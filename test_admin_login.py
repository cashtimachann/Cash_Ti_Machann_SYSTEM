#!/usr/bin/env python3
"""
Test script to verify admin login and get auth token
"""

import requests
import json

# Admin login endpoint
login_url = "http://127.0.0.1:8000/api/auth/login/"

# Admin credentials (using 'email' field as expected by login view)
admin_data = {
    "email": "admin",  # Login view expects 'email' field, but it can be username
    "password": "admin123"
}

try:
    print("Testing admin login...")
    response = requests.post(login_url, json=admin_data)
    
    print(f"Response status: {response.status_code}")
    print(f"Response content: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print(f"\n✅ Login successful!")
        print(f"Auth Token: {token}")
        print(f"User Type: {data.get('user_type')}")
        
        # Test getting users list
        headers = {'Authorization': f'Token {token}'}
        users_response = requests.get('http://127.0.0.1:8000/api/auth/admin/users/', headers=headers)
        print(f"\n📋 Users endpoint status: {users_response.status_code}")
        if users_response.status_code == 200:
            users = users_response.json()
            print(f"Number of users: {len(users)}")
        
    else:
        print(f"❌ Login failed: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to Django server. Make sure it's running on port 8000.")
except Exception as e:
    print(f"❌ Error: {e}")
