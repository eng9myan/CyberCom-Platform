from django.db import models

from platform.common.models import BaseModel


class ResearchProtocol(BaseModel):
    """
    IRB-governed research protocol / clinical study registry entry. Real
    regulatory backbone every hospital research office needs -- an
    approved IRB number is what makes patient enrollment legally possible
    at all.
    """

    data_classification = "confidential"

    PHASE_CHOICES = [
        ("phase_1", "Phase I"),
        ("phase_2", "Phase II"),
        ("phase_3", "Phase III"),
        ("phase_4", "Phase IV"),
        ("observational", "Observational"),
        ("retrospective", "Retrospective Chart Review"),
    ]
    IRB_STATUS_CHOICES = [
        ("submitted", "Submitted"),
        ("approved", "Approved"),
        ("expired", "Expired"),
        ("withdrawn", "Withdrawn"),
        ("suspended", "Suspended"),
    ]

    title = models.CharField(max_length=300)
    principal_investigator_id = models.UUIDField()
    sponsor = models.CharField(max_length=200, blank=True)  # e.g. pharma sponsor, internal, grant-funded
    protocol_number = models.CharField(max_length=100)
    irb_approval_number = models.CharField(max_length=100, blank=True)
    irb_status = models.CharField(max_length=20, choices=IRB_STATUS_CHOICES, default="submitted")
    irb_approval_date = models.DateField(null=True, blank=True)
    irb_expiry_date = models.DateField(null=True, blank=True)
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES)
    target_enrollment = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_research_protocols"
        ordering = ["-irb_approval_date"]
        unique_together = [["tenant_id", "protocol_number"]]
        indexes = [models.Index(fields=["tenant_id", "irb_status"])]

    def __str__(self):
        return f"{self.protocol_number} - {self.title}"

    @property
    def is_actively_enrolling(self) -> bool:
        from django.utils import timezone

        if self.irb_status != "approved":
            return False
        if self.irb_expiry_date and self.irb_expiry_date < timezone.now().date():
            return False
        return True


class StudyEnrollment(BaseModel):
    """
    A patient's real enrollment in a ResearchProtocol -- patient_id is a
    loose UUID (not a Django FK), matching the established cross-app
    convention used throughout rcm/* for referencing core.patients.Patient.
    """

    data_classification = "phi"

    STATUS_CHOICES = [
        ("screening", "Screening"),
        ("enrolled", "Enrolled"),
        ("completed", "Completed"),
        ("withdrawn", "Withdrawn"),
        ("screen_failed", "Screen Failed"),
    ]

    protocol = models.ForeignKey(ResearchProtocol, on_delete=models.CASCADE, related_name="enrollments")
    patient_id = models.UUIDField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="screening")
    consent_obtained = models.BooleanField(default=False)
    consent_date = models.DateField(null=True, blank=True)
    consented_by = models.UUIDField(null=True, blank=True)
    enrolled_at = models.DateField(null=True, blank=True)
    withdrawal_date = models.DateField(null=True, blank=True)
    withdrawal_reason = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_research_enrollments"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant_id", "patient_id"]),
            models.Index(fields=["tenant_id", "status"]),
        ]

    def __str__(self):
        return f"Enrollment(protocol={self.protocol_id}, patient={self.patient_id}, {self.status})"

    def clean(self):
        from django.core.exceptions import ValidationError

        # Real regulatory rule: no enrollment without documented consent.
        if self.status == "enrolled" and not self.consent_obtained:
            raise ValidationError("Cannot mark a subject enrolled without consent_obtained=True.")

    def save(self, *args, **kwargs):
        # Matches the cycom.inventory.StockMovement convention: call
        # clean() directly (not full_clean()) so only this model's own
        # business rule is enforced here, not every field validator.
        self.clean()
        super().save(*args, **kwargs)


class ResearchAdverseEvent(BaseModel):
    """
    Study-specific adverse event -- distinct from incident_reporting.
    IncidentReport (facility-wide safety incidents): an SAE (Serious
    Adverse Event) tied to a research subject has its own IRB-reportable
    workflow and timeline requirements.
    """

    data_classification = "phi"

    SEVERITY_CHOICES = [
        ("mild", "Mild"),
        ("moderate", "Moderate"),
        ("severe", "Severe"),
        ("life_threatening", "Life-Threatening"),
        ("fatal", "Fatal"),
    ]

    enrollment = models.ForeignKey(StudyEnrollment, on_delete=models.CASCADE, related_name="adverse_events")
    event_date = models.DateField()
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    related_to_study = models.BooleanField(help_text="Investigator assessment of causality to the study intervention.")
    reported_to_irb = models.BooleanField(default=False)
    reported_at = models.DateTimeField(null=True, blank=True)
    reported_by = models.UUIDField()

    class Meta:
        db_table = "cymed_hospital_research_adverse_events"
        ordering = ["-event_date"]
        indexes = [models.Index(fields=["tenant_id", "severity"])]

    def __str__(self):
        return f"ResearchAdverseEvent({self.severity}, enrollment={self.enrollment_id})"
