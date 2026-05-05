from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions

from apps.conversations.models import Conversation, Message
from apps.conversations.serializers import (
    ConversationCreateSerializer,
    ConversationSerializer,
    MessageSerializer,
)
from apps.users.models import User


class ConversationListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Conversation.objects.none()
        u = self.request.user
        if not u.is_authenticated:
            return Conversation.objects.none()
        return Conversation.objects.filter(Q(guest=u) | Q(host=u)).distinct()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ConversationCreateSerializer
        return ConversationSerializer


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_conversation(self):
        conv = get_object_or_404(Conversation, id=self.kwargs["id"])
        u = self.request.user
        if conv.guest_id != u.id and conv.host_id != u.id and u.role != User.Role.ADMIN:
            self.permission_denied(self.request)
        return conv

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Message.objects.none()
        return self.get_conversation().messages.all()

    def perform_create(self, serializer):
        conv = self.get_conversation()
        serializer.save(conversation=conv, sender=self.request.user)
