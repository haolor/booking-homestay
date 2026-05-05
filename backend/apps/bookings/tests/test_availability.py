import datetime

import pytest
from django.contrib.auth import get_user_model

from apps.bookings.models import Booking
from apps.homestays.availability import is_range_available
from apps.homestays.models import Homestay

User = get_user_model()


@pytest.mark.django_db
def test_is_range_available_blocks_confirmed_booking():
    host = User.objects.create_user("h@example.com", "pass", full_name="Host", role="host")
    guest = User.objects.create_user("g@example.com", "pass", full_name="Guest", role="guest")
    h = Homestay.objects.create(
        host=host,
        title="Test",
        address="1",
        city="HN",
        price_per_night=100,
        status=Homestay.Status.PUBLISHED,
    )
    Booking.objects.create(
        homestay=h,
        guest=guest,
        check_in_date=datetime.date(2026, 6, 1),
        check_out_date=datetime.date(2026, 6, 5),
        num_guests=2,
        num_nights=4,
        price_per_night=100,
        subtotal=400,
        service_fee=20,
        total_price=420,
        status=Booking.Status.CONFIRMED,
    )
    assert is_range_available(h.id, datetime.date(2026, 6, 3), datetime.date(2026, 6, 6)) is False
    assert is_range_available(h.id, datetime.date(2026, 6, 5), datetime.date(2026, 6, 7)) is True
