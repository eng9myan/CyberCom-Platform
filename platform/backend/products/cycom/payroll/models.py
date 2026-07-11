from django.db import models

from platform.common.models import BaseModel

# Jordan Social Security Corporation employee contribution rate. Verify
# against the current published SSC rate before relying on this in
# production -- rates are set by law and do change; this is a
# configurable default, not authoritative tax advice.
SOCIAL_SECURITY_EMPLOYEE_RATE = 7.5  # percent

# Simplified progressive monthly income-tax brackets (JOD). Real Jordanian
# income tax has additional exemptions (dependents, national contribution
# tax, etc.) not modeled here -- this is a configurable placeholder that
# MUST be reviewed by a licensed payroll/tax accountant before being used
# to actually withhold tax, not a substitute for that review.
INCOME_TAX_BRACKETS_MONTHLY_JOD = [
    (583.0, 0.0),  # tax-free threshold (~7,000 JOD/year exemption / 12)
    (1083.0, 5.0),  # next bracket at 5%
    (1667.0, 10.0),  # next bracket at 10%
    (float("inf"), 20.0),  # remainder at 20%
]

STANDARD_MONTHLY_HOURS = 208  # 8h/day x 26 working days, common GCC/Levant convention
STANDARD_DAILY_HOURS = 8
OVERTIME_MULTIPLIER = 1.5


class PayrollRun(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("approved", "Approved"),
        ("paid", "Paid"),
    ]

    run_date = models.DateField()
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    total_gross = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_net = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    processed_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "cycom_payroll_runs"

    def recalculate_totals(self) -> None:
        aggregates = self.payslips.aggregate(
            gross=models.Sum("gross_pay"),
            deductions=models.Sum("total_deductions"),
            net=models.Sum("net_salary"),
        )
        self.total_gross = aggregates["gross"] or 0
        self.total_deductions = aggregates["deductions"] or 0
        self.total_net = aggregates["net"] or 0
        self.save(update_fields=["total_gross", "total_deductions", "total_net"])


class Payslip(BaseModel):
    payroll_run = models.ForeignKey(
        PayrollRun,
        on_delete=models.CASCADE,
        related_name="payslips",
    )
    employee_id = models.UUIDField(db_index=True)  # References Employee UUID

    # Earnings
    basic_salary = models.DecimalField(max_digits=18, decimal_places=2)
    allowances = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    overtime_pay = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    shift_differential_pay = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    gross_pay = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Deductions
    social_security_deduction = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    income_tax_deduction = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Backward-compatible: kept so existing callers that only set the flat
    # "deductions" field still work; it now feeds into other_deductions
    # rather than being the sole deduction figure.
    deductions = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    net_salary = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = "cycom_payroll_payslips"

    def save(self, *args, **kwargs):
        # deductions is the legacy flat field; treat it as an alias for
        # other_deductions when a caller sets it directly without going
        # through PayrollCalculationService.
        if self.deductions and not self.other_deductions:
            self.other_deductions = self.deductions

        self.gross_pay = self.basic_salary + self.allowances + self.overtime_pay + self.shift_differential_pay
        self.total_deductions = (
            self.social_security_deduction + self.income_tax_deduction + self.other_deductions
        )
        self.deductions = self.total_deductions
        self.net_salary = self.gross_pay - self.total_deductions
        super().save(*args, **kwargs)
