import os
import cloudinary.uploader
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

from apps.users.models import User, HostProfile
from apps.homestays.models import Homestay, HomestayImage

DEMO_PASSWORD = "demo12345"


class Command(BaseCommand):
    help = "Seed demo accounts and homestays with images from the 'images' folder."

    @transaction.atomic
    def handle(self, *args, **options):
        user_model = get_user_model()

        # 1. Create/Update Admin
        admin_email = "admin@gmail.com"
        admin, _ = user_model.objects.get_or_create(
            email=admin_email,
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
        admin.set_password(DEMO_PASSWORD)
        admin.save()
        self.stdout.write(self.style.SUCCESS(f"Seed Admin: {admin_email}"))

        # 2. Create/Update 3 Hosts
        hosts = []
        host_emails = ["host1@gmail.com", "host2@gmail.com", "host3@gmail.com"]
        for email in host_emails:
            host, _ = user_model.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": f"Host {email.split('@')[0]} Demo",
                    "role": User.Role.HOST,
                    "is_verified": True,
                    "is_active": True,
                },
            )
            host.role = User.Role.HOST
            host.is_verified = True
            host.is_active = True
            host.set_password(DEMO_PASSWORD)
            host.save()
            
            # Ensure HostProfile exists
            HostProfile.objects.get_or_create(user=host)
            
            hosts.append(host)
            self.stdout.write(self.style.SUCCESS(f"Seed Host: {email}"))

        # 3. Create/Update 1 Guest
        guest_email = "guest@gmail.com"
        guest, _ = user_model.objects.get_or_create(
            email=guest_email,
            defaults={
                "full_name": "Guest Demo",
                "role": User.Role.GUEST,
                "is_verified": True,
                "is_active": True,
            },
        )
        guest.role = User.Role.GUEST
        guest.is_verified = True
        guest.is_active = True
        guest.set_password(DEMO_PASSWORD)
        guest.save()
        self.stdout.write(self.style.SUCCESS(f"Seed Guest: {guest_email}"))

        # Prepare images
        images_dir = os.path.join(settings.BASE_DIR, "images")
        local_images = []
        if os.path.exists(images_dir):
            local_images = sorted([
                f for f in os.listdir(images_dir)
                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))
            ])
            self.stdout.write(f"Found {len(local_images)} images in {images_dir}")
        else:
            self.stdout.write(self.style.WARNING(f"Images directory not found: {images_dir}"))

        # 4. Create Homestays for each host
        cities = ["Hanoi", "Da Nang", "Ho Chi Minh City"]
        img_idx = 0
        for index, host in enumerate(hosts):
            city = cities[index % len(cities)]
            num_homestays = 3 if index == 0 else 2
            for i in range(1, num_homestays + 1):
                homestay, created = Homestay.objects.get_or_create(
                    host=host,
                    title=f"Cozy {city} Stay {index*3 + i}",
                    defaults={
                        "description": f"Experience the best of {city} in this cozy homestay hosted by {host.email}.",
                        "address": f"{index*10 + i}23 {city} Main St",
                        "city": city,
                        "price_per_night": 400000 + (index * 100000) + (i * 50000),
                        "max_guests": 2 + i,
                        "status": Homestay.Status.PUBLISHED,
                        "type": Homestay.Type.ENTIRE_HOUSE if i % 2 == 0 else Homestay.Type.PRIVATE_ROOM,
                        "num_bedrooms": 1 + (i % 2),
                        "num_bathrooms": 1,
                    }
                )
                
                if created:
                    self.stdout.write(f"Created homestay: {homestay.title} for {host.email}")
                    # Upload image if available
                    if local_images:
                        img_name = local_images[img_idx % len(local_images)]
                        img_path = os.path.join(images_dir, img_name)
                        img_idx += 1
                        
                        try:
                            self.stdout.write(f"Uploading image {img_name} for {homestay.title}...")
                            upload_result = cloudinary.uploader.upload(
                                img_path,
                                folder="homestays/demo",
                                resource_type="image"
                            )
                            HomestayImage.objects.create(
                                homestay=homestay,
                                url=upload_result['secure_url'],
                                cloudinary_public_id=upload_result['public_id'],
                                is_cover=True
                            )
                            self.stdout.write(self.style.SUCCESS(f"Successfully uploaded {img_name}"))
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Cloudinary upload failed: {str(e)}"))
                else:
                    self.stdout.write(f"Homestay already exists: {homestay.title}")

        self.stdout.write(self.style.SUCCESS("Seed OK: all demo accounts, homestays, and images ready."))
        self.stdout.write(f"Default Password: {DEMO_PASSWORD}")
