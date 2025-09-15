from accounts.models import User

# Reset password for original admin
admin = User.objects.get(username='admin')
admin.set_password('JCS823ch!!')
admin.save()

print(f"Password reset for {admin.username}")
print(f"Is superuser: {admin.is_superuser}")
print(f"Is staff: {admin.is_staff}")
print(f"Is active: {admin.is_active}")

# Test authentication
from django.contrib.auth import authenticate
test_auth = authenticate(username='admin', password='JCS823ch!!')
print(f"Authentication test: {'SUCCESS' if test_auth else 'FAILED'}")
