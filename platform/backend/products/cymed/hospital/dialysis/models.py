from django.db import models

from platform.common.models import BaseModel


class DialysisModality(models.TextChoices):
    HEMODIALYSIS = "hemodialysis", "Hemodialysis"
    PERITONEAL_DIALYSIS = "peritoneal_dialysis", "Peritoneal Dialysis"


class VascularAccess(BaseModel):
    """
    patient_id is a loose UUID (not a Django FK), matching the established
    rehab/rcm convention -- dialysis serves both inpatients and standalone
    outpatient dialysis-center patients.
    """

    data_classification = "phi"

    ACCESS_TYPE_CHOICES = [
        ("av_fistula", "AV Fistula"),
        ("av_graft", "AV Graft"),
        ("central_catheter", "Central Venous Catheter"),
        ("peritoneal_catheter", "Peritoneal Catheter"),
    ]
    STATUS_CHOICES = [
        ("maturing", "Maturing"),
        ("active", "Active"),
        ("failed", "Failed"),
        ("removed", "Removed"),
    ]

    patient_id = models.UUIDField(db_index=True)
    access_type = models.CharField(max_length=30, choices=ACCESS_TYPE_CHOICES)
    site = models.CharField(max_length=100)  # e.g. "left forearm", "right IJ"
    placed_by_provider_id = models.UUIDField()
    placed_at = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="maturing")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_dialysis_vascular_access"
        ordering = ["-placed_at"]
        indexes = [
            models.Index(fields=["tenant_id", "patient_id"]),
            models.Index(fields=["tenant_id", "status"]),
        ]

    def __str__(self):
        return f"VascularAccess({self.access_type}, patient={self.patient_id})"


class DialysisMachine(BaseModel):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("in_use", "In Use"),
        ("maintenance", "Maintenance"),
        ("out_of_service", "Out of Service"),
    ]

    asset_tag = models.CharField(max_length=100, unique=True)
    manufacturer = models.CharField(max_length=150, blank=True)
    model = models.CharField(max_length=150, blank=True)
    room = models.ForeignKey(
        "cymed_facilities.Room", on_delete=models.SET_NULL, null=True, blank=True, related_name="dialysis_machines"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    last_serviced_at = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_dialysis_machines"
        ordering = ["asset_tag"]

    def __str__(self):
        return f"DialysisMachine({self.asset_tag}, {self.status})"


class DialysisOrder(BaseModel):
    """
    The clinical order authorizing dialysis treatment -- mirrors
    RehabReferral's role in the rehab module.
    """

    data_classification = "phi"

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("discontinued", "Discontinued"),
    ]

    patient_id = models.UUIDField(db_index=True)
    modality = models.CharField(max_length=30, choices=DialysisModality.choices)
    referring_provider_id = models.UUIDField()
    diagnosis = models.CharField(max_length=255)  # e.g. "ESRD secondary to diabetic nephropathy"
    ordered_at = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    class Meta:
        db_table = "cymed_hospital_dialysis_orders"
        ordering = ["-ordered_at"]
        indexes = [
            models.Index(fields=["tenant_id", "patient_id"]),
            models.Index(fields=["tenant_id", "status"]),
        ]

    def __str__(self):
        return f"DialysisOrder({self.modality}, patient={self.patient_id})"


class DialysisCarePlan(BaseModel):
    """
    The recurring-treatment schedule (e.g. "3x/week, 4hr sessions") that
    DialysisSession instances are logged against. Separate from
    DialysisOrder the same way rehab's TreatmentPlan is separate from
    RehabReferral -- the order authorizes treatment, the plan defines cadence.
    """

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("discontinued", "Discontinued"),
    ]

    order = models.OneToOneField(DialysisOrder, on_delete=models.CASCADE, related_name="care_plan")
    vascular_access = models.ForeignKey(
        VascularAccess, on_delete=models.PROTECT, related_name="care_plans"
    )
    frequency_per_week = models.PositiveSmallIntegerField(default=3)
    session_duration_hours = models.DecimalField(max_digits=3, decimal_places=1, default=4.0)
    dry_weight_kg = models.DecimalField(max_digits=5, decimal_places=2)
    dialyzer_type = models.CharField(max_length=100, blank=True)
    nephrologist_id = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    class Meta:
        db_table = "cymed_hospital_dialysis_care_plans"
        ordering = ["-created_at"]

    def __str__(self):
        return f"DialysisCarePlan(order={self.order_id}, {self.status})"


class DialysisSession(BaseModel):
    """
    A single dialysis treatment encounter -- the recurring event that
    happens frequency_per_week times against the care plan.
    """

    data_classification = "phi"

    plan = models.ForeignKey(DialysisCarePlan, on_delete=models.CASCADE, related_name="sessions")
    machine = models.ForeignKey(
        DialysisMachine, on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions"
    )
    technician_id = models.UUIDField()
    session_date = models.DateField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    pre_weight_kg = models.DecimalField(max_digits=5, decimal_places=2)
    post_weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fluid_removed_liters = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    pre_bp_sys = models.PositiveIntegerField()
    pre_bp_dia = models.PositiveIntegerField()
    post_bp_sys = models.PositiveIntegerField(null=True, blank=True)
    post_bp_dia = models.PositiveIntegerField(null=True, blank=True)
    blood_flow_rate_ml_min = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_dialysis_sessions"
        ordering = ["-session_date", "-start_time"]
        indexes = [
            models.Index(fields=["tenant_id", "plan", "session_date"]),
        ]

    def __str__(self):
        return f"DialysisSession(plan={self.plan_id}, {self.session_date})"


class DialysisComplication(BaseModel):
    """
    Structured complication log -- separate from DialysisSession.notes so
    complication rate can actually be queried/reported on, not buried in
    free text.
    """

    data_classification = "phi"

    COMPLICATION_TYPE_CHOICES = [
        ("hypotension", "Intradialytic Hypotension"),
        ("cramping", "Muscle Cramping"),
        ("access_clotting", "Access Clotting"),
        ("access_infection", "Access Infection"),
        ("bleeding", "Bleeding"),
        ("chest_pain", "Chest Pain"),
        ("nausea_vomiting", "Nausea/Vomiting"),
        ("other", "Other"),
    ]
    SEVERITY_CHOICES = [
        ("mild", "Mild"),
        ("moderate", "Moderate"),
        ("severe", "Severe"),
    ]

    session = models.ForeignKey(DialysisSession, on_delete=models.CASCADE, related_name="complications")
    complication_type = models.CharField(max_length=30, choices=COMPLICATION_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="mild")
    action_taken = models.TextField()
    reported_by_id = models.UUIDField()
    reported_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cymed_hospital_dialysis_complications"
        ordering = ["-reported_at"]

    def __str__(self):
        return f"DialysisComplication({self.complication_type}, session={self.session_id})"
