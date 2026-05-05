from rest_framework import serializers

from apps.homestays.models import Amenity, Homestay, HomestayAmenity
from apps.homestays.serializers import AmenitySerializer, HomestayImageSerializer
from apps.users.models import User


class AdminHomestayListSerializer(serializers.ModelSerializer):
    host_email = serializers.EmailField(source="host.email", read_only=True)
    host_name = serializers.CharField(source="host.full_name", read_only=True)
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Homestay
        fields = (
            "id",
            "title",
            "city",
            "district",
            "status",
            "type",
            "price_per_night",
            "max_guests",
            "host",
            "host_email",
            "host_name",
            "pending_admin_review",
            "avg_rating",
            "cover_url",
            "created_at",
        )

    def get_cover_url(self, obj):
        img = obj.images.filter(is_cover=True).first() or obj.images.order_by("order").first()
        return img.url if img else None


class AdminHomestaySerializer(serializers.ModelSerializer):
    images = HomestayImageSerializer(many=True, read_only=True)
    amenities = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Amenity.objects.all(), write_only=True, required=False
    )
    host = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=(User.Role.HOST, User.Role.ADMIN))
    )

    class Meta:
        model = Homestay
        fields = (
            "id",
            "host",
            "title",
            "description",
            "type",
            "status",
            "address",
            "city",
            "district",
            "latitude",
            "longitude",
            "price_per_night",
            "max_guests",
            "num_bedrooms",
            "num_bathrooms",
            "check_in_time",
            "check_out_time",
            "rules",
            "cancellation_policy",
            "avg_rating",
            "pending_admin_review",
            "images",
            "amenities",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "avg_rating", "created_at", "updated_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["amenities"] = AmenitySerializer(
            Amenity.objects.filter(homestay_links__homestay=instance).distinct(),
            many=True,
        ).data
        return data

    def create(self, validated_data):
        amenities = validated_data.pop("amenities", [])
        h = Homestay.objects.create(**validated_data)
        for a in amenities:
            HomestayAmenity.objects.get_or_create(homestay=h, amenity=a)
        return h

    def update(self, instance, validated_data):
        amenities = validated_data.pop("amenities", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if amenities is not None:
            instance.homestay_amenities.all().delete()
            for a in amenities:
                HomestayAmenity.objects.create(homestay=instance, amenity=a)
        return instance


class AdminHostMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "full_name")
