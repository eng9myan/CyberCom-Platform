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

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="crossmatch_requests")
    blood_type_required = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES)
    units_requested = models.PositiveSmallIntegerField(default=1)
    requested_by = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_blood_crossmatch_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Crossmatch for {self.patient_id} ({self.status})"


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
