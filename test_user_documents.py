#!/usr/bin/env python3
"""
Test script to get user details and check if documents are showing
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

def test_user_with_documents():
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
    
    # Look for a user with documents
    for user in users:
        if user.get('first_name') == 'Test' and user.get('last_name') == 'Document':
            user_id = user['id']
            print(f"Testing with user: {user['first_name']} {user['last_name']} (ID: {user_id})")
            
            # Test user details endpoint
            details_url = f"http://127.0.0.1:8000/api/auth/admin/user-details/{user_id}/"
            response = requests.get(details_url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"\n✅ User details retrieved successfully!")
                
                # Check identity_documents
                documents = data.get('identity_documents', [])
                print(f"📄 Number of identity documents: {len(documents)}")
                
                if documents:
                    for doc in documents:
                        print(f"  - Document Type: {doc.get('document_type')}")
                        print(f"    Status: {doc.get('status')}")
                        print(f"    Document Number: {doc.get('document_number')}")
                        print(f"    Front Image: {doc.get('front_image_url')}")
                        print(f"    Uploaded: {doc.get('uploaded_at')}")
                        print()
                else:
                    print("❌ No documents found for this user")
                    
                # Check profile data
                profile = data.get('profile')
                if profile:
                    print(f"📋 Profile document info:")
                    print(f"  - ID Document Type: {profile.get('id_document_type')}")
                    print(f"  - ID Document Number: {profile.get('id_document_number')}")
                    print(f"  - ID Document Image: {profile.get('id_document_image')}")
                    print(f"  - Verification Status: {profile.get('verification_status')}")
                
            else:
                print(f"❌ Failed to get user details: {response.text}")
            return
    
    print("❌ No test user with documents found")

if __name__ == "__main__":
    test_user_with_documents()
