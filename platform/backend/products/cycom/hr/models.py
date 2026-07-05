from datetime import date

from django.db import models

from platform.common.models import BaseModel


class Department(BaseModel):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50)

    class Meta:
        db_table = "cycom_hr_departments"

    def __str__(self):
        return f"{self.code} - {self.name}"


class Employee(BaseModel):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("on_leave", "On Leave"),
        ("terminated", "Terminated"),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    job_title = models.CharField(max_length=150)
    hire_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    is_clinical_staff = models.BooleanField(
        default=False,
        help_text="Physicians, nurses, pharmacists, techs -- anyone whose license must be tracked.",
    )

    class Meta:
        db_table = "cycom_hr_employees"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Attendance(BaseModel):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="present")

    class Meta:
        db_table = "cycom_hr_attendance"

    def __str__(self):
        return f"{self.employee} ({self.check_in.date()})"


class LeaveRequest(BaseModel):
    LEAVE_TYPE_CHOICES = [
        ("annual", "Annual"),
        ("sick", "Sick"),
        ("unpaid", "Unpaid"),
        ("parental", "Parental"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    approved_by = models.UUIDField(null=True, blank=True)
    reason = models.TextField(blank=True)

    class Meta:
        db_table = "cycom_hr_leave_requests"


class ClinicalCredential(BaseModel):
    CREDENTIAL_TYPE_CHOICES = [
        ("medical_license", "Medical License"),
        ("nursing_license", "Nursing License"),
        ("pharmacy_license", "Pharmacy License"),
        ("board_certification", "Board Certification"),
        ("dea_registration", "DEA Registration"),
        ("npi", "National Provider Identifier"),
        ("bls_cpr", "BLS / CPR"),
        ("acls", "ACLS"),
        ("other", "Other"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("suspended", "Suspended"),
        ("revoked", "Revoked"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="credentials",
    )
    credential_type = models.CharField(max_length=30, choices=CREDENTIAL_TYPE_CHOICES)
    license_number = models.CharField(max_length=100, blank=True)
    issuing_body = models.CharField(max_length=200, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    verified = models.BooleanField(default=False)
    verified_by = models.UUIDField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    document_ref = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "cycom_hr_clinical_credentials"
        ordering = ["expiry_date"]

    def __str__(self):
        return f"{self.employee} - {self.credential_type} (exp {self.expiry_date})"

    @property
    def is_expired(self) -> bool:
        return date.today() > self.expiry_date

    @property
    def days_until_expiry(self) -> int:
        return (self.expiry_date - date.today()).days


class PerformanceReview(BaseModel):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    reviewer_id = models.UUIDField()
    review_date = models.DateField()
    rating = models.PositiveIntegerField()  # 1 to 5
    feedback = models.TextField()

    class Meta:
        db_table = "cycom_hr_performance_reviews"
