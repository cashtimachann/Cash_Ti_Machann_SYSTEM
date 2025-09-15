#!/usr/bin/env python3
"""
Test script for admin user creation with document upload
"""
import requests
import os
from io import BytesIO
from PIL import Image

# Create a test image
def create_test_image():
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='blue')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_admin_create_user():
    """Test admin user creation with document upload"""
    
    # First login as admin
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {
        'email': 'admin@cashtimachann.com',
        'password': 'admin123'
    }
    
    try:
        login_response = requests.post(login_url, json=login_data)
        if login_response.status_code == 200:
            token = login_response.json()['token']
            print(f"✅ Admin login successful, token: {token[:20]}...")
            
            # Now create user with document
            create_url = "http://localhost:8000/api/auth/admin/create-user/"
            
            # Create test image
            test_image = create_test_image()
            
            data = {
                'username': 'test_client_admin',
                'email': 'test_client_admin@example.com',
                'first_name': 'Marie',
                'last_name': 'Joseph',
                'user_type': 'client',
                'password': 'testpass123',
                'phone': '+50937111222',
                'date_of_birth': '1995-05-15',
                'address': '456 Rue Admin',
                'city': 'Cap-Haïtien',
                'id_document_type': 'CIN',
                'id_document_number': 'CIN999888777'
            }
            
            files = {
                'id_document': ('admin_test_id.jpg', test_image, 'image/jpeg')
            }
            
            headers = {
                'Authorization': f'Token {token}'
            }
            
            create_response = requests.post(create_url, data=data, files=files, headers=headers)
            print(f"Create User Status: {create_response.status_code}")
            print(f"Create User Response: {create_response.json()}")
            
            if create_response.status_code == 201:
                print("✅ Admin user creation with document successful!")
            else:
                print("❌ Admin user creation failed")
                
        else:
            print(f"❌ Admin login failed: {login_response.json()}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing Admin User Creation with Document\n")
    test_admin_create_user()
    print("\n✅ Test completed!")
