from datetime import date, timedelta
from typing import Iterable

from django.db.models import Q

from apps.bookings.models import Booking


def daterange(start: date, end: date) -> Iterable[date]:
    """Dates from start inclusive to end exclusive (checkout day not occupied for new booking)."""
    day = start
    while day < end:
        yield day
        day += timedelta(days=1)


def dates_blocked_for_homestay(homestay_id, exclude_booking_id=None) -> set[date]:
    from apps.homestays.models import BlockedDate

    blocked = set(
        BlockedDate.objects.filter(homestay_id=homestay_id).values_list(
            "date", flat=True
        )
    )
    qs = Booking.objects.filter(
        homestay_id=homestay_id,
        status__in=[
            Booking.Status.PENDING,
            Booking.Status.AWAITING_PAYMENT,
            Booking.Status.CONFIRMED,
        ],
    )
    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)
    for b in qs.only("check_in_date", "check_out_date"):
        for d in daterange(b.check_in_date, b.check_out_date):
            blocked.add(d)
    return blocked


def is_range_available(
    homestay_id,
    check_in: date,
    check_out: date,
    exclude_booking_id=None,
) -> bool:
    if check_out <= check_in:
        return False
    blocked = dates_blocked_for_homestay(homestay_id, exclude_booking_id)
    for d in daterange(check_in, check_out):
        if d in blocked:
            return False
    return True
