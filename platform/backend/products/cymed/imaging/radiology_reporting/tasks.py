"""Critical-finding escalation safety net -- mirrors lab_results.escalate_critical_results."""
from __future__ import annotations

from celery import shared_task
from django.utils import timezone

from .models import CriticalFinding

PENDING_ESCALATION_MINUTES = 30
NOTIFIED_ESCALATION_MINUTES = 15


@shared_task(name="img_reporting.escalate_critical_findings")
def escalate_critical_findings_task() -> int:
    now = timezone.now()
    escalated_count = 0

    pending_cutoff = now - timezone.timedelta(minutes=PENDING_ESCALATION_MINUTES)
    stale_pending = CriticalFinding.objects.filter(
        escalated=False, notification_status="pending", created_at__lt=pending_cutoff
    )
    escalated_count += stale_pending.update(escalated=True)

    notified_cutoff = now - timezone.timedelta(minutes=NOTIFIED_ESCALATION_MINUTES)
    stale_notified = CriticalFinding.objects.filter(
        escalated=False, notification_status="notified", notified_at__lt=notified_cutoff
    )
    escalated_count += stale_notified.update(escalated=True)

    return escalated_count
