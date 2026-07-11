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
    national_id = models.CharField(
        max_length=50, blank=True, help_text="National ID / civil registry number, required by WPS export."
    )
    bank_iban = models.CharField(
        max_length=34, blank=True, help_text="IBAN salary is paid to, required by WPS export."
    )
    monthly_basic_salary = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True,
        help_text="Base monthly salary used to derive the hourly rate for overtime/shift-differential "
        "calculation (basic / STANDARD_MONTHLY_HOURS) and as the payslip default.",
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


class ShiftTemplate(BaseModel):
    """
    Reusable shift definition (e.g. "Day Shift 07:00-15:00") that
    ShiftAssignment rows are built against. Covers general (non-nursing)
    staff -- lab, pharmacy, security, housekeeping, admin. Nursing has its
    own ward-scoped NursingShift/NursingAssignment in the hospital module;
    this is the equivalent for everyone else.
    """

    name = models.CharField(max_length=100)  # "Day Shift", "Night Shift", "Rotating A"
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_night_shift = models.BooleanField(default=False)
    differential_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Pay premium applied on top of base hourly rate for working this shift "
        "(e.g. 15.00 for a 15% night-shift differential). Consumed by payroll calculation.",
    )

    class Meta:
        db_table = "cycom_hr_shift_templates"
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.name} ({self.start_time}-{self.end_time})"


class ShiftAssignment(BaseModel):
    """
    One employee's roster slot for one date. A roster/schedule is just a
    set of these rows -- publishing next month's schedule means bulk
    creating ShiftAssignment rows, not a separate "schedule" object.
    """

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("no_show", "No Show"),
        ("swapped", "Swapped"),
        ("cancelled", "Cancelled"),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="shift_assignments")
    shift_template = models.ForeignKey(
        ShiftTemplate, on_delete=models.PROTECT, related_name="assignments"
    )
    assigned_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cycom_hr_shift_assignments"
        ordering = ["assigned_date"]
        indexes = [
            models.Index(fields=["tenant_id", "employee", "assigned_date"]),
            models.Index(fields=["tenant_id", "assigned_date"]),
        ]

    def __str__(self):
        return f"{self.employee} - {self.shift_template.name} on {self.assigned_date}"


class ShiftSwapRequest(BaseModel):
    """
    Employee-initiated request to hand off a scheduled shift, optionally
    to a specific covering colleague. Approval flips both assignments'
    status to "swapped" -- see ShiftSwapRequestViewSet.approve().
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    original_assignment = models.ForeignKey(
        ShiftAssignment, on_delete=models.CASCADE, related_name="swap_requests"
    )
    covering_employee = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="covering_swap_requests"
    )
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    reviewed_by = models.UUIDField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cycom_hr_shift_swap_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"SwapRequest({self.original_assignment_id}, {self.status})"
