from rest_framework import serializers

from apps.reviews.models import Review
from apps.users.serializers import UserPublicSerializer


class ReviewListSerializer(serializers.ModelSerializer):
    reviewer = UserPublicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "reviewer",
            "rating_overall",
            "comment",
            "host_reply",
            "host_replied_at",
            "created_at",
        )


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = (
            "booking",
            "rating_overall",
            "rating_cleanliness",
            "rating_accuracy",
            "rating_checkin",
            "rating_communication",
            "rating_location",
            "rating_value",
            "comment",
        )

    def validate_booking(self, booking):
        from apps.bookings.models import Booking

        user = self.context["request"].user
        if booking.guest_id != user.id:
            raise serializers.ValidationError("Not your booking.")
        if booking.status != Booking.Status.COMPLETED:
            raise serializers.ValidationError("Booking must be completed.")
        if hasattr(booking, "review"):
            raise serializers.ValidationError("Already reviewed.")
        return booking

    def create(self, validated_data):
        booking = validated_data["booking"]
        validated_data["reviewer"] = self.context["request"].user
        validated_data["homestay"] = booking.homestay
        return super().create(validated_data)


class ReviewReplySerializer(serializers.Serializer):
    host_reply = serializers.CharField()

    def update(self, instance, validated_data):
        from django.utils import timezone

        instance.host_reply = validated_data["host_reply"]
        instance.host_replied_at = timezone.now()
        instance.save(update_fields=["host_reply", "host_replied_at"])
        return instance
