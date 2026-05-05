import django_filters

from apps.homestays.models import Homestay


class HomestayFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price_per_night", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price_per_night", lookup_expr="lte")
    city = django_filters.CharFilter(field_name="city", lookup_expr="icontains")
    min_rating = django_filters.NumberFilter(field_name="avg_rating", lookup_expr="gte")
    guests = django_filters.NumberFilter(field_name="max_guests", lookup_expr="gte")

    class Meta:
        model = Homestay
        fields = ["type", "city"]
