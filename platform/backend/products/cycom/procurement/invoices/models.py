from django.db import models

from platform.common.models import BaseModel
from products.cycom.procurement.purchase_orders.models import POLine, PurchaseOrder


class VendorInvoice(BaseModel):
    STATUS_CHOICES = [
        ("pending_match", "Pending Match"),
        ("matched", "Matched"),
        ("mismatched", "Mismatched"),
        ("approved", "Approved for Payment"),
        ("paid", "Paid"),
    ]

    po = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT, related_name="vendor_invoices")
    vendor_id = models.UUIDField(db_index=True)
    invoice_number = models.CharField(max_length=100)
    invoice_date = models.DateField()
    subtotal = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending_match")
    match_notes = models.TextField(blank=True)
    matched_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cycom_procurement_vendor_invoices"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.invoice_number} — PO {self.po.po_number}"


class VendorInvoiceLine(BaseModel):
    invoice = models.ForeignKey(VendorInvoice, on_delete=models.CASCADE, related_name="lines")
    po_line = models.ForeignKey(POLine, on_delete=models.PROTECT, related_name="invoice_lines")
    quantity_invoiced = models.DecimalField(max_digits=12, decimal_places=3)
    unit_price = models.DecimalField(max_digits=18, decimal_places=2)
    line_total = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = "cycom_procurement_vendor_invoice_lines"
        ordering = ["created_at"]

    def __str__(self):
        return f"Line {self.id} — Invoice {self.invoice_id}"
