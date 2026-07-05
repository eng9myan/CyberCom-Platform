from rest_framework import status
from rest_framework.decorators import action

from products.cymed.hospital.adt.models import (
    Admission,
    AdmissionReason,
    AdmissionType,
    DischargeDisposition,
    DischargeReason,
    DischargeSummary,
    TransferApproval,
    TransferRequest,
)
from products.cymed.hospital.adt.serializers import (
    AdmissionReasonSerializer,
    AdmissionSerializer,
    AdmissionTypeSerializer,
    DischargeDispositionSerializer,
    DischargeReasonSerializer,
    DischargeSummarySerializer,
    TransferApprovalSerializer,
    TransferRequestSerializer,
)
from products.cymed.hospital.services import AdmissionService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class AdmissionReasonViewSet(HospitalModelViewSet):
    queryset = AdmissionReason.objects.all()
    serializer_class = AdmissionReasonSerializer


class AdmissionTypeViewSet(HospitalModelViewSet):
    queryset = AdmissionType.objects.all()
    serializer_class = AdmissionTypeSerializer


class DischargeReasonViewSet(HospitalModelViewSet):
    queryset = DischargeReason.objects.all()
    serializer_class = DischargeReasonSerializer


class DischargeDispositionViewSet(HospitalModelViewSet):
    queryset = DischargeDisposition.objects.all()
    serializer_class = DischargeDispositionSerializer


class AdmissionViewSet(HospitalModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    action_required_roles = {
        "admit": {"physician"},
        "discharge": {"physician"},
        "transfer": {"physician", "nurse"},
    }

    @action(detail=False, methods=["post"])
    def admit(self, request):
        """Admits a patient: creates Admission + HospitalStay, assigns a bed if given."""
        data = request.data
        return run_service_action(
            lambda: AdmissionService.admit_patient(
                tenant_id=request.tenant_id,
                patient_id=data.get("patient_id"),
                encounter_id=data.get("encounter_id"),
                admission_type_id=data.get("admission_type_id"),
                admission_reason_id=data.get("admission_reason_id"),
                admitting_physician_id=data.get("admitting_physician_id", str(request.user)),
                bed_id=data.get("bed_id"),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def discharge(self, request, pk=None):
        """Discharges the admission: closes it, files a summary, releases the bed."""
        data = request.data
        return run_service_action(
            lambda: AdmissionService.discharge_patient(
                tenant_id=request.tenant_id,
                admission_id=pk,
                discharged_by=data.get("discharged_by", str(request.user)),
                disposition_id=data.get("disposition_id"),
                reason_id=data.get("reason_id"),
                summary_text=data.get("summary_text", ""),
                instructions=data.get("instructions", ""),
            )
        )

    @action(detail=True, methods=["post"])
    def transfer(self, request, pk=None):
        """Requests (and auto-approves if possible) a bed transfer for this admission."""
        data = request.data
        return run_service_action(
            lambda: AdmissionService.transfer_patient(
                tenant_id=request.tenant_id,
                admission_id=pk,
                target_bed_id=data.get("target_bed_id"),
                requested_by=data.get("requested_by", str(request.user)),
                reason=data.get("reason", ""),
            )
        )


class TransferRequestViewSet(HospitalModelViewSet):
    queryset = TransferRequest.objects.all()
    serializer_class = TransferRequestSerializer


class TransferApprovalViewSet(HospitalModelViewSet):
    queryset = TransferApproval.objects.all()
    serializer_class = TransferApprovalSerializer


class DischargeSummaryViewSet(HospitalModelViewSet):
    queryset = DischargeSummary.objects.all()
    serializer_class = DischargeSummarySerializer
