#!/usr/bin/env python3
"""
Test script to verify document upload functionality works
"""

import requests
import json

# Get admin token first
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

def test_document_upload():
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
    
    # Find a non-admin user to test with
    test_user = None
    for user in users:
        if user.get('user_type') != 'admin':
            test_user = user
            break
    
    if not test_user:
        print("No non-admin user found for testing")
        return
        
    print(f"Testing with user: {test_user.get('first_name', '')} {test_user.get('last_name', '')} (ID: {test_user['id']})")
    
    # Create a test file to upload
    test_file_content = b"This is a test document content"
    
    # Prepare the upload data
    files = {
        'id_document': ('test_document.jpg', test_file_content, 'image/jpeg')
    }
    data = {
        'id_document_type': 'national_id',
        'id_document_number': 'TEST123456'
    }
    
    # Test document upload
    upload_url = f"http://127.0.0.1:8000/api/auth/admin/upload-document/{test_user['id']}/"
    print(f"Uploading to: {upload_url}")
    
    response = requests.post(upload_url, headers=headers, files=files, data=data)
    
    print(f"Upload response status: {response.status_code}")
    print(f"Upload response content: {response.text}")
    
    if response.status_code == 200:
        print("✅ Document upload successful!")
    else:
        print("❌ Document upload failed!")

if __name__ == "__main__":
    test_document_upload()
