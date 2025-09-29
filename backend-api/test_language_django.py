#!/usr/bin/env python3
"""
Django shell test for language API endpoints
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
sys.path.append('/Users/herlytache/Desktop/Cash Ti Machann/backend-api')
django.setup()

from accounts.models import User, UserProfile
from django.test import Client
from django.contrib.auth import authenticate
import json

def test_language_endpoints():
    # Create a test client
    client = Client()
    
    print("Testing language API endpoints using Django test client...")
    print("=" * 60)
    
    # First, login as admin
    print("\n1. Logging in as admin...")
    try:
        # Get admin user
        admin_user = User.objects.get(username='admin')
        print(f"Found admin user: {admin_user.username}")
        
        # Login
        login_response = client.post('/api/auth/login/', {
            'email': 'admin',
            'password': 'admin123'
        }, content_type='application/json')
        
        print(f"Login status: {login_response.status_code}")
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get('token')  # Use 'token' instead of 'access'
            print(f"Got auth token: {token[:20]}...")
        else:
            print(f"Login failed: {login_response.content}")
            return
            
    except User.DoesNotExist:
        print("Admin user not found. Creating one...")
        admin_user = User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
        print("Admin user created")
        
        # Try login again
        login_response = client.post('/api/auth/login/', {
            'email': 'admin',
            'password': 'admin123'
        }, content_type='application/json')
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get('token')  # Use 'token' instead of 'access'
            print(f"Got auth token: {token[:20]}...")
        else:
            print(f"Login failed: {login_response.content}")
            return
    
    # Set authorization header
    auth_header = f'Token {token}'
    
    # Test GET user language
    print("\n2. Testing GET /api/auth/user-language/")
    try:
        response = client.get('/api/auth/user-language/', HTTP_AUTHORIZATION=auth_header)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"Error response: {response.content}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test UPDATE language to French
    print("\n3. Testing PUT /api/auth/update-language/ (French)")
    try:
        response = client.put('/api/auth/update-language/', 
                             json.dumps({'language': 'french'}),
                             content_type='application/json',
                             HTTP_AUTHORIZATION=auth_header)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"Error response: {response.content}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test UPDATE language to English
    print("\n4. Testing PUT /api/auth/update-language/ (English)")
    try:
        response = client.put('/api/auth/update-language/', 
                             json.dumps({'language': 'english'}),
                             content_type='application/json',
                             HTTP_AUTHORIZATION=auth_header)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"Error response: {response.content}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test UPDATE language with invalid value
    print("\n5. Testing PUT /api/auth/update-language/ (Invalid language)")
    try:
        response = client.put('/api/auth/update-language/', 
                             json.dumps({'language': 'invalid'}),
                             content_type='application/json',
                             HTTP_AUTHORIZATION=auth_header)
        print(f"Status: {response.status_code}")
        if response.content:
            try:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
            except:
                print(f"Response: {response.content}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Check UserProfile status
    print("\n6. Checking UserProfile status...")
    try:
        profile = UserProfile.objects.get(user=admin_user)
        print(f"UserProfile exists: {profile.preferred_language}")
    except UserProfile.DoesNotExist:
        print("UserProfile does not exist")

if __name__ == "__main__":
    test_language_endpoints()