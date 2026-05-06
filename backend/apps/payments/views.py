import json
from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.payments.models import Payment
from apps.users.models import User
from apps.payments.serializers import PaymentCreateSerializer, PaymentSerializer


#PaymentCreateView: Tạo thanh toán
class PaymentCreateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        ser = PaymentCreateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        booking = ser.validated_data["booking"]
        method = ser.validated_data["method"]
        if method != Payment.Method.VNPAY:
            return Response(
                {"detail": "Only vnpay implemented in MVP backend."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment, _ = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                "amount": booking.total_price,
                "method": method,
                "status": Payment.Status.PENDING,
            },
        )
        if payment.status == Payment.Status.SUCCESS:
            return Response({"detail": "Already paid.", "payment": PaymentSerializer(payment).data})
        
        # Môi trường giả lập (Mock)
        if settings.VNPAY_MOCK_ENABLED:
            query = urlencode({"mock": "1", "payment_id": str(payment.id)})
            redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/payment/vnpay-return?{query}"
            return Response(
                {
                    "redirect_url": redirect_url,
                    "payment": PaymentSerializer(payment).data,
                    "mock": True,
                }
            )
        
        return Response(
            {"detail": "VNPAY_MOCK_ENABLED is false. Real VNPay not configured or disabled."},
            status=status.HTTP_400_BAD_REQUEST
        )

#VNPayReturnView: Trả về kết quả thanh toán VNPay
class VNPayReturnView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        if settings.VNPAY_MOCK_ENABLED and request.query_params.get("mock") == "1":
            payment_id = request.query_params.get("payment_id") or request.query_params.get(
                "vnp_TxnRef"
            )
            payment = get_object_or_404(Payment, id=payment_id)
            payment.status = Payment.Status.SUCCESS
            payment.transaction_id = payment.transaction_id or f"MOCK-{payment.id}"
            payment.paid_at = timezone.now()
            payment.raw_response = json.loads(json.dumps(dict(request.query_params)))
            payment.save(
                update_fields=[
                    "status",
                    "transaction_id",
                    "paid_at",
                    "raw_response",
                    "updated_at",
                ]
            )
            booking = payment.booking
            if booking.status == Booking.Status.AWAITING_PAYMENT:
                booking.status = Booking.Status.CONFIRMED
                booking.save(update_fields=["status", "updated_at"])
            return Response({"mock": True, "payment": PaymentSerializer(payment).data})

        return Response({"detail": "Mock environment not enabled or invalid request"}, status=400)

#PaymentByBookingView: Lấy thông tin thanh toán theo booking
class PaymentByBookingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.guest_id != request.user.id and booking.homestay.host_id != request.user.id:
            if request.user.role != User.Role.ADMIN:
                return Response(status=403)
        payment = Payment.objects.filter(booking=booking).first()
        if not payment:
            return Response({"detail": "no payment"}, status=404)
        return Response(PaymentSerializer(payment).data)
