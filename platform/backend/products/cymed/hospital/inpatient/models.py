from django.db import models

from platform.common.models import BaseModel
from products.cymed.hospital.adt.models import Admission


class HospitalStay(BaseModel):
    class CodeStatus(models.TextChoices):
        FULL_CODE = "full_code", "Full Code"
        DNR = "dnr", "Do Not Resuscitate"
        DNI = "dni", "Do Not Intubate"
        DNR_DNI = "dnr_dni", "DNR/DNI"
        COMFORT_CARE = "comfort_care", "Comfort Care Only"

    data_classification = "phi"

    admission = models.OneToOneField(Admission, on_delete=models.CASCADE, related_name="stay")
    care_team_leader_id = models.UUIDField()
    expected_length_of_stay = models.PositiveIntegerField(default=3)
    actual_length_of_stay = models.PositiveIntegerField(null=True, blank=True)
    # Denormalized for fast reads (ICU/nursing/OR safety checks); source of truth is
    # the CodeStatusOrder audit trail below -- never overwrite this without creating an order.
    current_code_status = models.CharField(
        max_length=20, choices=CodeStatus.choices, default=CodeStatus.FULL_CODE
    )

    class Meta:
        db_table = "cymed_hospital_stays"


class CodeStatusOrder(BaseModel):
    """
    Immutable audit trail of code-status (resuscitation directive) changes.
    Never update in place -- each change is a new order, medico-legally.
    """

    data_classification = "phi"

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE, related_name="code_status_orders")
    status = models.CharField(max_length=20, choices=HospitalStay.CodeStatus.choices)
    ordered_by = models.UUIDField()
    ordered_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)
    discussed_with_patient = models.BooleanField(default=False)
    discussed_with_family = models.BooleanField(default=False)

    class Meta:
        db_table = "cymed_hospital_code_status_orders"
        ordering = ["-ordered_at"]


class IndwellingDevice(BaseModel):
    """
    HAI surveillance anchor: central lines and urinary catheters, tracked with
    device-days for CLABSI/CAUTI rate calculation (infections per 1,000 device-days).
    """

    class DeviceType(models.TextChoices):
        CENTRAL_LINE = "central_line", "Central Line (CLABSI surveillance)"
        FOLEY_CATHETER = "foley_catheter", "Urinary Catheter (CAUTI surveillance)"
        ARTERIAL_LINE = "arterial_line", "Arterial Line"
        PICC = "picc", "PICC Line (CLABSI surveillance)"

    data_classification = "phi"

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE, related_name="indwelling_devices")
    device_type = models.CharField(max_length=20, choices=DeviceType.choices)
    insertion_site = models.CharField(max_length=100, blank=True)
    inserted_at = models.DateTimeField()
    inserted_by = models.UUIDField()
    removed_at = models.DateTimeField(null=True, blank=True)
    removal_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cymed_hospital_indwelling_devices"


class DeviceAssociatedInfection(BaseModel):
    """CLABSI/CAUTI event -- a confirmed infection attributable to an IndwellingDevice."""

    data_classification = "phi"

    device = models.ForeignKey(
        IndwellingDevice, on_delete=models.CASCADE, related_name="infections"
    )
    diagnosed_at = models.DateTimeField(auto_now_add=True)
    diagnosed_by = models.UUIDField()
    organism = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_device_associated_infections"


class VTEProphylaxisOrder(BaseModel):
    """VTE (venous thromboembolism) prophylaxis order -- a standard core measure/quality metric."""

    class Method(models.TextChoices):
        PHARMACOLOGIC = "pharmacologic", "Pharmacologic"
        MECHANICAL = "mechanical", "Mechanical (SCDs/compression stockings)"
        BOTH = "both", "Pharmacologic + Mechanical"
        CONTRAINDICATED = "contraindicated", "Contraindicated"

    data_classification = "phi"

    stay = models.OneToOneField(
        HospitalStay, on_delete=models.CASCADE, related_name="vte_prophylaxis"
    )
    method = models.CharField(max_length=20, choices=Method.choices)
    ordered_by = models.UUIDField()
    ordered_at = models.DateTimeField(auto_now_add=True)
    contraindication_reason = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_vte_prophylaxis_orders"


class DailyRound(BaseModel):
    data_classification = "phi"

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE, related_name="rounds")
    clinician_id = models.UUIDField()
    round_time = models.DateTimeField(auto_now_add=True)
    subjective_notes = models.TextField()
    objective_notes = models.TextField()
    assessment_notes = models.TextField()
    plan_notes = models.TextField()

    class Meta:
        db_table = "cymed_hospital_daily_rounds"


class ProgressReview(BaseModel):
    data_classification = "phi"

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE)
    reviewed_at = models.DateTimeField(auto_now_add=True)
    reviewer_id = models.UUIDField()
    progress_status = models.CharField(max_length=50)  # improving, stable, deteriorating

    class Meta:
        db_table = "cymed_hospital_progress_reviews"


class InpatientCarePlan(BaseModel):
    data_classification = "phi"

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    goals = models.TextField()
    interventions = models.TextField()

    class Meta:
        db_table = "cymed_hospital_inpatient_careplans"


class DischargePlanning(BaseModel):
    data_classification = "phi"

    stay = models.OneToOneField(
        HospitalStay, on_delete=models.CASCADE, related_name="discharge_plan"
    )
    target_discharge_date = models.DateField()
    barriers_to_discharge = models.TextField(blank=True)
    is_cleared = models.BooleanField(default=False)

    class Meta:
        db_table = "cymed_hospital_discharge_planning"
