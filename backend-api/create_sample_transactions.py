#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.append('/Users/herlytache/Desktop/Cash Ti Machann/backend-api')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')

# Setup Django
django.setup()

from accounts.models import User, Wallet
from transactions.models import Transaction, PhoneTopUp, BillPayment
from decimal import Decimal
import uuid
from datetime import datetime, timedelta
from django.utils import timezone

def create_sample_transactions():
    print("Creating sample transactions...")
    
    # Get or create a test client user
    try:
        client = User.objects.get(username='testclient')
        print(f"✅ Found existing user: {client.username}")
    except User.DoesNotExist:
        client = User.objects.create_user(
            username='testclient',
            email='test@example.com',
            password='test123',
            user_type='client'
        )
        client.first_name = 'Test'
        client.last_name = 'Client'
        client.phone_number = '5555-5555'
        client.save()
        print(f"✅ Created user: {client.username}")
    
    # Ensure wallet exists with sufficient balance
    wallet, created = Wallet.objects.get_or_create(
        user=client,
        defaults={
            'balance': Decimal('10000.00')
        }
    )
    if created:
        print(f"✅ Created wallet with balance: {wallet.balance} HTG")
    else:
        wallet.balance = Decimal('10000.00')
        wallet.save()
        print(f"✅ Updated wallet balance: {wallet.balance} HTG")
    
    # Create another user for send/receive transactions
    try:
        sender = User.objects.get(username='mariejeanne')
    except User.DoesNotExist:
        sender = User.objects.create_user(
            username='mariejeanne',
            email='marie@example.com',
            password='test123',
            user_type='client'
        )
        sender.first_name = 'Marie'
        sender.last_name = 'Jeanne'
        sender.phone_number = '3812-5678'
        sender.save()
        Wallet.objects.get_or_create(
            user=sender,
            defaults={
                'balance': Decimal('5000.00')
            }
        )
        print(f"✅ Created sender user: {sender.username}")
    
    # Create sample transactions
    now = timezone.now()
    
    # 1. Received money from Marie
    receive_tx = Transaction.objects.create(
        transaction_type='receive',
        sender=sender,
        receiver=client,
        amount=Decimal('1250.00'),
        fee=Decimal('0.00'),
        total_amount=Decimal('1250.00'),
        reference_number=f"TXN{uuid.uuid4().hex[:8].upper()}",
        description='Money from Marie Jeanne',
        status='completed',
        created_at=now - timedelta(minutes=5),
        processed_at=now - timedelta(minutes=5)
    )
    print(f"✅ Created receive transaction: {receive_tx.reference_number}")
    
    # 2. Phone top-up transaction
    topup_tx = Transaction.objects.create(
        transaction_type='topup',
        sender=client,
        amount=Decimal('100.00'),
        fee=Decimal('5.00'),
        total_amount=Decimal('105.00'),
        reference_number=f"TOP{uuid.uuid4().hex[:8].upper()}",
        description='Phone top-up to 3812-3456',
        status='completed',
        created_at=now - timedelta(minutes=45),
        processed_at=now - timedelta(minutes=45)
    )
    PhoneTopUp.objects.create(
        transaction=topup_tx,
        recipient_phone='3812-3456',
        carrier='digicel',
        minutes_amount=50,
        message='',
        carrier_reference=f"DIGICEL{uuid.uuid4().hex[:6].upper()}"
    )
    print(f"✅ Created top-up transaction: {topup_tx.reference_number}")
    
    # 3. Send money transaction
    send_tx = Transaction.objects.create(
        transaction_type='send',
        sender=client,
        receiver=sender,  # Sending back to Marie
        amount=Decimal('750.00'),
        fee=Decimal('7.50'),
        total_amount=Decimal('757.50'),
        reference_number=f"TXN{uuid.uuid4().hex[:8].upper()}",
        description='Payment to Pierre Louis',
        status='completed',
        created_at=now - timedelta(hours=1),
        processed_at=now - timedelta(hours=1)
    )
    print(f"✅ Created send transaction: {send_tx.reference_number}")
    
    # 4. Bill payment transaction
    bill_tx = Transaction.objects.create(
        transaction_type='bill_payment',
        sender=client,
        amount=Decimal('450.00'),
        fee=Decimal('2.25'),
        total_amount=Decimal('452.25'),
        reference_number=f"BILL{uuid.uuid4().hex[:8].upper()}",
        description='EDH electricity bill payment',
        status='completed',
        created_at=now - timedelta(hours=2),
        processed_at=now - timedelta(hours=2)
    )
    BillPayment.objects.create(
        transaction=bill_tx,
        bill_type='electricity',
        account_number='EDH123456789',
        service_provider='EDH',
        provider_reference=f"EDH{uuid.uuid4().hex[:6].upper()}"
    )
    print(f"✅ Created bill payment transaction: {bill_tx.reference_number}")
    
    # 5. Account recharge transaction
    recharge_tx = Transaction.objects.create(
        transaction_type='recharge',
        sender=client,
        amount=Decimal('100.00'),
        fee=Decimal('0.00'),
        total_amount=Decimal('100.00'),
        reference_number=f"RCH{uuid.uuid4().hex[:8].upper()}",
        description='Digicel recharge',
        status='completed',
        created_at=now - timedelta(days=1),
        processed_at=now - timedelta(days=1)
    )
    print(f"✅ Created recharge transaction: {recharge_tx.reference_number}")
    
    print(f"\n🎉 Successfully created 5 sample transactions for user: {client.username}")
    print(f"💰 Current wallet balance: {client.wallet.balance} HTG")
    print("\nYou can now test the dashboard with real data!")

if __name__ == '__main__':
    create_sample_transactions()
