from django.urls import path
from . import views

urlpatterns = [
    path('', views.user_transactions, name='user_transactions'),
    path('send/', views.send_money, name='send_money'),
    path('topup/', views.phone_topup, name='phone_topup'),
    path('bills/', views.pay_bill, name='pay_bill'),
    path('stats/', views.transaction_stats, name='transaction_stats'),
    path('card-deposit/', views.card_deposit, name='card_deposit'),
    path('merchant-payment/', views.merchant_payment, name='merchant_payment'),
    path('agent-withdrawal/', views.agent_withdrawal, name='agent_withdrawal'),
]
