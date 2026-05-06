from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Max, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.admin_api.serializers import (
    AdminCustomerMiniSerializer,
    AdminHomestayListSerializer,
    AdminHomestaySerializer,
    AdminHostMiniSerializer,
)
from apps.bookings.models import Booking
from apps.core.permissions import IsAdmin
from apps.homestays.models import Amenity, Homestay
from apps.homestays.serializers import AmenitySerializer
from apps.payments.models import Payment
from apps.users.models import User


class AdminDashboardView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdmin)

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)

        bookings_qs = Booking.objects.filter(created_at__gte=month_start)
        # Only count realized revenue from active stays.
        # If a paid booking is later cancelled, it should be excluded.
        revenue = Payment.objects.filter(
            status=Payment.Status.SUCCESS,
            paid_at__gte=month_start,
            booking__status__in=[
                Booking.Status.CONFIRMED,
                Booking.Status.CHECKED_IN,
                Booking.Status.COMPLETED
            ],
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

        bookings_by_status = dict(
            Booking.objects.values("status").annotate(c=Count("id")).values_list("status", "c")
        )
        homestays_by_status = dict(
            Homestay.objects.values("status").annotate(c=Count("id")).values_list("status", "c")
        )

        day_counts = (
            Booking.objects.filter(created_at__gte=week_start)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(c=Count("id"))
            .order_by("day")
        )
        bookings_per_day = [
            {"date": row["day"].isoformat() if row["day"] else None, "count": row["c"]}
            for row in day_counts
        ]

        return Response(
            {
                "bookings_month": bookings_qs.count(),
                "cancellations_month": bookings_qs.filter(status=Booking.Status.CANCELLED).count(),
                "revenue_month": str(revenue),
                "users_total": User.objects.count(),
                "homestays_total": Homestay.objects.count(),
                "homestays_published": Homestay.objects.filter(status=Homestay.Status.PUBLISHED).count(),
                "bookings_pending_payment": Booking.objects.filter(
                    status=Booking.Status.AWAITING_PAYMENT
                ).count(),
                "bookings_by_status": bookings_by_status,
                "homestays_by_status": homestays_by_status,
                "bookings_per_day_last_week": bookings_per_day,
            }
        )


class AdminHostListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated, IsAdmin)
    serializer_class = AdminHostMiniSerializer
    pagination_class = None
    queryset = User.objects.filter(role=User.Role.HOST, is_active=True).order_by("email")


class AdminCustomerListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated, IsAdmin)
    serializer_class = AdminCustomerMiniSerializer
    pagination_class = None

    def get_queryset(self):
        return (
            User.objects.filter(role=User.Role.GUEST)
            .annotate(
                booking_count=Count("guest_bookings", distinct=True),
                last_booking_at=Max("guest_bookings__created_at"),
            )
            .order_by("-date_joined")
        )


class AdminAmenityListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated, IsAdmin)
    serializer_class = AmenitySerializer
    pagination_class = None
    queryset = Amenity.objects.all().order_by("category", "name")


class AdminHomestayListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated, IsAdmin)
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "type", "pending_admin_review", "host"]
    search_fields = ["title", "city", "address", "district"]
    ordering_fields = ["created_at", "price_per_night", "title", "avg_rating"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Homestay.objects.select_related("host").prefetch_related("images")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminHomestaySerializer
        return AdminHomestayListSerializer


class AdminHomestayDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated, IsAdmin)
    lookup_field = "id"
    serializer_class = AdminHomestaySerializer

    def get_queryset(self):
        return Homestay.objects.select_related("host").prefetch_related(
            "images", "homestay_amenities__amenity"
        )

    def perform_destroy(self, instance):
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
