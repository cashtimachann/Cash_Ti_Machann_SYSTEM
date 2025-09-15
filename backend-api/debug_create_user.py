#!/usr/bin/env python
import requests
import json

# Test the admin create user endpoint
url = 'http://127.0.0.1:8000/api/auth/admin/create-user/'

# First, login as admin to get a token
login_url = 'http://127.0.0.1:8000/api/auth/login/'
login_data = {
    'email': 'admin@cashtimachann.com',
    'password': 'admin123'  # This should be the admin password
}

print("1. Logging in as admin...")
login_response = requests.post(login_url, data=login_data)
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json().get('token')
    print(f"Token: {token}")
    
    # Test creating a user with document
    headers = {
        'Authorization': f'Token {token}',
    }
    
    # Test data - with document fields
    user_data = {
        'username': 'testuser_doc456',
        'email': 'testuser_doc456@example.com',
        'first_name': 'Test',
        'last_name': 'Document',
        'user_type': 'client',
        'password': 'testpassword123',
        'phone': '+509-9876-5432',
        'id_document_type': 'CIN',
        'id_document_number': 'CIN123456789',
        'address': '123 Test Street',
        'city': 'Port-au-Prince',
        'date_of_birth': '1990-01-01'
    }
    
    print("\n2. Creating user with document data:")
    print(json.dumps(user_data, indent=2))
    
    create_response = requests.post(url, data=user_data, headers=headers)
    print(f"\nCreate user status: {create_response.status_code}")
    print(f"Create user response: {create_response.text}")
    
    if create_response.status_code == 201:
        print("\n3. Now checking review documents endpoint...")
        review_url = 'http://127.0.0.1:8000/api/auth/admin/review-documents/'
        review_response = requests.get(review_url, headers=headers)
        print(f"Review documents status: {review_response.status_code}")
        print(f"Review documents response: {review_response.text}")
    
else:
    print("Failed to login as admin")
