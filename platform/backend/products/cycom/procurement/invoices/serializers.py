from rest_framework import serializers

from .models import VendorInvoice, VendorInvoiceLine


class VendorInvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorInvoiceLine
        fields = ["id", "invoice", "po_line", "quantity_invoiced", "unit_price", "line_total"]
        read_only_fields = ["id"]


class VendorInvoiceSerializer(serializers.ModelSerializer):
    lines = VendorInvoiceLineSerializer(many=True, read_only=True)

    class Meta:
        model = VendorInvoice
        fields = [
            "id",
            "po",
            "vendor_id",
            "invoice_number",
            "invoice_date",
            "subtotal",
            "tax_amount",
            "total_amount",
            "status",
            "match_notes",
            "matched_at",
            "lines",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "match_notes", "matched_at", "created_at", "updated_at"]
