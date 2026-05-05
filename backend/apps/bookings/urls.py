from django.urls import path

from apps.bookings import views

urlpatterns = [
    path("", views.BookingListCreateView.as_view(), name="booking-list"),
    path("<uuid:id>/", views.BookingDetailView.as_view(), name="booking-detail"),
    path("<uuid:id>/confirm/", views.BookingConfirmView.as_view(), name="booking-confirm"),
    path("<uuid:id>/reject/", views.BookingRejectView.as_view(), name="booking-reject"),
    path("<uuid:id>/cancel/", views.BookingCancelView.as_view(), name="booking-cancel"),
    path("<uuid:id>/checkin/", views.BookingCheckinView.as_view(), name="booking-checkin"),
]
