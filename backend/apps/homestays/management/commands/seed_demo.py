from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.users.models import User

DEMO_ADMIN_EMAIL = "admin@gmail.com"
DEMO_ADMIN_PASSWORD = "demo12345"


class Command(BaseCommand):
    help = "Seed only one demo admin account."

    @transaction.atomic
    def handle(self, *args, **options):
        user_model = get_user_model()
        admin, _ = user_model.objects.get_or_create(
            email=DEMO_ADMIN_EMAIL,
            defaults={
                "full_name": "Admin Demo",
                "role": User.Role.ADMIN,
                "is_verified": True,
                "is_active": True,
            },
        )
        admin.full_name = "Admin Demo"
        admin.role = User.Role.ADMIN
        admin.is_verified = True
        admin.is_active = True
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password(DEMO_ADMIN_PASSWORD)
        admin.save(
            update_fields=[
                "full_name",
                "role",
                "is_verified",
                "is_active",
                "is_staff",
                "is_superuser",
                "password",
            ]
        )

        self.stdout.write(self.style.SUCCESS("Seed OK: demo admin ready."))
        self.stdout.write(f"Email: {DEMO_ADMIN_EMAIL}")
        self.stdout.write(f"Password: {DEMO_ADMIN_PASSWORD}")
