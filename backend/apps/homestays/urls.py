from django.urls import path

from apps.homestays import views

urlpatterns = [
    path("wishlist/", views.WishlistListCreateView.as_view(), name="wishlist-list"),
    path(
        "wishlist/<uuid:homestay_id>/",
        views.WishlistDeleteView.as_view(),
        name="wishlist-delete",
    ),
    path("", views.HomestayListCreateView.as_view(), name="homestay-list"),
    path("<uuid:id>/", views.HomestayDetailView.as_view(), name="homestay-detail"),
    path(
        "<uuid:id>/availability/",
        views.HomestayAvailabilityView.as_view(),
        name="homestay-availability",
    ),
    path(
        "<uuid:id>/images/",
        views.HomestayImageListCreateView.as_view(),
        name="homestay-images",
    ),
    path(
        "<uuid:id>/images/<uuid:img_id>/",
        views.HomestayImageDeleteView.as_view(),
        name="homestay-image-delete",
    ),
    path(
        "<uuid:id>/block-dates/",
        views.BlockedDateListCreateView.as_view(),
        name="homestay-block-dates",
    ),
    path(
        "<uuid:id>/reviews/",
        views.HomestayReviewsListView.as_view(),
        name="homestay-reviews",
    ),
]
