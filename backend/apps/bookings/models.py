import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending host response"
        AWAITING_PAYMENT = "awaiting_payment", "Awaiting payment"
        CONFIRMED = "confirmed", "Confirmed"
        CHECKED_IN = "checked_in", "Checked in"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    homestay = models.ForeignKey(
        "homestays.Homestay", on_delete=models.CASCADE, related_name="bookings"
    )
    guest = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="guest_bookings",
    )
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    num_guests = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    num_nights = models.PositiveIntegerField(default=0)
    price_per_night = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    service_fee = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    cancellation_reason = models.TextField(blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cancelled_bookings",
    )
    host_confirmed_at = models.DateTimeField(null=True, blank=True)
    payment_deadline_at = models.DateTimeField(null=True, blank=True)
    host_response_deadline_at = models.DateTimeField(null=True, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Booking {self.id} ({self.status})"

    def save(self, *args, **kwargs):
        if self.check_in_date and self.check_out_date:
            self.num_nights = max(
                0, (self.check_out_date - self.check_in_date).days
            )
        super().save(*args, **kwargs)

    @staticmethod
    def compute_totals(price_per_night: Decimal, nights: int) -> tuple[Decimal, Decimal, Decimal]:
        subtotal = (price_per_night * nights).quantize(Decimal("0.01"))
        service_fee = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
        total = (subtotal + service_fee).quantize(Decimal("0.01"))
        return subtotal, service_fee, total

    def mark_completed_if_past_checkout(self) -> bool:
        if self.status not in (self.Status.CONFIRMED, self.Status.CHECKED_IN):
            return False
        today = timezone.localdate()
        if today > self.check_out_date:
            self.status = self.Status.COMPLETED
            self.save(update_fields=["status", "updated_at"])
            return True
        return False
