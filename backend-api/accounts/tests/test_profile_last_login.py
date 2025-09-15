from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from accounts.models import User


class ProfileLastLoginTests(APITestCase):
    def setUp(self):
        self.password = 'Testpass123!'
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password=self.password,
            is_active=True
        )

    def test_profile_includes_last_login_after_login(self):
        # Initially user.last_login may be None
        self.assertIsNone(self.user.last_login)

        # Login
        url = reverse('login')
        resp = self.client.post(url, {'email': 'test@example.com', 'password': self.password}, format='json')
        self.assertEqual(resp.status_code, 200)
        token = resp.data['token']
        # Fetch profile
        profile_url = reverse('profile')
        resp2 = self.client.get(profile_url, HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(resp2.status_code, 200)
        self.assertIn('user', resp2.data)
        self.assertIn('last_login', resp2.data['user'])
        last_login = resp2.data['user']['last_login']
        self.assertIsNotNone(last_login, 'last_login should be populated after login')

    def test_profile_fallback_to_login_activity_when_last_login_null(self):
        # Manually ensure last_login is null but create a login activity by simulating login without saving last_login (edge case)
        # Perform login to create activity and update last_login, then nullify last_login to simulate legacy state
        login_resp = self.client.post(reverse('login'), {'email': 'test@example.com', 'password': self.password}, format='json')
        self.assertEqual(login_resp.status_code, 200)
        # Nullify last_login
        User.objects.filter(id=self.user.id).update(last_login=None)
        token = login_resp.data['token']
        profile_resp = self.client.get(reverse('profile'), HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(profile_resp.status_code, 200)
        self.assertIsNotNone(profile_resp.data['user']['last_login'])
