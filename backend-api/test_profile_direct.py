#!/usr/bin/env python
"""
Direct test of profile picture functionality using Django ORM
Cash Ti Machann - Digital Financial Services Platform
"""
import os
import django
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

def test_profile_picture_direct():
    """Test profile picture functionality directly with Django"""
    try:
        from accounts.models import User, UserProfile
        from accounts.serializers import UserProfileSerializer
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.test import RequestFactory
        from PIL import Image
        import io
        
        print("🧪 Test direct des photos de profil")
        print("=" * 50)
        
        # Get a test user
        test_user = User.objects.filter(user_type='client').first()
        if not test_user:
            print("❌ Aucun utilisateur client trouvé")
            return False
            
        print(f"👤 Utilisateur de test: {test_user.username}")
        
        # Get or create profile
        try:
            profile = test_user.profile
            print(f"   - Profil existant trouvé")
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(
                user=test_user,
                first_name=test_user.first_name or 'Test',
                last_name=test_user.last_name or 'User'
            )
            print(f"   - Nouveau profil créé")
        
        # Check current state
        print(f"\n📋 État actuel:")
        print(f"   - Nom: {profile.first_name} {profile.last_name}")
        print(f"   - Photo: {'✅ ' + profile.profile_picture.name if profile.profile_picture else '❌ Aucune'}")
        
        # Create a test image
        print(f"\n📸 Création d'une image de test...")
        img = Image.new('RGB', (200, 200), color='blue')
        img_io = io.BytesIO()
        img.save(img_io, format='JPEG')
        img_io.seek(0)
        
        # Create uploaded file
        uploaded_file = SimpleUploadedFile(
            name='test_profile.jpg',
            content=img_io.read(),
            content_type='image/jpeg'
        )
        
        # Save profile picture
        profile.profile_picture = uploaded_file
        profile.save()
        print(f"   - ✅ Photo sauvegardée: {profile.profile_picture.name}")
        
        # Test persistence by reloading
        print(f"\n🔄 Test de persistance...")
        profile.refresh_from_db()
        print(f"   - Photo après reload: {'✅ ' + profile.profile_picture.name if profile.profile_picture else '❌ Perdue'}")
        
        # Test serializer
        print(f"\n🔄 Test du serializer...")
        factory = RequestFactory()
        request = factory.get('/')
        request.META['HTTP_HOST'] = '127.0.0.1:8000'
        
        serializer = UserProfileSerializer(profile, context={'request': request})
        data = serializer.data
        
        print(f"   - Photo URL: {data.get('profile_picture_url', 'Non définie')}")
        print(f"   - Langue: {data.get('preferred_language', 'Non définie')}")
        
        # Test file exists on disk
        if profile.profile_picture:
            file_path = profile.profile_picture.path
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                print(f"   - ✅ Fichier sur disque: {file_size} bytes")
            else:
                print(f"   - ❌ Fichier manquant sur disque")
        
        # Simulate logout/login by creating new profile instance
        print(f"\n🔐 Simulation déconnexion/reconnexion...")
        new_profile = UserProfile.objects.get(user=test_user)
        print(f"   - Photo après 'reconnexion': {'✅ ' + new_profile.profile_picture.name if new_profile.profile_picture else '❌ Perdue'}")
        
        # Test with fresh serializer (simulate page refresh)
        new_serializer = UserProfileSerializer(new_profile, context={'request': request})
        new_data = new_serializer.data
        print(f"   - URL après 'refresh': {new_data.get('profile_picture_url', 'Non définie')}")
        
        print(f"\n✅ Test terminé avec succès!")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_profile_picture_direct()