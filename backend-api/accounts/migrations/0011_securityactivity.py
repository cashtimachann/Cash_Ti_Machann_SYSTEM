from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_identitydocument_unique_doc_number'),
    ]

    operations = [
        migrations.CreateModel(
            name='SecurityActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(choices=[('password_change', 'Password Change'), ('password_reset', 'Password Reset'), ('two_factor_enabled', '2FA Enabled'), ('two_factor_disabled', '2FA Disabled'), ('email_change', 'Email Change'), ('phone_change', 'Phone Number Change')], max_length=50)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='security_activities', to='accounts.user')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='securityactivity',
            index=models.Index(fields=['user', '-timestamp'], name='accounts_sec_user_id_6bade9_idx'),
        ),
        migrations.AddIndex(
            model_name='securityactivity',
            index=models.Index(fields=['event_type', '-timestamp'], name='accounts_sec_event_t_1e3b22_idx'),
        ),
    ]
