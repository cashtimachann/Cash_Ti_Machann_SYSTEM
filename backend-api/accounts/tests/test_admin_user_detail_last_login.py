from django.urls import reverse
from rest_framework.test import APITestCase
from accounts.models import User, LoginActivity


class AdminUserDetailLastLoginTests(APITestCase):
    def setUp(self):
        self.admin_password = 'Adminpass123!'
        self.admin = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password=self.admin_password,
            user_type='admin',
            is_active=True
        )
        self.user_password = 'Userpass123!'
        self.target_user = User.objects.create_user(
            username='normaluser',
            email='normal@example.com',
            password=self.user_password,
            is_active=True
        )

    def auth_admin(self):
        resp = self.client.post(reverse('login'), {'email': 'admin@example.com', 'password': self.admin_password}, format='json')
        self.assertEqual(resp.status_code, 200)
        return resp.data['token']

    def test_admin_user_detail_last_login_fallback(self):
        # Ensure user has no last_login
        self.assertIsNone(self.target_user.last_login)
        # Create a successful login activity manually (simulate past login event existing in audit but field blank)
        LoginActivity.objects.create(user=self.target_user, success=True, ip_address='127.0.0.1', user_agent='TestAgent')
        token = self.auth_admin()
        url = reverse('admin_user_details', kwargs={'user_id': self.target_user.id})
        resp = self.client.get(url, HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('last_login', resp.data)
        self.assertIsNotNone(resp.data['last_login'], 'Expected fallback last_login from LoginActivity')
