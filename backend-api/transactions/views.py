from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Transaction, PhoneTopUp, BillPayment
from .serializers import TransactionSerializer, PhoneTopUpSerializer, BillPaymentSerializer
from accounts.models import Wallet
import uuid
from decimal import Decimal
from datetime import datetime

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_transactions(request):
    """Get all transactions for the authenticated user"""
    user = request.user
    
    # Get transactions where user is either sender or receiver
    transactions = Transaction.objects.filter(
        Q(sender=user) | Q(receiver=user)
    ).order_by('-created_at')
    
    # Apply pagination
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))
    transactions = transactions[offset:offset + limit]
    
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_money(request):
    """Send money to another user with PIN validation"""
    try:
        receiver_phone = request.data.get('receiver_phone')
        amount = Decimal(str(request.data.get('amount', 0)))
        description = request.data.get('description', '')
        pin = request.data.get('pin', '')
        
        # Validate amount
        if amount <= 0:
            return Response({'error': 'Montan an dwe pi gwo pase 0'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate PIN
        if not pin:
            return Response({'error': 'PIN obligatwa pou tranzaksyon yo'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get sender profile and check PIN
        try:
            sender_profile = request.user.profile
        except:
            return Response({'error': 'Profil ou pa jwenn'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not sender_profile.has_pin():
            return Response({'error': 'Ou pa gen PIN. Tanpri kreye yon PIN anvan w voye lajan'}, status=status.HTTP_400_BAD_REQUEST)
        
        pin_valid, pin_message = sender_profile.check_pin(pin)
        if not pin_valid:
            return Response({'error': pin_message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find receiver by phone or email
        try:
            from accounts.models import User
            # Try to find by phone number first
            if '@' in receiver_phone:
                # It's an email
                receiver = User.objects.get(email=receiver_phone)
            else:
                # It's a phone number
                receiver = User.objects.get(phone_number=receiver_phone)
        except User.DoesNotExist:
            return Response({'error': 'Destinatè pa jwenn'}, status=status.HTTP_404_NOT_FOUND)
        
        # Prevent self-transfer
        if receiver.id == request.user.id:
            return Response({'error': 'Ou pa ka voye lajan ba ou menm'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check sender's balance
        try:
            sender_wallet = request.user.wallet
        except:
            return Response({'error': 'Wallet ou pa jwenn'}, status=status.HTTP_400_BAD_REQUEST)
            
        fee = amount * Decimal('0.01')  # 1% fee
        total_amount = amount + fee
        
        if sender_wallet.balance < total_amount:
            return Response({'error': 'Ou pa gen ase lajan nan wallet ou'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transaction
        transaction = Transaction.objects.create(
            transaction_type='send',
            sender=request.user,
            receiver=receiver,
            amount=amount,
            fee=fee,
            total_amount=total_amount,
            reference_number=f"TXN{uuid.uuid4().hex[:8].upper()}",
            description=description,
            status='completed'
        )
        
        # Update wallets
        sender_wallet.balance -= total_amount
        sender_wallet.save()
        
        try:
            receiver_wallet = receiver.wallet
        except:
            return Response({'error': 'Wallet destinatè a pa jwenn'}, status=status.HTTP_400_BAD_REQUEST)
            
        receiver_wallet.balance += amount
        receiver_wallet.save()
        
        transaction.processed_at = datetime.now()
        transaction.save()
        
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def phone_topup(request):
    """Send phone top-up/minutes to a phone number"""
    try:
        recipient_phone = request.data.get('recipient_phone')
        carrier = request.data.get('carrier')
        amount = Decimal(str(request.data.get('amount', 0)))
        message = request.data.get('message', '')
        
        # Validate inputs
        if not recipient_phone or not carrier or amount <= 0:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check user's balance
        user_wallet = request.user.wallet
        fee = Decimal('5.00')  # Fixed 5 HTG fee
        total_amount = amount + fee
        
        if user_wallet.balance < total_amount:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transaction
        transaction = Transaction.objects.create(
            transaction_type='topup',
            sender=request.user,
            amount=amount,
            fee=fee,
            total_amount=total_amount,
            reference_number=f"TOP{uuid.uuid4().hex[:8].upper()}",
            description=f"Phone top-up to {recipient_phone}",
            status='completed'
        )
        
        # Create phone top-up record
        PhoneTopUp.objects.create(
            transaction=transaction,
            recipient_phone=recipient_phone,
            carrier=carrier,
            minutes_amount=int(amount / 2),  # Rough calculation: 1 HTG = 0.5 minutes
            message=message,
            carrier_reference=f"{carrier.upper()}{uuid.uuid4().hex[:6].upper()}"
        )
        
        # Update wallet
        user_wallet.balance -= total_amount
        user_wallet.save()
        
        transaction.processed_at = datetime.now()
        transaction.save()
        
        serializer = PhoneTopUpSerializer(transaction.phone_topup)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_bill(request):
    """Pay a bill with PIN validation"""
    try:
        bill_type = request.data.get('bill_type')
        account_number = request.data.get('account_number')
        service_provider = request.data.get('service_provider')
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin', '')
        
        # Validate inputs
        if not bill_type or not account_number or not service_provider or amount <= 0:
            return Response({'error': 'Enfòmasyon ki manke'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate PIN
        if not pin:
            return Response({'error': 'PIN obligatwa pou peman faktè yo'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get sender profile and check PIN
        try:
            sender_profile = request.user.profile
        except:
            return Response({'error': 'Profil ou pa jwenn'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not sender_profile.has_pin():
            return Response({'error': 'Ou pa gen PIN. Tanpri kreye yon PIN anvan w peye faktè'}, status=status.HTTP_400_BAD_REQUEST)
        
        pin_valid, pin_message = sender_profile.check_pin(pin)
        if not pin_valid:
            return Response({'error': pin_message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check user's balance
        user_wallet = request.user.wallet
        fee = amount * Decimal('0.005')  # 0.5% fee for bills
        total_amount = amount + fee
        
        if user_wallet.balance < total_amount:
            return Response({'error': 'Ou pa gen ase lajan nan wallet ou'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transaction
        transaction = Transaction.objects.create(
            transaction_type='bill_payment',
            sender=request.user,
            amount=amount,
            fee=fee,
            total_amount=total_amount,
            reference_number=f"BILL{uuid.uuid4().hex[:8].upper()}",
            description=f"{bill_type} payment to {service_provider}",
            status='completed'
        )
        
        # Create bill payment record
        BillPayment.objects.create(
            transaction=transaction,
            bill_type=bill_type,
            account_number=account_number,
            service_provider=service_provider,
            provider_reference=f"{service_provider.upper()}{uuid.uuid4().hex[:6].upper()}"
        )
        
        # Update wallet
        user_wallet.balance -= total_amount
        user_wallet.save()
        
        transaction.processed_at = datetime.now()
        transaction.save()
        
        serializer = BillPaymentSerializer(transaction.bill_payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_stats(request):
    """Get transaction statistics for the user"""
    user = request.user
    
    # Get monthly transaction count
    from django.utils import timezone
    from datetime import timedelta
    
    thirty_days_ago = timezone.now() - timedelta(days=30)
    monthly_transactions = Transaction.objects.filter(
        Q(sender=user) | Q(receiver=user),
        created_at__gte=thirty_days_ago
    ).count()
    
    # Get recent transaction amount
    recent_transaction = Transaction.objects.filter(
        Q(sender=user) | Q(receiver=user)
    ).first()
    
    recent_amount = '0 HTG'
    if recent_transaction:
        sign = '+' if recent_transaction.receiver == user else '-'
        recent_amount = f"{sign}{recent_transaction.amount} HTG"
    
    return Response({
        'monthly_transactions': monthly_transactions,
        'recent_transaction': recent_amount,
        'balance': str(user.wallet.balance),
        'wallet_id': str(user.wallet.id)
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def card_deposit(request):
    """Deposit money using VISA/Mastercard"""
    try:
        card_number = request.data.get('card_number', '').replace(' ', '')
        expiry_month = request.data.get('expiry_month')
        expiry_year = request.data.get('expiry_year')
        cvv = request.data.get('cvv')
        amount = Decimal(str(request.data.get('amount', 0)))
        cardholder_name = request.data.get('cardholder_name', '')
        
        # Validate required fields
        if not all([card_number, expiry_month, expiry_year, cvv, cardholder_name]):
            return Response({'error': 'Tanpri ranpli tout enfòmasyon yo'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate amount
        if amount < 100 or amount > 50000:
            return Response({'error': 'Kantite a dwe ant 100 ak 50,000 HTG'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate card number (basic check)
        if len(card_number) != 16 or not card_number.isdigit():
            return Response({'error': 'Nimewo kat la pa valab'}, status=status.HTTP_400_BAD_REQUEST)
        
        # In a real implementation, you would integrate with a payment gateway like Stripe
        # For demo purposes, we'll simulate success
        
        # Get user wallet
        try:
            wallet = request.user.wallet
        except:
            return Response({'error': 'Wallet pa jwenn'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate fee (2.5% + 10 HTG)
        fee = (amount * Decimal('0.025')) + Decimal('10')
        net_amount = amount - fee
        
        # Create transaction record
        transaction = Transaction.objects.create(
            sender=None,  # External card deposit
            receiver=request.user,
            amount=net_amount,
            transaction_type='card_deposit',
            status='completed',
            reference_number=f'CD{uuid.uuid4().hex[:10].upper()}',
            description=f'Depo ak kat ****{card_number[-4:]} - {cardholder_name}'
        )
        
        # Update wallet balance
        wallet.balance += net_amount
        wallet.save()
        
        return Response({
            'success': True,
            'message': 'Depo ak siksè!',
            'reference_number': transaction.reference_number,
            'amount_deposited': str(net_amount),
            'fee': str(fee),
            'new_balance': str(wallet.balance)
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan pwosèsman: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merchant_payment(request):
    """Pay to merchant via QR code or merchant code"""
    try:
        merchant_code = request.data.get('merchant_code', '').upper()
        amount = Decimal(str(request.data.get('amount', 0)))
        description = request.data.get('description', '')
        payment_type = request.data.get('payment_type', 'qr')
        
        # Validate required fields
        if not merchant_code or amount <= 0:
            return Response({'error': 'Kòd machann ak kantite obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate merchant code format
        if not merchant_code.startswith('M') or len(merchant_code) != 7:
            return Response({'error': 'Kòd machann pa valab (dwe kòmanse ak M ak gen 7 karaktè)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user wallet
        try:
            wallet = request.user.wallet
        except:
            return Response({'error': 'Wallet pa jwenn'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check balance
        if wallet.balance < amount:
            return Response({'error': 'Balans ou insifizant'}, status=status.HTTP_400_BAD_REQUEST)
        
        # In a real implementation, verify merchant exists and is active
        # For demo, simulate merchant data
        merchant_names = {
            'M001234': 'Supèmake Royal',
            'M005678': 'Pharmacy Plus', 
            'M009876': 'Restaurant Ti Kafe'
        }
        
        merchant_name = merchant_names.get(merchant_code, f'Machann {merchant_code}')
        
        # Create transaction
        transaction = Transaction.objects.create(
            sender=request.user,
            receiver=None,  # Merchant payment
            amount=amount,
            transaction_type='merchant_payment',
            status='completed',
            reference_number=f'MP{uuid.uuid4().hex[:10].upper()}',
            description=f'Peyman nan {merchant_name} - {description}' if description else f'Peyman nan {merchant_name}'
        )
        
        # Update wallet balance
        wallet.balance -= amount
        wallet.save()
        
        return Response({
            'success': True,
            'message': f'Peyman ak siksè nan {merchant_name}!',
            'reference_number': transaction.reference_number,
            'merchant_name': merchant_name,
            'amount': str(amount),
            'new_balance': str(wallet.balance)
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan peyman an: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agent_withdrawal(request):
    """Request cash withdrawal from agent with PIN validation"""
    try:
        agent_code = request.data.get('agent_code', '').upper()
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin', '')
        
        # Validate required fields
        if not all([agent_code, amount, pin]):
            return Response({'error': 'Kòd ajan, kantite ak PIN obligatwa'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate agent code format
        if not agent_code.startswith('A') or len(agent_code) != 7:
            return Response({'error': 'Kòd ajan pa valab (dwe kòmanse ak A ak gen 7 karaktè)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate amount
        if amount < 100 or amount > 25000:
            return Response({'error': 'Kantite retire a dwe ant 100 ak 25,000 HTG'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate PIN
        from accounts.models import UserProfile
        try:
            profile = UserProfile.objects.get(user=request.user)
            if not profile.check_pin(pin):
                return Response({'error': 'PIN an pa kòrèk'}, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profil itilizatè pa jwenn'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user wallet
        try:
            wallet = request.user.wallet
        except:
            return Response({'error': 'Wallet pa jwenn'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate total with fee (25 HTG fee)
        fee = Decimal('25')
        total_amount = amount + fee
        
        # Check balance
        if wallet.balance < total_amount:
            return Response({'error': f'Balans ou insifizant (bezwen {total_amount} HTG ak frè)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # In a real implementation, verify agent exists and has enough cash
        # For demo, simulate agent data
        agent_names = {
            'A001234': 'Ajan Delmas 33',
            'A005678': 'Ajan Pétion-Ville',
            'A009876': 'Ajan Tabarre'
        }
        
        agent_name = agent_names.get(agent_code, f'Ajan {agent_code}')
        
        # Generate confirmation code for agent verification
        confirmation_code = f'AW{uuid.uuid4().hex[:6].upper()}'
        
        # Create withdrawal transaction
        transaction = Transaction.objects.create(
            sender=request.user,
            receiver=None,  # Agent withdrawal
            amount=amount,
            transaction_type='agent_withdrawal',
            status='pending',  # Will be completed when agent confirms
            reference_number=f'AW{uuid.uuid4().hex[:10].upper()}',
            description=f'Retire lajan nan {agent_name} - Kòd: {confirmation_code}'
        )
        
        # Create fee transaction
        fee_transaction = Transaction.objects.create(
            sender=request.user,
            receiver=None,
            amount=fee,
            transaction_type='withdrawal_fee',
            status='completed',
            reference_number=f'FE{uuid.uuid4().hex[:10].upper()}',
            description='Frè retire lajan'
        )
        
        # Update wallet balance (deduct total amount)
        wallet.balance -= total_amount
        wallet.save()
        
        return Response({
            'success': True,
            'message': f'Retire otorize nan {agent_name}!',
            'confirmation_code': confirmation_code,
            'agent_name': agent_name,
            'amount': str(amount),
            'fee': str(fee),
            'reference_number': transaction.reference_number,
            'instructions': f'Montre kòd {confirmation_code} ak ID ou bay ajan {agent_name}'
        })
        
    except Exception as e:
        return Response({'error': f'Erè nan retire a: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
