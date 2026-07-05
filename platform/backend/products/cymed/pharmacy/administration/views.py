from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.cymed.pharmacy.administration.models import (
    AdministrationStatus,
    MedicationAdministrationRecord,
)
from products.cymed.pharmacy.administration.serializers import (
    MedicationAdministrationRecordSerializer,
)

# A dose given more than this long after its scheduled time is recorded as
# "late" rather than "given" -- a real, if simple, lateness threshold rather
# than treating every administration as on-time regardless of when it
# actually happened.
LATE_THRESHOLD_MINUTES = 60


def _write_mar_audit(
    *, tenant_id, action_name: str, mar_id: str, actor_user_id: str, outcome_description: str = ""
) -> None:
    try:
        from platform.audit.services import AuditService

        AuditService().record(
            action=action_name,
            action_verb="UPDATE",
            resource_type="MedicationAdministrationRecord",
            resource_id=str(mar_id),
            tenant_id=tenant_id,
            actor_user_id=str(actor_user_id),
            category="clinical",
            data_classification="phi",
            outcome_description=outcome_description,
        )
    except Exception:
        import logging

        logging.getLogger("cybercom.pharmacy.administration").exception(
            f"Failed to write audit record for {action_name} on MAR {mar_id}"
        )


class MedicationAdministrationRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicationAdministrationRecord.objects.all()
    serializer_class = MedicationAdministrationRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        if tenant_id:
            return self.queryset.filter(tenant_id=tenant_id)
        return self.queryset.none()

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id)

    @action(detail=True, methods=["post"])
    def administer(self, request, pk=None):
        """
        Records a dose as given, enforcing the "five rights" bedside
        barcode check: the scanned patient wristband must match the real
        patient's MRN and the scanned drug barcode must match the ordered
        drug code. A mismatch (or missing scan) blocks administration
        unless an explicit, audited override_reason is supplied -- matching
        the same override-with-justification pattern already used by
        pharmacy.drug_interactions for allergy/interaction overrides.
        """
        mar = self.get_object()
        data = request.data
        tenant_id = getattr(request, "tenant_id", None)
        actor_user_id = data.get("administered_by") or str(request.user)

        patient_barcode = data.get("patient_barcode_scanned", "")
        drug_barcode = data.get("drug_barcode_scanned", "")
        override_reason = data.get("barcode_override_reason", "")

        from products.cymed.core.patients.models import Patient

        try:
            patient = Patient.objects.get(id=mar.patient_id, tenant_id=tenant_id)
        except Patient.DoesNotExist:
            return Response({"detail": "Patient not found for this MAR entry."}, status=404)

        barcode_match = bool(patient_barcode) and bool(drug_barcode) and (
            patient_barcode == patient.mrn and drug_barcode == mar.medication_order.drug_code
        )

        if not barcode_match and not override_reason:
            return Response(
                {
                    "detail": (
                        "Barcode verification failed or was not performed. "
                        "Provide barcode_override_reason to administer anyway."
                    ),
                    "barcode_match_verified": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        minutes_late = (now - mar.scheduled_at).total_seconds() / 60
        mar.status = (
            AdministrationStatus.LATE if minutes_late > LATE_THRESHOLD_MINUTES else AdministrationStatus.GIVEN
        )
        mar.administered_at = now
        mar.administered_by = actor_user_id
        mar.dose_given = data.get("dose_given", mar.medication_order.dose)
        mar.route_given = data.get("route_given", mar.medication_order.route)
        mar.site = data.get("site", "")
        mar.patient_barcode_scanned = patient_barcode
        mar.drug_barcode_scanned = drug_barcode
        mar.barcode_match_verified = barcode_match
        mar.barcode_override_reason = override_reason
        mar.save()

        _write_mar_audit(
            tenant_id=tenant_id,
            action_name="mar.administered",
            mar_id=mar.id,
            actor_user_id=actor_user_id,
            outcome_description=(
                f"status={mar.status}, barcode_verified={barcode_match}"
                + (f", override: {override_reason}" if override_reason else "")
            ),
        )
        return Response(MedicationAdministrationRecordSerializer(mar).data)

    @action(detail=True, methods=["post"])
    def hold(self, request, pk=None):
        mar = self.get_object()
        reason = request.data.get("hold_reason", "")
        if not reason:
            return Response({"detail": "hold_reason is required."}, status=400)
        mar.status = AdministrationStatus.HELD
        mar.hold_reason = reason
        mar.save(update_fields=["status", "hold_reason", "updated_at"])
        _write_mar_audit(
            tenant_id=getattr(request, "tenant_id", None),
            action_name="mar.held",
            mar_id=mar.id,
            actor_user_id=str(request.user),
            outcome_description=reason,
        )
        return Response(MedicationAdministrationRecordSerializer(mar).data)

    @action(detail=True, methods=["post"])
    def refuse(self, request, pk=None):
        mar = self.get_object()
        reason = request.data.get("refused_reason", "")
        if not reason:
            return Response({"detail": "refused_reason is required."}, status=400)
        mar.status = AdministrationStatus.REFUSED
        mar.refused_reason = reason
        mar.save(update_fields=["status", "refused_reason", "updated_at"])
        _write_mar_audit(
            tenant_id=getattr(request, "tenant_id", None),
            action_name="mar.refused",
            mar_id=mar.id,
            actor_user_id=str(request.user),
            outcome_description=reason,
        )
        return Response(MedicationAdministrationRecordSerializer(mar).data)
