from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.tenants.models import BaseEntity, Company, Branch
from apps.catalog.models import Product, ProductVariant


class Warehouse(BaseEntity):
    """
    Full warehouse entity. Replaces the WarehousePlaceholder in apps.tenants.
    Existing placeholder records are migrated separately; this model takes over.
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='real_warehouses')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inv_warehouses')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    address = models.TextField(blank=True)

    class Meta:
        ordering = ['name']
        unique_together = [('tenant_id', 'company', 'code')]

    def __str__(self):
        return f"{self.code} – {self.name}"


class StockLocation(BaseEntity):
    """A zone or shelf inside a warehouse (e.g. SHELF-A1, RECEIVING, PRODUCTION)."""

    LOCATION_TYPES = [
        ('INTERNAL', 'Internal'),
        ('RECEIVING', 'Receiving / Input'),
        ('OUTPUT', 'Output / Dispatch'),
        ('VIRTUAL', 'Virtual / Loss'),
    ]

    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='locations')
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children'
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPES, default='INTERNAL')

    class Meta:
        ordering = ['code']
        unique_together = [('warehouse', 'code')]

    def __str__(self):
        return f"{self.warehouse.code}/{self.code}"


class StockLevel(BaseEntity):
    """
    Current quantity of a product (or variant) at a specific location.
    Updated atomically every time a StockMovement is posted.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_levels')
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, null=True, blank=True, related_name='stock_levels'
    )
    location = models.ForeignKey(StockLocation, on_delete=models.CASCADE, related_name='stock_levels')
    quantity = models.DecimalField(max_digits=15, decimal_places=4, default='0.0000')
    reserved_quantity = models.DecimalField(max_digits=15, decimal_places=4, default='0.0000')

    class Meta:
        unique_together = [('product', 'variant', 'location')]

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    def __str__(self):
        label = self.variant.name if self.variant else self.product.name
        return f"{label} @ {self.location} = {self.quantity}"


class StockMovement(BaseEntity):
    """
    Double-entry style stock journal. Every quantity change produces one movement record.
    Positive quantity always means goods moving INTO to_location;
    from_location being null means a receipt from vendor / production.
    to_location being null means a consumption / loss (out of system).
    """

    MOVEMENT_TYPES = [
        ('RECEIPT', 'Vendor Receipt'),
        ('ISSUE', 'Issue / Sale Consumption'),
        ('TRANSFER', 'Internal Transfer'),
        ('ADJUSTMENT', 'Manual Adjustment'),
        ('PRODUCTION_IN', 'Production Output'),
        ('PRODUCTION_OUT', 'Production Consumption'),
        ('RETURN_IN', 'Customer Return In'),
        ('RETURN_OUT', 'Return to Vendor'),
        ('OPENING', 'Opening Balance'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, null=True, blank=True, related_name='stock_movements'
    )
    from_location = models.ForeignKey(
        StockLocation, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='movements_out'
    )
    to_location = models.ForeignKey(
        StockLocation, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='movements_in'
    )
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=4, default='0.0000')

    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    reference = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    # Denormalized for reporting without joins
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='movements'
    )

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError({'quantity': 'Quantity must be positive.'})
        if self.from_location is None and self.to_location is None:
            raise ValidationError('At least one of from_location or to_location must be set.')

    def save(self, *args, **kwargs):
        self.full_clean()
        from django.db import transaction
        with transaction.atomic():
            super().save(*args, **kwargs)
            self._apply_stock_levels()

    def _apply_stock_levels(self):
        """Update StockLevel rows to reflect this movement."""
        if self.from_location:
            level, _ = StockLevel.objects.select_for_update().get_or_create(
                product=self.product,
                variant=self.variant,
                location=self.from_location,
                defaults={'tenant_id': self.tenant_id, 'quantity': 0},
            )
            level.quantity -= self.quantity
            level.save(update_fields=['quantity', 'updated_at', 'version'])

        if self.to_location:
            level, _ = StockLevel.objects.select_for_update().get_or_create(
                product=self.product,
                variant=self.variant,
                location=self.to_location,
                defaults={'tenant_id': self.tenant_id, 'quantity': 0},
            )
            level.quantity += self.quantity
            level.save(update_fields=['quantity', 'updated_at', 'version'])

    def __str__(self):
        return f"{self.movement_type} {self.quantity} x {self.product.name} ({self.reference or self.id})"
