# Admin Transaction Views
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.core.paginator import Paginator
from .models import Transaction
from .serializers import TransactionSerializer
from accounts.models import User
import uuid
from datetime import datetime, time
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_all_transactions(request):
    """Get all transactions for admin dashboard with filtering and pagination"""
    
    # Check if user is admin
    if request.user.user_type != 'admin':
        return Response({'error': 'Pa gen otorizasyon'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Start with all transactions
        transactions = Transaction.objects.all().select_related('sender', 'receiver').order_by('-created_at')
        
        # Apply filters
        search = request.GET.get('search', '').strip()
        status_filter = request.GET.get('status', '').strip()
        type_filter = request.GET.get('type', '').strip()
        user_type_filter = request.GET.get('user_type', '').strip()
        # Date/time range filters (optional)
        # Accepts:
        #   - date_from/date_to (preferred)
        #   - start_date/end_date (alias)
        # Formats supported: ISO (e.g., 2025-09-26T10:30:00Z) or date-only (YYYY-MM-DD)
        date_from_param = (request.GET.get('date_from') or request.GET.get('start_date') or '').strip()
        date_to_param = (request.GET.get('date_to') or request.GET.get('end_date') or '').strip()

        def _parse_dt(val: str, is_end: bool = False):
            if not val:
                return None
            tz = timezone.get_current_timezone()
            # Try ISO first
            try:
                dt = datetime.fromisoformat(val.replace('Z', '+00:00'))
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, tz)
                return dt
            except Exception:
                pass
            # Try date-only
            try:
                d = datetime.strptime(val, '%Y-%m-%d').date()
                if is_end:
                    dt = datetime.combine(d, time(23, 59, 59, 999999))
                else:
                    dt = datetime.combine(d, time(0, 0, 0, 0))
                return timezone.make_aware(dt, tz)
            except Exception:
                return None
        
        # Search filter (ID, sender name, receiver name, reference)
        if search:
            transactions = transactions.filter(
                Q(id__icontains=search) |
                Q(reference_number__icontains=search) |
                Q(sender__first_name__icontains=search) |
                Q(sender__last_name__icontains=search) |
                Q(sender__username__icontains=search) |
                Q(receiver__first_name__icontains=search) |
                Q(receiver__last_name__icontains=search) |
                Q(receiver__username__icontains=search)
            )
        
        # Status filter
        if status_filter:
            # Map frontend status to backend status
            status_mapping = {
                'Konfime': 'completed',
                'An analiz': 'pending',
                'Anile': 'cancelled',
                'Echwe': 'failed'
            }
            backend_status = status_mapping.get(status_filter)
            if backend_status:
                transactions = transactions.filter(status=backend_status)
        
        # Type filter
        if type_filter:
            # Map frontend type to backend type
            type_mapping = {
                'Voye': 'send',
                'Depo': 'deposit',
                'Retrè': 'withdrawal',
                'Reqèt': 'request',
                'Peman biznis': 'bill_payment'
            }
            backend_type = type_mapping.get(type_filter)
            if backend_type:
                transactions = transactions.filter(transaction_type=backend_type)
        
    # User type filter
        if user_type_filter:
            # Map frontend user type to backend user type
            user_type_mapping = {
                'Klyan': 'client',
                'Ajan': 'agent',
                'Ti machann': 'enterprise',
                'Sistèm': 'system'
            }
            backend_user_type = user_type_mapping.get(user_type_filter)
            if backend_user_type:
                transactions = transactions.filter(
                    Q(sender__user_type=backend_user_type) |
                    Q(receiver__user_type=backend_user_type)
                )

        # Date range filters
        start_dt = _parse_dt(date_from_param, is_end=False)
        end_dt = _parse_dt(date_to_param, is_end=True)
        if start_dt:
            transactions = transactions.filter(created_at__gte=start_dt)
        if end_dt:
            transactions = transactions.filter(created_at__lte=end_dt)
        
        # Pagination
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        
        paginator = Paginator(transactions, limit)
        page_obj = paginator.get_page(page)
        
        # Serialize transactions with additional admin fields
        serialized_transactions = []
        for transaction in page_obj:
            # Get basic serialized data
            serializer = TransactionSerializer(transaction)
            transaction_data = serializer.data
            
            # Add admin-specific fields
            transaction_data['admin_notes'] = getattr(transaction, 'admin_notes', '')
            transaction_data['created_by'] = 'Sistèm'  # Default for now
            transaction_data['history'] = []  # TODO: Implement transaction history
            
            serialized_transactions.append(transaction_data)
        
        return Response({
            'results': serialized_transactions,
            'count': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Erè nan jwenn tranzaksyon yo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_transaction_detail(request, transaction_id):
    """Get detailed information about a specific transaction"""
    
    # Check if user is admin
    if request.user.user_type != 'admin':
        return Response({'error': 'Pa gen otorizasyon'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        transaction = Transaction.objects.select_related('sender', 'receiver').get(id=transaction_id)
        
        # Serialize with admin fields
        serializer = TransactionSerializer(transaction)
        transaction_data = serializer.data
        
        # Add admin-specific fields
        transaction_data['admin_notes'] = getattr(transaction, 'admin_notes', '')
        transaction_data['created_by'] = 'Sistèm'  # Default for now
        transaction_data['history'] = []  # TODO: Implement transaction history
        
        return Response(transaction_data, status=status.HTTP_200_OK)
        
    except Transaction.DoesNotExist:
        return Response({'error': 'Tranzaksyon pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erè nan jwenn tranzaksyon an: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_transaction_status(request, transaction_id):
    """Update transaction status (admin action)"""
    
    # Check if user is admin
    if request.user.user_type != 'admin':
        return Response({'error': 'Pa gen otorizasyon'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        transaction = Transaction.objects.get(id=transaction_id)
        action = request.data.get('action')
        notes = request.data.get('notes', '')
        
        # Map frontend actions to backend status
        action_mapping = {
            'verify': 'completed',
            'cancel': 'cancelled',
            'block': 'pending'  # Keep in review
        }
        
        new_status = action_mapping.get(action)
        if not new_status:
            return Response({'error': 'Aksyon pa valid'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Store previous status for history
        previous_status = transaction.status
        
        # Update transaction
        transaction.status = new_status
        if hasattr(transaction, 'admin_notes'):
            transaction.admin_notes = notes
        transaction.save()
        
        # TODO: Create transaction history record
        # TransactionHistory.objects.create(
        #     transaction=transaction,
        #     action=f'Admin {action}',
        #     performed_by=request.user.username,
        #     previous_status=previous_status,
        #     new_status=new_status,
        #     notes=notes
        # )
        
        # Return updated transaction
        serializer = TransactionSerializer(transaction)
        transaction_data = serializer.data
        transaction_data['admin_notes'] = notes
        transaction_data['created_by'] = 'Sistèm'
        transaction_data['history'] = []
        
        return Response(transaction_data, status=status.HTTP_200_OK)
        
    except Transaction.DoesNotExist:
        return Response({'error': 'Tranzaksyon pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erè nan aktyalize tranzaksyon an: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_transaction_history(request, transaction_id):
    """Get transaction history"""
    
    # Check if user is admin
    if request.user.user_type != 'admin':
        return Response({'error': 'Pa gen otorizasyon'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        transaction = Transaction.objects.get(id=transaction_id)
        
        # TODO: Implement transaction history model and return real history
        # For now, return mock history based on transaction status
        history = []
        
        # Add creation history
        history.append({
            'id': f'{transaction.id}_created',
            'action': 'Tranzaksyon kreye',
            'performed_by': 'Sistèm',
            'timestamp': transaction.created_at.isoformat(),
            'new_status': transaction.status,
            'notes': 'Tranzaksyon inisyal'
        })
        
        # Add status change history if not pending
        if transaction.status != 'pending':
            history.append({
                'id': f'{transaction.id}_status_change',
                'action': f'Chanje nan {transaction.status}',
                'performed_by': 'Admin',
                'timestamp': transaction.updated_at.isoformat(),
                'previous_status': 'pending',
                'new_status': transaction.status,
                'notes': 'Chanjman estatik pa admin'
            })
        
        return Response({'history': history}, status=status.HTTP_200_OK)
        
    except Transaction.DoesNotExist:
        return Response({'error': 'Tranzaksyon pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erè nan jwenn istwa tranzaksyon an: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)