#!/usr/bin/env python3
"""
Test script for document upload functionality
"""
import requests
import os
from io import BytesIO
from PIL import Image

# Create a test image
def create_test_image():
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_registration_with_document():
    """Test user registration with document upload"""
    url = "http://localhost:8000/api/auth/register/"
    
    # Create test image
    test_image = create_test_image()
    
    data = {
        'email': 'test_user@example.com',
        'phone': '+50937654321',
        'password': 'testpass123',
        'first_name': 'Jean',
        'last_name': 'Dupont',
        'date_of_birth': '1990-01-01',
        'address': '123 Rue Example',
        'city': 'Port-au-Prince',
        'country': 'Haiti',
        'id_document_type': 'CIN',
        'id_document_number': 'CIN123456789'
    }
    
    files = {
        'id_document': ('test_id.jpg', test_image, 'image/jpeg')
    }
    
    try:
        response = requests.post(url, data=data, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Registration with document upload successful!")
        else:
            print("❌ Registration failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_document_upload():
    """Test separate document upload for existing user"""
    # First, you need to login and get a token
    login_url = "http://localhost:8000/api/auth/login/"
    upload_url = "http://localhost:8000/api/auth/upload-document/"
    
    # Login
    login_data = {
        'email': 'test_user@example.com',
        'password': 'testpass123'
    }
    
    try:
        login_response = requests.post(login_url, json=login_data)
        if login_response.status_code == 200:
            token = login_response.json()['token']
            print(f"✅ Login successful, token: {token[:20]}...")
            
            # Upload document
            test_image = create_test_image()
            
            headers = {
                'Authorization': f'Token {token}'
            }
            
            data = {
                'id_document_type': 'Passport',
                'id_document_number': 'PASS987654321'
            }
            
            files = {
                'id_document': ('passport.jpg', test_image, 'image/jpeg')
            }
            
            upload_response = requests.post(upload_url, data=data, files=files, headers=headers)
            print(f"Upload Status: {upload_response.status_code}")
            print(f"Upload Response: {upload_response.json()}")
            
            if upload_response.status_code == 200:
                print("✅ Document upload successful!")
            else:
                print("❌ Document upload failed")
                
        else:
            print(f"❌ Login failed: {login_response.json()}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing Document Upload Functionality\n")
    
    print("1. Testing registration with document...")
    test_registration_with_document()
    
    print("\n2. Testing separate document upload...")
    test_document_upload()
    
    print("\n✅ Tests completed!")
