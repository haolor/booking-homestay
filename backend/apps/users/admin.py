from django.contrib import admin

from apps.users.models import HostProfile, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "role", "is_staff", "is_active")
    ordering = ("email",)
    search_fields = ("email", "full_name")
    fieldsets = (
        (None, {"fields": ("email",)}),
        ("Profile", {"fields": ("full_name", "phone_number", "avatar", "role")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "is_verified")},
        ),
    )
    list_filter = ("role", "is_active", "is_staff")


@admin.register(HostProfile)
class HostProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "is_superhost", "pending_verification")
