from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from .models import User, IdentityDocument, UserProfile
from transactions.models import Transaction

class AdminRecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only admin can access
        if request.user.user_type != 'admin':
            return Response({'error': 'Pa gen otorizasyon'}, status=status.HTTP_403_FORBIDDEN)

        try:
            # Get pagination parameters
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 10))
            
            # Calculate offset
            offset = (page - 1) * per_page
            
            # Collect all activities with timestamps
            activities = []
            
            # Recent user registrations
            recent_users = User.objects.filter(user_type__in=['client','agent','enterprise']).order_by('-date_joined')[:5]
            for u in recent_users:
                full_name = f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip()
                display_name = full_name if full_name else u.username
                activities.append({
                    'action': 'Nouvo itilizatè enskri',
                    'user': display_name,
                    'time': u.date_joined.strftime('%d/%m/%Y %H:%M'),
                    'ts': int(u.date_joined.timestamp()),
                    'type': u.user_type
                })
            
            # Recent transactions
            try:
                recent_tx = Transaction.objects.order_by('-created_at')[:5]
                for t in recent_tx:
                    sender_name = getattr(getattr(t, 'sender', None), 'username', None) or 'Sistèm'
                    receiver_name = getattr(getattr(t, 'receiver', None), 'username', None) or 'Sistèm'
                    activities.append({
                        'action': 'Tranzaksyon',
                        'user': f"{sender_name} → {receiver_name}",
                        'amount': f"{t.amount} HTG",
                        'time': t.created_at.strftime('%d/%m/%Y %H:%M'),
                        'ts': int(t.created_at.timestamp()),
                        'type': 'transaction'
                    })
            except Exception as e:
                # Si pa gen Transaction model la oswa erè, ignore
                pass
            
            # Recent document approvals
            try:
                recent_docs = IdentityDocument.objects.filter(status='verified').order_by('-updated_at')[:3]
                for d in recent_docs:
                    doc_username = getattr(getattr(d, 'user', None), 'username', None) or 'Itilizatè enkoni'
                    activities.append({
                        'action': 'Dokiman apwouve',
                        'user': doc_username,
                        'time': d.updated_at.strftime('%d/%m/%Y %H:%M'),
                        'ts': int(d.updated_at.timestamp()),
                        'type': 'document'
                    })
            except Exception as e:
                # Si pa gen IdentityDocument model la oswa erè, ignore
                pass
            
            # Sort by time desc (latest first)
            activities.sort(key=lambda x: x.get('ts', 0), reverse=True)
            
            # Si pa gen aktivite yo, ajoute kèk demo data
            if not activities:
                from datetime import datetime, timedelta
                demo_activities = [
                    {
                        'action': 'Sistèm lan kòmanse',
                        'user': 'Cash Ti Machann',
                        'time': datetime.now().strftime('%d/%m/%Y %H:%M'),
                        'ts': int(datetime.now().timestamp()),
                        'type': 'system'
                    },
                    {
                        'action': 'Admin konekte',
                        'user': request.user.username,
                        'time': (datetime.now() - timedelta(minutes=5)).strftime('%d/%m/%Y %H:%M'),
                        'ts': int((datetime.now() - timedelta(minutes=5)).timestamp()),
                        'type': 'login'
                    },
                    {
                        'action': 'Database migrate',
                        'user': 'Sistèm',
                        'time': (datetime.now() - timedelta(hours=1)).strftime('%d/%m/%Y %H:%M'),
                        'ts': int((datetime.now() - timedelta(hours=1)).timestamp()),
                        'type': 'system'
                    },
                    {
                        'action': 'Server restart',
                        'user': 'Admin',
                        'time': (datetime.now() - timedelta(hours=2)).strftime('%d/%m/%Y %H:%M'),
                        'ts': int((datetime.now() - timedelta(hours=2)).timestamp()),
                        'type': 'system'
                    },
                    {
                        'action': 'Backup complete',
                        'user': 'Sistèm',
                        'time': (datetime.now() - timedelta(hours=3)).strftime('%d/%m/%Y %H:%M'),
                        'ts': int((datetime.now() - timedelta(hours=3)).timestamp()),
                        'type': 'system'
                    }
                ]
                activities.extend(demo_activities)
                activities.sort(key=lambda x: x.get('ts', 0), reverse=True)
            
            # Apply pagination
            total_activities = len(activities)
            paginated_activities = activities[offset:offset + per_page]
            
            # Return a machine-readable timestamp as `timestamp` (unix seconds) while keeping existing fields
            # for backward compatibility. This allows frontend to render in user's local timezone.
            trimmed = [
                {
                    **{k: v for k, v in a.items() if k != 'ts'},
                    'timestamp': a.get('ts')
                }
                for a in paginated_activities
            ]
            
            return Response({
                'activities': trimmed,
                'total': total_activities,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_activities + per_page - 1) // per_page
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Erè nan sistèm lan', 
                'activities': [],
                'total': 0,
                'page': 1,
                'per_page': per_page,
                'total_pages': 0
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.db.models import Q
from django.conf import settings
import random
import string
from .models import User, UserProfile, Wallet, IdentityDocument, Country, LoginActivity
from transactions.models import Transaction, WalletHistory
from django.db.models import Sum, Count, Q

# Admin dashboard summary stats endpoint
class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only admin can access
        if request.user.user_type != 'admin':
            return Response({'error': 'Pa gen otorizasyon'}, status=status.HTTP_403_FORBIDDEN)

        total_clients = User.objects.filter(user_type='client').count()
        total_agents = User.objects.filter(user_type='agent').count()
        total_enterprises = User.objects.filter(user_type='enterprise').count()
        # Active/Inactive breakdowns
        clients_active = User.objects.filter(user_type='client', is_active=True).count()
        clients_inactive = User.objects.filter(user_type='client', is_active=False).count()
        agents_active = User.objects.filter(user_type='agent', is_active=True).count()
        agents_inactive = User.objects.filter(user_type='agent', is_active=False).count()
        merchants_active = User.objects.filter(user_type='enterprise', is_active=True).count()
        merchants_inactive = User.objects.filter(user_type='enterprise', is_active=False).count()
        total_users = total_clients + total_agents + total_enterprises
        total_transactions = Transaction.objects.count()
        total_volume = Transaction.objects.aggregate(total=Sum('amount'))['total'] or 0
        pending_approvals = IdentityDocument.objects.filter(status='pending').count()

        return Response({
            'totalUsers': total_users,
            'totalClients': total_clients,
            'totalAgents': total_agents,
            'totalEnterprises': total_enterprises,
            'totalTransactions': total_transactions,
            'totalVolume': total_volume,
            'pendingApprovals': pending_approvals,
            # breakdowns
            'clientsActive': clients_active,
            'clientsInactive': clients_inactive,
            'agentsActive': agents_active,
            'agentsInactive': agents_inactive,
            'merchantsActive': merchants_active,
            'merchantsInactive': merchants_inactive
        }, status=status.HTTP_200_OK)
from decimal import Decimal
from django.db import transaction as db_transaction
from django.utils import timezone
import uuid
from .utils.country_utils import normalize_country_name
from .serializers import UserSerializer, UserProfileSerializer, RegisterSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = request.data
            # Allowed international phone prefixes (can be refined later to full parsing)
            allowed_prefixes = ['+509', '+1', '+33', '+56', '+52', '+55']  # Haiti, US/Canada, France, Chile, Mexico, Brazil
            # Dominican Republic explicit +1 country; we'll accept +1 but later we might distinguish NANP formatting
            raw_phone = data.get('phone', '') or ''
            # Normalize by stripping spaces/dashes
            normalized_phone = raw_phone.replace(' ', '').replace('-', '')
            
            # Validate required fields
            required_fields = ['email', 'phone', 'password', 'first_name', 'last_name', 'date_of_birth']
            for field in required_fields:
                if not data.get(field):
                    return Response({
                        'error': f'Kè a {field} obligatwa'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Country code validation
            if not any(normalized_phone.startswith(p) for p in allowed_prefixes):
                return Response({
                    'error': 'Nimewo telefòn lan dwe soti nan youn nan peyi yo otorize yo (Ayiti, Etazini/Kanada, Chili, Frans, Repiblik Dominikèn, Brezil, Meksik)',
                    'error_code': 'UNSUPPORTED_COUNTRY_CODE'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user already exists
            if User.objects.filter(email=data['email']).exists():
                return Response({
                    'error': 'Yon kont deja egziste ak email sa a',
                    'error_code': 'EMAIL_EXISTS',
                    'suggestion': 'Ou ka konekte ak kont ou ki egziste deja a, oswa itilize yon lòt email.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if User.objects.filter(phone_number=data['phone']).exists():
                return Response({
                    'error': 'Yon kont deja egziste ak nimewo telefòn sa a',
                    'error_code': 'PHONE_EXISTS', 
                    'suggestion': 'Ou ka konekte ak kont ou ki egziste deja a, oswa itilize yon lòt nimewo telefòn.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Determine username
            provided_username = data.get('username')
            if provided_username:
                # If user chose a username, it must be unique
                if User.objects.filter(username=provided_username).exists():
                    return Response({
                        'error': 'Non itilizatè sa a deja egziste',
                        'error_code': 'USERNAME_EXISTS',
                        'suggestion': 'Tanpri chwazi yon lòt non itilizatè.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                username = provided_username
            else:
                # Auto-generate from email prefix and ensure uniqueness
                username = data['email'].split('@')[0]
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
            
            user = User.objects.create(
                username=username,
                email=data['email'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                phone_number=data['phone'],
                is_active=False  # User needs to verify email/phone first
            )
            user.set_password(data['password'])
            user.save()
            
            # Document files (legacy single + new front/back)
            id_document = request.FILES.get('id_document') if hasattr(request, 'FILES') else None
            id_document_front = request.FILES.get('id_document_front') if hasattr(request, 'FILES') else None
            id_document_back = request.FILES.get('id_document_back') if hasattr(request, 'FILES') else None

            # Country inference & validation (mirror admin logic)
            raw_country = data.get('country') or data.get('residence_country') or None
            iso_code = data.get('residence_country_code') or None
            resolved_country_obj = None

            # Infer from phone if nothing explicit (only unambiguous prefixes)
            if not raw_country and not iso_code:
                prefix_map = {
                    '+509': 'HT',  # Haiti
                    '+33': 'FR',   # France
                    '+56': 'CL',   # Chile
                    '+52': 'MX',   # Mexico
                    '+55': 'BR',   # Brazil
                }
                for p, code in prefix_map.items():
                    if normalized_phone.startswith(p):
                        iso_code = code
                        break
                if normalized_phone.startswith('+1') and not iso_code:
                    return Response({'error': 'Pou nimewo ki kòmanse ak +1 tanpri presize peyi a (United States, Canada, Dominican Republic).'}, status=status.HTTP_400_BAD_REQUEST)

            if raw_country:
                raw_country = normalize_country_name(raw_country)
                resolved_country_obj = Country.objects.filter(
                    Q(name__iexact=raw_country) | Q(name_kreol__iexact=raw_country)
                ).first()
            if iso_code:
                iso_code = iso_code.strip().upper()
                resolved_country_obj = Country.objects.filter(iso2=iso_code).first() or resolved_country_obj

            if not resolved_country_obj:
                if normalized_phone.startswith('+509'):
                    resolved_country_obj = Country.objects.filter(iso2='HT').first()
                    raw_country = raw_country or 'Haiti'
                else:
                    return Response({'error': 'Peyi rezidans obligatwa. Tanpri voye country oswa residence_country_code.'}, status=status.HTTP_400_BAD_REQUEST)

            legacy_country_text = raw_country or resolved_country_obj.name

            profile = UserProfile.objects.create(
                user=user,
                first_name=data['first_name'],
                last_name=data['last_name'],
                date_of_birth=data['date_of_birth'],
                address=data.get('address', ''),
                city=data.get('city', ''),
                country=legacy_country_text,
                residence_country=resolved_country_obj,
                id_document_image=id_document,
                id_document_front=id_document_front,
                id_document_back=id_document_back,
                id_document_type=data.get('id_document_type', ''),
                id_document_number=data.get('id_document_number', '')
            )

            # Create IdentityDocument record for better tracking (optional files)
            try:
                if id_document_front or id_document_back or id_document:
                    IdentityDocument.objects.create(
                        user=user,
                        document_type=data.get('id_document_type', '') or 'unknown',
                        document_number=data.get('id_document_number', ''),
                        front_image=id_document_front,
                        back_image=id_document_back,
                        legacy_single_image=id_document,
                        status='pending',
                    )
            except Exception as e:
                # Do not fail registration if this auxiliary record fails
                print(f"IdentityDocument creation failed on register: {e}")
            
            # Create wallet
            wallet = Wallet.objects.create(user=user)
            
            # Generate verification code
            verification_code = ''.join(random.choices(string.digits, k=6))
            profile.email_verification_code = verification_code
            profile.save()
            
            # Send verification email
            try:
                send_mail(
                    'Konfime Kont Cash Ti Machann ou',
                    f'Kòd konfime ou an se: {verification_code}',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                # Log error but don't fail registration
                print(f"Error sending email: {e}")
            
            return Response({
                'message': 'Kont ou kreye ak siksè. Tcheke email ou pou konfime kont la.',
                'user_id': user.id,
                'verification_required': True
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Registration error: {str(e)}")  # Debug log
            import traceback
            traceback.print_exc()  # Print full traceback for debugging
            return Response({
                'error': f'Erè nan kreye kont la: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response({
                'available': False,
                'message': 'Non itilizatè oblije.'
            }, status=status.HTTP_400_BAD_REQUEST)
        exists = User.objects.filter(username=username).exists()
        return Response({
            'available': not exists,
            'message': None if not exists else 'Non itilizatè sa a deja egziste.'
        }, status=status.HTTP_200_OK)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email_or_username = request.data.get('email')
        password = request.data.get('password')
        
        if not email_or_username or not password:
            return Response({
                'error': 'Email/Username ak password obligatwa'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = None
        
        # First try to authenticate with the input as username
        user = authenticate(username=email_or_username, password=password)
        
        # If that fails, try to find user by email and authenticate with their username
        if not user:
            try:
                if '@' in email_or_username:  # Only try email lookup if it looks like an email
                    user_obj = User.objects.get(email=email_or_username)
                    user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        
        # If still no user found, try the reverse: find by username and check if email matches
        if not user:
            try:
                user_obj = User.objects.get(username=email_or_username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        
        # Extract request meta for audit
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        if user:
            if not user.is_active:
                # Log failed (inactive) attempt
                try:
                    LoginActivity.objects.create(
                        user=user,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        success=False
                    )
                except Exception as e:
                    print(f"LoginActivity log (inactive) failed: {e}")
                return Response({
                    'error': 'Kont ou pa aktive ankò. Tcheke email ou pou konfime kont la.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create or get token
            token, created = Token.objects.get_or_create(user=user)
            
            # Get user profile info
            try:
                profile = user.profile
                user_name = f"{profile.first_name} {profile.last_name}"
            except:
                user_name = user.username
            
            # Log successful login
            try:
                LoginActivity.objects.create(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=True
                )
                # Update last_login to reflect real last successful login (token auth doesn't auto update)
                from django.utils import timezone
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
            except Exception as e:
                print(f"LoginActivity log (success) failed: {e}")

            return Response({
                'message': 'Koneksyon ak siksè',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user_name,
                    'user_type': user.user_type
                }
            }, status=status.HTTP_200_OK)
        else:
            # If we can resolve a user by email/username for failed attempt, log it (if exists)
            candidate_user = None
            try:
                if '@' in email_or_username:
                    candidate_user = User.objects.filter(email=email_or_username).first()
                if not candidate_user:
                    candidate_user = User.objects.filter(username=email_or_username).first()
            except Exception:
                candidate_user = None
            if candidate_user:
                try:
                    LoginActivity.objects.create(
                        user=candidate_user,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        success=False
                    )
                except Exception as e:
                    print(f"LoginActivity log (fail) failed: {e}")
            return Response({
                'error': 'Email oswa password la pa kòrèk'
            }, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Delete the user's token
            request.user.auth_token.delete()
            return Response({
                'message': 'Dekoneksyon ak siksè'
            }, status=status.HTTP_200_OK)
        except:
            return Response({
                'error': 'Erè nan dekoneksyon an'
            }, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            # Ensure profile exists (some legacy users may have been created without profile)
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(
                    user=user,
                    first_name=user.first_name or '',
                    last_name=user.last_name or ''
                )

            # Ensure wallet exists
            try:
                wallet = user.wallet
            except Wallet.DoesNotExist:
                wallet = Wallet.objects.create(user=user, balance=0.00)

            residence_country_code = None
            residence_country_name = None
            if profile.residence_country_id:
                residence_country_code = profile.residence_country.iso2
                residence_country_name = profile.residence_country.name

            # Build absolute URL for profile picture if present
            profile_picture_url = None
            try:
                if profile.profile_picture and hasattr(profile.profile_picture, 'url'):
                    profile_picture_url = request.build_absolute_uri(profile.profile_picture.url)
            except Exception:
                profile_picture_url = None

            # Determine real last successful login: prefer user.last_login; fallback to latest successful LoginActivity
            real_last_login = user.last_login
            if not real_last_login:
                try:
                    from django.utils import timezone as _tz
                    latest_success = user.login_activities.filter(success=True).order_by('-timestamp').values_list('timestamp', flat=True).first()
                    if latest_success:
                        real_last_login = latest_success
                except Exception:
                    pass

            data = {
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'phone_number': user.phone_number,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type,
                    'last_login': real_last_login.isoformat() if real_last_login else None,
                },
                'profile': {
                    'first_name': profile.first_name,
                    'last_name': profile.last_name,
                    'date_of_birth': profile.date_of_birth,
                    'address': profile.address,
                    'city': profile.city,
                    'country': profile.country,  # legacy textual country
                    'residence_country_code': residence_country_code,
                    'residence_country_name': residence_country_name,
                    'verification_status': profile.verification_status,
                    'is_email_verified': profile.is_email_verified,
                    'is_phone_verified': profile.is_phone_verified,
                    # Persisted profile picture information
                    'profile_picture_url': profile_picture_url,
                    'preferred_language': getattr(profile, 'preferred_language', None),
                },
                'wallet': {
                    'balance': str(wallet.balance),
                    'currency': wallet.currency,
                    'is_active': wallet.is_active,
                }
            }
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Erè nan jwenn enfòmasyon yo: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({
                'error': 'Email ak kòd obligatwa'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            profile = user.profile
            
            if profile.email_verification_code == code:
                profile.is_email_verified = True
                profile.email_verification_code = None
                user.is_active = True
                profile.save()
                user.save()
                
                return Response({
                    'message': 'Email konfime ak siksè'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Kòd konfimme a pa kòrèk'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({
                'error': 'Email sa a pa egziste'
            }, status=status.HTTP_400_BAD_REQUEST)

class VerifyPhoneView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        phone = request.data.get('phone')
        code = request.data.get('code')
        
        if not phone or not code:
            return Response({
                'error': 'Telefòn ak kòd obligatwa'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(phone_number=phone)
            profile = user.profile
            
            if profile.phone_verification_code == code:
                profile.is_phone_verified = True
                profile.phone_verification_code = None
                profile.save()
                
                return Response({
                    'message': 'Telefòn konfime ak siksè'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Kòd konfimme a pa kòrèk'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({
                'error': 'Nimewo telefòn sa a pa egziste'
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email obligatwa'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            profile = user.profile
            
            # Generate new verification code
            verification_code = ''.join(random.choices(string.digits, k=6))
            profile.email_verification_code = verification_code
            profile.save()
            
            # Send verification email
            try:
                send_mail(
                    'Nouvo Kòd Konfimme Cash Ti Machann',
                    f'Nouvo kòd konfime ou an se: {verification_code}',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                
                return Response({
                    'message': 'Nouvo kòd konfimme voye nan email ou'
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({
                    'error': 'Erè nan voye email la'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except User.DoesNotExist:
            return Response({
                'error': 'Email sa a pa egziste'
            }, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({
                'error': 'Ansyen ak nouvo password obligatwa'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        if not user.check_password(old_password):
            return Response({
                'error': 'Ansyen password la pa kòrèk'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password chanje ak siksè'
        }, status=status.HTTP_200_OK)


# Admin-only views
class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Pa gen otorizasyon'
            }, status=status.HTTP_403_FORBIDDEN)
        # Load users & related profile
        users = User.objects.all().select_related('profile', 'wallet').order_by('-date_joined')

        # Identity documents summary (safe import to avoid circular import)
        from django.db.models import Count, Q
        try:
            from accounts.models import IdentityDocument as IDoc
            doc_counts = IDoc.objects.values('user_id').annotate(
                total=Count('id'),
                verified=Count('id', filter=Q(status='verified')),
                pending=Count('id', filter=Q(status='pending')),
                rejected=Count('id', filter=Q(status='rejected')),
            )
            counts_map = {c['user_id']: c for c in doc_counts}
        except Exception:
            counts_map = {}

        users_data = []

        for user in users:
            profile = getattr(user, 'profile', None)
            wallet_obj = getattr(user, 'wallet', None)
            c = counts_map.get(user.id, {}) if counts_map else {}
            # Fallback last login using latest successful LoginActivity if needed
            computed_last_login = user.last_login
            if not computed_last_login:
                try:
                    computed_last_login = user.login_activities.filter(success=True).order_by('-timestamp').values_list('timestamp', flat=True).first() or computed_last_login
                except Exception:
                    pass
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'last_login': computed_last_login.isoformat() if computed_last_login else None,
                'identity_documents_summary': {
                    'total': c.get('total', 0),
                    'verified': c.get('verified', 0),
                    'pending': c.get('pending', 0),
                    'rejected': c.get('rejected', 0),
                },
                'wallet': {
                    'balance': str(wallet_obj.balance),
                    'currency': wallet_obj.currency,
                    'is_active': wallet_obj.is_active,
                    'created_at': wallet_obj.created_at.isoformat() if wallet_obj and wallet_obj.created_at else None,
                } if wallet_obj else None,
                'profile': {
                    'phone': user.phone_number,
                    'date_of_birth': getattr(profile, 'date_of_birth', None) if profile else None,
                    'address': getattr(profile, 'address', '') if profile else '',
                    'city': getattr(profile, 'city', '') if profile else '',
                    'id_document_type': getattr(profile, 'id_document_type', '') if profile else '',
                    'id_document_number': getattr(profile, 'id_document_number', '') if profile else '',
                    'verification_status': getattr(profile, 'verification_status', None) if profile else None,
                    # Added residence country enriched fields
                    'residence_country_code': (getattr(getattr(profile, 'residence_country', None), 'iso2', None)
                                               if profile and getattr(profile, 'residence_country', None) else None),
                    'residence_country_name': (getattr(getattr(profile, 'residence_country', None), 'name', None)
                                               if profile and getattr(profile, 'residence_country', None) else None),
                    'residence_country_display': (
                        f"{getattr(profile.residence_country, 'name_kreol') or profile.residence_country.name} ({profile.residence_country.iso2})"
                        if profile and getattr(profile, 'residence_country', None) else None
                    ),
                    'country_display': (
                        (getattr(profile.residence_country, 'name_kreol') or profile.residence_country.name)
                        if profile and getattr(profile, 'residence_country', None) else getattr(profile, 'country', None)
                    ),
                } if profile else None
            }
            users_data.append(user_data)
        return Response(users_data, status=status.HTTP_200_OK)


class AdminCreateUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Pa gen otorizasyon'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Debug logging
        print(f"Request data: {request.data}")
        print(f"Request files: {request.FILES}")
        
        data = request.data
        # Allowed phone prefixes; reused from RegisterView (could refactor to util if expanded later)
        allowed_prefixes = ['+509', '+1', '+33', '+56', '+52', '+55']
        raw_phone = data.get('phone', '') or ''
        normalized_phone = raw_phone.replace(' ', '').replace('-', '')
        
        
        # Validate required fields
        required_fields = ['username', 'email', 'first_name', 'last_name', 'user_type', 'password', 'phone']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'Kè a {field} obligatwa'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate phone country code
        if not any(normalized_phone.startswith(p) for p in allowed_prefixes):
            return Response({'error': 'Nimewo telefòn lan dwe soti nan youn nan peyi yo otorize yo (Ayiti, Etazini/Kanada, Chili, Frans, Repiblik Dominikèn, Brezil, Meksik)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate user type
        if data['user_type'] not in ['client', 'agent', 'enterprise']:
            return Response({'error': 'Tip itilizatè pa valid. Itilize: client, agent, oswa enterprise'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=data['email']).exists():
            return Response({'error': 'Yon kont deja egziste ak email sa a'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=data['username']).exists():
            return Response({'error': 'Non itilizatè sa a deja pran'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(phone_number=data['phone']).exists():
            return Response({'error': 'Yon kont deja egziste ak nimewo telefòn sa a'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Parse date_of_birth if provided
            date_of_birth = None
            if data.get('date_of_birth'):
                try:
                    from datetime import datetime
                    date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
                except ValueError:
                    return Response({'error': 'Dat nesans pa nan fòmat ki kòrèk (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user
            user = User.objects.create(
                username=data['username'],
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                user_type=data['user_type'],
                phone_number=data['phone'],
                password=make_password(data['password']),
                is_active=True
            )
            
            # Get document files if present (legacy single + new front/back)
            id_document = request.FILES.get('id_document') if hasattr(request, 'FILES') else None
            id_document_front = request.FILES.get('id_document_front') if hasattr(request, 'FILES') else None
            id_document_back = request.FILES.get('id_document_back') if hasattr(request, 'FILES') else None
            
            # Country / residence country resolution
            # Accept either: country (text), residence_country (text), or residence_country_code (ISO2)
            raw_country = data.get('country') or data.get('residence_country') or None
            iso_code = data.get('residence_country_code') or None
            resolved_country_obj = None

            # If no explicit country provided try to infer from phone prefix (unambiguous prefixes only)
            if not raw_country and not iso_code:
                prefix_map = {
                    '+509': 'HT',  # Haiti
                    '+33': 'FR',   # France
                    '+56': 'CL',   # Chile
                    '+52': 'MX',   # Mexico
                    '+55': 'BR',   # Brazil
                }
                for p, code in prefix_map.items():
                    if normalized_phone.startswith(p):
                        iso_code = code
                        break
                # +1 (US / CA / DO) is ambiguous – require explicit selection if that's the case
                if normalized_phone.startswith('+1') and not iso_code:
                    return Response({'error': 'Pou nimewo ki kòmanse ak +1 tanpri presize peyi a (United States, Canada, Dominican Republic). Mete country oswa residence_country_code.'}, status=status.HTTP_400_BAD_REQUEST)

            # Normalize textual name if given
            if raw_country:
                raw_country = normalize_country_name(raw_country)
                # Attempt lookup by English or Kreyòl name
                resolved_country_obj = Country.objects.filter(
                    Q(name__iexact=raw_country) | Q(name_kreol__iexact=raw_country)
                ).first()

            # ISO2 override (takes priority if provided & valid)
            if iso_code:
                iso_code = iso_code.strip().upper()
                resolved_country_obj = Country.objects.filter(iso2=iso_code).first() or resolved_country_obj

            # If still not found default to legacy Haiti ONLY if phone is +509 otherwise require explicit
            if not resolved_country_obj:
                if normalized_phone.startswith('+509'):
                    resolved_country_obj = Country.objects.filter(iso2='HT').first()
                    raw_country = raw_country or 'Haiti'
                else:
                    return Response({'error': 'Peyi rezidans obligatwa. Tanpri voye country (non) oswa residence_country_code (ISO2).'}, status=status.HTTP_400_BAD_REQUEST)

            # Ensure legacy textual country value present for backward compatibility
            legacy_country_text = raw_country or resolved_country_obj.name

            UserProfile.objects.create(
                user=user,
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                date_of_birth=date_of_birth,
                address=data.get('address', ''),
                city=data.get('city', ''),
                country=legacy_country_text,
                residence_country=resolved_country_obj,
                id_document_image=id_document,
                id_document_front=id_document_front,
                id_document_back=id_document_back,
                id_document_type=data.get('id_document_type', ''),
                id_document_number=data.get('id_document_number', ''),
                verification_status='pending',  # Always pending for review
                is_email_verified=True,  # Admin created accounts are pre-verified
                is_phone_verified=True
            )

            # Create IdentityDocument record if any provided
            try:
                if id_document_front or id_document_back or id_document:
                    IdentityDocument.objects.create(
                        user=user,
                        document_type=data.get('id_document_type', '') or 'unknown',
                        document_number=data.get('id_document_number', ''),
                        front_image=id_document_front,
                        back_image=id_document_back,
                        legacy_single_image=id_document,
                        status='pending',
                    )
            except Exception as e:
                print(f"IdentityDocument creation failed on admin create: {e}")
            
            # Create wallet for newly created user
            Wallet.objects.create(user=user)
            return Response({
                'message': 'Itilizatè kreye ak siksè',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Admin create user error: {e}")
            import traceback; traceback.print_exc()
            return Response({'error': 'Erè pandan kreasyon itilizatè a'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminToggleUserStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        # Ensure only admins can toggle
        if request.user.user_type != 'admin':
            return Response({'error': 'Akses pa otorize'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)

        # Disallow self deactivation and other admins modifications
        if user.id == request.user.id:
            return Response({'error': 'Ou pa ka modifye pwòp kont ou'}, status=status.HTTP_400_BAD_REQUEST)
        if user.user_type == 'admin':
            return Response({'error': 'Ou pa ka modifye yon lòt admin'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = not user.is_active
        user.save()

        return Response({
            'message': 'Estati itilizatè mete ajou',
            'user': {
                'id': user.id,
                'is_active': user.is_active
            }
        }, status=status.HTTP_200_OK)
    # Accept PATCH for compatibility (same behavior as POST)
    def patch(self, request, user_id):
        return self.post(request, user_id)


def send_password_reset_email(user, request=None):
    from django.contrib.auth.tokens import PasswordResetTokenGenerator
    token_generator = PasswordResetTokenGenerator()
    token = token_generator.make_token(user)
    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')
    reset_link = f"{frontend_base}/reset-password?uid={user.id}&token={token}"
    subject = 'Reyinisyalize Modpas Kont Ou'
    html_message = (
        f"<div style='font-family:Arial,sans-serif;line-height:1.5;color:#111'>"
        f"<h2 style='color:#dc2626;margin-bottom:16px'>Cash Ti Machann</h2>"
        f"<p>Bonjou <strong>{user.first_name or user.username}</strong>,</p>"
        "<p>Nou resevwa yon demann pou reyinisyalize modpas kont ou. Si se pa ou ki mande sa, ou ka inyore mesaj sa a.</p>"
        f"<p style='margin:24px 0'><a href='{reset_link}' style='display:inline-block;background:#dc2626;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold'>Mete Nouvo Modpas</a></p>"
        f"<p>Si bouton an pa mache, kopye/kolan lyen sa a nan navigatè ou:<br/><span style='font-size:12px;color:#555'>{reset_link}</span></p>"
        "<p style='margin-top:32px'>Mèsi,<br/>Ekip Cash Ti Machann</p>"
        "</div>"
    )
    plain_message = (
        f"Bonjou {user.first_name or user.username},\n\n"
        "Nou resevwa yon demann pou reyinisyalize modpas ou. Klike lyen ki anba a oswa inyore si se pa ou: \n"
        f"{reset_link}\n\nMèsi,\nEkip Cash Ti Machann"
    )
    try:
        send_mail(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False, html_message=html_message)
    except Exception as e:
        print(f"send_password_reset_email error: {e}")
        raise
    # Update last request timestamp
    try:
        if hasattr(user, 'profile'):
            from django.utils import timezone
            user.profile.last_password_reset_requested = timezone.now()
            user.profile.save(update_fields=['last_password_reset_requested'])
    except Exception as e:
        print(f"Could not update last_password_reset_requested: {e}")
    return True


class ForgotPasswordRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Do not leak existence
            return Response({'message': 'Si email egziste, nou voye yon lyen reset.'}, status=status.HTTP_200_OK)
        # Optional throttle:  (simple check  - at least 2 minutes apart)
        try:
            pr = getattr(user, 'profile', None)
            if pr and pr.last_password_reset_requested and (timezone.now() - pr.last_password_reset_requested).total_seconds() < 120:
                return Response({'error': 'Ou fè yon demann deja. Tanpri tann kèk segond epi eseye ankò.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception:
            pass
        try:
            send_password_reset_email(user, request)
        except Exception:
            return Response({'error': 'Erè pandan voye imèl la'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'message': 'Si email egziste, nou voye yon lyen reset.'}, status=status.HTTP_200_OK)


class AdminResetPasswordView(APIView):
    """Admin triggers a password reset email containing a tokenized link.
    The user will click the link (frontend page) and submit a new password via confirm endpoint.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.user_type != 'admin':
            return Response({'error': 'Aksè refize - Admin sèlman'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent self-reset via this admin route and resetting other admins for now
        if target_user.id == request.user.id:
            return Response({'error': 'Ou pa ka lanse reset pou pwòp kont ou isit la'}, status=status.HTTP_400_BAD_REQUEST)
        if target_user.user_type == 'admin':
            return Response({'error': 'Ou pa ka lanse reset pou yon lòt admin'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            send_password_reset_email(target_user, request)
        except Exception:
            return Response({'error': 'Erè pandan voye email reset la'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Lyen reset modpas la voye pa email.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_id = request.data.get('uid') or request.data.get('user_id')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not user_id or not token or not new_password:
            return Response({'error': 'uid, token ak new_password obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        if confirm_password and confirm_password != new_password:
            return Response({'error': 'Konfimasyon modpas la pa koresponn'}, status=status.HTTP_400_BAD_REQUEST)
        # Enhanced policy: length >=8, at least 1 digit, 1 letter, 1 special
        import re
        if len(new_password) < 8 or not re.search(r'[A-Za-z]', new_password) or not re.search(r'\d', new_password) or not re.search(r'[^A-Za-z0-9]', new_password):
            return Response({'error': 'Modpas dwe gen omwen 8 karaktè, yon chif, yon lèt, ak yon siy espesyal.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)

        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'error': 'Token pa valid oswa ekspire'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user.set_password(new_password)
            user.save()
        except Exception as e:
            return Response({'error': f'Echèk nan mete nouvo modpas la: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Modpas mete ajou ak siksè'}, status=status.HTTP_200_OK)


class AdminChangeUserTypeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, user_id):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({'error': 'Aksè refize - Admin sèlman'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            new_type = request.data.get('user_type')
            
            if not new_type or new_type not in ['client', 'agent', 'enterprise']:
                return Response({'error': 'Tip itilizatè invalid'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Don't allow changing admin accounts
            if user.user_type == 'admin':
                return Response({'error': 'Ou pa ka chanje tip admin yo'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.user_type = new_type
            user.save()
            
            return Response({
                'message': f'Tip itilizatè {user.username} chanje nan {new_type}',
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'user_type': user.user_type
                }
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Erè nan chanjman tip la: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({'error': 'Aksè refize - Admin sèlman'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            
        # Get user profile
            try:
                profile = user.profile
                profile_data = {
                    'phone': user.phone_number,  # Phone is stored in User model
                    'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                    'address': profile.address,
                    'city': profile.city,
                    'country': profile.country,
                    # Residence country enriched fields
                    'residence_country_code': profile.residence_country.iso2 if getattr(profile, 'residence_country', None) else None,
                    'residence_country_name': profile.residence_country.name if getattr(profile, 'residence_country', None) else None,
                    'residence_country_display': (
                        f"{profile.residence_country.name_kreol or profile.residence_country.name} ({profile.residence_country.iso2})"
                        if getattr(profile, 'residence_country', None) else None
                    ),
                    'country_display': (
                        (profile.residence_country.name_kreol or profile.residence_country.name)
                        if getattr(profile, 'residence_country', None) else profile.country
                    ),
                    'id_document_type': profile.id_document_type,
                    'id_document_number': profile.id_document_number,
                    'id_document_image': profile.id_document_image.url if profile.id_document_image else None,
                    'id_document_front': profile.id_document_front.url if hasattr(profile, 'id_document_front') and profile.id_document_front else None,
                    'id_document_back': profile.id_document_back.url if hasattr(profile, 'id_document_back') and profile.id_document_back else None,
                    'verification_status': profile.verification_status,
                    'kyc_status': profile.verification_status,
                    'is_email_verified': profile.is_email_verified,
                    'is_phone_verified': profile.is_phone_verified,
                    # Aliases for frontend backward compatibility
                    'email_verified': profile.is_email_verified,
                    'phone_verified': profile.is_phone_verified,
                    'created_at': profile.created_at.isoformat() if profile.created_at else None,
                    'updated_at': profile.updated_at.isoformat() if profile.updated_at else None,
                }
            except:
                profile_data = None
            
            # Get wallet info
            try:
                wallet = user.wallet
                wallet_data = {
                    'balance': str(wallet.balance),
                    'currency': wallet.currency,
                    'is_active': wallet.is_active,
                    'created_at': wallet.created_at.isoformat() if wallet.created_at else None,
                }
            except:
                wallet_data = None
            
            # Get recent transactions (real data)
            try:
                from transactions.models import Transaction
                # Fetch last 20 transactions where user is sender or receiver (or involved in deposit/withdrawal)
                txns = Transaction.objects.filter(
                    Q(sender=user) | Q(receiver=user)
                ).order_by('-created_at')[:20]

                type_map = {
                    'deposit': 'Depo',
                    'withdrawal': 'Retire',
                    'send': 'Voye',
                    'receive': 'Resevwa',
                    'recharge': 'Rechaj',
                    'bill_payment': 'Peman Bòdwo',
                    'topup': 'Top-Up Telefòn',
                }
                recent_transactions = []
                for t in txns:
                    # Sign amount from perspective of this user:
                    #  - If user is sender in send/withdrawal => negative
                    #  - If user is receiver in receive/deposit => positive
                    #  - For other types use natural sign (t.amount)
                    signed_amount = t.amount
                    if t.transaction_type in ['send'] and t.sender_id == user.id:
                        signed_amount = -t.amount
                    elif t.transaction_type in ['receive'] and t.receiver_id == user.id:
                        signed_amount = t.amount
                    elif t.transaction_type == 'withdrawal' and t.sender_id == user.id:
                        signed_amount = -t.amount
                    elif t.transaction_type == 'deposit' and t.receiver_id == user.id:
                        signed_amount = t.amount
                    # Fallback: deposits credited to receiver, withdrawals debited from sender already handled
                    recent_transactions.append({
                        'id': str(t.id),
                        'type': type_map.get(t.transaction_type, t.transaction_type.title()),
                        'amount': float(signed_amount),
                        'description': t.description or '',
                        'status': t.status,
                        'created_at': t.created_at.isoformat() if t.created_at else None,
                        'reference_number': t.reference_number,
                    })
            except Exception as e:
                print(f"Error loading transactions for admin detail: {e}")
                recent_transactions = []
            
            # Get login & security activity history
            try:
                login_acts = list(user.login_activities.all()[:25])
            except Exception as e:
                print(f"Error loading login activities: {e}")
                login_acts = []
            try:
                from .models import SecurityActivity
                sec_acts = list(user.security_activities.all()[:25])
            except Exception as e:
                print(f"Error loading security activities: {e}")
                sec_acts = []

            # Normalize activities into unified structure
            activity_history = []
            for a in login_acts:
                activity_history.append({
                    'type': 'login_success' if a.success else 'login_fail',
                    'timestamp': a.timestamp.isoformat(),
                    'ip_address': a.ip_address,
                    'user_agent': a.user_agent[:120] if a.user_agent else None,
                    'meta': {
                        'success': a.success,
                    }
                })
            for s in sec_acts:
                activity_history.append({
                    'type': s.event_type,
                    'timestamp': s.timestamp.isoformat(),
                    'ip_address': s.ip_address,
                    'user_agent': s.user_agent[:120] if s.user_agent else None,
                    'meta': s.metadata or {}
                })
            # Sort combined list by timestamp desc
            try:
                activity_history.sort(key=lambda x: x['timestamp'], reverse=True)
            except Exception:
                pass
            
            # Build identity documents from model first; fallback to profile if none
            identity_documents = []
            try:
                docs = IdentityDocument.objects.filter(user=user).order_by('-created_at')
                def abs_url(u):
                    if not u:
                        return None
                    return u if u.startswith('http') else f"http://127.0.0.1:8000{u}"
                for doc in docs:
                    identity_documents.append({
                        'id': str(doc.id),
                        'document_type': doc.document_type or 'unknown',
                        'document_number': doc.document_number or '',
                        'issue_date': '',
                        'expiry_date': '',
                        'issuing_authority': 'Government of Haiti',
                        'status': doc.status,
                        'uploaded_at': doc.created_at.isoformat() if doc.created_at else None,
                        'verified_at': doc.updated_at.isoformat() if doc.status == 'verified' else None,
                        'rejection_reason': None,
                        'front_image_url': abs_url(doc.front_image.url) if doc.front_image else abs_url(doc.legacy_single_image.url) if doc.legacy_single_image else None,
                        'back_image_url': abs_url(doc.back_image.url) if doc.back_image else None,
                    })
            except Exception as e:
                print(f"Error loading IdentityDocuments: {e}")

            if not identity_documents and profile_data:
                # Helper to absolutize URLs
                def abs_url(u):
                    if not u:
                        return None
                    return u if u.startswith('http') else f"http://127.0.0.1:8000{u}"
                legacy_url = profile_data.get('id_document_image')
                front_url = profile_data.get('id_document_front')
                back_url = profile_data.get('id_document_back')
                if front_url or back_url:
                    identity_documents.append({
                        'id': f"doc_profile_{user.id}",
                        'document_type': profile_data.get('id_document_type', 'unknown'),
                        'document_number': profile_data.get('id_document_number', ''),
                        'issue_date': '',
                        'expiry_date': '',
                        'issuing_authority': 'Government of Haiti',
                        'status': profile_data.get('verification_status', 'pending'),
                        'uploaded_at': profile_data.get('created_at', ''),
                        'verified_at': profile_data.get('updated_at') if profile_data.get('verification_status') == 'verified' else None,
                        'rejection_reason': None,
                        'front_image_url': abs_url(front_url),
                        'back_image_url': abs_url(back_url),
                    })
                elif legacy_url:
                    identity_documents.append({
                        'id': f"doc_profile_{user.id}",
                        'document_type': profile_data.get('id_document_type', 'unknown'),
                        'document_number': profile_data.get('id_document_number', ''),
                        'issue_date': '',
                        'expiry_date': '',
                        'issuing_authority': 'Government of Haiti',
                        'status': profile_data.get('verification_status', 'pending'),
                        'uploaded_at': profile_data.get('created_at', ''),
                        'verified_at': profile_data.get('updated_at') if profile_data.get('verification_status') == 'verified' else None,
                        'rejection_reason': None,
                        'front_image_url': abs_url(legacy_url),
                        'back_image_url': None,
                    })
            # Always build a summary so frontend pa montre 'Pa gen dokiman upload' lè gen dokiman
            try:
                identity_documents_summary = {
                    'total': len(identity_documents),
                    'pending': sum(1 for d in identity_documents if d.get('status') == 'pending'),
                    'verified': sum(1 for d in identity_documents if d.get('status') == 'verified'),
                    'rejected': sum(1 for d in identity_documents if d.get('status') == 'rejected'),
                }
            except Exception:
                identity_documents_summary = {
                    'total': 0,
                    'pending': 0,
                    'verified': 0,
                    'rejected': 0,
                }
            
            # Determine real last successful login (fallback to login activities)
            real_last_login = user.last_login
            if not real_last_login:
                try:
                    real_last_login = user.login_activities.filter(success=True).order_by('-timestamp').values_list('timestamp', flat=True).first() or real_last_login
                except Exception:
                    pass

            user_data = {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat(),
                'last_login': real_last_login.isoformat() if real_last_login else None,
                'profile': profile_data,
                'wallet': wallet_data,
                'security': {
                    'email_verified': getattr(profile_data, 'get', lambda k, d=None: profile_data[k] if profile_data else None)('is_email_verified') if profile_data else None,
                    'phone_verified': getattr(profile_data, 'get', lambda k, d=None: profile_data[k] if profile_data else None)('is_phone_verified') if profile_data else None,
                    'last_login': real_last_login.isoformat() if real_last_login else None,
                    'two_factor_enabled': False,  # Placeholder until 2FA implemented
                    'password_last_changed': None,  # Could be tracked later
                },
                'recent_transactions': recent_transactions,
                'activity_history': activity_history[:40],  # cap to 40 recent events
                'identity_documents': identity_documents,
                'identity_documents_summary': identity_documents_summary,
            }

            # Compute role-specific stats so frontend pa rete vid
            try:
                from transactions.models import Transaction, AgentTransaction
                from django.db.models import Sum, Count
                from django.utils import timezone
                now = timezone.now()
                month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            except Exception:
                Transaction = None
                AgentTransaction = None
                month_start = None

            if user.user_type == 'agent' and Transaction and AgentTransaction:
                try:
                    # All transactions where the agent participated as sender or receiver
                    base_qs = Transaction.objects.filter(Q(sender=user) | Q(receiver=user))
                    month_qs = base_qs.filter(created_at__gte=month_start) if month_start else base_qs
                    commission_qs = AgentTransaction.objects.filter(agent=user)
                    commission_total = commission_qs.aggregate(total=Sum('commission_earned'))['total'] or 0
                    active_clients = (
                        base_qs.filter(sender__user_type='client').values('sender').distinct().count() +
                        base_qs.filter(receiver__user_type='client').values('receiver').distinct().count()
                    )
                    user_data['agent_stats'] = {
                        'total_transactions': base_qs.count(),
                        'total_commission': float(commission_total),
                        'active_clients': active_clients,
                        'monthly_volume': float(month_qs.aggregate(total=Sum('amount'))['total'] or 0),
                    }
                except Exception as e:
                    print(f"Agent stats error: {e}")
                    user_data['agent_stats'] = {
                        'total_transactions': 0,
                        'total_commission': 0,
                        'active_clients': 0,
                        'monthly_volume': 0,
                    }

            if user.user_type == 'enterprise' and Transaction:
                try:
                    base_qs = Transaction.objects.filter(Q(sender=user) | Q(receiver=user))
                    month_qs = base_qs.filter(created_at__gte=month_start) if month_start else base_qs
                    payments_received = base_qs.filter(receiver=user, transaction_type__in=['receive','deposit']).aggregate(total=Sum('amount'))['total'] or 0
                    customer_count = base_qs.filter(sender__user_type='client').values('sender').distinct().count()
                    user_data['enterprise_stats'] = {
                        'total_transactions': base_qs.count(),
                        'monthly_volume': float(month_qs.aggregate(total=Sum('amount'))['total'] or 0),
                        'total_payments_received': float(payments_received),
                        'active_services': 0,  # Placeholder until services model exists
                        'customer_count': customer_count,
                    }
                except Exception as e:
                    print(f"Enterprise stats error: {e}")
                    user_data['enterprise_stats'] = {
                        'total_transactions': 0,
                        'monthly_volume': 0,
                        'total_payments_received': 0,
                        'active_services': 0,
                        'customer_count': 0,
                    }
            
            return Response(user_data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Erè nan chajman detay yo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminAdjustWalletView(APIView):
    """Admin operation to credit or debit a user's wallet.
    Creates a Transaction + WalletHistory record and returns updated wallet.
    Expected POST body: { "operation": "credit"|"debit", "amount": number|string, "description": optional }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        # Must be admin
        if request.user.user_type != 'admin':
            return Response({'error': 'Aksè refize - Admin sèlman'}, status=status.HTTP_403_FORBIDDEN)

        operation = (request.data.get('operation') or '').lower()
        raw_amount = request.data.get('amount')
        description = request.data.get('description') or ''

        if operation not in ['credit', 'debit']:
            return Response({'error': 'Operation dwe "credit" oswa "debit"'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount = Decimal(str(raw_amount))
        except Exception:
            return Response({'error': 'Montan pa valid'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'error': 'Montan dwe pi gran pase zewo'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with db_transaction.atomic():
                user = User.objects.select_for_update().get(id=user_id)
                wallet = user.wallet  # will raise if none

                if not wallet.is_active:
                    return Response({'error': 'Pòtmonnè a bloke, ou pa ka fè operasyon.'}, status=status.HTTP_400_BAD_REQUEST)

                balance_before = wallet.balance

                if operation == 'debit' and balance_before < amount:
                    return Response({'error': 'Balance pa sifi pou operasyon an'}, status=status.HTTP_400_BAD_REQUEST)

                if operation == 'credit':
                    wallet.balance = balance_before + amount
                    trx_type = 'deposit'
                else:
                    wallet.balance = balance_before - amount
                    trx_type = 'withdrawal'

                wallet.updated_at = timezone.now()
                wallet.save()

                # Create internal transaction reference (simple unique ref)
                reference = f"ADM-{timezone.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}"
                transaction_record = Transaction.objects.create(
                    transaction_type=trx_type,
                    sender=None if operation == 'credit' else user,
                    receiver=user if operation == 'credit' else None,
                    amount=amount,
                    fee=Decimal('0.00'),
                    total_amount=amount,
                    currency=wallet.currency,
                    reference_number=reference,
                    description=description or (f"Admin {operation} {amount} {wallet.currency}"),
                    status='completed',
                    processed_at=timezone.now()
                )

                WalletHistory.objects.create(
                    wallet=wallet,
                    transaction=transaction_record,
                    operation_type=operation,
                    amount=amount,
                    balance_before=balance_before,
                    balance_after=wallet.balance,
                )

            return Response({
                'message': f"Operasyon {operation} fèt ak siksè",
                'wallet': {
                    'balance': str(wallet.balance),
                    'currency': wallet.currency,
                    'is_active': wallet.is_active,
                    'created_at': wallet.created_at.isoformat() if wallet.created_at else None,
                },
                'transaction': {
                    'id': str(transaction_record.id),
                    'reference_number': transaction_record.reference_number,
                    'amount': str(transaction_record.amount),
                    'type': transaction_record.transaction_type,
                    'description': transaction_record.description,
                    'status': transaction_record.status,
                    'created_at': transaction_record.created_at.isoformat() if transaction_record.created_at else None,
                }
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            return Response({'error': 'Pòtmonnè pa jwenn pou itilizatè sa a'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Erè nan operasyon pòtmonnè a: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminToggleWalletView(APIView):
    """Admin toggles wallet active status (block/unblock)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.user_type != 'admin':
            return Response({'error': 'Aksè refize - Admin sèlman'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(id=user_id)
            wallet = user.wallet
            wallet.is_active = not wallet.is_active
            wallet.updated_at = timezone.now()
            wallet.save()
            return Response({
                'message': 'Pòtmonnè aktive' if wallet.is_active else 'Pòtmonnè bloke',
                'wallet': {
                    'balance': str(wallet.balance),
                    'currency': wallet.currency,
                    'is_active': wallet.is_active,
                    'created_at': wallet.created_at.isoformat() if wallet.created_at else None,
                }
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            return Response({'error': 'Pòtmonnè pa jwenn pou itilizatè sa a'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Erè nan chanjman estati pòtmonnè a: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUpdateUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, user_id):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Pa gen otorizasyon'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            
            # Don't allow modifying other admins (except by super admin)
            if user.user_type == 'admin' and user.id != request.user.id:
                return Response({
                    'error': 'Ou pa ka modifye kont admin yo'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            data = request.data
            
            # Update user fields
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                # Check if email already exists for another user
                if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
                    return Response({
                        'error': 'Email sa a deja itilize nan yon lòt kont'
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.email = data['email']
            if 'is_active' in data and user.id != request.user.id:
                # Don't allow admin to deactivate themselves
                user.is_active = data['is_active']
            
            user.save()
            
            # Update profile fields
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            if 'phone' in data:
                # Check if phone already exists for another user
                if User.objects.filter(phone_number=data['phone']).exclude(id=user.id).exists():
                    return Response({
                        'error': 'Nimewo telefòn sa a deja itilize nan yon lòt kont'
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.phone_number = data['phone']
                user.save()
                
            if 'date_of_birth' in data:
                dob = data['date_of_birth']
                if dob in (None, '', 'null'):
                    profile.date_of_birth = None
                else:
                    try:
                        from datetime import datetime
                        profile.date_of_birth = datetime.strptime(dob, '%Y-%m-%d').date()
                    except ValueError:
                        return Response({
                            'error': 'Dat nesans pa nan fòmat ki kòrèk (YYYY-MM-DD)'
                        }, status=status.HTTP_400_BAD_REQUEST)
            if 'address' in data:
                profile.address = data['address']
            if 'city' in data:
                profile.city = data['city']
            # Residence country update (normalized)
            if 'residence_country_code' in data:
                code = (data.get('residence_country_code') or '').strip().upper()
                if code:
                    try:
                        country_obj = Country.objects.filter(iso2=code).first()
                        if not country_obj:
                            return Response({'error': 'Kòd peyi pa rekonèt'}, status=status.HTTP_400_BAD_REQUEST)
                        profile.residence_country = country_obj
                        # Keep legacy textual country in sync for backward compatibility
                        profile.country = country_obj.name
                    except Exception as e:
                        return Response({'error': f'Erè nan mete peyi rezidans lan: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Allow clearing (optional)
                    profile.residence_country = None
                
            profile.save()
            
            return Response({
                'message': 'Enfòmasyon itilizatè a chanje ak siksè',
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_active': user.is_active,
                    'phone': user.phone_number,
                    'profile': {
                        'phone': user.phone_number,
                        'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                        'address': profile.address,
                        'city': profile.city,
                        'country': profile.country,
                        'residence_country_code': profile.residence_country.iso2 if getattr(profile, 'residence_country', None) else None,
                        'residence_country_name': profile.residence_country.name if getattr(profile, 'residence_country', None) else None,
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Return more actionable error detail
            return Response({'error': f"Erè nan chanjman an: {e.__class__.__name__}: {str(e) or 'Erè enkoni'}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UploadDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            profile = request.user.profile
            
            # Check if a document is provided
            id_document = request.FILES.get('id_document')
            if not id_document:
                return Response({
                    'error': 'Dokiman obligatwa'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
            if id_document.content_type not in allowed_types:
                return Response({
                    'error': 'Tip dokiman pa aksèpte. Itilize JPEG, PNG oswa PDF.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file size (max 5MB)
            if id_document.size > 5 * 1024 * 1024:
                return Response({
                    'error': 'Dokiman an twò gwo. Maksimòm 5MB.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate uniqueness of provided document number (check both legacy profile field and IdentityDocument table)
            provided_number = request.data.get('id_document_number', '').strip()
            if provided_number:
                from .models import IdentityDocument, UserProfile
                if IdentityDocument.objects.filter(document_number__iexact=provided_number).exists() or \
                   UserProfile.objects.filter(id_document_number__iexact=provided_number).exclude(user=request.user).exists():
                    return Response({'error': 'Nimewo dokiman sa a deja egziste.'}, status=status.HTTP_400_BAD_REQUEST)

            # Update profile with document (legacy single image path)
            profile.id_document_image = id_document
            profile.id_document_type = request.data.get('id_document_type', '')
            profile.id_document_number = provided_number
            profile.verification_status = 'pending'
            profile.save()
            
            return Response({
                'message': 'Dokiman upload ak siksè. Y ap revize li kounye a.',
                'verification_status': profile.verification_status
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Erè nan upload dokiman an: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminReviewDocumentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Pa gen otorizasyon'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get all profiles with pending documents (support legacy single and new front/back)
            profiles = (
                UserProfile.objects
                .filter(
                    verification_status='pending'
                )
                .filter(
                    Q(id_document_image__isnull=False) |
                    Q(id_document_front__isnull=False) |
                    Q(id_document_back__isnull=False)
                )
                .select_related('user')
            )
            
            documents_data = []
            for profile in profiles:
                # Prefer front image, then back, then legacy single
                raw_url = (
                    (profile.id_document_front.url if profile.id_document_front else None)
                    or (profile.id_document_back.url if profile.id_document_back else None)
                    or (profile.id_document_image.url if profile.id_document_image else None)
                )
                abs_url = (
                    raw_url if (raw_url or '').startswith('http') else f"http://127.0.0.1:8000{raw_url}" if raw_url else None
                )

                documents_data.append({
                    'user_id': str(profile.user.id),
                    'user_name': f"{profile.first_name} {profile.last_name}",
                    'email': profile.user.email,
                    'phone': profile.user.phone_number,
                    'id_document_type': profile.id_document_type,
                    'id_document_number': profile.id_document_number,
                    'id_document_url': abs_url,
                    'submitted_date': profile.updated_at,
                    'verification_status': profile.verification_status
                })
            
            return Response({
                'documents': documents_data,
                'total_count': len(documents_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Erè nan jwenn dokiman yo: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminApproveDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Pa gen otorizasyon'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            profile = user.profile
            
            action = request.data.get('action')  # 'approve' or 'reject'
            reason = request.data.get('reason', '')
            document_id = request.data.get('document_id')  # Optional: IdentityDocument ID (numeric)
            
            if action == 'approve':
                profile.verification_status = 'verified'
                user.is_verified = True
                message = 'Dokiman apwouve ak siksè'
            elif action == 'reject':
                # Tentatively set to rejected; adjust after doc status updates
                profile.verification_status = 'rejected'
                user.is_verified = False
                message = 'Dokiman rejte'
            else:
                return Response({
                    'error': 'Aksyon pa valid. Itilize "approve" oswa "reject".'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # If a specific IdentityDocument provided, try updating it too
            updated_doc_payload = None
            if document_id:
                try:
                    # Only attempt if looks like an integer (skip legacy IDs like doc_profile_<id>)
                    doc_pk = int(str(document_id))
                    doc_obj = IdentityDocument.objects.filter(user=user, id=doc_pk).first()
                    if doc_obj:
                        if action == 'approve':
                            doc_obj.status = 'verified'
                        elif action == 'reject':
                            doc_obj.status = 'rejected'
                            if reason:
                                # store reason in notes if available
                                existing = (doc_obj.notes or '')
                                doc_obj.notes = f"{existing}\nRezon Rejte: {reason}".strip()
                        doc_obj.save()
                        def abs_url(u):
                            if not u:
                                return None
                            return u if u.startswith('http') else f"http://127.0.0.1:8000{u}"
                        updated_doc_payload = {
                            'id': str(doc_obj.id),
                            'status': doc_obj.status,
                            'document_type': doc_obj.document_type,
                            'document_number': doc_obj.document_number,
                            'front_image_url': abs_url(doc_obj.front_image.url) if doc_obj.front_image else abs_url(doc_obj.legacy_single_image.url) if doc_obj.legacy_single_image else None,
                            'back_image_url': abs_url(doc_obj.back_image.url) if doc_obj.back_image else None,
                        }
                except (ValueError, TypeError):
                    # Ignore invalid document id format
                    pass

            # After potential individual document update, if rejecting ensure no other verified docs remain
            if action == 'reject':
                try:
                    has_verified = IdentityDocument.objects.filter(user=user, status='verified').exists()
                    if has_verified:
                        # Maintain verified status if at least one doc still verified
                        profile.verification_status = 'verified'
                        user.is_verified = True
                except Exception:
                    pass

            profile.save()
            user.save()
            
            # Send notification email to user
            try:
                if action == 'approve':
                    email_subject = 'Dokiman Ou Apwouve - Cash Ti Machann'
                    email_body = f'Bonjou {profile.first_name},\n\nDokiman ou an apwouve ak siksè. Kont ou vin konplètman verifye kounye a.'
                else:
                    email_subject = 'Dokiman Ou Rejte - Cash Ti Machann'
                    email_body = f'Bonjou {profile.first_name},\n\nDokiman ou an rejte. Rezon: {reason}\n\nTanpri upload yon nouvo dokiman ki pi klè.'
                
                send_mail(
                    email_subject,
                    email_body,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Error sending notification email: {e}")
            
            resp = {
                'message': message,
                'verification_status': profile.verification_status,
                'kyc_status': profile.verification_status,
            }
            if updated_doc_payload:
                resp['updated_document'] = updated_doc_payload
            return Response(resp, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'Itilizatè pa jwenn'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erè nan prosesis la: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminRejectDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Pa gen otorizasyon'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            profile = user.profile

            reason = request.data.get('reason', 'Pa gen rezon ki bay')
            document_id = request.data.get('document_id')

            profile.verification_status = 'rejected'
            user.is_verified = False
            profile.save()
            user.save()

            updated_doc_payload = None
            if document_id:
                try:
                    doc_pk = int(str(document_id))
                    doc_obj = IdentityDocument.objects.filter(user=user, id=doc_pk).first()
                    if doc_obj:
                        doc_obj.status = 'rejected'
                        existing = (doc_obj.notes or '')
                        doc_obj.notes = f"{existing}\nRezon Rejte: {reason}".strip()
                        doc_obj.save()
                        def abs_url(u):
                            if not u:
                                return None
                            return u if u.startswith('http') else f"http://127.0.0.1:8000{u}"
                        updated_doc_payload = {
                            'id': str(doc_obj.id),
                            'status': doc_obj.status,
                            'document_type': doc_obj.document_type,
                            'document_number': doc_obj.document_number,
                            'front_image_url': abs_url(doc_obj.front_image.url) if doc_obj.front_image else abs_url(doc_obj.legacy_single_image.url) if doc_obj.legacy_single_image else None,
                            'back_image_url': abs_url(doc_obj.back_image.url) if doc_obj.back_image else None,
                        }
                except (ValueError, TypeError):
                    pass

            # Send notification email to user
            try:
                email_subject = 'Dokiman Ou Rejte - Cash Ti Machann'
                email_body = f'Bonjou {profile.first_name},\n\nDokiman ou an rejte. Rezon: {reason}\n\nTanpri upload yon nouvo dokiman ki pi klè.'

                send_mail(
                    email_subject,
                    email_body,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Error sending notification email: {e}")

            resp = {
                'message': 'Dokiman rejte ak siksè',
                'verification_status': profile.verification_status,
                'rejection_reason': reason
            }
            if updated_doc_payload:
                resp['updated_document'] = updated_doc_payload
            return Response(resp, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'Itilizatè pa jwenn'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erè nan prosè rejte an: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminDownloadDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Pa gen otorizasyon'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            profile = user.profile

            # Try IdentityDocument first (most recent)
            doc = IdentityDocument.objects.filter(user=user).order_by('-created_at').first()
            doc_field = None
            document_url = None
            if doc:
                if doc.front_image:
                    doc_field = 'front'
                    document_url = doc.front_image.url
                elif doc.back_image:
                    doc_field = 'back'
                    document_url = doc.back_image.url
                elif doc.legacy_single_image:
                    doc_field = 'legacy'
                    document_url = doc.legacy_single_image.url

            # Fallback to profile if needed
            if not document_url:
                if hasattr(profile, 'id_document_front') and profile.id_document_front:
                    doc_field = 'front'
                    document_url = profile.id_document_front.url
                elif hasattr(profile, 'id_document_back') and profile.id_document_back:
                    doc_field = 'back'
                    document_url = profile.id_document_back.url
                elif profile.id_document_image:
                    doc_field = 'legacy'
                    document_url = profile.id_document_image.url
                else:
                    return Response({'error': 'Pa gen dokiman pou download'}, status=status.HTTP_404_NOT_FOUND)
            
            # Return file info for download
            if not document_url.startswith('http'):
                document_url = f"http://127.0.0.1:8000{document_url}"
                
            return Response({
                'download_url': document_url,
                'filename': f"document_{user.username}_{profile.id_document_type or 'id'}_{doc_field}.jpg",
                'document_type': profile.id_document_type,
                'document_number': profile.id_document_number
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'error': 'Itilizatè pa jwenn'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erè nan download dokiman an: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUpdateIdentityDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id, document_id):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({'error': 'Pa gen otorizasyon'}, status=status.HTTP_403_FORBIDDEN)

        # Only support updates for IdentityDocument records (numeric IDs)
        try:
            doc_pk = int(document_id)
        except (ValueError, TypeError):
            return Response({'error': 'Dokiman sa a pa sipòte pou edisyon (eritaj ansyen fòm). Voye nouvo dokiman tanpri.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            doc = IdentityDocument.objects.get(id=doc_pk, user=user)

            # Update simple fields
            if 'document_type' in request.data:
                doc.document_type = request.data.get('document_type') or doc.document_type
            if 'document_number' in request.data:
                doc.document_number = request.data.get('document_number') or doc.document_number

            # If multipart with files
            if hasattr(request, 'FILES'):
                front = request.FILES.get('front_image')
                back = request.FILES.get('back_image')
                if front:
                    doc.front_image = front
                if back:
                    doc.back_image = back

            doc.save()

            # Build response payload
            def abs_url(u):
                if not u:
                    return None
                return u if u.startswith('http') else f"http://127.0.0.1:8000{u}"

            return Response({
                'message': 'Dokiman mete ajou',
                'document': {
                    'id': str(doc.id),
                    'document_type': doc.document_type,
                    'document_number': doc.document_number,
                    'status': doc.status,
                    'front_image_url': abs_url(doc.front_image.url) if doc.front_image else None,
                    'back_image_url': abs_url(doc.back_image.url) if doc.back_image else None,
                }
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'Itilizatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        except IdentityDocument.DoesNotExist:
            return Response({'error': 'Dokiman pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Erè nan mete ajou dokiman an: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUploadDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({
                'error': 'Pa gen otorizasyon'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get the target user
            user = User.objects.get(id=user_id)
            
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Get uploaded document
            id_document = request.FILES.get('id_document')
            
            if not id_document:
                return Response({
                    'error': 'Dokiman obligatwa'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            provided_number = request.data.get('id_document_number', '').strip()
            if provided_number:
                from .models import IdentityDocument, UserProfile
                if IdentityDocument.objects.filter(document_number__iexact=provided_number).exists() or \
                   UserProfile.objects.filter(id_document_number__iexact=provided_number).exclude(user=user).exists():
                    return Response({'error': 'Nimewo dokiman sa a deja egziste.'}, status=status.HTTP_400_BAD_REQUEST)

            # Update profile with new document
            profile.id_document_image = id_document
            profile.id_document_type = request.data.get('id_document_type', '')
            profile.id_document_number = provided_number
            profile.verification_status = 'pending'  # Reset to pending for review
            profile.save()
            
            return Response({
                'message': 'Dokiman upload ak siksè',
                'document_url': profile.id_document_image.url if profile.id_document_image else None
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'Itilizatè pa jwenn'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erè nan upload dokiman an: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RequestVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Check if already verified
            if profile.verification_status == 'verified':
                return Response({
                    'error': 'Kont ou deja verifye'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if already has pending verification
            if profile.verification_status == 'pending':
                return Response({
                    'error': 'Ou gen yon demand verifikasyon ki gen deja. Tanpri tann reponn nou an.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update verification status to pending
            profile.verification_status = 'pending'
            profile.save()
            
            # Send notification email to admins (optional)
            try:
                from django.core.mail import send_mail
                send_mail(
                    'Nouvo Demand Verifikasyon',
                    f'Itilizatè {user.first_name} {user.last_name} ({user.email}) mande verifikasyon kont li.',
                    settings.DEFAULT_FROM_EMAIL,
                    ['admin@cashtimachann.com'],  # Replace with actual admin emails
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Email notification failed: {e}")
            
            return Response({
                'message': 'Demand verifikasyon ou voye ak siksè. N ap verifye enfòmasyon yo ak reponn ou nan yon ti moman.',
                'verification_status': profile.verification_status
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Erè nan demand verifikasyon an: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search for users by name or phone number for money transfers"""
    query = request.GET.get('q', '').strip()
    
    if len(query) < 3:
        return Response([])
    
    # Search by first name, last name, username, phone number, or email
    users = User.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(username__icontains=query) |
        Q(phone_number__icontains=query) |
        Q(email__icontains=query),
        user_type='client',  # Only allow transfers to clients
        is_active=True
    ).exclude(
        id=request.user.id  # Exclude current user
    )[:10]  # Limit to 10 results
    
    results = []
    for user in users:
        # Prefer profile names if available; fall back to User fields
        try:
            profile_first = getattr(user.profile, 'first_name', '') if hasattr(user, 'profile') else ''
            profile_last = getattr(user.profile, 'last_name', '') if hasattr(user, 'profile') else ''
        except Exception:
            profile_first, profile_last = '', ''
        full_name = f"{(profile_first or user.first_name or '').strip()} {(profile_last or user.last_name or '').strip()}".strip()
        results.append({
            'id': user.id,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'username': user.username,
            'phone_number': user.phone_number or '',
            'email': user.email or '',
            'full_name': full_name,
            'user_type': user.user_type
        })
    
    return Response(results)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_transaction_pin(request):
    """Set or change transaction PIN"""
    pin = request.data.get('pin', '').strip()
    
    if not pin:
        return Response({'error': 'PIN obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(pin) < 4 or len(pin) > 6:
        return Response({'error': 'PIN dwe gen 4-6 chif'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not pin.isdigit():
        return Response({'error': 'PIN dwe gen sèlman chif'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = request.user.profile
        profile.set_pin(pin)
        return Response({'message': 'PIN konfigire ak siksè'})
    except Exception as e:
        return Response({'error': f'Erè nan konfigirasyon PIN: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_transaction_pin(request):
    """Verify transaction PIN without performing any transaction"""
    pin = request.data.get('pin', '').strip()
    
    if not pin:
        return Response({'error': 'PIN obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profile = request.user.profile
        if not profile.has_pin():
            return Response({'error': 'Ou pa gen PIN. Tanpri kreye yon PIN'}, status=status.HTTP_400_BAD_REQUEST)
        
        pin_valid, pin_message = profile.check_pin(pin)
        if pin_valid:
            return Response({'message': 'PIN correct'})
        else:
            return Response({'error': pin_message}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Erè nan verifikasyon PIN: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pin_status(request):
    """Check if user has set a PIN"""
    try:
        profile = request.user.profile
        return Response({
            'has_pin': profile.has_pin(),
            'pin_attempts': profile.pin_attempts,
            'pin_locked': bool(profile.pin_locked_until and profile.pin_locked_until > timezone.now()) if profile.pin_locked_until else False
        })
    except Exception as e:
        return Response({'error': f'Erè nan estatistik PIN: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_qr_code(request):
    """Generate QR code for receiving money"""
    try:
        import qrcode
        import json
        import base64
        from io import BytesIO
        from django.utils import timezone
        
        amount = request.data.get('amount', '')
        description = request.data.get('description', '')
        
        # Create QR code data
        qr_data = {
            'type': 'payment_request',
            'user_id': str(request.user.id),
            'phone': request.user.phone_number,
            'name': f"{request.user.first_name} {request.user.last_name}".strip(),
            'amount': amount,
            'description': description,
            'timestamp': timezone.now().isoformat()
        }
        
        qr_string = json.dumps(qr_data)
        
        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_string)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            'qr_data': qr_string,
            'qr_image': img_str,
            'display_info': {
                'name': qr_data['name'],
                'phone': qr_data['phone'],
                'amount': amount,
                'description': description
            }
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan kreyasyon kòd QR: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_personal_qr_code(request):
    """Generate a personal QR that encodes the user's receiving identity (no amount/description)."""
    try:
        import qrcode
        import json
        import base64
        from io import BytesIO
        from django.utils import timezone

        qr_data = {
            'type': 'personal_receive',
            'user_id': str(request.user.id),
            'phone': request.user.phone_number,
            'name': f"{request.user.first_name} {request.user.last_name}".strip(),
            'timestamp': timezone.now().isoformat()
        }
        qr_string = json.dumps(qr_data)

        # Generate QR image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_string)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            'qr_data': qr_string,
            'qr_image': img_str,
            'display_info': {
                'name': qr_data['name'],
                'phone': qr_data['phone']
            }
        })
    except Exception as e:
        return Response({'error': f'Erè nan kreyasyon kòd QR pèsonèl: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_qr_payment(request):
    """Process payment from scanned QR code"""
    try:
        qr_data = request.data.get('qr_data', '')
        pin = request.data.get('pin', '')
        
        if not qr_data or not pin:
            return Response({'error': 'Done QR ak PIN obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse QR data
        import json
        try:
            payment_info = json.loads(qr_data)
        except:
            return Response({'error': 'Kòd QR pa valid'}, status=status.HTTP_400_BAD_REQUEST)
        
        if payment_info.get('type') != 'payment_request':
            return Response({'error': 'Tip kòd QR pa bon'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get receiver
        try:
            receiver = User.objects.get(id=payment_info['user_id'])
        except User.DoesNotExist:
            return Response({'error': 'Moun ki ap resevwa a pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validate PIN
        sender_profile = request.user.profile
        if not sender_profile.has_pin():
            return Response({'error': 'Ou pa gen PIN'}, status=status.HTTP_400_BAD_REQUEST)
        
        pin_valid, pin_message = sender_profile.check_pin(pin)
        if not pin_valid:
            return Response({'error': pin_message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Process payment
        amount = Decimal(str(payment_info.get('amount', 0)))
        if amount <= 0:
            return Response({'error': 'Montan pa valid'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check balance
        sender_wallet = request.user.wallet
        fee = amount * Decimal('0.01')
        total_amount = amount + fee
        
        if sender_wallet.balance < total_amount:
            return Response({'error': 'Ou pa gen ase lajan'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transaction
        from transactions.models import Transaction
        import uuid
        transaction = Transaction.objects.create(
            transaction_type='send',
            sender=request.user,
            receiver=receiver,
            amount=amount,
            fee=fee,
            total_amount=total_amount,
            reference_number=f"QR{uuid.uuid4().hex[:8].upper()}",
            description=f"QR Payment: {payment_info.get('description', '')}",
            status='completed'
        )
        
        # Update wallets
        sender_wallet.balance -= total_amount
        sender_wallet.save()
        
        receiver_wallet = receiver.wallet
        receiver_wallet.balance += amount
        receiver_wallet.save()
        
        transaction.processed_at = timezone.now()
        transaction.save()
        
        return Response({
            'message': 'Peman QR reisi!',
            'reference_number': transaction.reference_number,
            'amount': float(amount),
            'receiver': f"{receiver.first_name} {receiver.last_name}",
            'fee': float(fee)
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan peman QR: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_2fa(request):
    """Enable two-factor authentication"""
    try:
        # For demo purposes, we'll use a simple email-based 2FA
        # In production, you'd use TOTP (Google Authenticator) or SMS
        
        profile = request.user.profile
        
        # Generate a verification code
        import random
        import string
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        # Store the code temporarily (in production, use a proper 2FA system)
        profile.email_verification_code = verification_code
        profile.save()
        
        # In production, send this code via email or show QR for authenticator app
        return Response({
            'message': '2FA konfigire. Kòd konfimo: ' + verification_code,
            'code': verification_code  # Only for demo - remove in production
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan konfigirasyon 2FA: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa(request):
    """Verify 2FA code"""
    try:
        code = request.data.get('code', '').strip()
        
        if not code:
            return Response({'error': 'Kòd 2FA obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile = request.user.profile
        
        if profile.email_verification_code == code:
            # In production, you'd enable 2FA permanently here
            profile.email_verification_code = None
            profile.save()
            
            # Record security activity
            from .models import SecurityActivity
            SecurityActivity.objects.create(
                user=request.user,
                event_type='two_factor_enabled',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                metadata={'enabled_at': timezone.now().isoformat()}
            )
            
            return Response({'message': '2FA aktive ak siksè!'})
        else:
            return Response({'error': 'Kòd 2FA pa bon'}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({'error': f'Erè nan verifikasyon 2FA: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def security_overview(request):
    """Get security overview for user"""
    try:
        profile = request.user.profile
        
        # Get recent security activities
        recent_activities = request.user.security_activities.all()[:10]
        activities_data = []
        for activity in recent_activities:
            activities_data.append({
                'event_type': activity.event_type,
                'timestamp': activity.timestamp.isoformat(),
                'ip_address': activity.ip_address,
                'user_agent': activity.user_agent[:100] if activity.user_agent else None
            })
        
        return Response({
            'has_pin': profile.has_pin(),
            'pin_locked': bool(profile.pin_locked_until and profile.pin_locked_until > timezone.now()) if profile.pin_locked_until else False,
            'email_verified': profile.is_email_verified,
            'phone_verified': profile.is_phone_verified,
            'two_factor_enabled': False,  # Placeholder for real 2FA
            'recent_activities': activities_data,
            'device_info': {
                'current_ip': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT')
            }
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan apèsi sekirite: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_email(request):
    """Update user email address"""
    try:
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response({'error': 'Email obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(email)
        except ValidationError:
            return Response({'error': 'Fòma email pa valab'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists
        if User.objects.filter(email=email).exclude(id=request.user.id).exists():
            return Response({'error': 'Email deja egziste'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update email
        request.user.email = email
        request.user.save()
        
        # Reset email verification
        try:
            profile = request.user.profile
        except Exception:
            # Ensure profile exists if reverse relation missing
            from .models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'first_name': request.user.first_name or getattr(request.user, 'username', 'User'),
                    'last_name': request.user.last_name or ''
                }
            )
        profile.is_email_verified = False
        profile.save()
        
        return Response({
            'success': True,
            'message': 'Email mizajou ak siksè',
            'email': email
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan mizajou email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_phone(request):
    """Update user phone number"""
    try:
        phone = request.data.get('phone', '').strip()
        
        if not phone:
            return Response({'error': 'Nimewo telefòn obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Basic phone validation
        import re
        if not re.match(r'^\+?509\d{8}$', phone.replace(' ', '').replace('-', '')):
            return Response({'error': 'Nimewo telefòn pa valab (dwe kòmanse ak +509)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if phone already exists
        if User.objects.filter(phone=phone).exclude(id=request.user.id).exists():
            return Response({'error': 'Nimewo telefòn deja egziste'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update phone
        request.user.phone = phone
        request.user.save()
        
        # Reset phone verification
        try:
            profile = request.user.profile
        except Exception:
            from .models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'first_name': request.user.first_name or getattr(request.user, 'username', 'User'),
                    'last_name': request.user.last_name or ''
                }
            )
        profile.is_phone_verified = False
        profile.save()
        
        return Response({
            'success': True,
            'message': 'Nimewo telefòn mizajou ak siksè',
            'phone': phone
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan mizajou telefòn: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    try:
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')
        
        if not current_password or not new_password:
            return Response({'error': 'Tout modpas yo obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify current password
        if not request.user.check_password(current_password):
            return Response({'error': 'Modpas aktyèl la pa kòrèk'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password strength
        if len(new_password) < 8:
            return Response({'error': 'Nouvo modpas la dwe gen omwen 8 karaktè'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Change password
        request.user.set_password(new_password)
        request.user.save()
        
        # Log password change activity
        try:
            from .models import SecurityActivity
            SecurityActivity.objects.create(
                user=request.user,
                activity_type='password_change',
                description='Modpas chanje',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        except:
            pass
        
        return Response({
            'success': True,
            'message': 'Modpas chanje ak siksè'
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan chanjman modpas: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get or update complete user profile information including profile picture"""
    try:
        from .serializers import UserProfileSerializer, UserSerializer
        from .models import UserProfile
        
        # Get or create user profile
        try:
            profile = request.user.profile
        except (UserProfile.DoesNotExist, AttributeError):
            # Create profile with basic info if it doesn't exist
            first_name = getattr(request.user, 'first_name', '') or getattr(request.user, 'username', 'User')
            last_name = getattr(request.user, 'last_name', '') or ''
            profile, _ = UserProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
        
        if request.method == 'GET':
            # Get profile information
            user_serializer = UserSerializer(request.user)
            profile_serializer = UserProfileSerializer(profile, context={'request': request})
            
            return Response({
                'success': True,
                'user': user_serializer.data,
                'profile': profile_serializer.data
            })
            
        elif request.method == 'PUT':
            # Update profile information
            serializer = UserProfileSerializer(profile, data=request.data, context={'request': request}, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Profil modifye ak siksè',
                    'profile': serializer.data
                })
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({'error': f'Erè nan jesyon profil: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_photo(request):
    """Upload user profile photo"""
    try:
        if 'profile_picture' not in request.FILES:
            return Response({'error': 'Foto obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile_picture = request.FILES['profile_picture']
        
        # Validate file size (max 5MB)
        if profile_picture.size > 5 * 1024 * 1024:
            return Response({'error': 'Foto twò gwo (maksimòm 5MB)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if profile_picture.content_type not in allowed_types:
            return Response({'error': 'Tip fichye pa valab (sèlman JPEG, PNG, GIF)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create user profile (ensure required fields are populated)
        from .models import UserProfile
        try:
            profile = request.user.profile  # type: ignore[attr-defined]
        except (UserProfile.DoesNotExist, AttributeError):
            first_name = getattr(request.user, 'first_name', '') or getattr(request.user, 'username', 'User')
            last_name = getattr(request.user, 'last_name', '') or ''
            profile, _ = UserProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
        
        # Save the profile picture
        profile.profile_picture = profile_picture
        profile.save()
        
        return Response({
            'success': True,
            'message': 'Foto profil chanje ak siksè',
            'profile_picture_url': profile.profile_picture.url if profile.profile_picture else None
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan chanjman foto: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_language(request):
    """Update user language preference"""
    try:
        language = request.data.get('language', '').strip()
        
        # Validate language choice
        valid_languages = ['kreyol', 'french', 'english', 'spanish']
        if language not in valid_languages:
            return Response({'error': 'Lang pa valab'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create user profile
        try:
            profile = request.user.profile
        except (UserProfile.DoesNotExist, AttributeError):
            # Handle both missing profile and missing relationship
            profile, created = UserProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'first_name': request.user.first_name or '',
                    'last_name': request.user.last_name or ''
                }
            )
        
        # Update language preference
        profile.preferred_language = language
        profile.save()
        
        # Language names mapping
        language_names = {
            'kreyol': 'Kreyòl Ayisyen',
            'french': 'Français', 
            'english': 'English',
            'spanish': 'Español'
        }
        
        return Response({
            'success': True,
            'message': f'Lang chanje nan {language_names.get(language, language)}',
            'language': language,
            'language_display': language_names.get(language, language)
        })
        
    except Exception as e:
        # Add more detailed error logging
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in update_language: {error_details}")
        return Response({'error': f'Erè nan chanjman lang: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_language(request):
    """Get user's current language preference"""
    try:
        # Get user profile
        try:
            profile = request.user.profile
            language = profile.preferred_language or 'kreyol'
        except (UserProfile.DoesNotExist, AttributeError):
            # Try to get profile directly if relationship doesn't work
            try:
                profile = UserProfile.objects.get(user=request.user)
                language = profile.preferred_language or 'kreyol'
            except UserProfile.DoesNotExist:
                language = 'kreyol'  # Default language
        
        # Language names mapping
        language_names = {
            'kreyol': 'Kreyòl Ayisyen',
            'french': 'Français',
            'english': 'English', 
            'spanish': 'Español'
        }
        
        return Response({
            'language': language,
            'language_display': language_names.get(language, 'Kreyòl Ayisyen'),
            'available_languages': [
                {'code': 'kreyol', 'name': 'Kreyòl Ayisyen', 'flag': '🇭🇹'},
                {'code': 'french', 'name': 'Français', 'flag': '🇫🇷'},
                {'code': 'english', 'name': 'English', 'flag': '🇺🇸'},
                {'code': 'spanish', 'name': 'Español', 'flag': '🇪🇸'}
            ]
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_user_language: {error_details}")
        return Response({'error': f'Erè nan rechèch lang: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)