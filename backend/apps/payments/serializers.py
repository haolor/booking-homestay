from rest_framework import serializers

from apps.bookings.models import Booking
from apps.payments.models import Payment


class PaymentCreateSerializer(serializers.Serializer):
    booking_id = serializers.UUIDField()
    method = serializers.ChoiceField(choices=Payment.Method.choices)

    def validate(self, attrs):
        user = self.context["request"].user
        booking = Booking.objects.filter(id=attrs["booking_id"]).first()
        if not booking:
            raise serializers.ValidationError("Booking not found.")
        if booking.guest_id != user.id:
            raise serializers.ValidationError("Not your booking.")
        if booking.status != Booking.Status.AWAITING_PAYMENT:
            raise serializers.ValidationError("Booking is not awaiting payment.")
        attrs["booking"] = booking
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "booking",
            "amount",
            "method",
            "status",
            "transaction_id",
            "paid_at",
            "created_at",
        )
