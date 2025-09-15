from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_loginactivity'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='last_password_reset_requested',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
