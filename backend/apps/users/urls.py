from django.urls import path

from apps.users import views

urlpatterns = [
    path("me/", views.UserMeView.as_view(), name="users-me"),
    path("me/avatar/", views.UserAvatarUploadView.as_view(), name="users-me-avatar"),
    path("host/register/", views.HostRegisterView.as_view(), name="users-host-register"),
    path("<uuid:id>/profile/", views.UserProfileDetailView.as_view(), name="users-profile"),
]
