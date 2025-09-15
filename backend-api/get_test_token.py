#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.append('/Users/herlytache/Desktop/Cash Ti Machann/backend-api')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')

# Setup Django
django.setup()

from accounts.models import User
from rest_framework.authtoken.models import Token

def create_test_token():
    try:
        user = User.objects.get(username='testclient')
        token, created = Token.objects.get_or_create(user=user)
        
        print(f"Test User: {user.username}")
        print(f"Email: {user.email}")
        print(f"Password: test123")
        print(f"Auth Token: {token.key}")
        print(f"\nYou can login with:")
        print(f"Username: testclient")
        print(f"Password: test123")
        
        return token.key
        
    except User.DoesNotExist:
        print("Test user not found. Please run create_sample_transactions.py first.")
        return None

if __name__ == '__main__':
    create_test_token()
