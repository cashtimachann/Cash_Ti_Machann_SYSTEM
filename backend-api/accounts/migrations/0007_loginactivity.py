from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_country_userprofile_residence_country'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('success', models.BooleanField(default=False)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='login_activities', to='accounts.user')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='loginactivity',
            index=models.Index(fields=['user', '-timestamp'], name='accounts_lo_user_id_c7cda0_idx'),
        ),
        migrations.AddIndex(
            model_name='loginactivity',
            index=models.Index(fields=['-timestamp'], name='accounts_lo_timesta_f21a16_idx'),
        ),
    ]
