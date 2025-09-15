from rest_framework import serializers
from .models import Transaction, PhoneTopUp, BillPayment, AgentTransaction
from accounts.serializers import UserSerializer

class TransactionSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    display_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'sender', 'receiver', 'sender_name', 'receiver_name',
            'amount', 'fee', 'total_amount', 'currency', 'reference_number',
            'description', 'status', 'created_at', 'updated_at', 'processed_at',
            'display_type'
        ]
        read_only_fields = ['id', 'reference_number', 'created_at', 'updated_at']
    
    def get_sender_name(self, obj):
        if obj.sender:
            return f"{obj.sender.first_name} {obj.sender.last_name}"
        return "System"
    
    def get_receiver_name(self, obj):
        if obj.receiver:
            return f"{obj.receiver.first_name} {obj.receiver.last_name}"
        return "External"
    
    def get_display_type(self, obj):
        type_map = {
            'send': 'Voye Lajan',
            'receive': 'Resevwa Lajan',
            'topup': 'Voye Minit',
            'bill_payment': 'Peye Faktè',
            'recharge': 'Rechaje Kont',
            'withdrawal': 'Retire Lajan',
            'deposit': 'Depo Lajan'
        }
        return type_map.get(obj.transaction_type, obj.transaction_type)

class PhoneTopUpSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)
    
    class Meta:
        model = PhoneTopUp
        fields = ['transaction', 'recipient_phone', 'carrier', 'minutes_amount', 'message', 'carrier_reference']

class BillPaymentSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)
    
    class Meta:
        model = BillPayment
        fields = ['transaction', 'bill_type', 'account_number', 'service_provider', 'billing_period', 'provider_reference']

class AgentTransactionSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)
    agent_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AgentTransaction
        fields = ['agent', 'agent_name', 'transaction', 'commission_earned', 'commission_rate', 'created_at']
    
    def get_agent_name(self, obj):
        return f"{obj.agent.first_name} {obj.agent.last_name}"
