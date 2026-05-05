from rest_framework import serializers

from apps.conversations.models import Conversation, Message
from apps.homestays.models import Homestay


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "sender", "content", "is_read", "sent_at")
        read_only_fields = ("id", "sender", "is_read", "sent_at")


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ("id", "guest", "host", "homestay", "created_at", "updated_at")
        read_only_fields = ("id", "guest", "host", "created_at", "updated_at")


class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ("homestay",)

    def validate_homestay(self, homestay: Homestay):
        user = self.context["request"].user
        if homestay.host_id == user.id:
            raise serializers.ValidationError(
                "Host cannot start a thread as guest."
            )
        return homestay

    def create(self, validated_data):
        homestay = validated_data["homestay"]
        user = self.context["request"].user
        conv, _ = Conversation.objects.get_or_create(
            guest=user,
            host=homestay.host,
            homestay=homestay,
        )
        return conv
