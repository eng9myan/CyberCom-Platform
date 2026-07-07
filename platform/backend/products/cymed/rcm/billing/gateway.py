"""
External invoice ingestion gateway -- POST /api/v1/gateway/external-invoice/.

Scope, per explicit decision: this is an ingest-and-stage endpoint, not an
ingest-and-auto-submit-to-a-government-tax-authority endpoint. A payload from
a third-party or legacy system is validated, mapped into a DRAFT Invoice +
InvoiceLine rows, and logged to the immutable platform.audit.AuditLog -- it
does NOT call ZatcaFatoorahService/JoFotaraISTDService. A staff member
reviews the draft in the existing billing UI and submits it from there, the
same as any other invoice. This was deliberately scoped down from "auto-map
and auto-submit before returning 200" because that combination -- external
parties triggering real government tax submissions with no human in the
loop, no idempotency key, no rate limiting -- is a real financial/compliance
risk to expose in a single pass.

Note on naming: the task asked for this to map into "SalesOrder or PosOrder"
-- neither model exists in this codebase (they belong to CyShop, a separate
deployment/repo). The real, equivalent internal target here is
rcm.billing.Invoice/InvoiceLine, which is what this maps into.
"""
from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from django.db import transaction
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from platform.audit.models import AuditAction, AuditLog
from platform.cyidentity.permissions import HasExternalGatewayAccess
from products.cymed.core.patients.models import Patient

from .models import Invoice, InvoiceLine, PatientAccount, ServiceClassification
from .vat import apply_vat_to_line, nationality_codes_for_patient


class ExternalInvoiceLinePayloadSerializer(serializers.Serializer):
    description = serializers.CharField(max_length=500)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1"))
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    # tax_amount is NOT accepted from the external payload -- an external
    # system self-reporting its own tax figure was the gap this closes; the
    # gateway now computes it itself via vat.apply_vat_to_line() so a
    # third-party system can't under/over-state VAT on ingestion.
    service_classification = serializers.ChoiceField(
        choices=ServiceClassification.choices, default=ServiceClassification.MEDICAL_NECESSITY
    )
    service_code = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    service_date = serializers.DateField(required=False)


class ExternalInvoicePayloadSerializer(serializers.Serializer):
    """
    Minimal, deliberately generic shape: enough for a legacy PMS/EMR or
    retail system to describe an invoice without knowing this platform's
    internal schema. Anything ambiguous fails validation rather than being
    guessed at.
    """

    external_reference = serializers.CharField(max_length=200)
    patient_mrn = serializers.CharField(max_length=100)
    invoice_type = serializers.ChoiceField(
        choices=["patient", "insurance", "corporate", "government"], default="patient"
    )
    currency = serializers.CharField(max_length=3, default="SAR")
    invoice_date = serializers.DateField(required=False)
    lines = ExternalInvoiceLinePayloadSerializer(many=True)

    def validate_lines(self, value):
        if not value:
            raise serializers.ValidationError("At least one invoice line is required.")
        return value


