from django.shortcuts import get_object_or_404
from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.users.models import User


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class IsHost(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in (User.Role.HOST, User.Role.ADMIN)
        )


class IsGuestRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
        )


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


class IsHomestayOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == User.Role.ADMIN:
            return True
        host = getattr(obj, "host", None)
        if host is None and hasattr(obj, "homestay"):
            host = getattr(obj.homestay, "host", None)
        return host == request.user


class IsOwnerOfHomestayInUrl(BasePermission):
    """For nested routes `/homestays/{id}/...` — only host (or admin) of that homestay."""

    def has_permission(self, request, view):
        from apps.homestays.models import Homestay

        hid = view.kwargs.get("id")
        if not hid:
            return True
        homestay = get_object_or_404(Homestay, id=hid)
        if request.user.role == User.Role.ADMIN:
            return True
        return homestay.host_id == request.user.id


class IsBookingGuestOrHost(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == User.Role.ADMIN:
            return True
        return obj.guest_id == request.user.id or obj.homestay.host_id == request.user.id
