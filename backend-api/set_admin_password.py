from accounts.models import User

# Set password for admin2
admin2 = User.objects.get(username='admin2')
admin2.set_password('admin123')
admin2.save()

print(f"Password set for {admin2.username}")
print(f"Is superuser: {admin2.is_superuser}")
print(f"Is staff: {admin2.is_staff}")
print(f"Is active: {admin2.is_active}")
