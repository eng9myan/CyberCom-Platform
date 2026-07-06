from decimal import Decimal

from django.db import models

from platform.common.models import BaseModel

VAT_RATE = Decimal("0.15")  # Saudi standard VAT rate, matches ZATCA e-invoicing elsewhere


class PharmacySale(BaseModel):
    PAYMENT_METHOD_CHOICES = [
        ("cash", "Cash"),
        ("card", "Card"),
        ("insurance", "Insurance"),
        ("mobile", "Mobile Wallet"),
    ]
    STATUS_CHOICES = [
        ("completed", "Completed"),
        ("voided", "Voided"),
    ]

    data_classification = "phi"  # may carry patient_id for insurance-linked sales

    sale_number = models.CharField(max_length=50, unique=True)
    cashier_id = models.UUIDField()
    patient_id = models.UUIDField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    subtotal = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed")
    voided_reason = models.TextField(blank=True)
    voided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cymed_pharmacy_pos_sales"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.sale_number} ({self.status})"


class PharmacySaleLine(BaseModel):
    sale = models.ForeignKey(PharmacySale, on_delete=models.CASCADE, related_name="lines")
    stock_item_id = models.UUIDField()
    item_name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    unit_price = models.DecimalField(max_digits=18, decimal_places=2)
    line_total = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = "cymed_pharmacy_pos_sale_lines"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.item_name} x{self.quantity} (sale {self.sale_id})"
