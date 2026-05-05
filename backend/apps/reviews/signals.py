from decimal import Decimal

from django.db.models import Avg
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.homestays.models import Homestay
from apps.reviews.models import Review


@receiver(post_save, sender=Review)
@receiver(post_delete, sender=Review)
def update_homestay_avg_rating(sender, instance, **kwargs):
    homestay_id = getattr(instance, "homestay_id", None)
    if homestay_id is None and hasattr(instance, "homestay"):
        homestay_id = instance.homestay_id
    if not homestay_id:
        return
    agg = Review.objects.filter(homestay_id=homestay_id).aggregate(
        avg=Avg("rating_overall")
    )
    avg = agg["avg"] or Decimal("0")
    Homestay.objects.filter(pk=homestay_id).update(avg_rating=avg.quantize(Decimal("0.01")))
