from rest_framework import status
from rest_framework.decorators import action

from products.cymed.hospital.operating_room.models import (
    ProcedureBooking,
    ProcedureChecklist,
    ProcedureConsent,
    SurgicalCase,
    SurgicalEquipment,
    SurgicalSchedule,
    SurgicalTeam,
)
from products.cymed.hospital.operating_room.serializers import (
    ProcedureBookingSerializer,
    ProcedureChecklistSerializer,
    ProcedureConsentSerializer,
    SurgicalCaseSerializer,
    SurgicalEquipmentSerializer,
    SurgicalScheduleSerializer,
    SurgicalTeamSerializer,
)
from products.cymed.hospital.services import OperatingRoomService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class SurgicalCaseViewSet(HospitalModelViewSet):
    queryset = SurgicalCase.objects.all()
    serializer_class = SurgicalCaseSerializer

    @action(detail=False, methods=["post"])
    def schedule(self, request):
        """Schedules a surgical case with OR conflict detection."""
        data = request.data
        return run_service_action(
            lambda: OperatingRoomService.schedule_case(
                tenant_id=request.tenant_id,
                encounter_id=data.get("encounter_id"),
                procedure_codes=data.get("procedure_codes", []),
                surgeon_id=data.get("surgeon_id"),
                scheduled_datetime=data.get("scheduled_datetime"),
                estimated_minutes=data.get("estimated_minutes", 60),
                room_id=data.get("room_id"),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        """Transitions the case to intra-op and registers the surgical team."""
        data = request.data
        return run_service_action(
            lambda: OperatingRoomService.start_case(
                tenant_id=request.tenant_id,
                case_id=pk,
                started_by=data.get("started_by", str(request.user)),
                team_members=data.get("team_members", []),
            )
        )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Completes the case, records duration, posts the surgery charge."""
        data = request.data
        return run_service_action(
            lambda: OperatingRoomService.complete_case(
                tenant_id=request.tenant_id,
                case_id=pk,
                completed_by=data.get("completed_by", str(request.user)),
                actual_minutes=data.get("actual_minutes", 0),
                complications=data.get("complications"),
            )
        )

    @action(detail=True, methods=["post"])
    def consent(self, request, pk=None):
        """Records a signed procedure consent for this case."""
        data = request.data
        return run_service_action(
            lambda: OperatingRoomService.create_consent(
                tenant_id=request.tenant_id,
                case_id=pk,
                patient_id=data.get("patient_id"),
                procedure_name=data.get("procedure_name", ""),
                risk_summary=data.get("risk_summary", ""),
                consented_by=data.get("consented_by", str(request.user)),
                witness_id=data.get("witness_id"),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class SurgicalScheduleViewSet(HospitalModelViewSet):
    queryset = SurgicalSchedule.objects.all()
    serializer_class = SurgicalScheduleSerializer


class ProcedureBookingViewSet(HospitalModelViewSet):
    queryset = ProcedureBooking.objects.all()
    serializer_class = ProcedureBookingSerializer


class ProcedureConsentViewSet(HospitalModelViewSet):
    queryset = ProcedureConsent.objects.all()
    serializer_class = ProcedureConsentSerializer


class ProcedureChecklistViewSet(HospitalModelViewSet):
    queryset = ProcedureChecklist.objects.all()
    serializer_class = ProcedureChecklistSerializer


class SurgicalTeamViewSet(HospitalModelViewSet):
    queryset = SurgicalTeam.objects.all()
    serializer_class = SurgicalTeamSerializer


class SurgicalEquipmentViewSet(HospitalModelViewSet):
    queryset = SurgicalEquipment.objects.all()
    serializer_class = SurgicalEquipmentSerializer
