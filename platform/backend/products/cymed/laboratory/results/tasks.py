"""
Critical-result escalation: mandatory-notification workflow safety net.
If a critical lab value sits un-notified or un-acknowledged too long, escalate
it (status -> "escalated") so it surfaces on a supervisor/charge-nurse worklist
instead of quietly aging out.
"""
from __future__ import annotations

from celery import shared_task
from django.utils import timezone

from .models import CriticalResult

PENDING_ESCALATION_MINUTES = 30
NOTIFIED_ESCALATION_MINUTES = 15


@shared_task(name="lab_results.escalate_critical_results")
def escalate_critical_results_task() -> int:
    now = timezone.now()
    escalated_count = 0

    pending_cutoff = now - timezone.timedelta(minutes=PENDING_ESCALATION_MINUTES)
    stale_pending = CriticalResult.objects.filter(
        notification_status="pending", critical_at__lt=pending_cutoff
    )
    escalated_count += stale_pending.update(
        notification_status="escalated", escalated_at=now
    )

    notified_cutoff = now - timezone.timedelta(minutes=NOTIFIED_ESCALATION_MINUTES)
    stale_notified = CriticalResult.objects.filter(
        notification_status="notified", notified_at__lt=notified_cutoff
    )
    escalated_count += stale_notified.update(
        notification_status="escalated", escalated_at=now
    )

    return escalated_count
