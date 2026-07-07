from django.db import models

from platform.common.models import BaseModel


class IncidentReport(BaseModel):
    data_classification = "confidential"

    INCIDENT_TYPE_CHOICES = [
        ("medication_error", "Medication Error"),
        ("fall", "Patient Fall"),
        ("adverse_event", "Adverse Event"),
        ("near_miss", "Near Miss"),
        ("equipment_failure", "Equipment Failure"),
        ("needlestick", "Needlestick/Sharps Injury"),
        ("security", "Security Incident"),
        ("other", "Other"),
    ]
    SEVERITY_CHOICES = [
        ("minor", "Minor"),
        ("moderate", "Moderate"),
        ("major", "Major"),
        ("sentinel", "Sentinel Event"),
    ]
    STATUS_CHOICES = [
        ("reported", "Reported"),
        ("under_investigation", "Under Investigation"),
        ("closed", "Closed"),
    ]

    incident_type = models.CharField(max_length=30, choices=INCIDENT_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    description = models.TextField()
    location = models.CharField(max_length=255, blank=True)
    patient_id = models.UUIDField(null=True, blank=True)
    reported_by = models.UUIDField()
    occurred_at = models.DateTimeField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="reported")

    class Meta:
        db_table = "cymed_hospital_incident_reports"
        ordering = ["-occurred_at"]

    def __str__(self):
        return f"{self.incident_type} ({self.severity}) - {self.status}"


class RootCauseAnalysis(BaseModel):
    incident = models.OneToOneField(
        IncidentReport, on_delete=models.CASCADE, related_name="root_cause_analysis"
    )
    analysis_text = models.TextField()
    contributing_factors = models.TextField(blank=True)
    corrective_actions = models.TextField(blank=True)
    conducted_by = models.UUIDField()
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cymed_hospital_incident_rca"

    def __str__(self):
        return f"RCA for incident {self.incident_id}"
