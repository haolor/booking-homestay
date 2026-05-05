from rest_framework import serializers

from apps.users.models import HostProfile, User


class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "phone_number",
            "avatar",
            "role",
            "is_verified",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "email", "role", "is_verified", "date_joined")


class HostProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostProfile
        fields = (
            "id",
            "bio",
            "response_rate",
            "response_time_hours",
            "is_superhost",
            "verified_at",
            "pending_verification",
        )
        read_only_fields = fields


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "full_name", "avatar", "date_joined")


class HostRegisterSerializer(serializers.Serializer):
    bio = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        user: User = self.context["request"].user
        if user.role != User.Role.GUEST:
            raise serializers.ValidationError("Already a host or admin.")
        user.role = User.Role.HOST
        user.save(update_fields=["role"])
        HostProfile.objects.get_or_create(
            user=user, defaults={"bio": validated_data.get("bio", "")}
        )
        return user

    def to_representation(self, instance):
        return UserMeSerializer(instance).data
