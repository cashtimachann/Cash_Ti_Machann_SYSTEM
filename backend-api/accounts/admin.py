from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, Wallet, AgentProfile, EnterpriseProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'user_type', 'phone_number', 'is_verified', 'date_joined')
    list_filter = ('user_type', 'is_verified', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'phone_number')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Cash Ti Machann Info', {
            'fields': ('user_type', 'phone_number', 'is_verified')
        }),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'first_name', 'last_name', 'verification_status', 'city', 'country')
    list_filter = ('verification_status', 'country', 'city')
    search_fields = ('first_name', 'last_name', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'currency', 'is_active', 'updated_at')
    list_filter = ('currency', 'is_active')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'agent_code', 'commission_rate', 'is_approved', 'current_month_volume')
    list_filter = ('is_approved', 'commission_rate')
    search_fields = ('user__username', 'agent_code', 'location')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(EnterpriseProfile)
class EnterpriseProfileAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'user', 'company_registration_number', 'business_type', 'is_approved')
    list_filter = ('business_type', 'is_approved')
    search_fields = ('company_name', 'company_registration_number', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
