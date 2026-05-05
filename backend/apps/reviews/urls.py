from django.urls import path

from apps.reviews import views

urlpatterns = [
    path("", views.ReviewCreateView.as_view(), name="review-create"),
    path("<uuid:id>/", views.ReviewDetailView.as_view(), name="review-detail"),
    path("<uuid:id>/reply/", views.ReviewReplyView.as_view(), name="review-reply"),
    path("<uuid:id>/report/", views.ReviewReportView.as_view(), name="review-report"),
]
