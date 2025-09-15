from django.core.management.base import BaseCommand
from accounts.models import User, UserProfile, Wallet, AgentProfile, EnterpriseProfile
from transactions.models import Transaction, PhoneTopUp, BillPayment
from agents.models import AgentLocation, AgentLimit
from decimal import Decimal
import uuid
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Create sample data for Cash Ti Machann'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create client users
        client1 = User.objects.create_user(
            username='jean_baptiste',
            email='jean@example.com',
            password='password123',
            user_type='client',
            phone_number='3812-3456',
            is_verified=True
        )
        
        client2 = User.objects.create_user(
            username='marie_jeanne',
            email='marie@example.com',
            password='password123',
            user_type='client',
            phone_number='4712-7890',
            is_verified=True
        )
        
        # Create agent user
        agent1 = User.objects.create_user(
            username='pierre_agent',
            email='pierre@agent.com',
            password='password123',
            user_type='agent',
            phone_number='3823-4567',
            is_verified=True
        )
        
        # Create enterprise user
        enterprise1 = User.objects.create_user(
            username='tech_solutions',
            email='admin@techsolutions.com',
            password='password123',
            user_type='enterprise',
            phone_number='2245-6789',
            is_verified=True
        )
        
        # Create user profiles
        UserProfile.objects.create(
            user=client1,
            first_name='Jean',
            last_name='Baptiste',
            address='Rue Capois, Port-au-Prince',
            city='Port-au-Prince',
            verification_status='verified'
        )
        
        UserProfile.objects.create(
            user=client2,
            first_name='Marie',
            last_name='Jeanne',
            address='Avenue Jean Paul II, Cap-Haitien',
            city='Cap-Haitien',
            verification_status='verified'
        )
        
        UserProfile.objects.create(
            user=agent1,
            first_name='Pierre',
            last_name='Louis',
            address='Centre-ville, Les Cayes',
            city='Les Cayes',
            verification_status='verified'
        )
        
        # Create wallets with balances
        Wallet.objects.create(user=client1, balance=Decimal('5670.00'))
        Wallet.objects.create(user=client2, balance=Decimal('3245.50'))
        Wallet.objects.create(user=agent1, balance=Decimal('25000.00'))
        Wallet.objects.create(user=enterprise1, balance=Decimal('150000.00'))
        
        # Create agent profile
        AgentProfile.objects.create(
            user=agent1,
            agent_code='AGT001',
            commission_rate=Decimal('2.50'),
            monthly_limit=Decimal('100000.00'),
            current_month_volume=Decimal('15000.00'),
            is_approved=True,
            location='Les Cayes, Sud'
        )
        
        # Create enterprise profile
        EnterpriseProfile.objects.create(
            user=enterprise1,
            company_name='Tech Solutions Haiti',
            company_registration_number='ENT2023001',
            tax_id='TAX123456',
            business_type='Technology Services',
            is_approved=True
        )
        
        # Create agent location
        AgentLocation.objects.create(
            agent=agent1,
            name='Pierre Louis Financial Services',
            address='Avenue Nemours Pierre-Louis, Les Cayes',
            city='Les Cayes',
            department='Sud',
            phone_number='3823-4567',
            operating_hours={
                'monday': '8:00-17:00',
                'tuesday': '8:00-17:00',
                'wednesday': '8:00-17:00',
                'thursday': '8:00-17:00',
                'friday': '8:00-17:00',
                'saturday': '8:00-12:00',
                'sunday': 'closed'
            }
        )
        
        # Create agent limits
        AgentLimit.objects.create(
            agent=agent1,
            limit_type='daily_transaction',
            limit_amount=Decimal('50000.00'),
            current_usage=Decimal('12500.00'),
            reset_period='daily'
        )
        
        AgentLimit.objects.create(
            agent=agent1,
            limit_type='single_transaction',
            limit_amount=Decimal('10000.00'),
            current_usage=Decimal('0.00'),
            reset_period='never'
        )
        
        # Create sample transactions
        # Money transfer
        transfer_tx = Transaction.objects.create(
            transaction_type='send',
            sender=client2,
            receiver=client1,
            amount=Decimal('1250.00'),
            fee=Decimal('25.00'),
            total_amount=Decimal('1275.00'),
            reference_number='TXN' + str(uuid.uuid4())[:8].upper(),
            description='Transfer to Jean Baptiste',
            status='completed'
        )
        
        # Phone top-up
        topup_tx = Transaction.objects.create(
            transaction_type='topup',
            sender=client1,
            amount=Decimal('100.00'),
            fee=Decimal('5.00'),
            total_amount=Decimal('105.00'),
            reference_number='TXN' + str(uuid.uuid4())[:8].upper(),
            description='Phone top-up',
            status='completed'
        )
        
        PhoneTopUp.objects.create(
            transaction=topup_tx,
            recipient_phone='3812-3456',
            carrier='digicel',
            minutes_amount=25,
            message='Minit pou ou'
        )
        
        # Bill payment
        bill_tx = Transaction.objects.create(
            transaction_type='bill_payment',
            sender=client1,
            amount=Decimal('450.00'),
            fee=Decimal('10.00'),
            total_amount=Decimal('460.00'),
            reference_number='TXN' + str(uuid.uuid4())[:8].upper(),
            description='EDH electricity bill',
            status='completed'
        )
        
        BillPayment.objects.create(
            transaction=bill_tx,
            bill_type='electricity',
            account_number='EDH123456',
            service_provider='EDH',
            billing_period='August 2025'
        )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data for Cash Ti Machann!')
        )
        self.stdout.write(f'Created users: {User.objects.count()}')
        self.stdout.write(f'Created transactions: {Transaction.objects.count()}')
        self.stdout.write(f'Admin login: username=admin, password=JCS823ch!!')
