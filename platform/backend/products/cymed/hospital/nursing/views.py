from rest_framework import status
from rest_framework.decorators import action

from products.cymed.hospital.nursing.models import (
    NursingAssessment,
    NursingAssignment,
    NursingCarePlan,
    NursingHandover,
    NursingShift,
    NursingTask,
)
from products.cymed.hospital.nursing.serializers import (
    NursingAssessmentSerializer,
    NursingAssignmentSerializer,
    NursingCarePlanSerializer,
    NursingHandoverSerializer,
    NursingShiftSerializer,
    NursingTaskSerializer,
)
from products.cymed.hospital.services import NursingService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class NursingShiftViewSet(HospitalModelViewSet):
    queryset = NursingShift.objects.all()
    serializer_class = NursingShiftSerializer


class NursingAssignmentViewSet(HospitalModelViewSet):
    queryset = NursingAssignment.objects.all()
    serializer_class = NursingAssignmentSerializer

    @action(detail=False, methods=["post"])
    def assign(self, request):
        """Assigns a nurse to a ward for a shift, covering the given patients."""
        data = request.data
        return run_service_action(
            lambda: NursingService.assign_nurse(
                tenant_id=request.tenant_id,
                nurse_id=data.get("nurse_id"),
                ward_id=data.get("ward_id"),
                shift_id=data.get("shift_id"),
                patients=data.get("patients", []),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class NursingAssessmentViewSet(HospitalModelViewSet):
    queryset = NursingAssessment.objects.all()
    serializer_class = NursingAssessmentSerializer

    @action(detail=False, methods=["post"])
    def complete(self, request):
        """Logs a nursing clinical assessment against an admission."""
        data = request.data
        return run_service_action(
            lambda: NursingService.complete_assessment(
                tenant_id=request.tenant_id,
                assignment_id=data.get("assignment_id"),
                assessment_type=data.get("assessment_type", ""),
                findings=data.get("findings", {}),
                assessed_by=data.get("assessed_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class NursingCarePlanViewSet(HospitalModelViewSet):
    queryset = NursingCarePlan.objects.all()
    serializer_class = NursingCarePlanSerializer

    @action(detail=False, methods=["post"])
    def create_plan(self, request):
        """Creates a nursing care plan with goals and interventions for an admitted encounter."""
        data = request.data
        return run_service_action(
            lambda: NursingService.create_care_plan(
                tenant_id=request.tenant_id,
                patient_id=data.get("patient_id"),
                encounter_id=data.get("encounter_id"),
                goals=data.get("goals", []),
                interventions=data.get("interventions", []),
                created_by=data.get("created_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class NursingTaskViewSet(HospitalModelViewSet):
    queryset = NursingTask.objects.all()
    serializer_class = NursingTaskSerializer

    @action(detail=False, methods=["post"])
    def schedule(self, request):
        """Schedules a nursing task/treatment for an admitted patient."""
        data = request.data
        return run_service_action(
            lambda: NursingService.create_task(
                tenant_id=request.tenant_id,
                patient_id=data.get("patient_id"),
                task_type=data.get("task_type", ""),
                due_at=data.get("due_at"),
                assigned_to=data.get("assigned_to", str(request.user)),
                instructions=data.get("instructions", ""),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class NursingHandoverViewSet(HospitalModelViewSet):
    queryset = NursingHandover.objects.all()
    serializer_class = NursingHandoverSerializer

    @action(detail=False, methods=["post"])
    def complete(self, request):
        """Completes a shift handover using the SBAR structured format."""
        data = request.data
        return run_service_action(
            lambda: NursingService.complete_handover(
                tenant_id=request.tenant_id,
                outgoing_nurse_id=data.get("outgoing_nurse_id", str(request.user)),
                incoming_nurse_id=data.get("incoming_nurse_id"),
                ward_id=data.get("ward_id"),
                handover_notes=data.get("handover_notes", {}),
            ),
            success_status=status.HTTP_201_CREATED,
        )
