from platform.cyidentity.permissions import HasProcurementAccess
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ReorderAlert, StockBatch, StockItem, StockMovement, Warehouse
from .serializers import (
    ReorderAlertSerializer,
    StockBatchSerializer,
    StockItemSerializer,
    StockMovementSerializer,
    WarehouseSerializer,
)


class BaseInventoryViewSet(viewsets.ModelViewSet):
    permission_classes = [HasProcurementAccess]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        return self.queryset.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id)


class WarehouseViewSet(BaseInventoryViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer


class StockItemViewSet(BaseInventoryViewSet):
    queryset = StockItem.objects.all()
    serializer_class = StockItemSerializer

    @action(detail=False, methods=["get"], url_path="needs-reorder")
    def needs_reorder(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        items = [
            item
            for item in StockItem.objects.filter(tenant_id=tenant_id)
            if item.needs_reorder
        ]
        return Response(StockItemSerializer(items, many=True).data)


class StockBatchViewSet(BaseInventoryViewSet):
    queryset = StockBatch.objects.all()
    serializer_class = StockBatchSerializer

    @action(detail=False, methods=["get"], url_path="expiring-soon")
    def expiring_soon(self, request):
        """Batches expiring within 60 days with stock still on hand -- same window hospital_notify_expiring_batches uses."""
        from datetime import timedelta

        from django.utils import timezone

        tenant_id = getattr(request, "tenant_id", None)
        cutoff = timezone.now().date() + timedelta(days=60)
        batches = StockBatch.objects.filter(
            tenant_id=tenant_id, expiry_date__lte=cutoff, quantity_on_hand__gt=0
        ).order_by("expiry_date")
        return Response(StockBatchSerializer(batches, many=True).data)


class StockMovementViewSet(BaseInventoryViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer


class ReorderAlertViewSet(BaseInventoryViewSet):
    queryset = ReorderAlert.objects.all()
    serializer_class = ReorderAlertSerializer
    http_method_names = ["get", "post", "head", "options"]

    @action(detail=True, methods=["post"])
    def dismiss(self, request, pk=None):
        alert = self.get_object()
        alert.status = "dismissed"
        alert.save(update_fields=["status"])
        return Response(ReorderAlertSerializer(alert).data)
