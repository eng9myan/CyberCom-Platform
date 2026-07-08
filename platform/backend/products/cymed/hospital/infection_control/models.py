from django.db import models

from platform.common.models import BaseModel
from products.cymed.hospital.inpatient.models import HospitalStay


class IsolationPrecaution(BaseModel):
    """
    Real infection-control workflow: a patient placed on isolation
    precautions during a stay. FK (not OneToOne like ICUStay) because a
    single stay can carry multiple precaution periods sequentially (e.g.
    contact precautions for MRSA, later lifted, then droplet precautions
    for a separate flu diagnosis).
    """

    data_classification = "phi"

    PRECAUTION_TYPE_CHOICES = [
        ("contact", "Contact"),
        ("droplet", "Droplet"),
        ("airborne", "Airborne"),
        ("protective", "Protective (Reverse) Isolation"),
        ("contact_enteric", "Contact Enteric (C. diff)"),
    ]

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE, related_name="isolation_precautions")
    precaution_type = models.CharField(max_length=30, choices=PRECAUTION_TYPE_CHOICES)
    reason = models.CharField(max_length=255)  # e.g. "MRSA colonization", "confirmed influenza A"
    ordered_by = models.UUIDField()
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_infection_control_isolation"
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["tenant_id", "ended_at"])]

    def __str__(self):
        return f"IsolationPrecaution({self.precaution_type}, stay={self.stay_id})"

    @property
    def is_active(self) -> bool:
        return self.ended_at is None


class HAICase(BaseModel):
    """
    Healthcare-Associated Infection surveillance case. Site classification
    follows the real, standard CDC/NHSN HAI categories (device-associated
    infections are the ones facilities are actually required to report
    under most national surveillance programs).
    """

    data_classification = "phi"

    INFECTION_SITE_CHOICES = [
        ("clabsi", "Central Line-Associated Bloodstream Infection (CLABSI)"),
        ("cauti", "Catheter-Associated Urinary Tract Infection (CAUTI)"),
        ("ssi", "Surgical Site Infection (SSI)"),
        ("vap", "Ventilator-Associated Pneumonia (VAP)"),
        ("c_diff", "Clostridioides difficile Infection"),
        ("other", "Other HAI"),
    ]
    STATUS_CHOICES = [
        ("suspected", "Suspected"),
        ("confirmed", "Confirmed"),
        ("ruled_out", "Ruled Out"),
        ("resolved", "Resolved"),
    ]

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE, related_name="hai_cases")
    infection_site = models.CharField(max_length=20, choices=INFECTION_SITE_CHOICES)
    device_associated = models.BooleanField(default=False)  # true for CLABSI/CAUTI/VAP -- device-days denominator
    onset_date = models.DateField()
    organism = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="suspected")
    reported_by = models.UUIDField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_infection_control_hai_cases"
        ordering = ["-onset_date"]
        indexes = [
            models.Index(fields=["tenant_id", "infection_site"]),
            models.Index(fields=["tenant_id", "status"]),
        ]

    def __str__(self):
        return f"HAICase({self.infection_site}, {self.status})"


class HandHygieneObservation(BaseModel):
    """
    Direct-observation hand hygiene audit (the real WHO "5 Moments for Hand
    Hygiene" methodology most infection-control programs use) -- distinct
    from housekeeping.HygieneAudit, which scores environmental/surface
    cleanliness of a LOCATION, not clinical staff hand-hygiene compliance
    at the point of patient contact.
    """

    MOMENT_CHOICES = [
        ("before_patient_contact", "Before Patient Contact"),
        ("before_aseptic_procedure", "Before Aseptic Procedure"),
        ("after_body_fluid_exposure", "After Body Fluid Exposure Risk"),
        ("after_patient_contact", "After Patient Contact"),
        ("after_patient_surroundings", "After Touching Patient Surroundings"),
    ]

    unit = models.CharField(max_length=100)  # e.g. "ICU", "Ward 3B"
    observed_staff_id = models.UUIDField()
    moment = models.CharField(max_length=30, choices=MOMENT_CHOICES)
    compliant = models.BooleanField()
    observed_by = models.UUIDField()
    observed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cymed_hospital_infection_control_hand_hygiene"
        ordering = ["-observed_at"]
        indexes = [models.Index(fields=["tenant_id", "unit"])]

    def __str__(self):
        return f"HandHygieneObservation({self.unit}, compliant={self.compliant})"


class OutbreakInvestigation(BaseModel):
    STATUS_CHOICES = [
        ("investigating", "Investigating"),
        ("contained", "Contained"),
        ("closed", "Closed"),
    ]

    name = models.CharField(max_length=200)
    suspected_pathogen = models.CharField(max_length=200, blank=True)
    unit_affected = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    case_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="investigating")
    lead_investigator_id = models.UUIDField()
    summary = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_infection_control_outbreaks"
        ordering = ["-start_date"]
        indexes = [models.Index(fields=["tenant_id", "status"])]

    def __str__(self):
        return f"OutbreakInvestigation({self.name}, {self.status})"
