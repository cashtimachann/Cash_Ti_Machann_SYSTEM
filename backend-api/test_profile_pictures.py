#!/usr/bin/env python
"""
Test script to verify profile picture persistence
Cash Ti Machann - Digital Financial Services Platform
"""
import os
import django
from django.test.client import Client
from django.core.files.uploadedfile import SimpleUploadedFile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

def test_profile_picture_persistence():
    """Test that profile pictures are saved and retrieved correctly"""
    try:
        from accounts.models import User, UserProfile
        from django.contrib.auth import authenticate
        from rest_framework.authtoken.models import Token
        
        print("🧪 Test de persistance des photos de profil")
        print("=" * 50)
        
        # Get a test user
        test_users = User.objects.filter(user_type='client')[:3]
        
        for user in test_users:
            print(f"\n👤 Utilisateur: {user.username} ({user.email})")
            
            try:
                profile = user.profile
                print(f"   - Nom: {profile.first_name} {profile.last_name}")
                print(f"   - Langue préférée: {profile.get_preferred_language_display()}")
                
                if profile.profile_picture:
                    print(f"   - Photo de profil: ✅ {profile.profile_picture.name}")
                    print(f"   - URL: {profile.profile_picture.url}")
                    
                    # Check if file exists on disk
                    file_path = profile.profile_picture.path
                    if os.path.exists(file_path):
                        file_size = os.path.getsize(file_path)
                        print(f"   - Fichier sur disque: ✅ ({file_size} bytes)")
                    else:
                        print(f"   - Fichier sur disque: ❌ Manquant")
                else:
                    print(f"   - Photo de profil: ❌ Aucune photo")
                    
            except UserProfile.DoesNotExist:
                print(f"   - Profil: ❌ Pas de profil créé")
                
        # Test serializer with profile picture
        print(f"\n🔄 Test du serializer avec contexte de requête...")
        from accounts.serializers import UserProfileSerializer
        from django.test import RequestFactory
        
        if test_users.exists():
            user = test_users.first()
            try:
                profile = user.profile
                
                # Create mock request
                factory = RequestFactory()
                request = factory.get('/')
                request.META['HTTP_HOST'] = '127.0.0.1:8000'
                
                # Test serializer
                serializer = UserProfileSerializer(profile, context={'request': request})
                data = serializer.data
                
                print(f"   - Données sérialisées:")
                print(f"     * Nom: {data.get('first_name')} {data.get('last_name')}")
                print(f"     * Photo URL: {data.get('profile_picture_url', 'Non définie')}")
                print(f"     * Langue: {data.get('preferred_language', 'Non définie')}")
                
            except UserProfile.DoesNotExist:
                print(f"   - Pas de profil pour tester le serializer")
                
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

if __name__ == "__main__":
    test_profile_picture_persistence()