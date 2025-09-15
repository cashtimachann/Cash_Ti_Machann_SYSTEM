#!/usr/bin/env python
import requests
import json

# Test the admin upload document endpoint
def test_admin_upload_document():
    # First, login as admin to get a token
    login_url = 'http://127.0.0.1:8000/api/auth/login/'
    login_data = {
        'email': 'admin@cashtimachann.com',
        'password': 'admin123'
    }

    print("1. Logging in as admin...")
    login_response = requests.post(login_url, data=login_data)
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    token = login_response.json().get('token')
    print(f"✓ Login successful, token: {token[:20]}...")
    
    # Get list of users to find a test user
    headers = {'Authorization': f'Token {token}'}
    users_response = requests.get('http://127.0.0.1:8000/api/auth/admin/users/', headers=headers)
    
    if users_response.status_code != 200:
        print(f"Failed to get users: {users_response.status_code}")
        return
    
    users = users_response.json()
    test_user = None
    for user in users:
        if user['user_type'] == 'client':
            test_user = user
            break
    
    if not test_user:
        print("No client users found for testing")
        return
    
    print(f"2. Found test user: {test_user['first_name']} {test_user['last_name']} ({test_user['email']})")
    
    # Test uploading a document (we'll use a simple text file as test)
    test_file_content = b"This is a test document content for ID verification"
    
    upload_url = f'http://127.0.0.1:8000/api/auth/admin/upload-document/{test_user["id"]}/'
    
    files = {'id_document': ('test_document.txt', test_file_content, 'text/plain')}
    data = {
        'id_document_type': 'CIN',
        'id_document_number': 'TEST123456789'
    }
    
    print("3. Uploading test document...")
    upload_response = requests.post(upload_url, headers=headers, files=files, data=data)
    
    print(f"Upload status: {upload_response.status_code}")
    print(f"Upload response: {upload_response.text}")
    
    if upload_response.status_code == 200:
        print("✓ Document upload successful!")
        
        # Check user details to verify upload
        detail_url = f'http://127.0.0.1:8000/api/auth/admin/user-details/{test_user["id"]}/'
        detail_response = requests.get(detail_url, headers=headers)
        
        if detail_response.status_code == 200:
            user_details = detail_response.json()
            profile = user_details.get('profile', {})
            print(f"✓ Document type: {profile.get('id_document_type')}")
            print(f"✓ Document number: {profile.get('id_document_number')}")
            print(f"✓ Document URL: {profile.get('id_document_image')}")
            print(f"✓ Verification status: {profile.get('verification_status')}")
        else:
            print(f"Failed to get updated user details: {detail_response.status_code}")
    else:
        print("✗ Document upload failed!")

if __name__ == "__main__":
    test_admin_upload_document()
