from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ReorderAlert, StockItem, StockMovement, Warehouse
from .serializers import (
    ReorderAlertSerializer,
    StockItemSerializer,
    StockMovementSerializer,
    WarehouseSerializer,
)


class BaseInventoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

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