class ExternalInvoiceGatewayView(APIView):
    permission_classes = [IsAuthenticated, HasExternalGatewayAccess]

    def post(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        claims = getattr(request, "auth_claims", {}) or {}
        actor = claims.get("sub", claims.get("azp", "external-gateway"))
        source_system = request.headers.get("X-Source-System", claims.get("azp", "unknown"))

        serializer = ExternalInvoicePayloadSerializer(data=request.data)
        if not serializer.is_valid():
            self._audit(tenant_id, actor, source_system, status_="rejected", detail=serializer.errors)
            return Response({"detail": "Invalid payload.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        patient = Patient.objects.filter(tenant_id=tenant_id, mrn=data["patient_mrn"]).first()
        if patient is None:
            self._audit(
                tenant_id, actor, source_system, status_="rejected",
                detail={"reason": f"No patient found for MRN {data['patient_mrn']}"},
            )
            return Response(
                {"detail": f"No patient found for MRN '{data['patient_mrn']}'."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        try:
            with transaction.atomic():
                account, _ = PatientAccount.objects.get_or_create(
                    tenant_id=tenant_id,
                    patient_id=patient.id,
                    defaults={"account_number": f"ACC-{uuid.uuid4().hex[:10].upper()}"},
                )

                invoice = Invoice.objects.create(
                    tenant_id=tenant_id,
                    patient_account=account,
                    invoice_number=f"EXT-{uuid.uuid4().hex[:10].upper()}",
                    invoice_type=data["invoice_type"],
                    invoice_date=data.get("invoice_date") or date.today(),
                    due_date=data.get("invoice_date") or date.today(),
                    currency=data["currency"],
                    status="draft",  # staged for staff review -- never auto-issued
                    external_source_system=source_system,
                    external_reference=data["external_reference"],
                )

                nationality_codes = nationality_codes_for_patient(patient.id)

                subtotal = Decimal("0")
                tax_total = Decimal("0")
                subsidy_total = Decimal("0")
                for i, line in enumerate(data["lines"], start=1):
                    line_total = (line["quantity"] * line["unit_price"]).quantize(Decimal("0.01"))
                    line_obj = InvoiceLine(
                        tenant_id=tenant_id,
                        invoice=invoice,
                        line_number=i,
                        service_date=line.get("service_date") or invoice.invoice_date,
                        service_code=line.get("service_code", ""),
                        service_description=line["description"],
                        quantity=line["quantity"],
                        unit_price=line["unit_price"],
                        line_total=line_total,
                        service_classification=line["service_classification"],
                    )
                    apply_vat_to_line(line_obj, nationality_codes=nationality_codes)
                    line_obj.save()
                    subtotal += line_total
                    tax_total += line_obj.tax_amount
                    subsidy_total += line_obj.government_subsidy_amount

                # amount_total/amount_tax are the REAL, full legal liability
                # -- what ZATCA/JoFotara see. amount_government_subsidy is a
                # separate reduction of what the PATIENT owes (amount_
                # outstanding), not a change to the invoice's tax reporting.
                invoice.amount_subtotal = subtotal
                invoice.amount_tax = tax_total
                invoice.amount_total = subtotal + tax_total
                invoice.amount_government_subsidy = subsidy_total
                invoice.amount_outstanding = invoice.amount_total - subsidy_total
                invoice.save(update_fields=[
                    "amount_subtotal", "amount_tax", "amount_total",
                    "amount_government_subsidy", "amount_outstanding", "updated_at",
                ])
        except (InvalidOperation, ValueError) as exc:
            self._audit(tenant_id, actor, source_system, status_="rejected", detail={"error": str(exc)})
            return Response({"detail": f"Failed to map payload: {exc}"}, status=status.HTTP_400_BAD_REQUEST)

        self._audit(
            tenant_id, actor, source_system, status_="success",
            detail={"invoice_id": str(invoice.id), "invoice_number": invoice.invoice_number, "raw_payload": request.data},
            resource_id=str(invoice.id),
        )

        return Response(
            {
                "status": "staged_for_review",
                "invoice_id": str(invoice.id),
                "invoice_number": invoice.invoice_number,
                "detail": "Invoice created as a draft. It will not be submitted to any tax authority "
                          "until reviewed and issued by billing staff.",
            },
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _audit(tenant_id, actor: str, source_system: str, *, status_: str, detail: dict[str, Any], resource_id: str = "") -> None:
        AuditLog.objects.create(
            tenant_id=tenant_id,
            user_id=str(actor),
            action=AuditAction.IMPORT,
            resource_type="external_invoice_gateway",
            resource_id=resource_id,
            status="success" if status_ == "success" else "failure",
            description=f"External invoice ingestion from '{source_system}'",
            details={"source_system": source_system, **detail},
        )
