# Generated manually to add front/back document images
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0002_userprofile_email_verification_code_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='id_document_front',
            field=models.ImageField(upload_to='documents/', null=True, blank=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='id_document_back',
            field=models.ImageField(upload_to='documents/', null=True, blank=True),
        ),
    ]
