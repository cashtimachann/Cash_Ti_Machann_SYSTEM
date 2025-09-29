import json
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
import pytest


User = get_user_model()


@pytest.mark.django_db
def test_search_users_returns_full_name_and_email(client):
    # Create current authenticated user
    me = User.objects.create_user(username='me', password='pass123', email='me@example.com', user_type='client')
    # Create a target user with profile-like names (using User fields here)
    target = User.objects.create_user(
        username='john', password='pass123', email='john.doe@example.com', user_type='client', first_name='John', last_name='Doe', phone_number='+50912345678'
    )

    api = APIClient()
    api.force_authenticate(user=me)

    url = reverse('search_users')
    # Search by email
    resp = api.get(url, {'q': 'john.doe@example.com'})
    assert resp.status_code == 200
    data = resp.json()
    assert any(u.get('email') == 'john.doe@example.com' for u in data)
    # Ensure full_name is present and composed
    match = next((u for u in data if u.get('email') == 'john.doe@example.com'), None)
    assert match is not None
    assert 'full_name' in match
    assert match['full_name'] in ('John Doe', 'John', 'Doe')
