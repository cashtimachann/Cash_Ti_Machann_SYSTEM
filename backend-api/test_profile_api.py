#!/usr/bin/env python
"""
Test API endpoints for profile picture functionality
Cash Ti Machann - Digital Financial Services Platform
"""
import os
import django
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

def test_profile_picture_api():
    """Test the profile picture API endpoints"""
    try:
        from accounts.models import User
        from rest_framework.authtoken.models import Token
        
        print("🔗 Test des APIs de photo de profil")
        print("=" * 50)
        
        # Base URL
        BASE_URL = "http://127.0.0.1:8000/api/auth"
        
        # Get a test user with token
        test_user = User.objects.filter(user_type='client').first()
        if not test_user:
            print("❌ Aucun utilisateur client trouvé pour le test")
            return False
            
        # Get or create token
        token, created = Token.objects.get_or_create(user=test_user)
        headers = {'Authorization': f'Token {token.key}'}
        
        print(f"👤 Test avec utilisateur: {test_user.username}")
        print(f"🔑 Token: {token.key[:20]}...")
        
        # Test 1: Get user profile
        print(f"\n📋 Test 1: Récupération du profil utilisateur")
        response = requests.get(f"{BASE_URL}/user-profile/", headers=headers)
        print(f"   - Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            print(f"   - Nom: {profile.get('first_name', 'N/A')} {profile.get('last_name', 'N/A')}")
            print(f"   - Photo URL: {profile.get('profile_picture_url', 'Aucune')}")
            print(f"   - Langue: {profile.get('preferred_language', 'N/A')}")
        else:
            print(f"   - Erreur: {response.text}")
            
        # Test 2: Check if media directory exists and create sample image
        media_dir = "/Users/herlytache/Desktop/Cash Ti Machann/backend-api/media/profile_pictures"
        os.makedirs(media_dir, exist_ok=True)
        
        # Create a simple test image file
        from PIL import Image
        test_image_path = "/tmp/test_profile.jpg"
        
        try:
            # Create a small test image
            img = Image.new('RGB', (100, 100), color='red')
            img.save(test_image_path, 'JPEG')
            print(f"\n📸 Image de test créée: {test_image_path}")
            
            # Test 3: Upload profile picture
            print(f"\n📤 Test 2: Upload de photo de profil")
            with open(test_image_path, 'rb') as img_file:
                files = {'profile_picture': ('test_profile.jpg', img_file, 'image/jpeg')}
                response = requests.post(f"{BASE_URL}/upload-photo/", headers=headers, files=files)
                
            print(f"   - Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   - Message: {data.get('message', 'N/A')}")
                print(f"   - Photo URL: {data.get('profile_picture_url', 'N/A')}")
            else:
                print(f"   - Erreur: {response.text}")
                
            # Clean up test image
            os.remove(test_image_path)
            
        except ImportError:
            print("   - Pillow non installé, test d'upload ignoré")
            
        # Test 4: Get profile again to check persistence
        print(f"\n🔄 Test 3: Vérification de la persistance")
        response = requests.get(f"{BASE_URL}/user-profile/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            photo_url = profile.get('profile_picture_url')
            if photo_url:
                print(f"   - ✅ Photo persistante: {photo_url}")
            else:
                print(f"   - ❌ Photo non trouvée après upload")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test API: {e}")
        return False

if __name__ == "__main__":
    test_profile_picture_api()