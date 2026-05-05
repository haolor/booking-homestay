from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.reviews.models import Review, ReviewReport
from apps.reviews.serializers import (
    ReviewCreateSerializer,
    ReviewListSerializer,
    ReviewReplySerializer,
)


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewCreateSerializer
    permission_classes = (permissions.IsAuthenticated,)


class ReviewDetailView(generics.RetrieveAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewListSerializer
    lookup_field = "id"
    permission_classes = (permissions.AllowAny,)


class ReviewReplyView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        review = get_object_or_404(Review, id=id)
        homestay = review.homestay
        if homestay.host_id != request.user.id and request.user.role != User.Role.ADMIN:
            return Response(status=status.HTTP_403_FORBIDDEN)
        ser = ReviewReplySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.update(review, ser.validated_data)
        return Response(ReviewListSerializer(review).data)


class ReviewReportView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, id):
        review = get_object_or_404(Review, id=id)
        reason = request.data.get("reason", "")
        ReviewReport.objects.create(review=review, reporter=request.user, reason=reason)
        review.reported = True
        review.save(update_fields=["reported"])
        return Response({"detail": "reported"})
