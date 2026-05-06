from datetime import datetime

from django.http import Http404
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import (
    IsHomestayOwner,
    IsHost,
    IsOwnerOfHomestayInUrl,
)
from apps.homestays.availability import dates_blocked_for_homestay, is_range_available
from apps.homestays.filters import HomestayFilter
from apps.homestays.models import Homestay, HomestayImage
from apps.homestays.serializers import (
    BlockedDateSerializer,
    HomestayDetailSerializer,
    HomestayImageWriteSerializer,
    HomestayListSerializer,
    WishlistSerializer,
)
from apps.reviews.serializers import ReviewListSerializer
from apps.users.models import User


class HomestayListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend]
    filterset_class = HomestayFilter

    #Truy vấn dữ liệu
    def get_queryset(self):
        user = self.request.user
        mine = self.request.query_params.get("mine")
        if user.is_authenticated and mine == "1" and user.role in (
            User.Role.HOST,
            User.Role.ADMIN,
        ):
            return (
                Homestay.objects.filter(host=user)
                .select_related("host")
                .prefetch_related("images", "homestay_amenities")
            )
        return (
            Homestay.objects.filter(status=Homestay.Status.PUBLISHED)
            .select_related("host")
            .prefetch_related("images", "homestay_amenities")
        )

    #chuẩn bị khuôn
    def get_serializer_class(self):
        if self.request.method == "POST":
            return HomestayDetailSerializer
        return HomestayListSerializer

    #xác thực quyền hạn
    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsHost()]
        return [permissions.AllowAny()]

    #Thêm dữ liệu
    def perform_create(self, serializer):
        serializer.save(host=self.request.user)


class HomestayDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = "id"
    #truy vấn dữ liệu
    def get_queryset(self):
        return Homestay.objects.all().prefetch_related(
            "images", "homestay_amenities__amenity"
        )

    #chuẩn bị khuôn
    def get_serializer_class(self):
        return HomestayDetailSerializer

    #xác thực quyền hạn
    def get_permissions(self):
        if self.request.method in ("GET",):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsHomestayOwner()]

    #Lấy dữ liệu
    def get_object(self):
        obj = super().get_object()
        if self.request.method == "GET" and obj.status != Homestay.Status.PUBLISHED:
            user = self.request.user
            if not user.is_authenticated or (
                user != obj.host and user.role != User.Role.ADMIN
            ):
                raise Http404()
        return obj

    #Xóa dữ liệu
    def perform_destroy(self, instance):
        from apps.bookings.models import Booking

        active = instance.bookings.filter(
            status__in=[
                Booking.Status.PENDING,
                Booking.Status.AWAITING_PAYMENT,
                Booking.Status.CONFIRMED,
            ]
        ).exists()
        if active:
            raise ValidationError("Cannot delete homestay with active bookings.")
        instance.delete()


class HomestayAvailabilityView(APIView):
    permission_classes = (permissions.AllowAny,)

    #Lấy dữ liệu
    def get(self, request, id):
        homestay = get_object_or_404(Homestay, id=id)
        check_in = request.query_params.get("check_in")
        check_out = request.query_params.get("check_out")
        if check_in and check_out:
            try:
                ci = datetime.strptime(check_in, "%Y-%m-%d").date()
                co = datetime.strptime(check_out, "%Y-%m-%d").date()
            except ValueError as exc:
                raise ValidationError("Invalid date format, use YYYY-MM-DD") from exc
            ok = is_range_available(homestay.id, ci, co)
            return Response({"available": ok})
        blocked = sorted(dates_blocked_for_homestay(homestay.id))
        return Response({"blocked_dates": [d.isoformat() for d in blocked]})


class HomestayImageListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated, IsHost, IsOwnerOfHomestayInUrl)
    parser_classes = (MultiPartParser, FormParser)

    #Lấy dữ liệu
    def get_homestay(self):
        return get_object_or_404(Homestay, id=self.kwargs["id"])

    #Truy vấn dữ liệu
    def get_queryset(self):
        return self.get_homestay().images.all()

    #chuẩn bị khuôn
    def get_serializer_class(self):
        if self.request.method == "POST":
            return HomestayImageWriteSerializer
        from apps.homestays.serializers import HomestayImageSerializer

        return HomestayImageSerializer

    #truyền dữ liệu vào khuôn
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["homestay"] = self.get_homestay()
        return ctx

    #Thêm dữ liệu
    def perform_create(self, serializer):
        serializer.save(homestay=self.get_homestay())


class HomestayImageDeleteView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated, IsHomestayOwner)
    lookup_field = "img_id"
    lookup_url_kwarg = "img_id"

    def get_queryset(self):
        h = get_object_or_404(Homestay, id=self.kwargs["id"])
        return HomestayImage.objects.filter(homestay=h)


class BlockedDateListCreateView(generics.ListCreateAPIView):
    serializer_class = BlockedDateSerializer
    permission_classes = (permissions.IsAuthenticated, IsHost, IsOwnerOfHomestayInUrl)

    def get_homestay(self):
        return get_object_or_404(Homestay, id=self.kwargs["id"])

    #Truy vấn dữ liệu
    def get_queryset(self):
        return self.get_homestay().blocked_dates.all()

    #truyền dữ liệu vào khuôn
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["homestay"] = self.get_homestay()
        return ctx

    def perform_create(self, serializer):
        serializer.save(homestay=self.get_homestay())


class HomestayReviewsListView(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = ReviewListSerializer

    def get_queryset(self):
        from apps.reviews.models import Review

        return Review.objects.filter(homestay_id=self.kwargs["id"]).select_related(
            "reviewer"
        )


class WishlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        from apps.homestays.models import WishlistItem

        return WishlistItem.objects.filter(user=self.request.user).select_related(
            "homestay"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WishlistDeleteView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        from apps.homestays.models import WishlistItem

        return get_object_or_404(
            WishlistItem,
            user=self.request.user,
            homestay_id=self.kwargs["homestay_id"],
        )
