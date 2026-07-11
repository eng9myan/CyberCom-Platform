"""
Payroll calculation: derives overtime, shift-differential pay, and
statutory deductions from real Attendance/ShiftAssignment data instead of
requiring every figure to be entered by hand.
"""

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from products.cycom.hr.models import Attendance, Employee, ShiftAssignment

from .models import (
    INCOME_TAX_BRACKETS_MONTHLY_JOD,
    OVERTIME_MULTIPLIER,
    SOCIAL_SECURITY_EMPLOYEE_RATE,
    STANDARD_DAILY_HOURS,
    STANDARD_MONTHLY_HOURS,
    Payslip,
)


def _round2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_social_security(basic_salary: Decimal) -> Decimal:
    return _round2(basic_salary * Decimal(str(SOCIAL_SECURITY_EMPLOYEE_RATE)) / Decimal("100"))


def calculate_income_tax(basic_salary: Decimal) -> Decimal:
    """
    Progressive bracket calculation against INCOME_TAX_BRACKETS_MONTHLY_JOD.
    Each bracket entry is (upper_bound, rate_percent_on_the_slice_up_to_that_bound).
    """
    remaining = basic_salary
    tax = Decimal("0")
    previous_bound = Decimal("0")
    for upper_bound, rate_percent in INCOME_TAX_BRACKETS_MONTHLY_JOD:
        bound = Decimal(str(upper_bound)) if upper_bound != float("inf") else None
        slice_width = (bound - previous_bound) if bound is not None else remaining
        taxable_in_slice = min(remaining, slice_width) if bound is not None else remaining
        if taxable_in_slice <= 0:
            break
        tax += taxable_in_slice * Decimal(str(rate_percent)) / Decimal("100")
        remaining -= taxable_in_slice
        if bound is not None:
            previous_bound = bound
        if remaining <= 0:
            break
    return _round2(tax)


def calculate_overtime_hours(employee_id, period_start: date, period_end: date) -> Decimal:
    """
    Sums hours worked beyond STANDARD_DAILY_HOURS per day, from real
    Attendance check-in/check-out records -- not self-reported.
    """
    records = Attendance.objects.filter(
        employee_id=employee_id,
        check_in__date__gte=period_start,
        check_in__date__lte=period_end,
        check_out__isnull=False,
    )
    overtime_hours = Decimal("0")
    for record in records:
        worked_hours = Decimal(str((record.check_out - record.check_in).total_seconds() / 3600))
        if worked_hours > STANDARD_DAILY_HOURS:
            overtime_hours += worked_hours - STANDARD_DAILY_HOURS
    return overtime_hours


def calculate_shift_differential_hours(employee_id, period_start: date, period_end: date):
    """
    Returns [(differential_percent, hours), ...] for each distinct shift
    template with a nonzero differential worked in the period, from real
    ShiftAssignment rows (not a flat "night shift bonus" guess).
    """
    assignments = ShiftAssignment.objects.filter(
        employee_id=employee_id,
        assigned_date__gte=period_start,
        assigned_date__lte=period_end,
        status__in=["scheduled", "completed"],
    ).select_related("shift_template")

    by_differential: dict[Decimal, Decimal] = {}
    for assignment in assignments:
        template = assignment.shift_template
        if template.differential_percent <= 0:
            continue
        start = timedelta(hours=template.start_time.hour, minutes=template.start_time.minute)
        end = timedelta(hours=template.end_time.hour, minutes=template.end_time.minute)
        duration = (end - start) if end > start else (end + timedelta(days=1) - start)
        hours = Decimal(str(duration.total_seconds() / 3600))
        by_differential[template.differential_percent] = (
            by_differential.get(template.differential_percent, Decimal("0")) + hours
        )
    return list(by_differential.items())


class PayrollCalculationService:
    @staticmethod
    def generate_payslip(
        payroll_run,
        employee: Employee,
        period_start: date,
        period_end: date,
        allowances: Decimal = Decimal("0"),
        other_deductions: Decimal = Decimal("0"),
    ) -> Payslip:
        if employee.monthly_basic_salary is None:
            raise ValueError(
                f"Employee {employee.id} has no monthly_basic_salary set -- cannot calculate payroll."
            )

        basic_salary = employee.monthly_basic_salary
        hourly_rate = basic_salary / Decimal(STANDARD_MONTHLY_HOURS)

        overtime_hours = calculate_overtime_hours(employee.id, period_start, period_end)
        overtime_pay = _round2(overtime_hours * hourly_rate * Decimal(str(OVERTIME_MULTIPLIER)))

        differential_pay = Decimal("0")
        for differential_percent, hours in calculate_shift_differential_hours(
            employee.id, period_start, period_end
        ):
            differential_pay += hours * hourly_rate * (differential_percent / Decimal("100"))
        differential_pay = _round2(differential_pay)

        social_security = calculate_social_security(basic_salary)
        income_tax = calculate_income_tax(basic_salary)

        payslip = Payslip.objects.create(
            tenant_id=payroll_run.tenant_id,
            payroll_run=payroll_run,
            employee_id=employee.id,
            basic_salary=basic_salary,
            allowances=allowances,
            overtime_hours=overtime_hours,
            overtime_pay=overtime_pay,
            shift_differential_pay=differential_pay,
            social_security_deduction=social_security,
            income_tax_deduction=income_tax,
            other_deductions=other_deductions,
        )
        payroll_run.recalculate_totals()
        return payslip
