import io
from PIL import Image
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from accounts.models import UserProfile

User = get_user_model()


class UploadProfilePhotoAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='apitester', password='pass1234', email='api@test.ht'
        )
        # Ensure a profile exists
        UserProfile.objects.create(user=self.user, first_name='Api', last_name='Tester')
        self.client.force_authenticate(user=self.user)

    def _make_image(self, color=(255, 0, 0)):
        img = Image.new('RGB', (64, 64), color=color)
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        return buf

    def test_upload_and_profile_returns_url(self):
        img_buf = self._make_image()
        # DRF client needs (file, name, content_type)
        response = self.client.post(
            '/api/auth/upload-photo/',
            {'profile_picture': img_buf},
            format='multipart'
        )
        self.assertEqual(response.status_code, 200, response.content)
        data = response.json()
        self.assertTrue(data.get('success'))
        url = data.get('profile_picture_url')
        self.assertIsNotNone(url)
        self.assertIn('/media/profile_pictures/', url)

        # Now GET profile and ensure urls are present
        prof = self.client.get('/api/auth/profile/')
        self.assertEqual(prof.status_code, 200, prof.content)
        pdata = prof.json()
        self.assertIn('profile', pdata)
        p = pdata['profile']
        self.assertIsNotNone(p.get('profile_picture_url'))
        self.assertIsNotNone(p.get('profile_picture_absolute_url'))
        self.assertIn('/media/profile_pictures/', p.get('profile_picture_url'))