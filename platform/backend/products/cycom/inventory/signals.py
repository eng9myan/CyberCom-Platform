from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ReorderAlert, StockMovement


@receiver(post_save, sender=StockMovement)
def trigger_reorder_alert(sender, instance: StockMovement, created, **kwargs):
    if not created:
        return

    stock_item = instance.stock_item
    stock_item.refresh_from_db(fields=["quantity", "reorder_level", "par_level"])

    if not stock_item.needs_reorder:
        return

    already_open = ReorderAlert.objects.filter(
        stock_item=stock_item, status="open"
    ).exists()
    if already_open:
        return

    suggested_quantity = max(stock_item.par_level - stock_item.quantity, 0)
    ReorderAlert.objects.create(
        tenant_id=stock_item.tenant_id,
        stock_item=stock_item,
        quantity_at_trigger=stock_item.quantity,
        reorder_level_at_trigger=stock_item.reorder_level,
        suggested_order_quantity=suggested_quantity,
        status="open",
    )
