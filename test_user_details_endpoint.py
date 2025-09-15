#!/usr/bin/env python3
"""
Test script to verify the user details endpoint
"""

import requests
import json

def get_admin_token():
    login_url = "http://127.0.0.1:8000/api/auth/login/"
    admin_data = {
        "email": "admin",
        "password": "admin123"
    }
    
    response = requests.post(login_url, json=admin_data)
    if response.status_code == 200:
        return response.json()['token']
    else:
        print(f"Failed to get admin token: {response.text}")
        return None

def test_user_details_endpoint():
    token = get_admin_token()
    if not token:
        return
    
    headers = {'Authorization': f'Token {token}'}
    
    # Get list of users first
    users_response = requests.get('http://127.0.0.1:8000/api/auth/admin/users/', headers=headers)
    if users_response.status_code != 200:
        print(f"Failed to get users: {users_response.text}")
        return
        
    users = users_response.json()
    print(f"Found {len(users)} users")
    
    if not users:
        print("No users found to test with")
        return
    
    # Test with first user
    test_user = users[0]
    user_id = test_user['id']
    
    print(f"Testing user details endpoint with user ID: {user_id}")
    
    # Test user details endpoint
    details_url = f"http://127.0.0.1:8000/api/auth/admin/user-details/{user_id}/"
    print(f"Making request to: {details_url}")
    
    response = requests.get(details_url, headers=headers)
    
    print(f"Response status: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print("✅ User details endpoint working!")
            print(f"User data keys: {list(data.keys())}")
            if 'profile' in data:
                print(f"Profile data keys: {list(data['profile'].keys())}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            print(f"Raw response: {response.text}")
    else:
        print(f"❌ User details endpoint failed!")
        print(f"Response content: {response.text}")

if __name__ == "__main__":
    test_user_details_endpoint()
