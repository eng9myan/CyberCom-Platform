"""
CPOE unification: when a ProviderOrderRequest is submitted, fan it out to the
real department order system (Pharmacy MedicationOrder, Laboratory LabOrder,
Imaging ImagingOrder) instead of leaving it siloed in the provider portal.

If the order_details a provider entered don't resolve to a real catalog entry
(drug/test/procedure code), the order is held (status="on_hold") with a
recorded reason -- we never fabricate a placeholder catalog row just to make
the fan-out succeed.
"""
from __future__ import annotations

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import OrderStatusUpdate, ProviderOrderRequest


@receiver(post_save, sender=ProviderOrderRequest)
def fan_out_submitted_order(sender, instance: ProviderOrderRequest, created, **kwargs):
    if instance.status != "submitted":
        return

    already_fanned_out = any(
        [instance.cymed_rx_id, instance.cymed_lab_order_id, instance.cymed_imaging_order_id]
    )
    if already_fanned_out:
        return

    handler = _HANDLERS.get(instance.order_category)
    if handler is None:
        # No downstream department system for this category yet (e.g. referral,
        # dietary, physical_therapy) -- leave it submitted with no cross-reference.
        return

    with transaction.atomic():
        handler(instance)


def _hold(order: ProviderOrderRequest, reason: str) -> None:
    previous_status = order.status
    order.status = "on_hold"
    ProviderOrderRequest.objects.filter(pk=order.pk).update(status="on_hold")
    OrderStatusUpdate.objects.create(
        tenant_id=order.tenant_id,
        order=order,
        previous_status=previous_status,
        new_status="on_hold",
        updated_by_system="cpoe_fanout",
        notes=reason,
    )


def _fan_out_medication(order: ProviderOrderRequest) -> None:
    from products.cymed.pharmacy.prescriptions.models import DEASchedule, MedicationOrder

    details = order.order_details or {}
    required = ["drug_code", "drug_name", "dose", "dose_unit", "route", "frequency", "admission_id"]
    missing = [f for f in required if not details.get(f)]
    if missing:
        _hold(order, f"Cannot fan out to Pharmacy: missing {', '.join(missing)} in order_details.")
        return

    order_type = "stat" if order.priority == "stat" else "scheduled"
    med_order = MedicationOrder.objects.create(
        tenant_id=order.tenant_id,
        order_number=f"RX-{order.id.hex[:8].upper()}",
        patient_id=order.patient_id,
        admission_id=details["admission_id"],
        encounter_id=order.cymed_encounter_id,
        prescriber_id=order.ordering_provider_id,
        order_type=order_type,
        priority=order.priority,
        drug_code=details["drug_code"],
        drug_name=details["drug_name"],
        dose=details["dose"],
        dose_unit=details["dose_unit"],
        route=details["route"],
        frequency=details["frequency"],
        start_date=details.get("start_date"),
        stop_date=details.get("stop_date"),
        duration_days=details.get("duration_days", 0),
        is_controlled=details.get("is_controlled", False),
        dea_schedule=details.get("dea_schedule", DEASchedule.NON_CONTROLLED),
    )
    ProviderOrderRequest.objects.filter(pk=order.pk).update(
        status="acknowledged", cymed_rx_id=med_order.id, acknowledged_at=timezone.now()
    )
    OrderStatusUpdate.objects.create(
        tenant_id=order.tenant_id,
        order=order,
        previous_status="submitted",
        new_status="acknowledged",
        updated_by_system="cpoe_fanout",
        notes=f"Fanned out to Pharmacy as {med_order.order_number} (status={med_order.status}).",
    )


