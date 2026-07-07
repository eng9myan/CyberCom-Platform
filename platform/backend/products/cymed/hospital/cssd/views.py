from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.views import HospitalModelViewSet

from .models import InstrumentSet, InstrumentTracking, SterilizationLoad
from .serializers import (
    InstrumentSetSerializer,
    InstrumentTrackingSerializer,
    SterilizationLoadSerializer,
)


class SterilizationLoadViewSet(HospitalModelViewSet):
    queryset = SterilizationLoad.objects.all()
    serializer_class = SterilizationLoadSerializer

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        load = self.get_object()
        if load.status != "loading":
            return Response({"detail": f"Cannot start a load in status '{load.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        load.status = "running"
        load.started_at = timezone.now()
        load.operator_id = request.data.get("operator_id") or load.operator_id
        load.save(update_fields=["status", "started_at", "operator_id"])
        return Response(SterilizationLoadSerializer(load).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        load = self.get_object()
        if load.status != "running":
            return Response({"detail": f"Cannot complete a load in status '{load.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        bi_result = request.data.get("biological_indicator_result", "pass")
        load.biological_indicator_result = bi_result
        load.status = "completed" if bi_result == "pass" else "failed"
        load.completed_at = timezone.now()
        load.save(update_fields=["status", "biological_indicator_result", "completed_at"])
        return Response(SterilizationLoadSerializer(load).data)


class InstrumentSetViewSet(HospitalModelViewSet):
    queryset = InstrumentSet.objects.all()
    serializer_class = InstrumentSetSerializer

    @action(detail=True, methods=["post"])
    def issue(self, request, pk=None):
        item = self.get_object()
        if item.status != "sterile":
            return Response({"detail": f"Cannot issue a set in status '{item.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        tenant_id = getattr(request, "tenant_id", None)
        item.status = "issued"
        item.save(update_fields=["status"])
        InstrumentTracking.objects.create(
            tenant_id=tenant_id, instrument_set=item, event_type="issued",
            location=request.data.get("location", ""), logged_by=request.data.get("logged_by"),
        )
        return Response(InstrumentSetSerializer(item).data)

    @action(detail=True, methods=["post"], url_path="return")
    def return_set(self, request, pk=None):
        item = self.get_object()
        tenant_id = getattr(request, "tenant_id", None)
        contaminated = bool(request.data.get("contaminated"))
        item.status = "contaminated" if contaminated else "dirty"
        item.save(update_fields=["status"])
        InstrumentTracking.objects.create(
            tenant_id=tenant_id, instrument_set=item,
            event_type="contaminated" if contaminated else "returned",
            location=request.data.get("location", ""), logged_by=request.data.get("logged_by"),
        )
        return Response(InstrumentSetSerializer(item).data)


class InstrumentTrackingViewSet(HospitalModelViewSet):
    queryset = InstrumentTracking.objects.all()
    serializer_class = InstrumentTrackingSerializer
