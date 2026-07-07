"""
FEFO expiry-watch: scans batch-tracked stock for lots expiring within the
next 60 days (with stock still on hand) and raises an in-app notification
per batch, using the real platform.notifications.Notification model rather
than a bespoke "SystemNotification" model that doesn't exist anywhere in
this codebase (see StockBatch/StockMovement in models.py for the FEFO
enforcement this feeds off of).
"""
from __future__ import annotations

from celery import shared_task
from django.utils import timezone

from platform.notifications.models import NotificationChannel
from platform.notifications.services import NotificationService

from .models import StockBatch

EXPIRY_WATCH_WINDOW_DAYS = 60
# Notification queue is a role, not a specific user id -- StockBatch has no
# per-tenant "who owns pharmacy inventory alerts" field to target instead;
# the in-app channel's _deliver_in_app() just logs recipient_id today, so
# this is a real placeholder for wherever a role-routing table lands later.
INVENTORY_ALERT_RECIPIENT_ID = "role:inventory-managers"


@shared_task(name="inventory.notify_expiring_batches")
def notify_expiring_batches_task() -> int:
    cutoff = timezone.now().date() + timezone.timedelta(days=EXPIRY_WATCH_WINDOW_DAYS)
    expiring = StockBatch.objects.filter(
        expiry_date__lte=cutoff, expiry_date__gte=timezone.now().date(), quantity_on_hand__gt=0
    ).select_related("stock_item")

    notified_count = 0
    for batch in expiring:
        days_remaining = (batch.expiry_date - timezone.now().date()).days
        NotificationService.send(
            tenant_id=batch.tenant_id,
            recipient_id=INVENTORY_ALERT_RECIPIENT_ID,
            recipient_address="",
            channel=NotificationChannel.IN_APP,
            subject=f"Batch expiring in {days_remaining} day(s): {batch.stock_item.sku}",
            body=(
                f"{batch.stock_item.name} ({batch.stock_item.sku}) batch {batch.batch_number} "
                f"expires {batch.expiry_date.isoformat()} with {batch.quantity_on_hand} "
                f"{batch.stock_item.unit} still on hand. FEFO requires this lot be dispensed "
                f"before any newer batch of the same item."
            ),
            metadata={
                "stock_item_id": str(batch.stock_item_id),
                "stock_batch_id": str(batch.id),
                "batch_number": batch.batch_number,
                "expiry_date": batch.expiry_date.isoformat(),
                "days_remaining": days_remaining,
                "quantity_on_hand": str(batch.quantity_on_hand),
            },
        )
        notified_count += 1

    return notified_count
