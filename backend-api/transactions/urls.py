from django.urls import path
from . import views
from . import admin_views

urlpatterns = [
    path('', views.user_transactions, name='user_transactions'),
    path('send/', views.send_money, name='send_money'),
    path('topup/', views.phone_topup, name='phone_topup'),
    path('bills/', views.pay_bill, name='pay_bill'),
    path('stats/', views.transaction_stats, name='transaction_stats'),
    path('card-deposit/', views.card_deposit, name='card_deposit'),
    path('merchant-payment/', views.merchant_payment, name='merchant_payment'),
    path('agent-withdrawal/', views.agent_withdrawal, name='agent_withdrawal'),
    
    # Admin endpoints
    path('admin/all/', admin_views.admin_all_transactions, name='admin_all_transactions'),
    path('admin/<str:transaction_id>/', admin_views.admin_transaction_detail, name='admin_transaction_detail'),
    path('admin/<str:transaction_id>/status/', admin_views.admin_update_transaction_status, name='admin_update_transaction_status'),
    path('admin/<str:transaction_id>/history/', admin_views.admin_transaction_history, name='admin_transaction_history'),
]
