from rest_framework import status
from rest_framework.decorators import action

from products.cymed.hospital.emergency.models import (
    EmergencyAcuity,
    EmergencyDisposition,
    EmergencyObservation,
    EmergencyTracking,
    EmergencyTriage,
    EmergencyVisit,
)
from products.cymed.hospital.emergency.serializers import (
    EmergencyAcuitySerializer,
    EmergencyDispositionSerializer,
    EmergencyObservationSerializer,
    EmergencyTrackingSerializer,
    EmergencyTriageSerializer,
    EmergencyVisitSerializer,
)
from products.cymed.hospital.services import EmergencyService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class EmergencyVisitViewSet(HospitalModelViewSet):
    queryset = EmergencyVisit.objects.all()
    serializer_class = EmergencyVisitSerializer

    @action(detail=False, methods=["post"])
    def register(self, request):
        """Registers an incoming ER patient and opens tracking at the triage desk."""
        data = request.data
        return run_service_action(
            lambda: EmergencyService.register_emergency_visit(
                tenant_id=request.tenant_id,
                patient_id=data.get("patient_id"),
                chief_complaint=data.get("chief_complaint", ""),
                arrival_mode=data.get("arrival_mode", "walk_in"),
                arrived_at=data.get("arrived_at"),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def triage(self, request, pk=None):
        """Triages the visit (ESI + NEWS2), routes status, fires a critical alert on ESI<=2."""
        data = request.data
        return run_service_action(
            lambda: EmergencyService.triage_patient(
                tenant_id=request.tenant_id,
                visit_id=pk,
                triage_data=data,
                triaged_by=data.get("triaged_by", str(request.user)),
            )
        )

    @action(detail=True, methods=["post"])
    def disposition(self, request, pk=None):
        """Assigns the ER disposition (admitted/discharged/etc.) and closes tracking."""
        data = request.data
        return run_service_action(
            lambda: EmergencyService.assign_disposition(
                tenant_id=request.tenant_id,
                visit_id=pk,
                disposition_code=data.get("disposition_code", ""),
                disposition_notes=data.get("disposition_notes", ""),
                assigned_by=data.get("assigned_by", str(request.user)),
            )
        )

    @action(detail=True, methods=["get"])
    def boarding(self, request, pk=None):
        """Returns total ER boarding time in minutes for this visit."""
        return run_service_action(
            lambda: EmergencyService.track_boarding(tenant_id=request.tenant_id, visit_id=pk)
        )


class EmergencyTriageViewSet(HospitalModelViewSet):
    queryset = EmergencyTriage.objects.all()
    serializer_class = EmergencyTriageSerializer


class EmergencyAcuityViewSet(HospitalModelViewSet):
    queryset = EmergencyAcuity.objects.all()
    serializer_class = EmergencyAcuitySerializer


class EmergencyDispositionViewSet(HospitalModelViewSet):
    queryset = EmergencyDisposition.objects.all()
    serializer_class = EmergencyDispositionSerializer


class EmergencyObservationViewSet(HospitalModelViewSet):
    queryset = EmergencyObservation.objects.all()
    serializer_class = EmergencyObservationSerializer


class EmergencyTrackingViewSet(HospitalModelViewSet):
    queryset = EmergencyTracking.objects.all()
    serializer_class = EmergencyTrackingSerializer
