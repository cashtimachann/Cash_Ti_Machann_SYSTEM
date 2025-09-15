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
    """Send money to another user"""
    try:
        receiver_phone = request.data.get('receiver_phone')
        amount = Decimal(str(request.data.get('amount', 0)))
        description = request.data.get('description', '')
        
        # Validate amount
        if amount <= 0:
            return Response({'error': 'Amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find receiver
        try:
            from accounts.models import User
            receiver = User.objects.get(phone_number=receiver_phone)
        except User.DoesNotExist:
            return Response({'error': 'Receiver not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check sender's balance
        sender_wallet = request.user.wallet
        fee = amount * Decimal('0.01')  # 1% fee
        total_amount = amount + fee
        
        if sender_wallet.balance < total_amount:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
        
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
        
        receiver_wallet = receiver.wallet
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
    """Pay a bill"""
    try:
        bill_type = request.data.get('bill_type')
        account_number = request.data.get('account_number')
        service_provider = request.data.get('service_provider')
        amount = Decimal(str(request.data.get('amount', 0)))
        
        # Validate inputs
        if not bill_type or not account_number or not service_provider or amount <= 0:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check user's balance
        user_wallet = request.user.wallet
        fee = amount * Decimal('0.005')  # 0.5% fee for bills
        total_amount = amount + fee
        
        if user_wallet.balance < total_amount:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
        
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
