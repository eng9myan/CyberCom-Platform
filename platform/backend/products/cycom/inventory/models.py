from django.core.exceptions import ValidationError
from django.db import models

from platform.common.models import BaseModel


class Warehouse(BaseModel):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50)
    location = models.CharField(max_length=255, blank=True)
    room = models.ForeignKey(
        "cymed_facilities.Room",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="warehouses",
        help_text="Physical room this warehouse/stock pool is located in, e.g. a specific "
        "pharmacy counter -- lets multiple warehouses (ER pharmacy vs outpatient retail "
        "pharmacy) be distinguished by real facility location, not just free-text.",
    )

    class Meta:
        db_table = "cycom_inventory_warehouses"

    def __str__(self):
        return f"{self.code} - {self.name}"


class StockItem(BaseModel):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100)
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="stock_items",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    unit = models.CharField(max_length=20, default="pcs")
    unit_cost = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    reorder_level = models.DecimalField(
        max_digits=12, decimal_places=3, default=0,
        help_text="Reorder is triggered when quantity falls to or below this level. 0 disables auto-reorder.",
    )
    par_level = models.DecimalField(
        max_digits=12, decimal_places=3, default=0,
        help_text="Target stock level to replenish up to when a reorder is triggered.",
    )
    preferred_vendor_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "cycom_inventory_stock_items"

    def __str__(self):
        return f"{self.sku} - {self.name}"

    @property
    def needs_reorder(self) -> bool:
        return self.reorder_level > 0 and self.quantity <= self.reorder_level


class StockBatch(BaseModel):
    """
    A physical lot of a StockItem. Real batch/expiry tracking (Phase:
    Medical Compliance) -- previously StockItem.quantity was a single
    aggregate number with no notion of which physical lot it came from,
    which makes First-Expired-First-Out (FEFO) dispensing impossible to
    enforce: without knowing that lot A (expires sooner) and lot B (expires
    later, received later) are separate, nothing can stop a pharmacist from
    picking B while A still has unexpired stock sitting in the same bin.

    StockItem.quantity remains the aggregate across all its batches (kept
    in sync by StockMovement.save(), unchanged from before) -- existing
    non-medical inventory (general hospital/retail supplies with no real
    batch/expiry concept) can keep using StockItem/StockMovement exactly as
    before by simply never creating a StockBatch for those items; batch
    tracking is opt-in per stock item, not a forced migration.
    """

    stock_item = models.ForeignKey(StockItem, on_delete=models.CASCADE, related_name="batches")
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    received_date = models.DateField(auto_now_add=True)
    quantity_on_hand = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    class Meta:
        db_table = "cycom_inventory_stock_batches"
        unique_together = [["stock_item", "batch_number"]]
        ordering = ["expiry_date"]  # FEFO order by construction

    def __str__(self):
        return f"{self.stock_item.sku} lot {self.batch_number} (exp {self.expiry_date})"

    @property
    def is_expired(self) -> bool:
        from django.utils import timezone

        return self.expiry_date < timezone.now().date()


class StockMovement(BaseModel):
    MOVEMENT_TYPE_CHOICES = [
        ("receipt", "Receipt (In)"),
        ("issue", "Issue (Out)"),
        ("transfer", "Transfer"),
        ("adjustment", "Adjustment"),
    ]

    stock_item = models.ForeignKey(
        StockItem,
        on_delete=models.CASCADE,
        related_name="movements",
    )
    batch = models.ForeignKey(
        StockBatch, on_delete=models.PROTECT, null=True, blank=True, related_name="movements",
        help_text="Required for batch-tracked (medical/pharmacy) items on receipt/issue; "
                   "left null for non-batch-tracked general inventory.",
    )
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    reference_id = models.UUIDField(
        null=True, blank=True
    )  # Can refer to PO line, Invoice line, etc.
    movement_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cycom_inventory_stock_movements"

    def clean(self):
        if self.movement_type == "issue" and self.batch_id:
            self._validate_fefo()

    def _validate_fefo(self):
        """
        FEFO enforcement: an issue against `self.batch` is blocked if a
        DIFFERENT batch of the same stock item exists that (a) is not
        expired, (b) has stock on hand, and (c) expires sooner than the
        batch being dispensed. This is a real, physically-enforced rule --
        not a warning -- per "physically prevents a pharmacist from
        dispensing a newer batch if an older, unexpired batch is in stock."
        """
        from django.utils import timezone

        today = timezone.now().date()
        older_available = (
            StockBatch.objects.filter(
                stock_item_id=self.stock_item_id,
                quantity_on_hand__gt=0,
                expiry_date__gte=today,
                expiry_date__lt=self.batch.expiry_date,
            )
            .exclude(pk=self.batch_id)
            .order_by("expiry_date")
            .first()
        )
        if older_available is not None:
            raise ValidationError(
                f"FEFO violation: batch {self.batch.batch_number} (exp {self.batch.expiry_date}) "
                f"cannot be dispensed while older, unexpired batch {older_available.batch_number} "
                f"(exp {older_available.expiry_date}, qty {older_available.quantity_on_hand}) is still in stock. "
                f"Dispense {older_available.batch_number} first."
            )

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if is_new:
            # Only the FEFO rule (clean() above) -- not a full_clean() sweep,
            # to avoid changing validation behavior for anything else that
            # already creates StockMovement rows today.
            self.clean()

            # Update stock item aggregate balance upon movement
            if self.movement_type in ("receipt", "adjustment"):
                self.stock_item.quantity += self.quantity
            elif self.movement_type == "issue":
                self.stock_item.quantity -= self.quantity
            self.stock_item.save(update_fields=["quantity"])

            # Keep the batch's own on-hand quantity in sync, same direction
            # as the aggregate above -- this is what makes FEFO checks on
            # the NEXT movement see accurate remaining quantity per batch.
            if self.batch_id:
                if self.movement_type in ("receipt", "adjustment"):
                    self.batch.quantity_on_hand += self.quantity
                elif self.movement_type == "issue":
                    self.batch.quantity_on_hand -= self.quantity
                self.batch.save(update_fields=["quantity_on_hand"])
        super().save(*args, **kwargs)


class ReorderAlert(BaseModel):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("requisitioned", "Requisitioned"),
        ("dismissed", "Dismissed"),
    ]

    stock_item = models.ForeignKey(
        StockItem,
        on_delete=models.CASCADE,
        related_name="reorder_alerts",
    )
    triggered_at = models.DateTimeField(auto_now_add=True)
    quantity_at_trigger = models.DecimalField(max_digits=12, decimal_places=3)
    reorder_level_at_trigger = models.DecimalField(max_digits=12, decimal_places=3)
    suggested_order_quantity = models.DecimalField(max_digits=12, decimal_places=3)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    requisition_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "cycom_inventory_reorder_alerts"

    def __str__(self):
        return f"Reorder: {self.stock_item.sku} ({self.status})"
