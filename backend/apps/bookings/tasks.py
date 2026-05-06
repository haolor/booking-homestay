from celery import shared_task
from django.utils import timezone

from apps.bookings.models import Booking


@shared_task
def expire_pending_bookings():
    now = timezone.now()
    qs = Booking.objects.filter(
        status=Booking.Status.PENDING, host_response_deadline_at__lt=now
    )
    qs.update(status=Booking.Status.CANCELLED, updated_at=now)


@shared_task
def expire_awaiting_payment():
    now = timezone.now()
    qs = Booking.objects.filter(
        status=Booking.Status.AWAITING_PAYMENT, payment_deadline_at__lt=now
    )
    qs.update(status=Booking.Status.CANCELLED, updated_at=now)


@shared_task
def auto_complete_bookings():
    today = timezone.localdate()
    for b in Booking.objects.filter(
        status__in=[Booking.Status.CONFIRMED, Booking.Status.CHECKED_IN],
        check_out_date__lt=today
    ):
        b.mark_completed_if_past_checkout()
