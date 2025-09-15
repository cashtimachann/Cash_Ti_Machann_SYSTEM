from django.core.management.base import BaseCommand
from accounts.models import Country

COUNTRIES = [
    # iso2, name, name_kreol
    ('HT', 'Haiti', 'Ayiti'),
    ('US', 'United States', 'Etazini'),
    ('CA', 'Canada', 'Kanada'),
    ('CL', 'Chile', 'Chili'),
    ('FR', 'France', 'Frans'),
    ('DO', 'Dominican Republic', 'Repiblik Dominikèn'),
    ('BR', 'Brazil', 'Brezil'),
    ('MX', 'Mexico', 'Meksik'),
]

class Command(BaseCommand):
    help = 'Seed initial countries allowed for registration'

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for iso2, name, kreol in COUNTRIES:
            obj, was_created = Country.objects.update_or_create(
                iso2=iso2,
                defaults={
                    'name': name,
                    'name_kreol': kreol,
                    'allowed_for_registration': True,
                    'is_active': True
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Countries seeded. Created: {created}, Updated: {updated}"))
