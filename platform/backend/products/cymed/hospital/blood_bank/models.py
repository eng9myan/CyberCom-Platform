from django.db import models

from platform.common.models import BaseModel
from products.cymed.core.patients.models import Patient

BLOOD_TYPE_CHOICES = [
    ("O-", "O negative"), ("O+", "O positive"),
    ("A-", "A negative"), ("A+", "A positive"),
    ("B-", "B negative"), ("B+", "B positive"),
    ("AB-", "AB negative"), ("AB+", "AB positive"),
]


class BloodDonor(BaseModel):
    data_classification = "phi"

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    blood_type = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES)
    last_donation_date = models.DateField(null=True, blank=True)
    is_eligible = models.BooleanField(default=True)
    ineligibility_reason = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_blood_donors"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.blood_type})"


class BloodUnit(BaseModel):
    data_classification = "phi"

    COMPONENT_CHOICES = [
        ("whole_blood", "Whole Blood"), ("rbc", "Packed Red Blood Cells"),
        ("plasma", "Fresh Frozen Plasma"), ("platelets", "Platelets"), ("cryoprecipitate", "Cryoprecipitate"),
        ("albumin", "Albumin"), ("ivig", "IVIG"),
    ]
    STATUS_CHOICES = [
        ("available", "Available"), ("reserved", "Reserved"),
        ("issued", "Issued"), ("discarded", "Discarded"), ("quarantine", "Quarantine"),
    ]

    unit_number = models.CharField(max_length=100, unique=True)
    donor = models.ForeignKey(BloodDonor, on_delete=models.SET_NULL, null=True, blank=True, related_name="units")
    blood_type = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES)
    component_type = models.CharField(max_length=30, choices=COMPONENT_CHOICES, default="whole_blood")
    collection_date = models.DateField()
    expiry_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="quarantine")
    # Supplier-sourced derivatives (albumin/IVIG) aren't donor-collected units --
    # this stays blank for donor-collected components.
    supplier = models.CharField(max_length=150, blank=True)
    storage_location = models.CharField(max_length=100, blank=True)
    # e.g. ["irradiated", "cmv_negative", "leukoreduced"]
    special_attributes = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "cymed_hospital_blood_units"
        ordering = ["expiry_date"]

    def __str__(self):
        return f"{self.unit_number} ({self.blood_type}, {self.status})"


class CrossmatchRequest(BaseModel):
    data_classification = "phi"

    STATUS_CHOICES = [
        ("pending", "Pending"), ("compatible", "Compatible"),
        ("incompatible", "Incompatible"), ("fulfilled", "Fulfilled"),
    ]
    URGENCY_CHOICES = [
        ("elective", "Elective"), ("urgent", "Urgent"),
        ("emergency", "Emergency"), ("massive_hemorrhage_protocol", "Massive Hemorrhage Protocol"),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="crossmatch_requests")
    blood_type_required = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES)
    units_requested = models.PositiveSmallIntegerField(default=1)
    requested_by = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    urgency = models.CharField(max_length=30, choices=URGENCY_CHOICES, default="elective")
    clinical_indication = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_blood_crossmatch_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Crossmatch for {self.patient_id} ({self.status})"


class BloodCompatibility(BaseModel):
    """Type-and-screen / antibody workup for a patient, independent of any one request."""

    data_classification = "phi"

    ANTIBODY_SCREEN_CHOICES = [
        ("not_done", "Not Done"), ("negative", "Negative"),
        ("positive", "Positive"), ("positive_pending", "Positive - Pending ID"),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="blood_compatibility_records")
    blood_type = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES)
    antibody_screen = models.CharField(max_length=20, choices=ANTIBODY_SCREEN_CHOICES, default="not_done")
    antibodies_identified = models.JSONField(default=list, blank=True)
    special_requirements = models.JSONField(default=list, blank=True)
    verified_by = models.UUIDField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    sample_expiry_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_blood_compatibility"
        ordering = ["-created_at"]
        verbose_name_plural = "blood compatibility records"

    def __str__(self):
        return f"Type & screen for {self.patient_id} ({self.antibody_screen})"


class BloodInventory(BaseModel):
    """Aggregate stock-level row per component/blood-type/location, for reorder alerts."""

    available_units = models.PositiveIntegerField(default=0)
    reserved_units = models.PositiveIntegerField(default=0)
    minimum_threshold = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=0)
    component_type = models.CharField(max_length=30, choices=BloodUnit.COMPONENT_CHOICES, default="whole_blood")
    blood_type = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES)
    storage_location = models.CharField(max_length=100, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cymed_hospital_blood_inventory"
        ordering = ["component_type", "blood_type"]
        unique_together = ("tenant_id", "component_type", "blood_type", "storage_location")
        verbose_name_plural = "blood inventory"

    def __str__(self):
        return f"{self.component_type}/{self.blood_type} @ {self.storage_location}: {self.available_units}"


class BloodIssue(BaseModel):
    data_classification = "phi"

    crossmatch_request = models.ForeignKey(
        CrossmatchRequest, on_delete=models.CASCADE, related_name="issues"
    )
    blood_unit = models.ForeignKey(BloodUnit, on_delete=models.PROTECT, related_name="issue_record")
    issued_by = models.UUIDField()
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cymed_hospital_blood_issues"
        ordering = ["-issued_at"]

    def __str__(self):
        return f"Issue {self.blood_unit.unit_number} for request {self.crossmatch_request_id}"
