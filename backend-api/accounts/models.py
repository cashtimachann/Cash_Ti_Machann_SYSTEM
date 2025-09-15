from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
import uuid

class Country(models.Model):
    """Normalized list of countries (initially only allowed registration countries).
    Using ISO2 codes so we can later extend with risk scoring, sanctions, currency, etc.
    """
    iso2 = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=100)
    name_kreol = models.CharField(max_length=120, null=True, blank=True)
    allowed_for_registration = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.iso2} - {self.name}"

class User(AbstractUser):
    USER_TYPES = (
        ('client', 'Client'),
        ('agent', 'Agent'),
        ('enterprise', 'Enterprise'),
        ('admin', 'Admin'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='client')
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Nimewo telefòn pa valid")],
        unique=True,
        null=True,
        blank=True
    )
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"

class UserProfile(models.Model):
    VERIFICATION_STATUS = (
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, default='Haiti')  # legacy textual storage
    # New normalized relation (transitional): when populated, supersedes legacy country field
    residence_country = models.ForeignKey('Country', null=True, blank=True, on_delete=models.PROTECT, related_name='profiles')
    id_document_type = models.CharField(max_length=50, null=True, blank=True)
    id_document_number = models.CharField(max_length=100, null=True, blank=True)
    id_document_image = models.ImageField(upload_to='documents/', null=True, blank=True)
    # New separated front/back images (id_document_image kept for backward compatibility / legacy single-sided uploads)
    id_document_front = models.ImageField(upload_to='documents/', null=True, blank=True)
    id_document_back = models.ImageField(upload_to='documents/', null=True, blank=True)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='pending')
    
    # Email verification
    email_verification_code = models.CharField(max_length=6, null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    
    # Phone verification
    phone_verification_code = models.CharField(max_length=6, null=True, blank=True)
    is_phone_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_password_reset_requested = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class IdentityDocument(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='identity_documents')
    document_type = models.CharField(max_length=50)
    document_number = models.CharField(max_length=100, null=True, blank=True)
    front_image = models.ImageField(upload_to='documents/', null=True, blank=True)
    back_image = models.ImageField(upload_to='documents/', null=True, blank=True)
    legacy_single_image = models.ImageField(upload_to='documents/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['document_number']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['document_number'],
                name='uniq_identity_document_number',
                condition=models.Q(document_number__isnull=False) & ~models.Q(document_number='')
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.document_type} ({self.status})"

class Wallet(models.Model):
    CURRENCY_CHOICES = (
        ('HTG', 'Haitian Gourde'),
        ('USD', 'US Dollar'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='HTG')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.balance} {self.currency}"

class AgentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agent_profile')
    agent_code = models.CharField(max_length=20, unique=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=2.50)  # Percentage
    monthly_limit = models.DecimalField(max_digits=12, decimal_places=2, default=100000.00)
    current_month_volume = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_approved = models.BooleanField(default=False)
    location = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Agent {self.agent_code} - {self.user.username}"

class EnterpriseProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='enterprise_profile')
    company_name = models.CharField(max_length=200)
    company_registration_number = models.CharField(max_length=100, unique=True)
    tax_id = models.CharField(max_length=100, null=True, blank=True)
    business_type = models.CharField(max_length=100)
    monthly_transaction_limit = models.DecimalField(max_digits=15, decimal_places=2, default=1000000.00)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.company_name}"


class LoginActivity(models.Model):
    """Stores user login attempts (successful or failed) for security auditing.
    Only ties to a User object when it can be confidently resolved (existing account).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_activities')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    success = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        status = 'SUCCESS' if self.success else 'FAIL'
        return f"{self.user.username} {status} @ {self.timestamp.isoformat()}"


class SecurityActivity(models.Model):
    """General security/account activities (password change, 2FA enable/disable, email change, etc.).
    This extends audit coverage beyond login attempts.
    """
    EVENT_CHOICES = (
        ('password_change', 'Password Change'),
        ('password_reset', 'Password Reset'),
        ('two_factor_enabled', '2FA Enabled'),
        ('two_factor_disabled', '2FA Disabled'),
        ('email_change', 'Email Change'),
        ('phone_change', 'Phone Number Change'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_activities')
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['event_type', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.user.username} {self.event_type} @ {self.timestamp.isoformat()}"
