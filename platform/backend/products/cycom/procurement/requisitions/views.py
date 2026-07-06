from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from platform.cyidentity.permissions import HasProcurementAccess
from rest_framework.response import Response

from products.cycom.procurement.purchase_orders.models import PurchaseOrder, POLine

from .models import PurchaseRequisition, RequisitionLine
from .serializers import PurchaseRequisitionSerializer, RequisitionLineSerializer


class PurchaseRequisitionViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisition.objects.all()
    serializer_class = PurchaseRequisitionSerializer
    permission_classes = [HasProcurementAccess]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        return self.queryset.filter(tenant_id=tenant_id).prefetch_related("lines")

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id, status="pending_approval")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        req = self.get_object()
        if req.status != "pending_approval":
            return Response(
                {"detail": f"Cannot approve a requisition in status '{req.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        claims = getattr(request, "auth_claims", {}) or {}
        req.status = "approved"
        req.approved_by = claims.get("sub") or None
        req.approved_at = timezone.now()
        req.save(update_fields=["status", "approved_by", "approved_at"])
        return Response(PurchaseRequisitionSerializer(req).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        req = self.get_object()
        reason = request.data.get("rejection_reason", "")
        if not reason:
            return Response(
                {"detail": "rejection_reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if req.status != "pending_approval":
            return Response(
                {"detail": f"Cannot reject a requisition in status '{req.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        req.status = "rejected"
        req.rejection_reason = reason
        req.save(update_fields=["status", "rejection_reason"])
        return Response(PurchaseRequisitionSerializer(req).data)

    @action(detail=True, methods=["post"], url_path="convert-to-po")
    def convert_to_po(self, request, pk=None):
        req = self.get_object()
        if req.status != "approved":
            return Response(
                {"detail": "Only approved requisitions can be converted to a purchase order."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        vendor_id = request.data.get("vendor_id")
        if not vendor_id:
            return Response(
                {"detail": "vendor_id is required to raise a purchase order."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tenant_id = getattr(request, "tenant_id", None)
        lines = list(req.lines.all())
        if not lines:
            return Response(
                {"detail": "Requisition has no lines to convert."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            subtotal = sum(line.quantity * line.estimated_unit_price for line in lines)
            po = PurchaseOrder.objects.create(
                tenant_id=tenant_id,
                po_number=f"PO-{req.id.hex[:8].upper()}",
                vendor_id=vendor_id,
                po_date=timezone.now().date(),
                status="draft",
                subtotal=subtotal,
                total_amount=subtotal,
            )
            for line in lines:
                POLine.objects.create(
                    tenant_id=tenant_id,
                    po=po,
                    item_id=line.stock_item_id,
                    quantity=line.quantity,
                    unit_price=line.estimated_unit_price,
                    line_total=line.quantity * line.estimated_unit_price,
                )
            req.status = "converted"
            req.purchase_order_id = po.id
            req.save(update_fields=["status", "purchase_order_id"])

        return Response(
            {
                "requisition": PurchaseRequisitionSerializer(req).data,
                "purchase_order_id": str(po.id),
                "po_number": po.po_number,
            },
            status=status.HTTP_201_CREATED,
        )


class RequisitionLineViewSet(viewsets.ModelViewSet):
    queryset = RequisitionLine.objects.all()
    serializer_class = RequisitionLineSerializer
    permission_classes = [HasProcurementAccess]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        qs = self.queryset.filter(tenant_id=tenant_id)
        requisition_id = self.request.query_params.get("requisition")
        if requisition_id:
            qs = qs.filter(requisition_id=requisition_id)
        return qs

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id)
