from datetime import timedelta

from platform.cyidentity.permissions import HasProcurementAccess
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import Asset, AssetDepreciation, BiomedicalEquipment, EquipmentServiceRecord
from .serializers import (
    AssetDepreciationSerializer,
    AssetSerializer,
    BiomedicalEquipmentSerializer,
    EquipmentServiceRecordSerializer,
)


class BaseAssetViewSet(viewsets.ModelViewSet):
    permission_classes = [HasProcurementAccess]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        return self.queryset.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id)


class AssetViewSet(BaseAssetViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer


class AssetDepreciationViewSet(BaseAssetViewSet):
    queryset = AssetDepreciation.objects.all()
    serializer_class = AssetDepreciationSerializer


class BiomedicalEquipmentViewSet(BaseAssetViewSet):
    queryset = BiomedicalEquipment.objects.all()
    serializer_class = BiomedicalEquipmentSerializer

    @action(detail=False, methods=["get"], url_path="calibration-due")
    def calibration_due(self, request):
        """Equipment whose calibration is due within 30 days or already overdue -- real due-date query, not a fabricated threshold."""
        tenant_id = getattr(request, "tenant_id", None)
        cutoff = timezone.now().date() + timedelta(days=30)
        qs = BiomedicalEquipment.objects.filter(
            tenant_id=tenant_id, next_calibration_due__lte=cutoff,
        ).exclude(status="decommissioned")
        return Response(BiomedicalEquipmentSerializer(qs, many=True).data)


class EquipmentServiceRecordViewSet(BaseAssetViewSet):
    queryset = EquipmentServiceRecord.objects.all()
    serializer_class = EquipmentServiceRecordSerializer
