"""
Management command: python manage.py seed_demo

Creates a demo tenant and admin user so customers can explore CyShop
immediately without filling a registration form.

Credentials:
  Workspace : demo
  Username  : demo
  Password  : Demo@cyshop1
  Email     : demo@cy-com.com
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


User = get_user_model()

DEMO_TENANT = {
    "name": "CyShop Demo",
    "subdomain": "demo",
}

DEMO_ADMIN = {
    "username": "demo",
    "email": "demo@cy-com.com",
    "password": "Demo@cyshop1",
    "first_name": "Demo",
    "last_name": "User",
}


class Command(BaseCommand):
    help = "Seed demo tenant and admin user for live demonstrations"

    def handle(self, *args, **options):
        self._seed_tenant()
        self._seed_admin()
        self.stdout.write(self.style.SUCCESS(
            "\nDemo ready!\n"
            f"  Workspace : {DEMO_TENANT['subdomain']}\n"
            f"  Username  : {DEMO_ADMIN['username']}\n"
            f"  Password  : {DEMO_ADMIN['password']}\n"
        ))

    def _seed_tenant(self):
        try:
            from apps.tenants.models import Tenant  # noqa: PLC0415
            tenant, created = Tenant.objects.get_or_create(
                subdomain=DEMO_TENANT["subdomain"],
                defaults={"name": DEMO_TENANT["name"]},
            )
            if created:
                self.stdout.write(f"  Created tenant: {tenant.name}")
            else:
                self.stdout.write(f"  Tenant already exists: {tenant.subdomain}")
        except Exception as exc:  # noqa: BLE001
            self.stdout.write(self.style.WARNING(f"  Tenant seeding skipped: {exc}"))

    def _seed_admin(self):
        user, created = User.objects.get_or_create(
            username=DEMO_ADMIN["username"],
            defaults={
                "email": DEMO_ADMIN["email"],
                "first_name": DEMO_ADMIN["first_name"],
                "last_name": DEMO_ADMIN["last_name"],
                "is_staff": False,
                "is_superuser": False,
            },
        )
        if created:
            user.set_password(DEMO_ADMIN["password"])
            user.save()
            self.stdout.write(f"  Created admin: {user.username}")
        else:
            self.stdout.write(f"  Admin already exists: {user.username}")
