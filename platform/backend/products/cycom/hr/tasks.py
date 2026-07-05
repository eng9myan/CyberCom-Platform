from __future__ import annotations

from datetime import date

from celery import shared_task

from .models import ClinicalCredential


@shared_task(name="cycom_hr.expire_clinical_credentials")
def expire_clinical_credentials_task() -> int:
    """Flip any active clinical credential past its expiry_date to 'expired'."""
    return ClinicalCredential.objects.filter(
        status="active", expiry_date__lt=date.today()
    ).update(status="expired")
