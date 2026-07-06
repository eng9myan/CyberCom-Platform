import uuid
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cycom.inventory.models import StockItem, StockMovement

from ..views import PharmacyModelViewSet
from .models import VAT_RATE, PharmacySale, PharmacySaleLine
from .serializers import CheckoutSerializer, PharmacySaleSerializer


class PharmacySaleViewSet(PharmacyModelViewSet):
    queryset = PharmacySale.objects.all()
    serializer_class = PharmacySaleSerializer

    def get_queryset(self):
        return super().get_queryset().prefetch_related("lines")

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        """
        Finalizes a POS sale: creates the sale + line items, computes
        VAT/total, and posts a real "issue" StockMovement per line so the
        shared inventory StockItem.quantity actually decrements (no
        separate PATCH needed -- that's handled by StockMovement.save()).
        """
        tenant_id = getattr(request, "tenant_id", None)
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        lines_input = data["lines"]
        subtotal = sum((line["quantity"] * line["unit_price"] for line in lines_input), Decimal("0"))
        discount = data.get("discount_amount") or Decimal("0")
        taxable = max(subtotal - discount, Decimal("0"))
        tax_amount = (taxable * VAT_RATE).quantize(Decimal("0.01"))
        total_amount = taxable + tax_amount

        with transaction.atomic():
            sale = PharmacySale.objects.create(
                tenant_id=tenant_id,
                sale_number=f"POS-{uuid.uuid4().hex[:8].upper()}",
                cashier_id=data["cashier_id"],
                patient_id=data.get("patient_id"),
                payment_method=data["payment_method"],
                subtotal=subtotal,
                discount_amount=discount,
                tax_amount=tax_amount,
                total_amount=total_amount,
                status="completed",
            )
            for line in lines_input:
                line_total = (line["quantity"] * line["unit_price"]).quantize(Decimal("0.01"))
                PharmacySaleLine.objects.create(
                    tenant_id=tenant_id,
                    sale=sale,
                    stock_item_id=line["stock_item_id"],
                    item_name=line["item_name"],
                    quantity=line["quantity"],
                    unit_price=line["unit_price"],
                    line_total=line_total,
                )
                stock_item = StockItem.objects.filter(
                    id=line["stock_item_id"], tenant_id=tenant_id
                ).first()
                if stock_item is not None:
                    StockMovement.objects.create(
                        tenant_id=tenant_id,
                        stock_item=stock_item,
                        movement_type="issue",
                        quantity=line["quantity"],
                        reference_id=sale.id,
                        notes=f"POS sale {sale.sale_number}",
                    )

        sale.refresh_from_db()
        return Response(PharmacySaleSerializer(sale).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def void(self, request, pk=None):
        """Voids a completed sale and reverses the stock decrement via a real receipt movement."""
        sale = self.get_object()
        if sale.status != "completed":
            return Response(
                {"detail": f"Cannot void a sale in status '{sale.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get("reason", "")
        tenant_id = getattr(request, "tenant_id", None)

        with transaction.atomic():
            for line in sale.lines.all():
                stock_item = StockItem.objects.filter(
                    id=line.stock_item_id, tenant_id=tenant_id
                ).first()
                if stock_item is not None:
                    StockMovement.objects.create(
                        tenant_id=tenant_id,
                        stock_item=stock_item,
                        movement_type="receipt",
                        quantity=line.quantity,
                        reference_id=sale.id,
                        notes=f"Void reversal for {sale.sale_number}",
                    )
            sale.status = "voided"
            sale.voided_reason = reason
            sale.voided_at = timezone.now()
            sale.save(update_fields=["status", "voided_reason", "voided_at"])

        return Response(PharmacySaleSerializer(sale).data)
