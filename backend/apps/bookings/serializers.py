from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.bookings.models import Booking
from apps.homestays.availability import is_range_available
from apps.homestays.models import Homestay


class BookingSerializer(serializers.ModelSerializer):
    homestay_title = serializers.CharField(source="homestay.title", read_only=True)
    guest_email = serializers.EmailField(source="guest.email", read_only=True)
    guest_name = serializers.CharField(source="guest.full_name", read_only=True)
    can_cancel_until = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id",
            "homestay",
            "homestay_title",
            "guest",
            "guest_email",
            "guest_name",
            "check_in_date",
            "check_out_date",
            "num_guests",
            "num_nights",
            "price_per_night",
            "subtotal",
            "service_fee",
            "total_price",
            "status",
            "cancellation_reason",
            "host_confirmed_at",
            "payment_deadline_at",
            "host_response_deadline_at",
            "can_cancel_until",
            "checked_in_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "guest",
            "num_nights",
            "price_per_night",
            "subtotal",
            "service_fee",
            "total_price",
            "status",
            "host_confirmed_at",
            "payment_deadline_at",
            "host_response_deadline_at",
            "checked_in_at",
            "created_at",
            "updated_at",
        )

    def get_can_cancel_until(self, obj: Booking):
        return obj.created_at + timedelta(minutes=30)


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ("homestay", "check_in_date", "check_out_date", "num_guests")

    def validate(self, attrs):
        homestay: Homestay = attrs["homestay"]
        if homestay.status != Homestay.Status.PUBLISHED:
            raise serializers.ValidationError("Homestay is not bookable.")
        guests = attrs["num_guests"]
        if guests > homestay.max_guests:
            raise serializers.ValidationError("Too many guests for this listing.")
        ci, co = attrs["check_in_date"], attrs["check_out_date"]
        if not is_range_available(homestay.id, ci, co):
            raise serializers.ValidationError("Selected dates are not available.")
        nights = (co - ci).days
        if nights < 1:
            raise serializers.ValidationError("Stay must be at least 1 night.")
        subtotal, fee, total = Booking.compute_totals(homestay.price_per_night, nights)
        attrs["num_nights"] = nights
        attrs["price_per_night"] = homestay.price_per_night
        attrs["subtotal"] = subtotal
        attrs["service_fee"] = fee
        attrs["total_price"] = total
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        now = timezone.now()
        return Booking.objects.create(
            guest=user,
            # Booking available immediately goes to payment step.
            status=Booking.Status.AWAITING_PAYMENT,
            payment_deadline_at=now + timedelta(minutes=30),
            **validated_data,
        )
