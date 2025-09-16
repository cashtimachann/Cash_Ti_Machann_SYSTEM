#!/usr/bin/env python3
"""
Script pou kreye kèk aktivite test yo nan sistèm lan
"""
import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from accounts.models import User, UserProfile, IdentityDocument
from transactions.models import Transaction
import random

def create_test_users():
    """Kreye kèk itilizatè test yo"""
    print("Kreye itilizatè test yo...")
    
    # Kreye 3 client test
    clients = [
        {'username': 'jean_client', 'first_name': 'Jean', 'last_name': 'Baptiste', 'email': 'jean@test.ht'},
        {'username': 'marie_client', 'first_name': 'Marie', 'last_name': 'Pierre', 'email': 'marie@test.ht'},
        {'username': 'paul_client', 'first_name': 'Paul', 'last_name': 'Joseph', 'email': 'paul@test.ht'},
    ]
    
    for client_data in clients:
        user, created = User.objects.get_or_create(
            username=client_data['username'],
            defaults={
                'email': client_data['email'],
                'first_name': client_data['first_name'],
                'last_name': client_data['last_name'],
                'user_type': 'client',
                'is_active': True,
                'password': make_password('test123'),
                'date_joined': datetime.now() - timedelta(days=random.randint(1, 30))
            }
        )
        if created:
            print(f"✓ Kreye client: {client_data['first_name']} {client_data['last_name']}")
            
            # Kreye profile yo
            UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'phone_number': f"+509{random.randint(30000000, 99999999)}",
                    'phone_verified': True,
                    'email_verified': True,
                }
            )
    
    # Kreye 2 agent test
    agents = [
        {'username': 'agent_nord', 'first_name': 'Robert', 'last_name': 'Nord', 'email': 'robert@agent.ht'},
        {'username': 'agent_sud', 'first_name': 'Sophie', 'last_name': 'Sud', 'email': 'sophie@agent.ht'},
    ]
    
    for agent_data in agents:
        user, created = User.objects.get_or_create(
            username=agent_data['username'],
            defaults={
                'email': agent_data['email'],
                'first_name': agent_data['first_name'],
                'last_name': agent_data['last_name'],
                'user_type': 'agent',
                'is_active': True,
                'password': make_password('test123'),
                'date_joined': datetime.now() - timedelta(days=random.randint(1, 15))
            }
        )
        if created:
            print(f"✓ Kreye agent: {agent_data['first_name']} {agent_data['last_name']}")
            
            # Kreye profile yo
            UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'phone_number': f"+509{random.randint(30000000, 99999999)}",
                    'phone_verified': True,
                    'email_verified': True,
                }
            )

def create_test_transactions():
    """Kreye kèk tranzaksyon test yo"""
    print("Kreye tranzaksyon test yo...")
    
    clients = User.objects.filter(user_type='client')
    agents = User.objects.filter(user_type='agent')
    
    if clients.count() < 2:
        print("Pa gen ase client pou kreye tranzaksyon yo")
        return
        
    # Kreye kèk tranzaksyon
    for i in range(5):
        sender = random.choice(clients)
        receiver = random.choice(list(clients) + list(agents))
        
        if sender != receiver:
            amount = random.randint(100, 5000)
            tx = Transaction.objects.create(
                sender=sender,
                receiver=receiver,
                amount=amount,
                transaction_type='transfer',
                status='completed',
                description=f"Transfer test #{i+1}",
                created_at=datetime.now() - timedelta(hours=random.randint(1, 72))
            )
            print(f"✓ Kreye tranzaksyon: {sender.username} → {receiver.username} ({amount} HTG)")

def create_test_documents():
    """Kreye kèk dokiman test yo"""
    print("Kreye dokiman test yo...")
    
    clients = User.objects.filter(user_type='client')
    
    for client in clients[:3]:
        doc, created = IdentityDocument.objects.get_or_create(
            user=client,
            defaults={
                'document_type': 'national_id',
                'document_number': f"ID{random.randint(100000, 999999)}",
                'status': random.choice(['pending', 'verified', 'rejected']),
                'updated_at': datetime.now() - timedelta(hours=random.randint(1, 48))
            }
        )
        if created:
            print(f"✓ Kreye dokiman pou: {client.first_name} {client.last_name} (Status: {doc.status})")

if __name__ == '__main__':
    print("Kòmanse kreye done test yo pou Aktivite Resan...")
    print("-" * 50)
    
    create_test_users()
    print()
    create_test_transactions()
    print()
    create_test_documents()
    
    print("-" * 50)
    print("✅ Fini kreye done test yo!")
    print("\nKounye a ou ka teste Aktivite Resan nan dashboard admin lan.")