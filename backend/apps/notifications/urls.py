from django.urls import path

from apps.notifications import views

urlpatterns = [
    path("", views.NotificationListView.as_view(), name="notification-list"),
    path("<uuid:id>/read/", views.NotificationMarkReadView.as_view(), name="notification-read"),
    path("read-all/", views.NotificationReadAllView.as_view(), name="notification-read-all"),
]
