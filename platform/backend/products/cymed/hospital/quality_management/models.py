from django.db import models

from platform.common.models import BaseModel


class QualityIndicator(BaseModel):
    """
    Hospital-wide quality indicator DEFINITION (distinct from
    laboratory.quality/imaging.quality, which are department-level QC for
    test/imaging results, not facility-wide performance indicators like
    readmission rate or patient fall rate).
    """

    CATEGORY_CHOICES = [
        ("patient_safety", "Patient Safety"),
        ("clinical_effectiveness", "Clinical Effectiveness"),
        ("patient_experience", "Patient Experience"),
        ("efficiency", "Efficiency"),
    ]
    DIRECTION_CHOICES = [
        ("higher_is_better", "Higher is Better"),
        ("lower_is_better", "Lower is Better"),
    ]

    name = models.CharField(max_length=200)  # e.g. "30-Day Readmission Rate", "Patient Fall Rate"
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    unit_of_measure = models.CharField(max_length=50)  # e.g. "%", "per 1000 patient-days"
    target_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES, default="lower_is_better")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "cymed_hospital_quality_indicators"
        ordering = ["name"]

    def __str__(self):
        return self.name


class QualityMeasurement(BaseModel):
    indicator = models.ForeignKey(QualityIndicator, on_delete=models.CASCADE, related_name="measurements")
    period_start = models.DateField()
    period_end = models.DateField()
    numerator = models.DecimalField(max_digits=14, decimal_places=2)
    denominator = models.DecimalField(max_digits=14, decimal_places=2)
    recorded_by = models.UUIDField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_quality_measurements"
        ordering = ["-period_end"]
        indexes = [models.Index(fields=["tenant_id", "indicator", "period_end"])]

    def __str__(self):
        return f"{self.indicator.name} {self.period_start}..{self.period_end}"

    @property
    def value(self):
        """Real computed rate -- never store a value the numerator/denominator don't back."""
        if not self.denominator:
            return None
        return round(float(self.numerator) / float(self.denominator) * 100, 2)

    @property
    def meets_target(self) -> bool | None:
        target = self.indicator.target_value
        val = self.value
        if target is None or val is None:
            return None
        if self.indicator.direction == "lower_is_better":
            return val <= float(target)
        return val >= float(target)


class PerformanceImprovementProject(BaseModel):
    """PDSA (Plan-Do-Study-Act) cycle tracking -- the real, standard hospital QI methodology."""

    PHASE_CHOICES = [
        ("plan", "Plan"),
        ("do", "Do"),
        ("study", "Study"),
        ("act", "Act"),
        ("closed", "Closed"),
    ]

    title = models.CharField(max_length=200)
    problem_statement = models.TextField()
    related_indicator = models.ForeignKey(
        QualityIndicator, on_delete=models.SET_NULL, null=True, blank=True, related_name="improvement_projects",
    )
    phase = models.CharField(max_length=10, choices=PHASE_CHOICES, default="plan")
    owner_id = models.UUIDField()
    started_at = models.DateField(auto_now_add=True)
    target_completion_date = models.DateField(null=True, blank=True)
    outcome_summary = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_quality_pip"
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["tenant_id", "phase"])]

    def __str__(self):
        return f"{self.title} ({self.phase})"


class AccreditationStandard(BaseModel):
    ACCREDITING_BODY_CHOICES = [
        ("jci", "Joint Commission International (JCI)"),
        ("cbahi", "Saudi Central Board for Accreditation of Healthcare Institutions (CBAHI)"),
        ("moh", "Ministry of Health"),
        ("iso", "ISO"),
    ]

    code = models.CharField(max_length=50)  # e.g. "COP.1", "IPSG.1"
    title = models.CharField(max_length=255)
    accrediting_body = models.CharField(max_length=20, choices=ACCREDITING_BODY_CHOICES)
    category = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "cymed_hospital_quality_accreditation_standards"
        ordering = ["accrediting_body", "code"]
        unique_together = [["tenant_id", "accrediting_body", "code"]]

    def __str__(self):
        return f"{self.accrediting_body.upper()} {self.code}"


class StandardComplianceAssessment(BaseModel):
    COMPLIANCE_STATUS_CHOICES = [
        ("compliant", "Compliant"),
        ("partially_compliant", "Partially Compliant"),
        ("non_compliant", "Non-Compliant"),
    ]

    standard = models.ForeignKey(AccreditationStandard, on_delete=models.CASCADE, related_name="assessments")
    assessed_at = models.DateField(auto_now_add=True)
    compliance_status = models.CharField(max_length=20, choices=COMPLIANCE_STATUS_CHOICES)
    assessed_by = models.UUIDField()
    evidence_notes = models.TextField(blank=True)
    corrective_action_due = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_quality_compliance_assessments"
        ordering = ["-assessed_at"]
        indexes = [models.Index(fields=["tenant_id", "compliance_status"])]

    def __str__(self):
        return f"{self.standard} - {self.compliance_status}"
