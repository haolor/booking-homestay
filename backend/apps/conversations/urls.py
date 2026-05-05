from django.urls import path

from apps.conversations import views

urlpatterns = [
    path("", views.ConversationListCreateView.as_view(), name="conversation-list"),
    path(
        "<uuid:id>/messages/",
        views.MessageListCreateView.as_view(),
        name="conversation-messages",
    ),
]
