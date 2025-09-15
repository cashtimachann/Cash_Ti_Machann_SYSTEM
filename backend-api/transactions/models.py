from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('send', 'Send Money'),
        ('receive', 'Receive Money'),
        ('topup', 'Phone Top Up'),
        ('bill_payment', 'Bill Payment'),
        ('recharge', 'Account Recharge'),
        ('withdrawal', 'Withdrawal'),
        ('deposit', 'Deposit'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_transactions', null=True, blank=True)
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_transactions', null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)  # amount + fee
    currency = models.CharField(max_length=3, default='HTG')
    reference_number = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} {self.currency} - {self.reference_number}"

class PhoneTopUp(models.Model):
    CARRIERS = (
        ('digicel', 'Digicel'),
        ('natcom', 'Natcom'),
    )
    
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='phone_topup')
    recipient_phone = models.CharField(max_length=15)
    carrier = models.CharField(max_length=20, choices=CARRIERS)
    minutes_amount = models.IntegerField(null=True, blank=True)  # estimated minutes
    message = models.TextField(null=True, blank=True)
    carrier_reference = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"Top up {self.recipient_phone} - {self.carrier}"

class BillPayment(models.Model):
    BILL_TYPES = (
        ('electricity', 'Electricity (EDH)'),
        ('water', 'Water (DINEPA)'),
        ('internet', 'Internet'),
        ('cable', 'Cable TV'),
        ('school', 'School Fees'),
        ('other', 'Other'),
    )
    
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='bill_payment')
    bill_type = models.CharField(max_length=20, choices=BILL_TYPES)
    account_number = models.CharField(max_length=100)
    service_provider = models.CharField(max_length=100)
    billing_period = models.CharField(max_length=50, null=True, blank=True)
    provider_reference = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"{self.bill_type} - {self.account_number}"

class AgentTransaction(models.Model):
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agent_transactions')
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='agent_records')
    commission_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage at time of transaction
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Agent {self.agent.username} - {self.transaction.reference_number}"

class WalletHistory(models.Model):
    OPERATION_TYPES = (
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    )
    
    wallet = models.ForeignKey('accounts.Wallet', on_delete=models.CASCADE, related_name='history')
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='wallet_histories')
    operation_type = models.CharField(max_length=10, choices=OPERATION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_before = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.operation_type} {self.amount} - {self.wallet.user.username}"
