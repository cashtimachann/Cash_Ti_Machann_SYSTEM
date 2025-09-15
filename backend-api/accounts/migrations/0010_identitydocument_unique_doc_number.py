from django.db import migrations, models
from django.db.models import Q


def dedupe_document_numbers(apps, schema_editor):
    IdentityDocument = apps.get_model('accounts', 'IdentityDocument')
    # We only care about non-null, non-empty numbers
    seen = {}
    duplicates = []
    for doc in IdentityDocument.objects.exclude(Q(document_number__isnull=True) | Q(document_number='')):
        num = doc.document_number
        if num in seen:
            duplicates.append(doc.pk)
        else:
            seen[num] = doc.pk
    # Strategy: blank out duplicates so they won't violate upcoming constraint
    if duplicates:
        IdentityDocument.objects.filter(pk__in=duplicates).update(document_number=None)

def reverse_dedupe(apps, schema_editor):
    # Irreversible safely
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_rename_accounts_lo_user_id_c7cda0_idx_accounts_lo_user_id_c06636_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(dedupe_document_numbers, reverse_dedupe),
        migrations.AddConstraint(
            model_name='identitydocument',
            constraint=models.UniqueConstraint(
                fields=('document_number',), name='uniq_identity_document_number', condition=Q(document_number__isnull=False) & ~Q(document_number='')
            ),
        ),
        migrations.AddIndex(
            model_name='identitydocument',
            index=models.Index(fields=['document_number'], name='accounts_id_doc_number_idx'),
        ),
    ]
