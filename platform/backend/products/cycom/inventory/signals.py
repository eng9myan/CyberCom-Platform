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
        stock_item=stock_item, status__in=["open", "requisitioned"]
    ).exists()
    if already_open:
        return

    suggested_quantity = max(stock_item.par_level - stock_item.quantity, 0)
    alert = ReorderAlert.objects.create(
        tenant_id=stock_item.tenant_id,
        stock_item=stock_item,
        quantity_at_trigger=stock_item.quantity,
        reorder_level_at_trigger=stock_item.reorder_level,
        suggested_order_quantity=suggested_quantity,
        status="open",
    )
    _create_requisition_for_alert(stock_item, alert, suggested_quantity)


def _create_requisition_for_alert(stock_item, alert: ReorderAlert, suggested_quantity):
    from products.cycom.procurement.requisitions.models import (
        PurchaseRequisition,
        RequisitionLine,
    )

    requisition = PurchaseRequisition.objects.create(
        tenant_id=stock_item.tenant_id,
        department="Inventory / Auto-Reorder",
        justification=(
            f"Auto-generated: {stock_item.sku} ({stock_item.name}) fell to "
            f"{stock_item.quantity} {stock_item.unit}, at/below reorder level "
            f"{stock_item.reorder_level}."
        ),
        status="pending_approval",
        source_reorder_alert_id=alert.id,
    )
    RequisitionLine.objects.create(
        tenant_id=stock_item.tenant_id,
        requisition=requisition,
        stock_item_id=stock_item.id,
        description=f"{stock_item.sku} - {stock_item.name}",
        quantity=suggested_quantity,
        estimated_unit_price=stock_item.unit_cost,
    )
    alert.status = "requisitioned"
    alert.requisition_id = requisition.id
    alert.save(update_fields=["status", "requisition_id"])
