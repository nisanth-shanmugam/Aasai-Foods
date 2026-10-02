from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Seed database with demo users'

    def handle(self, *args, **options):
        # 1. Create/Update Admin User
        admin_email = "admin@aasai.com"
        admin_pass = "admin123"
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "name": "Aasai Admin",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True
            }
        )
        if created or not admin_user.check_password(admin_pass):
            admin_user.set_password(admin_pass)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"User {admin_email} configured with password."))
        else:
            self.stdout.write(f"User {admin_email} already exists and is configured.")

        # 2. Create/Update Customer User
        customer_email = "priya@gmail.com"
        customer_pass = "customer123"
        customer_user, created = User.objects.get_or_create(
            email=customer_email,
            defaults={
                "name": "Priya",
                "role": "customer",
                "is_staff": False,
                "is_superuser": False
            }
        )
        if created or not customer_user.check_password(customer_pass):
            customer_user.set_password(customer_pass)
            customer_user.save()
            self.stdout.write(self.style.SUCCESS(f"User {customer_email} configured with password."))
        else:
            self.stdout.write(f"User {customer_email} already exists and is configured.")
