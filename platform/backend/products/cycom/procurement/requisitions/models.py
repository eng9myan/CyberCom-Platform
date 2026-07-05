from django.db import models

from platform.common.models import BaseModel


class PurchaseRequisition(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending_approval", "Pending Approval"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("converted", "Converted to PO"),
    ]

    requested_by = models.UUIDField(null=True, blank=True)
    department = models.CharField(max_length=200, blank=True)
    justification = models.TextField(blank=True)
    needed_by = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    approved_by = models.UUIDField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    source_reorder_alert_id = models.UUIDField(
        null=True, blank=True,
        help_text="Set when this requisition was auto-generated from an inventory ReorderAlert.",
    )
    purchase_order_id = models.UUIDField(
        null=True, blank=True,
        help_text="Set once this requisition has been converted into a real PurchaseOrder.",
    )

    class Meta:
        db_table = "cycom_procurement_requisitions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"REQ-{self.id} ({self.status})"


class RequisitionLine(BaseModel):
    requisition = models.ForeignKey(
        PurchaseRequisition, on_delete=models.CASCADE, related_name="lines"
    )
    stock_item_id = models.UUIDField(null=True, blank=True)
    description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    estimated_unit_price = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = "cycom_procurement_requisition_lines"
        ordering = ["created_at"]

    def __str__(self):
        return f"Line {self.id} — REQ {self.requisition_id}"
