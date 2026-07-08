from django.db import models

from platform.common.models import BaseModel


class RehabDiscipline(models.TextChoices):
    PHYSICAL_THERAPY = "physical_therapy", "Physical Therapy"
    OCCUPATIONAL_THERAPY = "occupational_therapy", "Occupational Therapy"
    SPEECH_THERAPY = "speech_therapy", "Speech Therapy"


class RehabReferral(BaseModel):
    """
    patient_id is a loose UUID (not a Django FK), matching the established
    rcm/* convention -- rehab serves BOTH inpatients (referred mid-stay)
    and standalone outpatients (Outpatient Rehab Center), so this
    deliberately doesn't force a HospitalStay FK the way ICUStay does.
    """

    data_classification = "phi"

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("discontinued", "Discontinued"),
    ]

    patient_id = models.UUIDField(db_index=True)
    discipline = models.CharField(max_length=30, choices=RehabDiscipline.choices)
    referring_provider_id = models.UUIDField()
    diagnosis = models.CharField(max_length=255)  # free-text clinical diagnosis driving the referral
    referred_at = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    class Meta:
        db_table = "cymed_hospital_rehab_referrals"
        ordering = ["-referred_at"]
        indexes = [
            models.Index(fields=["tenant_id", "patient_id"]),
            models.Index(fields=["tenant_id", "status"]),
        ]

    def __str__(self):
        return f"RehabReferral({self.discipline}, patient={self.patient_id})"


class TreatmentPlan(BaseModel):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("discontinued", "Discontinued"),
    ]

    referral = models.OneToOneField(RehabReferral, on_delete=models.CASCADE, related_name="treatment_plan")
    goals = models.TextField()
    frequency_per_week = models.PositiveSmallIntegerField(default=3)
    duration_weeks = models.PositiveSmallIntegerField(default=6)
    therapist_id = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    class Meta:
        db_table = "cymed_hospital_rehab_treatment_plans"
        ordering = ["-created_at"]

    def __str__(self):
        return f"TreatmentPlan(referral={self.referral_id}, {self.status})"


class TherapySession(BaseModel):
    plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name="sessions")
    session_date = models.DateField()
    duration_minutes = models.PositiveSmallIntegerField()
    therapist_id = models.UUIDField()
    activities = models.TextField()
    patient_response = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_rehab_sessions"
        ordering = ["-session_date"]

    def __str__(self):
        return f"TherapySession({self.plan_id}, {self.session_date})"


class OutcomeMeasurement(BaseModel):
    """
    Real standardized outcome-measure tracking (FIM, ROM, pain scale, etc.)
    -- what actually demonstrates whether therapy is working, not just
    that sessions happened.
    """

    MEASURE_TYPE_CHOICES = [
        ("fim", "Functional Independence Measure (FIM)"),
        ("rom", "Range of Motion"),
        ("pain_scale", "Pain Scale (0-10)"),
        ("gait_speed", "Gait Speed"),
        ("mmse", "Mini-Mental State Examination"),  # cognitive/speech-therapy relevant
    ]

    plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name="outcome_measurements")
    measured_at = models.DateField(auto_now_add=True)
    measure_type = models.CharField(max_length=20, choices=MEASURE_TYPE_CHOICES)
    score = models.DecimalField(max_digits=6, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_rehab_outcome_measurements"
        ordering = ["-measured_at"]

    def __str__(self):
        return f"OutcomeMeasurement({self.measure_type}={self.score})"
