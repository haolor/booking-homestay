from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.authentication.serializers import LogoutSerializer, RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)


class RefreshView(TokenRefreshView):
    permission_classes = (permissions.AllowAny,)


class LogoutView(APIView):
    def post(self, request):
        ser = LogoutSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class EmailVerifyStubView(APIView):
    """Placeholder: mark user verified (real flow sends email)."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        # In production: validate signed token from email link
        request.user.is_verified = True
        request.user.save(update_fields=["is_verified"])
        return Response({"detail": "verified"})


class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        # Stub: would send email with uid/token
        return Response({"detail": "If the email exists, a reset link was sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        return Response({"detail": "not_implemented"}, status=501)


class SocialGoogleStubView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        return Response({"detail": "OAuth Google: configure in Phase 3"}, status=501)
