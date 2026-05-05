from django.urls import path

from apps.payments import views

urlpatterns = [
    path("create/", views.PaymentCreateView.as_view(), name="payment-create"),
    path("vnpay/return/", views.VNPayReturnView.as_view(), name="payment-vnpay-return"),
    path("stripe/webhook/", views.StripeWebhookView.as_view(), name="payment-stripe-webhook"),
    path("<uuid:booking_id>/", views.PaymentByBookingView.as_view(), name="payment-by-booking"),
]
