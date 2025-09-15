from django.contrib import admin
from .models import Transaction, PhoneTopUp, BillPayment, AgentTransaction, WalletHistory

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'transaction_type', 'sender', 'receiver', 'amount', 'status', 'created_at')
    list_filter = ('transaction_type', 'status', 'currency', 'created_at')
    search_fields = ('reference_number', 'sender__username', 'receiver__username', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at', 'processed_at')
    ordering = ('-created_at',)

@admin.register(PhoneTopUp)
class PhoneTopUpAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'recipient_phone', 'carrier', 'minutes_amount', 'carrier_reference')
    list_filter = ('carrier',)
    search_fields = ('recipient_phone', 'carrier_reference', 'transaction__reference_number')

@admin.register(BillPayment)
class BillPaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'bill_type', 'account_number', 'service_provider', 'billing_period')
    list_filter = ('bill_type', 'service_provider')
    search_fields = ('account_number', 'service_provider', 'provider_reference')

@admin.register(AgentTransaction)
class AgentTransactionAdmin(admin.ModelAdmin):
    list_display = ('agent', 'transaction', 'commission_earned', 'commission_rate', 'created_at')
    list_filter = ('commission_rate', 'created_at')
    search_fields = ('agent__username', 'transaction__reference_number')
    readonly_fields = ('created_at',)

@admin.register(WalletHistory)
class WalletHistoryAdmin(admin.ModelAdmin):
    list_display = ('wallet', 'operation_type', 'amount', 'balance_before', 'balance_after', 'created_at')
    list_filter = ('operation_type', 'created_at')
    search_fields = ('wallet__user__username', 'transaction__reference_number')
    readonly_fields = ('created_at',)
