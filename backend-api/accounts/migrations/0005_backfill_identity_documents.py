from django.db import migrations


def backfill_identity_documents(apps, schema_editor):
    UserProfile = apps.get_model('accounts', 'UserProfile')
    IdentityDocument = apps.get_model('accounts', 'IdentityDocument')
    db_alias = schema_editor.connection.alias

    for profile in UserProfile.objects.using(db_alias).select_related('user').all():
        has_legacy = bool(getattr(profile, 'id_document_image', None))
        has_front = bool(getattr(profile, 'id_document_front', None))
        has_back = bool(getattr(profile, 'id_document_back', None))

        if not (has_legacy or has_front or has_back):
            continue

        # Skip if an IdentityDocument already exists for this user
        if IdentityDocument.objects.using(db_alias).filter(user=profile.user).exists():
            continue

        IdentityDocument.objects.using(db_alias).create(
            user=profile.user,
            document_type=getattr(profile, 'id_document_type', None) or 'unknown',
            document_number=getattr(profile, 'id_document_number', None) or '',
            front_image=getattr(profile, 'id_document_front', None) if has_front else None,
            back_image=getattr(profile, 'id_document_back', None) if has_back else None,
            legacy_single_image=getattr(profile, 'id_document_image', None) if has_legacy else None,
            status=getattr(profile, 'verification_status', None) or 'pending',
            notes='Backfilled from UserProfile during migration',
        )


def noop_reverse(apps, schema_editor):
    # No-op reverse migration; we won't delete backfilled records automatically
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0004_identitydocument'),
    ]

    operations = [
        migrations.RunPython(backfill_identity_documents, noop_reverse),
    ]
