from django.urls import path

from apps.admin_api import views

urlpatterns = [
    path("dashboard/", views.AdminDashboardView.as_view(), name="admin-dashboard"),
    path("hosts/", views.AdminHostListView.as_view(), name="admin-hosts"),
    path("amenities/", views.AdminAmenityListView.as_view(), name="admin-amenities"),
    path("homestays/", views.AdminHomestayListCreateView.as_view(), name="admin-homestays"),
    path(
        "homestays/<uuid:id>/",
        views.AdminHomestayDetailView.as_view(),
        name="admin-homestay-detail",
    ),
]
