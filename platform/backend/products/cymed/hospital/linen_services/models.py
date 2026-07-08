from django.db import models

from platform.common.models import BaseModel


class LinenCart(BaseModel):
    """Real par-level tracking per ward, mirroring the cycom.inventory reorder-level pattern (needs_reorder-style property) but for linen, not purchased stock."""

    CART_TYPE_CHOICES = [
        ("clean", "Clean Linen"),
        ("soiled", "Soiled Linen"),
    ]

    ward = models.CharField(max_length=100)  # e.g. "Ward 3B", "ICU"
    cart_type = models.CharField(max_length=10, choices=CART_TYPE_CHOICES)
    current_count = models.PositiveIntegerField(default=0)
    par_level = models.PositiveIntegerField(default=0, help_text="Target stock level for clean carts; capacity threshold for soiled carts.")

    class Meta:
        db_table = "cymed_hospital_linen_carts"
        ordering = ["ward", "cart_type"]
        unique_together = [["tenant_id", "ward", "cart_type"]]

    def __str__(self):
        return f"LinenCart({self.ward}, {self.cart_type}, {self.current_count})"

    @property
    def needs_attention(self) -> bool:
        """Clean cart below par (needs restock) OR soiled cart at/above par (needs pickup) -- same threshold field, opposite meaning by cart_type."""
        if self.cart_type == "clean":
            return self.current_count < self.par_level
        return self.current_count >= self.par_level


class LaundryBatch(BaseModel):
    """
    Strict clean/dirty separation chain-of-custody -- collected from a
    soiled cart, sent to laundry, returned as clean stock. item_count on
    return is compared against collection to flag real shrinkage/loss,
    not just trusted blindly.
    """

    STATUS_CHOICES = [
        ("collected", "Collected"),
        ("at_laundry", "At Laundry"),
        ("returned", "Returned"),
        ("short_count_flagged", "Short Count Flagged"),
    ]

    source_ward = models.CharField(max_length=100)
    item_count_collected = models.PositiveIntegerField()
    weight_kg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    collected_by = models.UUIDField()
    collected_at = models.DateTimeField(auto_now_add=True)
    sent_to_laundry_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    item_count_returned = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="collected")

    class Meta:
        db_table = "cymed_hospital_linen_laundry_batches"
        ordering = ["-collected_at"]
        indexes = [models.Index(fields=["tenant_id", "status"])]

    def __str__(self):
        return f"LaundryBatch({self.source_ward}, {self.status})"

    def mark_returned(self, *, item_count_returned: int):
        from django.utils import timezone

        self.item_count_returned = item_count_returned
        self.returned_at = timezone.now()
        self.status = "short_count_flagged" if item_count_returned < self.item_count_collected else "returned"
        self.save(update_fields=["item_count_returned", "returned_at", "status", "updated_at"])
