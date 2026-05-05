from django.urls import path

from apps.authentication import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", views.RefreshView.as_view(), name="auth-token-refresh"),
    path("email/verify/", views.EmailVerifyStubView.as_view(), name="auth-email-verify"),
    path("password/reset/", views.PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path(
        "password/reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
    path("social/google/", views.SocialGoogleStubView.as_view(), name="auth-social-google"),
]
