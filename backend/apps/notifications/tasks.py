from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_email_task(subject: str, body: str, to: list[str]):
    if not to:
        return
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        to,
        fail_silently=True,
    )


@shared_task
def notify_user_email(user_id: str, subject: str, body: str):
    from apps.users.models import User

    user = User.objects.filter(id=user_id).first()
    if user and user.email:
        send_email_task.delay(subject, body, [user.email])
