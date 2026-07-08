from django.db import models

from platform.common.models import BaseModel
from products.cymed.hospital.inpatient.models import HospitalStay


class ICUUnitType(models.TextChoices):
    """
    Previously ICUStay had no unit-type distinction at all -- one
    undifferentiated ICU. Real hospitals separate these because staffing
    ratios, equipment, and normal vital-sign ranges differ (a NICU patient's
    normal heart rate is 120-160, an adult MICU patient's is 60-100) --
    ICURound itself is intentionally left shared/generic (age-appropriate
    range validation is a real follow-up, not modeled here) but the unit
    a stay belongs to is now a real, queryable fact.
    """

    MEDICAL_SURGICAL = "micu_sicu", "Medical/Surgical ICU"
    CORONARY_CARE = "ccu", "Coronary Care Unit (CCU)"
    NEONATAL = "nicu", "Neonatal ICU (NICU)"
    PEDIATRIC = "picu", "Pediatric ICU (PICU)"


class ICUStay(BaseModel):
    data_classification = "phi"

    stay = models.OneToOneField(HospitalStay, on_delete=models.CASCADE, related_name="icu_details")
    unit_type = models.CharField(max_length=20, choices=ICUUnitType.choices, default=ICUUnitType.MEDICAL_SURGICAL)
    icu_admitted_at = models.DateTimeField(auto_now_add=True)
    icu_released_at = models.DateTimeField(null=True, blank=True)
    ventilator_status = models.CharField(
        max_length=50, default="none"
    )  # none, non_invasive, invasive
    invasive_lines_count = models.PositiveIntegerField(default=0)

    # NICU-only fields -- blank/null for every other unit_type. Not split
    # into a separate NicuStay model: a OneToOne on HospitalStay already
    # exists here, and NICU stays otherwise share every other ICUStay field
    # (ventilator_status, invasive_lines_count, rounds, critical events).
    gestational_age_weeks = models.PositiveSmallIntegerField(null=True, blank=True)
    birth_weight_grams = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_icu_stays"
        indexes = [models.Index(fields=["tenant_id", "unit_type"])]


class ICURound(BaseModel):
    data_classification = "phi"

    icu_stay = models.ForeignKey(ICUStay, on_delete=models.CASCADE, related_name="rounds")
    recorded_at = models.DateTimeField(auto_now_add=True)
    recorded_by = models.UUIDField()
    heart_rate = models.PositiveIntegerField()
    mean_arterial_pressure = models.PositiveIntegerField()
    temp_c = models.DecimalField(max_digits=4, decimal_places=2)
    resp_rate = models.PositiveIntegerField()
    o2_sat = models.PositiveIntegerField()

    class Meta:
        db_table = "cymed_hospital_icu_rounds"


class ICUAssessment(BaseModel):
    data_classification = "phi"

    icu_stay = models.ForeignKey(ICUStay, on_delete=models.CASCADE)
    assessed_at = models.DateTimeField(auto_now_add=True)
    sofa_score = models.PositiveIntegerField()
    apache_ii_score = models.PositiveIntegerField()
    glasgow_coma_scale = models.PositiveIntegerField()

    class Meta:
        db_table = "cymed_hospital_icu_assessments"


class VentilatorRecord(BaseModel):
    data_classification = "phi"

    icu_stay = models.ForeignKey(ICUStay, on_delete=models.CASCADE)
    logged_at = models.DateTimeField(auto_now_add=True)
    logged_by = models.UUIDField()
    mode = models.CharField(max_length=100)  # AC, SIMV, PSV, CPAP
    fio2_pct = models.PositiveIntegerField()  # Oxygen fraction (e.g. 40 means 40%)
    peep = models.PositiveIntegerField()  # Positive end-expiratory pressure
    rate = models.PositiveIntegerField()  # Respiratory rate on vent

    class Meta:
        db_table = "cymed_hospital_icu_ventilators"


class CriticalEvent(BaseModel):
    data_classification = "phi"

    icu_stay = models.ForeignKey(ICUStay, on_delete=models.CASCADE)
    event_time = models.DateTimeField(auto_now_add=True)
    event_type = models.CharField(max_length=100)  # cardiac_arrest, intubation, line_displacement
    details = models.TextField()
    actions_taken = models.TextField()

    class Meta:
        db_table = "cymed_hospital_icu_critical_events"
