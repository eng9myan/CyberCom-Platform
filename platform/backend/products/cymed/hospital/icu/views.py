from rest_framework import status
from rest_framework.decorators import action

from products.cymed.hospital.icu.models import (
    CriticalEvent,
    ICUAssessment,
    ICURound,
    ICUStay,
    VentilatorRecord,
)
from products.cymed.hospital.icu.serializers import (
    CriticalEventSerializer,
    ICUAssessmentSerializer,
    ICURoundSerializer,
    ICUStaySerializer,
    VentilatorRecordSerializer,
)
from products.cymed.hospital.services import ICUService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class ICUStayViewSet(HospitalModelViewSet):
    queryset = ICUStay.objects.all()
    serializer_class = ICUStaySerializer

    @action(detail=False, methods=["post"])
    def admit(self, request):
        """Admits an inpatient to the ICU and assigns the ICU bed."""
        data = request.data
        return run_service_action(
            lambda: ICUService.admit_to_icu(
                tenant_id=request.tenant_id,
                encounter_id=data.get("encounter_id"),
                bed_id=data.get("bed_id"),
                admission_dx=data.get("admission_dx", ""),
                admitted_by=data.get("admitted_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def round(self, request, pk=None):
        """Records an ICU round (vitals) and computes the SOFA score."""
        data = request.data
        return run_service_action(
            lambda: ICUService.complete_icu_round(
                tenant_id=request.tenant_id,
                icu_stay_id=pk,
                round_data=data,
                rounded_by=data.get("rounded_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def ventilator(self, request, pk=None):
        """Starts/updates ventilator settings for this ICU stay."""
        data = request.data
        return run_service_action(
            lambda: ICUService.start_ventilator(
                tenant_id=request.tenant_id,
                icu_stay_id=pk,
                settings=data,
                initiated_by=data.get("initiated_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def critical_event(self, request, pk=None):
        """Logs a critical ICU event (e.g. cardiac arrest, extubation)."""
        data = request.data
        return run_service_action(
            lambda: ICUService.record_critical_event(
                tenant_id=request.tenant_id,
                icu_stay_id=pk,
                event_type=data.get("event_type", ""),
                description=data.get("description", ""),
                severity=data.get("severity", ""),
                responded_by=data.get("responded_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class ICURoundViewSet(HospitalModelViewSet):
    queryset = ICURound.objects.all()
    serializer_class = ICURoundSerializer


class ICUAssessmentViewSet(HospitalModelViewSet):
    queryset = ICUAssessment.objects.all()
    serializer_class = ICUAssessmentSerializer


class VentilatorRecordViewSet(HospitalModelViewSet):
    queryset = VentilatorRecord.objects.all()
    serializer_class = VentilatorRecordSerializer


class CriticalEventViewSet(HospitalModelViewSet):
    queryset = CriticalEvent.objects.all()
    serializer_class = CriticalEventSerializer
