from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.serializers import (
    HostRegisterSerializer,
    UserMeSerializer,
    UserPublicSerializer,
)


class UserMeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserMeSerializer

    def get_object(self):
        return self.request.user


class UserAvatarUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        # MVP: return URL placeholder; production uses Cloudinary direct upload from FE or server
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "file required"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.avatar = f"https://res.cloudinary.com/demo/image/upload/{file.name}"
        request.user.save(update_fields=["avatar"])
        return Response(UserMeSerializer(request.user).data)


class HostRegisterView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = HostRegisterSerializer

    def post(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)


class UserProfileDetailView(generics.RetrieveAPIView):
    permission_classes = (permissions.AllowAny,)
    queryset = User.objects.all()
    serializer_class = UserPublicSerializer
    lookup_field = "id"
