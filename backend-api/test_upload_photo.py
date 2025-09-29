#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings
import requests
import io
from PIL import Image

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
sys.path.append('/Users/herlytache/Desktop/Cash Ti Machann/backend-api')
django.setup()

def test_upload_photo():
    """Test profile photo upload functionality"""
    
    # First get auth token
    login_data = {
        'email': 'admin@cashtimachann.com',  # Use existing admin user
        'password': 'admin123'
    }
    
    login_response = requests.post('http://127.0.0.1:8000/api/auth/login/', json=login_data)
    print(f"Login Response: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print("Login failed, creating test user first...")
        # Create test user
        register_data = {
            'phone_number': '+50912345678',
            'password': 'testpassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com'
        }
        register_response = requests.post('http://127.0.0.1:8000/api/auth/register/', json=register_data)
        print(f"Register Response: {register_response.status_code}")
        
        # Try login again
        login_response = requests.post('http://127.0.0.1:8000/api/auth/login/', json=login_data)
        print(f"Login Response after register: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token = login_response.json().get('token')
        print(f"Token: {token}")
        
        # Create a test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Upload photo
        headers = {'Authorization': f'Token {token}'}
        files = {'profile_picture': ('test.jpg', img_bytes, 'image/jpeg')}
        
        print("Uploading photo...")
        upload_response = requests.post('http://127.0.0.1:8000/api/auth/upload-photo/', 
                                       headers=headers, files=files)
        
        print(f"Upload Response Status: {upload_response.status_code}")
        print(f"Upload Response Content: {upload_response.text}")
        
        if upload_response.status_code == 200:
            print("✅ Photo upload successful!")
        else:
            print("❌ Photo upload failed!")
            print(f"Error details: {upload_response.text}")
    else:
        print("❌ Could not authenticate")
        print(f"Login response: {login_response.text}")

if __name__ == '__main__':
    test_upload_photo()