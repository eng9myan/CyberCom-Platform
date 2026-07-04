from rest_framework import status
from rest_framework.decorators import action

from products.cymed.hospital.discharge.models import (
    DischargeChecklist,
    DischargeInstruction,
    DischargeMedication,
    FollowUpAppointment,
)
from products.cymed.hospital.discharge.serializers import (
    DischargeChecklistSerializer,
    DischargeInstructionSerializer,
    DischargeMedicationSerializer,
    FollowUpAppointmentSerializer,
)
from products.cymed.hospital.services import DischargeService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class DischargeChecklistViewSet(HospitalModelViewSet):
    queryset = DischargeChecklist.objects.all()
    serializer_class = DischargeChecklistSerializer

    @action(detail=False, methods=["post"])
    def complete(self, request):
        """Marks the discharge checklist final review complete for an admission."""
        data = request.data
        return run_service_action(
            lambda: DischargeService.complete_discharge_checklist(
                tenant_id=request.tenant_id,
                admission_id=data.get("admission_id"),
                completed_by=data.get("completed_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class DischargeMedicationViewSet(HospitalModelViewSet):
    queryset = DischargeMedication.objects.all()
    serializer_class = DischargeMedicationSerializer

    @action(detail=False, methods=["post"])
    def reconcile(self, request):
        """Adds a medication item during discharge medication reconciliation."""
        data = request.data
        return run_service_action(
            lambda: DischargeService.add_discharge_medication(
                tenant_id=request.tenant_id,
                admission_id=data.get("admission_id"),
                drug_name=data.get("drug_name", ""),
                dose=data.get("dose", ""),
                frequency=data.get("frequency", ""),
                duration_days=data.get("duration_days", 0),
                instructions=data.get("instructions", ""),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class FollowUpAppointmentViewSet(HospitalModelViewSet):
    queryset = FollowUpAppointment.objects.all()
    serializer_class = FollowUpAppointmentSerializer

    @action(detail=False, methods=["post"])
    def schedule(self, request):
        """Schedules a post-discharge follow-up appointment."""
        data = request.data
        return run_service_action(
            lambda: DischargeService.schedule_follow_up(
                tenant_id=request.tenant_id,
                admission_id=data.get("admission_id"),
                provider_id=data.get("provider_id"),
                specialty=data.get("specialty", ""),
                scheduled_at=data.get("scheduled_at"),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class DischargeInstructionViewSet(HospitalModelViewSet):
    queryset = DischargeInstruction.objects.all()
    serializer_class = DischargeInstructionSerializer

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """Compiles discharge instructions (diet, restrictions, warning symptoms)."""
        data = request.data
        return run_service_action(
            lambda: DischargeService.generate_discharge_instructions(
                tenant_id=request.tenant_id,
                admission_id=data.get("admission_id"),
                language=data.get("language", "en"),
            ),
            success_status=status.HTTP_201_CREATED,
        )
