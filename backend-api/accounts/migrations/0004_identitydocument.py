from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0003_userprofile_id_document_front_id_document_back'),
    ]

    operations = [
        migrations.CreateModel(
            name='IdentityDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(max_length=50)),
                ('document_number', models.CharField(max_length=100, null=True, blank=True)),
                ('front_image', models.ImageField(upload_to='documents/', null=True, blank=True)),
                ('back_image', models.ImageField(upload_to='documents/', null=True, blank=True)),
                ('legacy_single_image', models.ImageField(upload_to='documents/', null=True, blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('verified', 'Verified'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('notes', models.TextField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='identity_documents', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
