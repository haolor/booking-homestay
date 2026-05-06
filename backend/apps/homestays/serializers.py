import cloudinary.uploader
from rest_framework import serializers

from apps.homestays.models import (
    Amenity,
    BlockedDate,
    Homestay,
    HomestayAmenity,
    HomestayImage,
    WishlistItem,
)

#AmenitySerializer: Dùng để hiển thị thông tin tiện ích
class AmenitySerializer(serializers.ModelSerializer):
    #chuẩn bị khuôn
    class Meta:
        model = Amenity
        fields = ("id", "name", "icon", "category")


class HomestayImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomestayImage
        fields = ("id", "url", "cloudinary_public_id", "is_cover", "order", "created_at")
        read_only_fields = ("id", "created_at")

#HomestayListSerializer: Dùng để hiển thị danh sách homestay
class HomestayListSerializer(serializers.ModelSerializer):
    #chuẩn bị khuôn
    cover_url = serializers.SerializerMethodField()
    #chuẩn bị khuôn
    amenities = serializers.SerializerMethodField()

    #chuẩn bị khuôn
    class Meta:
        model = Homestay
        fields = (
            "id",
            "title",
            "city",
            "district",
            "price_per_night",
            "max_guests",
            "type",
            "status",
            "avg_rating",
            "latitude",
            "longitude",
            "cover_url",
            "amenities",
        )

    #Lấy dữ liệu
    def get_cover_url(self, obj):
        img = obj.images.filter(is_cover=True).first() or obj.images.order_by("order").first()
        return img.url if img else None
    
    #Lấy dữ liệu
    def get_amenities(self, obj):
        ids = obj.homestay_amenities.values_list("amenity_id", flat=True)
        return list(map(str, ids))


#HomestayDetailSerializer: Dùng để hiển thị chi tiết homestay
class HomestayDetailSerializer(serializers.ModelSerializer):
    images = HomestayImageSerializer(many=True, read_only=True)
    amenities = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Amenity.objects.all(), write_only=True, required=False
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
            "images",
            "amenities",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("host", "avg_rating", "created_at", "updated_at")

    #Lấy dữ liệu
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["amenities"] = AmenitySerializer(
            Amenity.objects.filter(homestay_links__homestay=instance).distinct(),
            many=True,
        ).data
        return data

    def create(self, validated_data):
        amenities = validated_data.pop("amenities", [])
        validated_data["host"] = self.context["request"].user
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

#HomestayImageWriteSerializer: Dùng để thêm ảnh vào homestay
class HomestayImageWriteSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True, required=True)

    class Meta:
        model = HomestayImage
        fields = ("is_cover", "order", "image")

    def validate(self, attrs):
        homestay = self.context["homestay"]
        count = homestay.images.count()
        if count >= 20:
            raise serializers.ValidationError("Maximum 20 images.")
        return attrs

    def create(self, validated_data):
        image_file = validated_data.pop("image")
        uploaded = cloudinary.uploader.upload(
            image_file,
            folder="homestays",
            resource_type="image",
        )
        validated_data["url"] = uploaded.get("secure_url") or uploaded.get("url")
        validated_data["cloudinary_public_id"] = uploaded.get("public_id", "")
        validated_data["homestay"] = self.context["homestay"]
        img = super().create(validated_data)
        if img.is_cover:
            HomestayImage.objects.filter(homestay=img.homestay).exclude(pk=img.pk).update(
                is_cover=False
            )
        return img

#BlockedDateSerializer: Dùng để thêm ngày bị chặn vào homestay
class BlockedDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedDate
        fields = ("id", "date", "reason")

    def create(self, validated_data):
        validated_data["homestay"] = self.context["homestay"]
        return super().create(validated_data)


#WishlistSerializer: Dùng để thêm homestay vào danh sách yêu thích
class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistItem
        fields = ("id", "homestay", "created_at")
        read_only_fields = ("id", "created_at")
