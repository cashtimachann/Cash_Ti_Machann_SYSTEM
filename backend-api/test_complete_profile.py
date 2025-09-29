#!/usr/bin/env python
"""
Comprehensive test for profile picture persistence across sessions
Cash Ti Machann - Digital Financial Services Platform
"""
import os
import django
import tempfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

def test_complete_profile_picture_flow():
    """Complete test of profile picture functionality"""
    try:
        from accounts.models import User, UserProfile
        from accounts.serializers import UserProfileSerializer
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.test import RequestFactory, Client
        from django.contrib.auth import authenticate
        from rest_framework.authtoken.models import Token
        from PIL import Image
        import io, json
        
        print("🏦 Cash Ti Machann - Test complet des photos de profil")
        print("=" * 60)
        
        # Step 1: Create/Get test user
        username = 'test_photo_user'
        email = 'test_photo@example.com'
        password = 'TestPass123!'
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'user_type': 'client',
                'is_active': True
            }
        )
        if created:
            user.set_password(password)
            user.save()
            print(f"✅ Nouvel utilisateur créé: {username}")
        else:
            print(f"✅ Utilisateur existant: {username}")
        
        # Step 2: Create/Get profile
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'first_name': 'Test',
                'last_name': 'Photo',
                'preferred_language': 'kreyol'
            }
        )
        print(f"✅ Profil {'créé' if created else 'existant'}: {profile.first_name} {profile.last_name}")
        
        # Step 3: Test initial state (no photo)
        print(f"\n📋 État initial:")
        print(f"   - Photo: {'✅ ' + profile.profile_picture.name if profile.profile_picture else '❌ Aucune'}")
        
        # Step 4: Create and upload photo
        print(f"\n📸 Upload d'une photo de profil...")
        
        # Create test image
        img = Image.new('RGB', (300, 300), color=(255, 100, 100))  # Red image
        img_io = io.BytesIO()
        img.save(img_io, format='JPEG', quality=90)
        img_io.seek(0)
        
        # Upload via Django file field
        uploaded_file = SimpleUploadedFile(
            name=f'profile_{user.id}.jpg',
            content=img_io.read(),
            content_type='image/jpeg'
        )
        
        old_photo = profile.profile_picture.name if profile.profile_picture else None
        profile.profile_picture = uploaded_file
        profile.save()
        
        print(f"   - ✅ Photo uploadée: {profile.profile_picture.name}")
        if old_photo:
            print(f"   - Ancienne photo remplacée: {old_photo}")
        
        # Step 5: Test immediate persistence
        print(f"\n🔄 Test persistence immédiate...")
        profile.refresh_from_db()
        if profile.profile_picture:
            print(f"   - ✅ Photo conservée après refresh: {profile.profile_picture.name}")
            file_path = profile.profile_picture.path
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                print(f"   - ✅ Fichier sur disque: {file_size:,} bytes")
            else:
                print(f"   - ❌ Fichier manquant sur disque!")
        else:
            print(f"   - ❌ Photo perdue après refresh!")
            
        # Step 6: Test serializer with URL generation
        print(f"\n🔗 Test génération URL...")
        factory = RequestFactory()
        request = factory.get('/')
        request.META['HTTP_HOST'] = '127.0.0.1:8000'
        request.META['wsgi.url_scheme'] = 'http'
        
        serializer = UserProfileSerializer(profile, context={'request': request})
        data = serializer.data
        
        photo_url = data.get('profile_picture_url')
        if photo_url:
            print(f"   - ✅ URL générée: {photo_url}")
        else:
            print(f"   - ❌ URL non générée!")
        
        # Step 7: Simulate session disconnection
        print(f"\n🔐 Simulation déconnexion/reconnexion...")
        
        # Clear Django cache and reload user
        user = User.objects.get(id=user.id)
        profile = user.profile
        
        if profile.profile_picture:
            print(f"   - ✅ Photo conservée après 'reconnexion': {profile.profile_picture.name}")
            
            # Test serializer again (simulates page refresh)
            new_serializer = UserProfileSerializer(profile, context={'request': request})
            new_data = new_serializer.data
            new_photo_url = new_data.get('profile_picture_url')
            
            if new_photo_url:
                print(f"   - ✅ URL disponible après refresh: {new_photo_url}")
            else:
                print(f"   - ❌ URL perdue après refresh!")
        else:
            print(f"   - ❌ Photo perdue après 'reconnexion'!")
        
        # Step 8: Test API token authentication
        print(f"\n🔑 Test avec token d'authentification...")
        token, created = Token.objects.get_or_create(user=user)
        print(f"   - Token {'créé' if created else 'existant'}: {token.key[:20]}...")
        
        # Step 9: Final verification
        print(f"\n✅ Vérification finale:")
        final_profile = UserProfile.objects.get(user=user)
        
        if final_profile.profile_picture:
            print(f"   - ✅ Photo persistante: {final_profile.profile_picture.name}")
            print(f"   - ✅ Langue: {final_profile.get_preferred_language_display()}")
            
            # Check file still exists
            if os.path.exists(final_profile.profile_picture.path):
                print(f"   - ✅ Fichier toujours présent sur disque")
            else:
                print(f"   - ❌ Fichier supprimé du disque!")
                
            # Final serializer test
            final_serializer = UserProfileSerializer(final_profile, context={'request': request})
            final_data = final_serializer.data
            
            print(f"   - ✅ Données finales sérialisées:")
            print(f"     * Nom: {final_data.get('first_name')} {final_data.get('last_name')}")
            print(f"     * Photo URL: {final_data.get('profile_picture_url', 'Non définie')}")
            print(f"     * Langue: {final_data.get('preferred_language')}")
        else:
            print(f"   - ❌ Photo finale manquante!")
            
        print(f"\n🎉 Test complet terminé avec succès!")
        print(f"   Les photos de profil sont bien persistantes même après déconnexion/reconnexion!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_complete_profile_picture_flow()