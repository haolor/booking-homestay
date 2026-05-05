from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "expire-pending-bookings": {
        "task": "apps.bookings.tasks.expire_pending_bookings",
        "schedule": crontab(minute="*/15"),
    },
    "expire-awaiting-payment": {
        "task": "apps.bookings.tasks.expire_awaiting_payment",
        "schedule": crontab(minute="*/15"),
    },
    "auto-complete-bookings": {
        "task": "apps.bookings.tasks.auto_complete_bookings",
        "schedule": crontab(hour=1, minute=0),
    },
}
