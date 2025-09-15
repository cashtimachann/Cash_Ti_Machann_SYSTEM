from django.core.management.base import BaseCommand
from accounts.models import UserProfile, Country

# Map lowercase textual variants to ISO2
COUNTRY_MAP = {}

def build_country_map():
    for c in Country.objects.all():
        variants = {c.name.lower()}
        if c.name_kreol:
            variants.add(c.name_kreol.lower())
        # Handle Haiti accent variants
        if c.iso2 == 'HT':
            variants.update({'haiti','haïti','ayiti'})
        for v in variants:
            COUNTRY_MAP[v] = c

class Command(BaseCommand):
    help = 'Backfill UserProfile.residence_country from legacy country text field'

    def handle(self, *args, **options):
        build_country_map()
        total = 0
        matched = 0
        for profile in UserProfile.objects.select_related('residence_country').all():
            total += 1
            if profile.residence_country_id:
                continue
            legacy = (profile.country or '').strip().lower()
            if not legacy:
                continue
            c = COUNTRY_MAP.get(legacy)
            if c:
                profile.residence_country = c
                profile.save(update_fields=['residence_country'])
                matched += 1
        self.stdout.write(self.style.SUCCESS(f"Processed {total} profiles. Backfilled: {matched}"))
