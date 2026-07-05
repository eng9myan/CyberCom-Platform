from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import VendorInvoice, VendorInvoiceLine
from .serializers import VendorInvoiceSerializer

PRICE_TOLERANCE = Decimal("0.01")


class VendorInvoiceViewSet(viewsets.ModelViewSet):
    queryset = VendorInvoice.objects.all()
    serializer_class = VendorInvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        return self.queryset.filter(tenant_id=tenant_id).prefetch_related("lines")

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id)

    @action(detail=True, methods=["post"], url_path="run-three-way-match")
    def run_three_way_match(self, request, pk=None):
        invoice = self.get_object()
        lines = list(invoice.lines.select_related("po_line").all())
        if not lines:
            return Response(
                {"detail": "Invoice has no lines to match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        discrepancies = []
        for line in lines:
            po_line = line.po_line
            received_qty = po_line.receipt_lines.aggregate(
                total=Sum("quantity_received")
            )["total"] or Decimal("0")

            if line.quantity_invoiced > po_line.quantity:
                discrepancies.append(
                    f"Line {line.id}: invoiced qty {line.quantity_invoiced} exceeds "
                    f"PO ordered qty {po_line.quantity}"
                )
            if line.quantity_invoiced > received_qty:
                discrepancies.append(
                    f"Line {line.id}: invoiced qty {line.quantity_invoiced} exceeds "
                    f"goods received qty {received_qty}"
                )
            price_diff = abs(line.unit_price - po_line.unit_price)
            if price_diff > PRICE_TOLERANCE:
                discrepancies.append(
                    f"Line {line.id}: invoiced unit price {line.unit_price} does not match "
                    f"PO unit price {po_line.unit_price} (diff {price_diff})"
                )

        if discrepancies:
            invoice.status = "mismatched"
            invoice.match_notes = "\n".join(discrepancies)
            invoice.matched_at = None
        else:
            invoice.status = "matched"
            invoice.match_notes = "All lines matched PO quantity/price and goods-receipt quantity."
            invoice.matched_at = timezone.now()

        invoice.save(update_fields=["status", "match_notes", "matched_at"])
        return Response(VendorInvoiceSerializer(invoice).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status != "matched":
            return Response(
                {"detail": "Only a matched invoice can be approved for payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice.status = "approved"
        invoice.save(update_fields=["status"])
        return Response(VendorInvoiceSerializer(invoice).data)
