from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class AgentLocation(models.Model):
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='locations')
    name = models.CharField(max_length=200)  # Branch/Office name
    address = models.TextField()
    city = models.CharField(max_length=100)
    department = models.CharField(max_length=100)  # Haiti departments
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    operating_hours = models.JSONField(default=dict, null=True, blank=True)  # Store opening hours
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.city}"

class AgentCashFlow(models.Model):
    OPERATION_TYPES = (
        ('cash_in', 'Cash In'),
        ('cash_out', 'Cash Out'),
        ('float_management', 'Float Management'),
    )
    
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cash_flows')
    operation_type = models.CharField(max_length=20, choices=OPERATION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_before = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    reference_number = models.CharField(max_length=50, unique=True)
    notes = models.TextField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processed_cash_flows')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.operation_type} - {self.amount} HTG - {self.agent.username}"

class AgentCommission(models.Model):
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commissions')
    transaction = models.ForeignKey('transactions.Transaction', on_delete=models.CASCADE)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage
    period_start = models.DateField()
    period_end = models.DateField()
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Commission {self.agent.username} - {self.commission_amount} HTG"

class AgentLimit(models.Model):
    LIMIT_TYPES = (
        ('daily_transaction', 'Daily Transaction Limit'),
        ('monthly_transaction', 'Monthly Transaction Limit'),
        ('single_transaction', 'Single Transaction Limit'),
        ('cash_balance', 'Cash Balance Limit'),
    )
    
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='limits')
    limit_type = models.CharField(max_length=30, choices=LIMIT_TYPES)
    limit_amount = models.DecimalField(max_digits=15, decimal_places=2)
    current_usage = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    reset_period = models.CharField(max_length=20, choices=[('daily', 'Daily'), ('monthly', 'Monthly'), ('never', 'Never')])
    last_reset = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['agent', 'limit_type']
    
    def __str__(self):
        return f"{self.agent.username} - {self.limit_type}: {self.limit_amount} HTG"
