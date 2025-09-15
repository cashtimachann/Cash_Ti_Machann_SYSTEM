from django.contrib import admin
from .models import AgentLocation, AgentCashFlow, AgentCommission, AgentLimit

@admin.register(AgentLocation)
class AgentLocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'agent', 'city', 'department', 'is_active', 'phone_number')
    list_filter = ('is_active', 'city', 'department')
    search_fields = ('name', 'agent__username', 'city', 'address')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(AgentCashFlow)
class AgentCashFlowAdmin(admin.ModelAdmin):
    list_display = ('agent', 'operation_type', 'amount', 'balance_after', 'reference_number', 'created_at')
    list_filter = ('operation_type', 'created_at')
    search_fields = ('agent__username', 'reference_number', 'notes')
    readonly_fields = ('created_at',)

@admin.register(AgentCommission)
class AgentCommissionAdmin(admin.ModelAdmin):
    list_display = ('agent', 'commission_amount', 'commission_rate', 'is_paid', 'period_start', 'period_end')
    list_filter = ('is_paid', 'commission_rate', 'period_start')
    search_fields = ('agent__username', 'transaction__reference_number')
    readonly_fields = ('created_at',)

@admin.register(AgentLimit)
class AgentLimitAdmin(admin.ModelAdmin):
    list_display = ('agent', 'limit_type', 'limit_amount', 'current_usage', 'reset_period', 'is_active')
    list_filter = ('limit_type', 'reset_period', 'is_active')
    search_fields = ('agent__username',)
    readonly_fields = ('created_at', 'updated_at')
