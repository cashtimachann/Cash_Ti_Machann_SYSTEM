#!/usr/bin/env python3

import requests
import json

# Test script for request verification functionality

def test_request_verification():
    base_url = "http://127.0.0.1:8000/api/auth"
    
    # First, login as a client user
    login_data = {
        "email": "marie@example.com",  # Using client who needs verification
        "password": "password123"     # Common test password
    }
    
    print("🔄 Attempting to login...")
    login_response = requests.post(f"{base_url}/login/", json=login_data)
    
    if login_response.status_code == 200:
        token = login_response.json().get('token')
        print(f"✅ Login successful! Token: {token[:20]}...")
        
        # Test request verification
        headers = {
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json'
        }
        
        print("\n🔄 Testing request verification...")
        verification_response = requests.post(f"{base_url}/request-verification/", headers=headers)
        
        if verification_response.status_code == 200:
            print(f"✅ Request verification successful!")
            print(f"Response: {verification_response.json()}")
        else:
            print(f"❌ Request verification failed: {verification_response.status_code}")
            print(f"Error: {verification_response.text}")
            
        # Test duplicate request (should fail)
        print("\n🔄 Testing duplicate request verification...")
        duplicate_response = requests.post(f"{base_url}/request-verification/", headers=headers)
        
        if duplicate_response.status_code == 400:
            print(f"✅ Duplicate request properly rejected!")
            print(f"Response: {duplicate_response.json()}")
        else:
            print(f"⚠️ Unexpected response for duplicate request: {duplicate_response.status_code}")
            print(f"Response: {duplicate_response.text}")
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Error: {login_response.text}")

if __name__ == "__main__":
    test_request_verification()
