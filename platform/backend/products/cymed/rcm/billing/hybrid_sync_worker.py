"""
Hybrid Edge offline tax sync worker (Phase 7).

Deployment model: this runs as a Celery worker + beat schedule on the SAME
process/container already defined in platform/infrastructure/docker-compose.yml
(celery-worker + celery-beat services) -- there is no separate always-on
"cloud gateway" service to tunnel to. Both the hospital's on-prem deployment
and any cloud deployment run the identical Django project; the worker talks
to ZATCA/JoFotara (or any other country connector registered in
tax_providers.py) directly over HTTPS, the same way the interactive
"Submit to ZATCA/JoFotara" buttons in the billing UI already do. When the
hospital's internet is down, that direct HTTPS call fails at the transport
level -- see zatca.py/jofotara.py's httpx.TransportError handling -- and
this worker is what retries it once connectivity returns.

What does NOT change during an outage: local POS and clinical transactions
keep saving to the local PostgreSQL database the entire time (that's just
normal Django ORM writes against the local instance -- Postgres itself
doesn't require internet). Only the TAX-AUTHORITY-FACING submission step for
JoFotara/ZATCA-eligible invoices is queued; everything else in the app
continues to function.
"""
from __future__ import annotations

import logging

from celery import shared_task
from django.db import transaction

from . import tax_providers
from .models import Invoice, OfflineTaxQueueEntry

log = logging.getLogger(__name__)

MAX_RETRY_COUNT = 20  # ~ several hours at the 5-minute beat interval below before a human gets paged instead


def queue_for_offline_retry(*, invoice: Invoice, provider_code: str, tenant_id, error: str) -> OfflineTaxQueueEntry:
    """
    Called from the interactive submit-to-<provider> view actions
    (views.py) when a submission attempt returns status="offline". Creates
    (or reuses) the queue entry and flags the invoice as pending clearance
    on the local UI, per the "hospital offline" requirement -- this is the
    literal function that makes JoFotara/ZATCA-eligible invoices show
    "Pending Government Clearance" instead of silently failing.
    """
    provider = tax_providers.get_provider(provider_code)
    if provider is None:
        raise ValueError(f"Unknown tax provider code: {provider_code}")

    entry = OfflineTaxQueueEntry.objects.filter(
        tenant_id=tenant_id, invoice=invoice, provider_code=provider_code, status__in=["queued", "retrying"],
    ).first()
    if entry is None:
        entry = OfflineTaxQueueEntry.objects.create(
            tenant_id=tenant_id, invoice=invoice, provider_code=provider_code, status="queued", last_error=error,
        )
    else:
        entry.last_error = error
        entry.save(update_fields=["last_error", "updated_at"])

    status_fields = provider.status_field_names()
    setattr(invoice, status_fields.status, "pending_clearance")
    setattr(invoice, status_fields.error, error)
    invoice.save(update_fields=[status_fields.status, status_fields.error, "updated_at"])

    return entry


@shared_task(name="rcm_billing.retry_offline_tax_queue", bind=True)
def retry_offline_tax_queue(self):
    """
    Celery Beat periodic task -- the actual "hybrid sync worker" logic.
    Runs every 5 minutes (see CELERY_BEAT_SCHEDULE in core/settings.py).
    Every queued/retrying entry is a genuine retry attempt against the real
    provider API, not a connectivity ping followed by a separate submit --
    a successful attempt IS the connectivity check.
    """
    from products.cymed.commercial.compliance_settings.models import TenantComplianceSettings

    processed = {"submitted": 0, "still_offline": 0, "failed_permanent": 0, "skipped": 0}

    entries = OfflineTaxQueueEntry.objects.filter(status__in=["queued", "retrying"]).select_related("invoice")
    for entry in entries:
        provider = tax_providers.get_provider(entry.provider_code)
        if provider is None:
            log.warning("Offline tax queue entry %s references unknown provider '%s'", entry.id, entry.provider_code)
            processed["skipped"] += 1
            continue

        try:
            compliance_settings = TenantComplianceSettings.objects.get(tenant_id=entry.tenant_id)
        except TenantComplianceSettings.DoesNotExist:
            processed["skipped"] += 1
            continue

        if not provider.is_enabled(compliance_settings):
            # Tenant turned the provider off since queuing -- stop retrying,
            # leave the queue entry for a human to look at rather than
            # silently deleting evidence of it.
            entry.status = "failed_permanent"
            entry.last_error = f"{provider.code} was disabled for this tenant while queued."
            entry.save(update_fields=["status", "last_error", "updated_at"])
            processed["failed_permanent"] += 1
            continue

        previous_invoice = (
            Invoice.objects.filter(tenant_id=entry.tenant_id)
            .exclude(pk=entry.invoice_id)
            .order_by("-created_at")
            .first()
        )
        device_counter = OfflineTaxQueueEntry.objects.filter(tenant_id=entry.tenant_id, status="submitted").count() + 1

        result = provider.submit(entry.invoice, compliance_settings, previous_invoice=previous_invoice, device_counter=device_counter)

        with transaction.atomic():
            changed_fields = provider.apply_result(entry.invoice, result)
            entry.invoice.save(update_fields=changed_fields + ["updated_at"])

            entry.last_attempted_at = entry.invoice.updated_at
            entry.retry_count += 1

            if result["status"] == "submitted":
                entry.status = "submitted"
                entry.submitted_at = entry.invoice.updated_at
                processed["submitted"] += 1
            elif result["status"] == "offline":
                entry.status = "retrying"
                entry.last_error = result.get("error", "")
                if entry.retry_count >= MAX_RETRY_COUNT:
                    # Connectivity has been down long enough that this needs
                    # a human, not another silent retry.
                    entry.status = "failed_permanent"
                    entry.last_error += " (max retries reached -- needs manual attention, possibly a real outage or a misconfigured endpoint, not just a transient blip)"
                    processed["failed_permanent"] += 1
                else:
                    processed["still_offline"] += 1
            else:  # genuine rejection -- not retryable by resubmission
                entry.status = "failed_permanent"
                entry.last_error = result.get("error", result.get("reason", ""))
                processed["failed_permanent"] += 1

            entry.save(update_fields=["status", "last_attempted_at", "retry_count", "last_error", "submitted_at", "updated_at"])

    log.info("hybrid_sync_worker.retry_offline_tax_queue: %s", processed)
    return processed
