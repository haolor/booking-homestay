import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Homestay(models.Model):
    class Type(models.TextChoices):
        ENTIRE_HOUSE = "entire_house", "Entire place"
        PRIVATE_ROOM = "private_room", "Private room"
        SHARED_ROOM = "shared_room", "Shared room"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        SUSPENDED = "suspended", "Suspended"

    class CancellationPolicy(models.TextChoices):
        FLEXIBLE = "flexible", "Flexible"
        MODERATE = "moderate", "Moderate"
        STRICT = "strict", "Strict"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="homestays",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(
        max_length=32, choices=Type.choices, default=Type.ENTIRE_HOUSE
    )
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.DRAFT
    )
    address = models.CharField(max_length=512)
    city = models.CharField(max_length=128, db_index=True)
    district = models.CharField(max_length=128, blank=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    price_per_night = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    max_guests = models.PositiveSmallIntegerField(default=1)
    num_bedrooms = models.PositiveSmallIntegerField(default=1)
    num_bathrooms = models.PositiveSmallIntegerField(default=1)
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    rules = models.TextField(blank=True)
    cancellation_policy = models.CharField(
        max_length=32,
        choices=CancellationPolicy.choices,
        default=CancellationPolicy.FLEXIBLE,
    )
    avg_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    pending_admin_review = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class HomestayImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    homestay = models.ForeignKey(
        Homestay, on_delete=models.CASCADE, related_name="images"
    )
    cloudinary_public_id = models.CharField(max_length=255, blank=True)
    url = models.URLField()
    is_cover = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "created_at"]
        # created_at missing - add for ordering
    # Django startapp adds no created_at - add it

    created_at = models.DateTimeField(auto_now_add=True)


class Amenity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128, unique=True)
    icon = models.CharField(max_length=64, blank=True)
    category = models.CharField(max_length=64, blank=True)

    class Meta:
        verbose_name_plural = "Amenities"

    def __str__(self):
        return self.name


class HomestayAmenity(models.Model):
    homestay = models.ForeignKey(
        Homestay, on_delete=models.CASCADE, related_name="homestay_amenities"
    )
    amenity = models.ForeignKey(
        Amenity, on_delete=models.CASCADE, related_name="homestay_links"
    )

    class Meta:
        unique_together = ("homestay", "amenity")


class BlockedDate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    homestay = models.ForeignKey(
        Homestay, on_delete=models.CASCADE, related_name="blocked_dates"
    )
    date = models.DateField()
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("homestay", "date")


class WishlistItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
    )
    homestay = models.ForeignKey(
        Homestay, on_delete=models.CASCADE, related_name="wishlisted_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "homestay")
