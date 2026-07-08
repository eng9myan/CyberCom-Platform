from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.views import HospitalModelViewSet

from .models import HAICase, HandHygieneObservation, IsolationPrecaution, OutbreakInvestigation
from .serializers import (
    HAICaseSerializer,
    HandHygieneObservationSerializer,
    IsolationPrecautionSerializer,
    OutbreakInvestigationSerializer,
)


class IsolationPrecautionViewSet(HospitalModelViewSet):
    queryset = IsolationPrecaution.objects.all()
    serializer_class = IsolationPrecautionSerializer

    @action(detail=True, methods=["post"])
    def lift(self, request, pk=None):
        precaution = self.get_object()
        if precaution.ended_at is not None:
            return Response({"detail": "Precaution already lifted."}, status=status.HTTP_400_BAD_REQUEST)
        precaution.ended_at = timezone.now()
        precaution.save(update_fields=["ended_at", "updated_at"])
        return Response(IsolationPrecautionSerializer(precaution).data)

    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        qs = IsolationPrecaution.objects.filter(tenant_id=tenant_id, ended_at__isnull=True)
        return Response(IsolationPrecautionSerializer(qs, many=True).data)


class HAICaseViewSet(HospitalModelViewSet):
    queryset = HAICase.objects.all()
    serializer_class = HAICaseSerializer


class HandHygieneObservationViewSet(HospitalModelViewSet):
    queryset = HandHygieneObservation.objects.all()
    serializer_class = HandHygieneObservationSerializer

    @action(detail=False, methods=["get"], url_path="compliance-rate")
    def compliance_rate(self, request):
        """Real observed-compliance rate (compliant / total), optionally filtered by unit -- no fabricated benchmark number."""
        tenant_id = getattr(request, "tenant_id", None)
        unit = request.query_params.get("unit")
        qs = HandHygieneObservation.objects.filter(tenant_id=tenant_id)
        if unit:
            qs = qs.filter(unit=unit)
        total = qs.count()
        compliant = qs.filter(compliant=True).count()
        rate = round((compliant / total) * 100, 1) if total else None
        return Response({"unit": unit or "all", "total_observations": total, "compliant": compliant, "compliance_rate_pct": rate})


class OutbreakInvestigationViewSet(HospitalModelViewSet):
    queryset = OutbreakInvestigation.objects.all()
    serializer_class = OutbreakInvestigationSerializer
