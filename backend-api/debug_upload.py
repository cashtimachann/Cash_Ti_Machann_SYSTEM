#!/usr/bin/env python3

import os
import sys
import django
from django.conf import settings

# Add the backend-api directory to the path
sys.path.append('/Users/herlytache/Desktop/Cash Ti Machann/backend-api')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

from accounts.models import User, UserProfile
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

def test_upload():
    """Test the photo upload functionality"""
    try:
        # Get admin user
        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            print("Admin user not found")
            return
            
        print(f"Found admin user: {admin_user.username}")
        
        # Check if user has profile
        try:
            profile = admin_user.profile
            print(f"User has profile: {profile}")
        except UserProfile.DoesNotExist:
            print("User profile doesn't exist, creating one...")
            profile = UserProfile.objects.create(user=admin_user)
            print(f"Created profile: {profile}")
        
        # Create test image
        img = Image.new('RGB', (100, 100), color='red')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        
        # Create uploaded file
        uploaded_file = SimpleUploadedFile(
            name='test.jpg',
            content=buffer.getvalue(),
            content_type='image/jpeg'
        )
        
        print(f"Created test image: {uploaded_file.name}, size: {uploaded_file.size}")
        
        # Try to save profile picture
        profile.profile_picture = uploaded_file
        profile.save()
        
        print(f"Successfully saved profile picture: {profile.profile_picture.url}")
        print("Upload test completed successfully!")
        
    except Exception as e:
        print(f"Error during upload test: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_upload()