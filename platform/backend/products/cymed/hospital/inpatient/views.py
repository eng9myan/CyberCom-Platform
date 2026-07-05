from rest_framework import status
from rest_framework.decorators import action

from products.cymed.hospital.inpatient.models import (
    CodeStatusOrder,
    DailyRound,
    DeviceAssociatedInfection,
    DischargePlanning,
    HospitalStay,
    IndwellingDevice,
    InpatientCarePlan,
    ProgressReview,
    VTEProphylaxisOrder,
)
from products.cymed.hospital.inpatient.serializers import (
    CodeStatusOrderSerializer,
    DailyRoundSerializer,
    DeviceAssociatedInfectionSerializer,
    DischargePlanningSerializer,
    HospitalStaySerializer,
    IndwellingDeviceSerializer,
    InpatientCarePlanSerializer,
    ProgressReviewSerializer,
    VTEProphylaxisOrderSerializer,
)
from products.cymed.hospital.services import ClinicalSafetyService, DischargeService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class HospitalStayViewSet(HospitalModelViewSet):
    queryset = HospitalStay.objects.all()
    serializer_class = HospitalStaySerializer
    action_required_roles = {"code_status": {"physician"}}

    @action(detail=True, methods=["post"])
    def code_status(self, request, pk=None):
        """Records a new code-status (resuscitation directive) order for this stay."""
        data = request.data
        return run_service_action(
            lambda: ClinicalSafetyService.set_code_status(
                tenant_id=request.tenant_id,
                stay_id=pk,
                status=data.get("status", HospitalStay.CodeStatus.FULL_CODE),
                ordered_by=data.get("ordered_by", str(request.user)),
                reason=data.get("reason", ""),
                discussed_with_patient=data.get("discussed_with_patient", False),
                discussed_with_family=data.get("discussed_with_family", False),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class DailyRoundViewSet(HospitalModelViewSet):
    queryset = DailyRound.objects.all()
    serializer_class = DailyRoundSerializer


class ProgressReviewViewSet(HospitalModelViewSet):
    queryset = ProgressReview.objects.all()
    serializer_class = ProgressReviewSerializer


class InpatientCarePlanViewSet(HospitalModelViewSet):
    queryset = InpatientCarePlan.objects.all()
    serializer_class = InpatientCarePlanSerializer


class DischargePlanningViewSet(HospitalModelViewSet):
    queryset = DischargePlanning.objects.all()
    serializer_class = DischargePlanningSerializer

    @action(detail=False, methods=["post"])
    def initiate(self, request):
        """Opens the discharge-planning track for an admission with a target date."""
        data = request.data
        return run_service_action(
            lambda: DischargeService.initiate_discharge_planning(
                tenant_id=request.tenant_id,
                admission_id=data.get("admission_id"),
                target_date=data.get("target_date"),
                planned_by=data.get("planned_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class CodeStatusOrderViewSet(HospitalModelViewSet):
    """Read-only audit trail -- create via HospitalStay's code_status action, never direct POST."""

    http_method_names = ["get", "head", "options"]
    queryset = CodeStatusOrder.objects.all()
    serializer_class = CodeStatusOrderSerializer


class IndwellingDeviceViewSet(HospitalModelViewSet):
    queryset = IndwellingDevice.objects.all()
    serializer_class = IndwellingDeviceSerializer
    action_required_roles = {"insert": {"physician", "nurse"}, "remove": {"physician", "nurse"}}

    @action(detail=False, methods=["post"])
    def insert(self, request):
        """Registers a central line / urinary catheter insertion (starts HAI device-day clock)."""
        data = request.data
        return run_service_action(
            lambda: ClinicalSafetyService.insert_device(
                tenant_id=request.tenant_id,
                stay_id=data.get("stay_id"),
                device_type=data.get("device_type"),
                inserted_by=data.get("inserted_by", str(request.user)),
                insertion_site=data.get("insertion_site", ""),
                inserted_at=data.get("inserted_at"),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def remove(self, request, pk=None):
        """Closes out the device's device-days window."""
        data = request.data
        return run_service_action(
            lambda: ClinicalSafetyService.remove_device(
                tenant_id=request.tenant_id,
                device_id=pk,
                removal_reason=data.get("removal_reason", ""),
            )
        )

    @action(detail=False, methods=["get"])
    def hai_rates(self, request):
        """Returns CLABSI/CAUTI rates per 1,000 device-days over the trailing window."""
        return run_service_action(
            lambda: ClinicalSafetyService.get_hai_rates(
                tenant_id=request.tenant_id,
                days=int(request.query_params.get("days", 30)),
            )
        )


class DeviceAssociatedInfectionViewSet(HospitalModelViewSet):
    queryset = DeviceAssociatedInfection.objects.all()
    serializer_class = DeviceAssociatedInfectionSerializer
    action_required_roles = {"record": {"physician"}}

    @action(detail=False, methods=["post"])
    def record(self, request):
        """Records a confirmed CLABSI/CAUTI event for a device."""
        data = request.data
        return run_service_action(
            lambda: ClinicalSafetyService.record_device_infection(
                tenant_id=request.tenant_id,
                device_id=data.get("device_id"),
                diagnosed_by=data.get("diagnosed_by", str(request.user)),
                organism=data.get("organism", ""),
                notes=data.get("notes", ""),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class VTEProphylaxisOrderViewSet(HospitalModelViewSet):
    queryset = VTEProphylaxisOrder.objects.all()
    serializer_class = VTEProphylaxisOrderSerializer
    action_required_roles = {"order": {"physician"}}

    @action(detail=False, methods=["post"])
    def order(self, request):
        """Orders (or replaces) the VTE prophylaxis plan for a stay."""
        data = request.data
        return run_service_action(
            lambda: ClinicalSafetyService.order_vte_prophylaxis(
                tenant_id=request.tenant_id,
                stay_id=data.get("stay_id"),
                method=data.get("method"),
                ordered_by=data.get("ordered_by", str(request.user)),
                contraindication_reason=data.get("contraindication_reason", ""),
            ),
            success_status=status.HTTP_201_CREATED,
        )
