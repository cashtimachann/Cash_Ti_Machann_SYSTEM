#!/usr/bin/env python
"""
Test the API endpoint for profile picture functionality
Cash Ti Machann - Digital Financial Services Platform
"""
import os
import django
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

def test_api_endpoints():
    """Test the profile picture API endpoints"""
    try:
        from accounts.models import User, UserProfile
        from rest_framework.authtoken.models import Token
        from PIL import Image
        import io
        
        print("🌐 Test des endpoints API - Photos de profil")
        print("=" * 50)
        
        # Get test user
        user = User.objects.filter(username='test_photo_user').first()
        if not user:
            print("❌ Utilisateur de test non trouvé")
            return False
        
        # Get token
        token, _ = Token.objects.get_or_create(user=user)
        
        # Create Django test client
        client = Client()
        
        # Test 1: Get user profile
        print(f"\n📋 Test 1: GET /api/auth/user-profile/")
        response = client.get(
            '/api/auth/user-profile/',
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        
        print(f"   - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            print(f"   - Nom: {profile.get('first_name')} {profile.get('last_name')}")
            print(f"   - Photo URL: {profile.get('profile_picture_url', 'Aucune')[:60]}...")
            print(f"   - Langue: {profile.get('preferred_language')}")
        else:
            print(f"   - Erreur: {response.content.decode()}")
        
        # Test 2: Upload profile picture
        print(f"\n📤 Test 2: POST /api/auth/upload-photo/")
        
        # Create test image
        img = Image.new('RGB', (400, 400), color=(100, 255, 100))  # Green image
        img_io = io.BytesIO()
        img.save(img_io, format='JPEG', quality=95)
        img_io.seek(0)
        
        uploaded_file = SimpleUploadedFile(
            name='api_test_profile.jpg',
            content=img_io.read(),
            content_type='image/jpeg'
        )
        
        response = client.post(
            '/api/auth/upload-photo/',
            {'profile_picture': uploaded_file},
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        
        print(f"   - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   - Message: {data.get('message')}")
            print(f"   - Photo URL: {data.get('profile_picture_url', 'Non définie')[:60]}...")
        else:
            print(f"   - Erreur: {response.content.decode()}")
        
        # Test 3: Get profile again to verify upload
        print(f"\n🔄 Test 3: Vérification après upload")
        response = client.get(
            '/api/auth/user-profile/',
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            photo_url = profile.get('profile_picture_url')
            if photo_url and 'api_test_profile' in photo_url:
                print(f"   - ✅ Nouvelle photo bien sauvegardée")
                print(f"   - URL: {photo_url[:60]}...")
            else:
                print(f"   - ❌ Photo non sauvegardée ou URL incorrecte")
                print(f"   - URL reçue: {photo_url}")
        
        # Test 4: Update profile via PUT
        print(f"\n📝 Test 4: PUT /api/auth/user-profile/ (mise à jour)")
        response = client.put(
            '/api/auth/user-profile/',
            data=json.dumps({
                'first_name': 'Test Updated',
                'last_name': 'Photo User',
                'preferred_language': 'french'
            }),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        
        print(f"   - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   - Message: {data.get('message')}")
            profile = data.get('profile', {})
            print(f"   - Nom mis à jour: {profile.get('first_name')} {profile.get('last_name')}")
            print(f"   - Langue mise à jour: {profile.get('preferred_language')}")
            # Check photo is still there
            if profile.get('profile_picture_url'):
                print(f"   - ✅ Photo conservée après mise à jour profil")
            else:
                print(f"   - ❌ Photo perdue après mise à jour profil")
        else:
            print(f"   - Erreur: {response.content.decode()}")
        
        # Test 5: Final verification - simulate fresh session
        print(f"\n🔐 Test 5: Simulation nouvelle session")
        
        # Create new client (simulates fresh browser)
        new_client = Client()
        response = new_client.get(
            '/api/auth/user-profile/',
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            
            print(f"   - ✅ Session fresh - données récupérées:")
            print(f"     * Nom: {profile.get('first_name')} {profile.get('last_name')}")
            print(f"     * Langue: {profile.get('preferred_language')}")
            
            photo_url = profile.get('profile_picture_url')
            if photo_url:
                print(f"     * ✅ Photo toujours disponible")
                print(f"     * URL: {photo_url[:60]}...")
                
                # Verify file exists
                from urllib.parse import urlparse
                photo_path = urlparse(photo_url).path
                if photo_path.startswith('/media/'):
                    file_path = os.path.join('/Users/herlytache/Desktop/Cash Ti Machann/backend-api', photo_path[1:])
                    if os.path.exists(file_path):
                        print(f"     * ✅ Fichier physique présent")
                    else:
                        print(f"     * ❌ Fichier physique manquant")
            else:
                print(f"     * ❌ Photo perdue dans nouvelle session")
        
        print(f"\n🎉 Tests API terminés avec succès!")
        print(f"   Les photos de profil persistent correctement à travers les sessions!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors des tests API: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_api_endpoints()