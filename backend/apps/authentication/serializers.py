from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import HostProfile, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=[User.Role.GUEST, User.Role.HOST],
        default=User.Role.GUEST,
        required=False,
    )

    class Meta:
        model = User
        fields = ("email", "full_name", "password", "phone_number", "role")
        extra_kwargs = {"phone_number": {"required": False, "allow_blank": True}}

    def validate(self, attrs):
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.pop("role", User.Role.GUEST)
        email = validated_data.pop("email")
        user = User.objects.create_user(email, password, role=role, **validated_data)
        if role == User.Role.HOST:
            HostProfile.objects.get_or_create(user=user)
        return user


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        try:
            token = RefreshToken(attrs["refresh"])
            token.blacklist()
        except Exception as exc:  # noqa: BLE001
            raise serializers.ValidationError(str(exc)) from exc
        return attrs
