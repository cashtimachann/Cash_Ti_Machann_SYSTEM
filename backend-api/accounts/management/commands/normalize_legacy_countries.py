from django.core.management.base import BaseCommand
from accounts.models import UserProfile
from accounts.utils.country_utils import normalize_country_name

class Command(BaseCommand):
    help = 'Normalize legacy textual country names (e.g., Ayiti, Haïti) to canonical form in UserProfile.country'

    def handle(self, *args, **options):
        qs = UserProfile.objects.all()
        updated = 0
        total = qs.count()
        for profile in qs:
            canon = normalize_country_name(profile.country)
            if canon and canon != profile.country:
                profile.country = canon
                profile.save(update_fields=['country'])
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Checked {total} profiles. Updated: {updated}"))
