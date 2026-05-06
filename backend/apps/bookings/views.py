from datetime import timedelta
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.bookings.serializers import BookingCreateSerializer, BookingSerializer
from apps.core.permissions import IsAdmin, IsBookingGuestOrHost
from apps.users.models import User


class BookingListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "POST":
            return BookingCreateSerializer
        return BookingSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Booking.objects.none()
        user = self.request.user
        if not user.is_authenticated:
            return Booking.objects.none()
        if user.role == User.Role.ADMIN:
            qs = Booking.objects.all().select_related("homestay", "guest")
            st = self.request.query_params.get("status")
            if st:
                qs = qs.filter(status=st)
            hid = self.request.query_params.get("homestay")
            if hid:
                qs = qs.filter(homestay_id=hid)
            return qs
        if user.role == User.Role.HOST:
            return Booking.objects.filter(homestay__host=user).select_related(
                "homestay", "guest"
            )
        return Booking.objects.filter(guest=user).select_related("homestay", "guest")

    def perform_create(self, serializer):
        if self.request.user.role == User.Role.ADMIN:
            raise PermissionDenied("Admins cannot create bookings.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        booking = serializer.instance
        output = BookingSerializer(booking, context={"request": request})
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = (permissions.IsAuthenticated, IsBookingGuestOrHost)
    lookup_field = "id"

    def get_queryset(self):
        return Booking.objects.all().select_related("homestay", "guest")


class BookingConfirmView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        booking = get_object_or_404(Booking, id=id)
        if booking.homestay.host_id != request.user.id and request.user.role != User.Role.ADMIN:
            raise PermissionDenied()
        if booking.status != Booking.Status.PENDING:
            raise ValidationError("Invalid state for confirm.")
        now = timezone.now()
        booking.status = Booking.Status.AWAITING_PAYMENT
        booking.host_confirmed_at = now
        booking.payment_deadline_at = now + timedelta(hours=2)
        booking.save(
            update_fields=[
                "status",
                "host_confirmed_at",
                "payment_deadline_at",
                "updated_at",
            ]
        )
        return Response(BookingSerializer(booking).data)


class BookingRejectView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        booking = get_object_or_404(Booking, id=id)
        if booking.homestay.host_id != request.user.id and request.user.role != User.Role.ADMIN:
            raise PermissionDenied()
        if booking.status != Booking.Status.PENDING:
            raise ValidationError("Invalid state for reject.")
        booking.status = Booking.Status.REJECTED
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingSerializer(booking).data)


class BookingCancelView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        booking = get_object_or_404(Booking, id=id)
        user = request.user
        if booking.guest_id != user.id and booking.homestay.host_id != user.id and user.role != User.Role.ADMIN:
            raise PermissionDenied()
        if booking.status in (
            Booking.Status.CANCELLED,
            Booking.Status.COMPLETED,
            Booking.Status.REJECTED,
        ):
            raise ValidationError("Cannot cancel this booking.")
        # Guests can cancel within 30 minutes after booking creation.
        if user.role != User.Role.ADMIN and booking.guest_id == user.id:
            if timezone.now() > booking.created_at + timedelta(minutes=30):
                raise ValidationError("You can only cancel within 30 minutes after booking.")
        reason = request.data.get("reason", "")
        booking.status = Booking.Status.CANCELLED
        booking.cancellation_reason = reason
        booking.cancelled_by = user
        booking.save(
            update_fields=[
                "status",
                "cancellation_reason",
                "cancelled_by",
                "updated_at",
            ]
        )
        return Response(BookingSerializer(booking).data)


class BookingCheckinView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        booking = get_object_or_404(Booking, id=id)
        if booking.homestay.host_id != request.user.id and request.user.role != User.Role.ADMIN:
            raise PermissionDenied()
        if booking.status != Booking.Status.CONFIRMED:
            raise ValidationError("Booking must be confirmed.")
        
        now = timezone.now()
        today = timezone.localdate()
        
        booking.checked_in_at = now
        # Nếu ngày trả phòng đã qua rồi (so với hôm nay) thì hoàn thành luôn
        if today > booking.check_out_date:
            booking.status = Booking.Status.COMPLETED
        else:
            booking.status = Booking.Status.CHECKED_IN
            
        booking.save(update_fields=["status", "checked_in_at", "updated_at"])
        return Response(BookingSerializer(booking).data)


class HostRevenueView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Role.HOST and request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only hosts can view revenue.")
        
        # Base queryset for revenue-generating bookings
        # As requested: payment (confirmed), checked-in, and completed are all added to revenue
        qs = Booking.objects.filter(
            status__in=[
                Booking.Status.CONFIRMED,
                Booking.Status.CHECKED_IN,
                Booking.Status.COMPLETED
            ]
        )
        
        if request.user.role == User.Role.HOST:
            qs = qs.filter(homestay__host=request.user)
            
        total_revenue = qs.aggregate(total=Sum('total_price'))['total'] or 0
        total_bookings = qs.count()
        
        # Monthly revenue
        monthly_stats = qs.annotate(month=TruncMonth('created_at')) \
            .values('month') \
            .annotate(revenue=Sum('total_price'), count=Count('id')) \
            .order_by('month')
            
        # Revenue by homestay
        homestay_stats = qs.values('homestay__id', 'homestay__title') \
            .annotate(revenue=Sum('total_price'), count=Count('id')) \
            .order_by('-revenue')
            
        return Response({
            "total_revenue": float(total_revenue),
            "total_bookings": total_bookings,
            "monthly_stats": [
                {
                    "month": item['month'].strftime('%Y-%m'),
                    "revenue": float(item['revenue']),
                    "count": item['count']
                } for item in monthly_stats
            ],
            "homestay_stats": [
                {
                    "homestay_id": item['homestay__id'],
                    "homestay_name": item['homestay__title'],
                    "revenue": float(item['revenue']),
                    "count": item['count']
                } for item in homestay_stats
            ]
        })