def _fan_out_laboratory(order: ProviderOrderRequest) -> None:
    from products.cymed.laboratory.orders.models import LabOrder, LabOrderItem, LabTest

    details = order.order_details or {}
    test_codes = details.get("test_codes") or []
    if not test_codes:
        _hold(order, "Cannot fan out to Laboratory: order_details.test_codes is empty.")
        return

    tests = list(
        LabTest.objects.filter(tenant_id=order.tenant_id, code__in=test_codes, is_active=True)
    )
    resolved_codes = {t.code for t in tests}
    unresolved = [c for c in test_codes if c not in resolved_codes]
    if unresolved:
        _hold(
            order,
            f"Cannot fan out to Laboratory: unknown/inactive test code(s) {', '.join(unresolved)}.",
        )
        return

    lab_order = LabOrder.objects.create(
        tenant_id=order.tenant_id,
        order_number=f"LAB-{order.id.hex[:8].upper()}",
        patient_id=order.patient_id,
        encounter_id=order.cymed_encounter_id,
        admission_id=details.get("admission_id"),
        order_type="hospital",
        priority=order.priority,
        status="submitted",
        ordered_by=order.ordering_provider_id,
        clinical_notes=order.clinical_indication,
        requested_at=timezone.now(),
    )
    for test in tests:
        LabOrderItem.objects.create(
            tenant_id=order.tenant_id,
            order=lab_order,
            test=test,
            priority=order.priority,
        )
    ProviderOrderRequest.objects.filter(pk=order.pk).update(
        status="acknowledged", cymed_lab_order_id=lab_order.id, acknowledged_at=timezone.now()
    )
    OrderStatusUpdate.objects.create(
        tenant_id=order.tenant_id,
        order=order,
        previous_status="submitted",
        new_status="acknowledged",
        updated_by_system="cpoe_fanout",
        notes=f"Fanned out to Laboratory as {lab_order.order_number} ({len(tests)} test(s)).",
    )


def _fan_out_imaging(order: ProviderOrderRequest) -> None:
    from products.cymed.imaging.orders.models import ImagingOrder, ImagingOrderItem, ImagingProcedure

    details = order.order_details or {}
    procedure_codes = details.get("procedure_codes") or []
    if not procedure_codes:
        _hold(order, "Cannot fan out to Imaging: order_details.procedure_codes is empty.")
        return

    procedures = list(
        ImagingProcedure.objects.filter(
            tenant_id=order.tenant_id, code__in=procedure_codes, is_active=True
        )
    )
    resolved_codes = {p.code for p in procedures}
    unresolved = [c for c in procedure_codes if c not in resolved_codes]
    if unresolved:
        _hold(
            order,
            f"Cannot fan out to Imaging: unknown/inactive procedure code(s) {', '.join(unresolved)}.",
        )
        return

    img_order = ImagingOrder.objects.create(
        tenant_id=order.tenant_id,
        order_number=f"IMG-{order.id.hex[:8].upper()}",
        patient_id=order.patient_id,
        encounter_id=order.cymed_encounter_id,
        ordered_by=order.ordering_provider_id,
        priority=order.priority,
        order_type="inpatient",
        clinical_indication=order.clinical_indication,
        icd11_codes=details.get("icd11_codes", []),
        status="pending",
    )
    for proc in procedures:
        ImagingOrderItem.objects.create(
            tenant_id=order.tenant_id,
            order=img_order,
            procedure=proc,
            contrast_required=proc.contrast_required,
        )
    ProviderOrderRequest.objects.filter(pk=order.pk).update(
        status="acknowledged", cymed_imaging_order_id=img_order.id, acknowledged_at=timezone.now()
    )
    OrderStatusUpdate.objects.create(
        tenant_id=order.tenant_id,
        order=order,
        previous_status="submitted",
        new_status="acknowledged",
        updated_by_system="cpoe_fanout",
        notes=f"Fanned out to Imaging as {img_order.order_number} ({len(procedures)} procedure(s)).",
    )


_HANDLERS = {
    "medication": _fan_out_medication,
    "laboratory": _fan_out_laboratory,
    "imaging": _fan_out_imaging,
}
