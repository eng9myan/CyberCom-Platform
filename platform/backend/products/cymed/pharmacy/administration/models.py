"""
eMAR — electronic Medication Administration Record.

Closes the gap the multi-disciplinary system audit found: prescribing
(pharmacy.prescriptions.MedicationOrder) and pharmacy dispensing
(pharmacy.dispensing.DispenseOrder/DispenseItem) were both real, but
nothing tracked the actual bedside administration event -- no scheduled
dose record, no given/held/refused status, no barcode-scan-at-bedside
confirmation tying patient wristband + drug package to the order. A drug
could be ordered and dispensed with a full interaction check, and then
there was no record of whether it was actually given.
"""

from django.db import models

from platform.common.models import BaseModel
from products.cymed.pharmacy.dispensing.models import DispenseItem
from products.cymed.pharmacy.prescriptions.models import MedicationOrder


class AdministrationStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Scheduled"
    GIVEN = "given", "Given"
    HELD = "held", "Held"
    REFUSED = "refused", "Refused"
    MISSED = "missed", "Missed"
    LATE = "late", "Given Late"


class MedicationAdministrationRecord(BaseModel):
    data_classification = "phi"

    medication_order = models.ForeignKey(
        MedicationOrder, on_delete=models.CASCADE, related_name="administrations"
    )
    dispense_item = models.ForeignKey(
        DispenseItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="administrations",
        help_text="The specific dispensed unit this dose was drawn from, when known.",
    )
    patient_id = models.UUIDField(db_index=True)

    scheduled_at = models.DateTimeField(db_index=True)
    status = models.CharField(
        max_length=20, choices=AdministrationStatus.choices, default=AdministrationStatus.SCHEDULED
    )

    administered_at = models.DateTimeField(null=True, blank=True)
    administered_by = models.UUIDField(null=True, blank=True, help_text="Nurse/provider id")
    dose_given = models.CharField(max_length=100, blank=True)
    route_given = models.CharField(max_length=100, blank=True)
    site = models.CharField(max_length=100, blank=True)

    hold_reason = models.TextField(blank=True)
    refused_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    # "Five rights" bedside barcode verification: patient wristband +
    # drug package, both scanned at the point of administration. Raw
    # scanned values are kept for the audit trail; barcode_match_verified
    # is the actual pass/fail computed by AdministrationService.
    patient_barcode_scanned = models.CharField(max_length=255, blank=True)
    drug_barcode_scanned = models.CharField(max_length=255, blank=True)
    barcode_match_verified = models.BooleanField(default=False)
    barcode_override_reason = models.TextField(
        blank=True, help_text="Required if administered without a matching barcode scan."
    )

    class Meta:
        db_table = "cymed_pharmacy_mar"
        ordering = ["scheduled_at"]
        indexes = [
            models.Index(fields=["patient_id", "scheduled_at"]),
            models.Index(fields=["medication_order", "status"]),
            models.Index(fields=["tenant_id", "status", "scheduled_at"]),
        ]

    def __str__(self):
        return f"MAR({self.medication_order.drug_name}, {self.scheduled_at}, {self.status})"
