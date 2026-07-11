import time
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings
from django.utils import timezone
from rest_framework.test import APIClient

from products.cycom.hr.models import Attendance, Employee, ShiftAssignment, ShiftTemplate
from products.cycom.payroll.models import PayrollRun, Payslip
from products.cycom.payroll.services import (
    calculate_income_tax,
    calculate_overtime_hours,
    calculate_shift_differential_hours,
    calculate_social_security,
)


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture(scope="session")
def _payroll_rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_key, public_pem


@pytest.fixture
def _mock_jwks(_payroll_rsa_keypair, monkeypatch):
    from types import SimpleNamespace

    _private_key, public_pem = _payroll_rsa_keypair
    monkeypatch.setattr(
        "shared.auth.auth_middleware._get_jwks_client",
        lambda: SimpleNamespace(get_signing_key_from_jwt=lambda token: SimpleNamespace(key=public_pem)),
    )


def _make_role_client(test_tenant_id, private_key, roles: list[str], sub: str):
    client = APIClient()
    now = int(time.time())
    payload = {
        "sub": sub,
        "email": f"{sub}@cybercom.io",
        "tenant_id": str(test_tenant_id),
        "realm_access": {"roles": roles},
        "roles": roles,
        "permissions": ["read", "write"],
        "iat": now,
        "exp": now + 3600,
        "aud": settings.CYIDENTITY_CLIENT_ID,
        "iss": settings.CYIDENTITY_ISSUER,
    }
    token = jwt.encode(payload, private_key, algorithm="RS256")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}", HTTP_X_TENANT_ID=str(test_tenant_id))
    return client


@pytest.fixture
def hr_client(test_tenant_id, _payroll_rsa_keypair, _mock_jwks):
    private_key, _ = _payroll_rsa_keypair
    return _make_role_client(test_tenant_id, private_key, ["payroll_admin"], sub="77777777-7777-7777-7777-777777777777")


@pytest.fixture
def clinical_client(test_tenant_id, _payroll_rsa_keypair, _mock_jwks):
    private_key, _ = _payroll_rsa_keypair
    return _make_role_client(test_tenant_id, private_key, ["nurse"], sub="88888888-8888-8888-8888-888888888888")


@pytest.fixture
def employee(test_tenant_id):
    return Employee.objects.create(
        tenant_id=test_tenant_id, first_name="Layla", last_name="Odeh", email="layla@hospital.io",
        job_title="Lab Technician", hire_date="2023-05-01",
        national_id="9901012345", bank_iban="JO71CBJO0000000000001234567890",
        monthly_basic_salary=Decimal("650.00"),
    )


class TestPureCalculations:
    def test_social_security_deduction(self):
        assert calculate_social_security(Decimal("650.00")) == Decimal("48.75")  # 7.5%

    def test_income_tax_within_free_threshold(self):
        assert calculate_income_tax(Decimal("500.00")) == Decimal("0.00")

    def test_income_tax_second_bracket(self):
        # 583 tax-free + remaining 100 at 5% = 5.00
        assert calculate_income_tax(Decimal("683.00")) == Decimal("5.00")

    def test_income_tax_progressive_across_brackets(self):
        # 583 @ 0% + 500 @ 5% (to 1083) + 100 @ 10% = 0 + 25 + 10 = 35.00
        assert calculate_income_tax(Decimal("1183.00")) == Decimal("35.00")


@pytest.mark.django_db
class TestOvertimeAndDifferentialCalculation:
    def test_overtime_hours_from_real_attendance(self, test_tenant_id, employee):
        base = datetime(2026, 8, 3, 8, 0, tzinfo=timezone.get_current_timezone())
        Attendance.objects.create(
            tenant_id=test_tenant_id, employee=employee,
            check_in=base, check_out=base + timedelta(hours=10),  # 2h overtime
        )
        Attendance.objects.create(
            tenant_id=test_tenant_id, employee=employee,
            check_in=base + timedelta(days=1), check_out=base + timedelta(days=1, hours=7),  # under 8h, no OT
        )
        hours = calculate_overtime_hours(employee.id, date(2026, 8, 1), date(2026, 8, 31))
        assert hours == Decimal("2")

    def test_shift_differential_hours_from_night_shift(self, test_tenant_id, employee):
        night = ShiftTemplate.objects.create(
            tenant_id=test_tenant_id, name="Night", start_time="23:00", end_time="07:00",
            is_night_shift=True, differential_percent="15.00",
        )
        ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee, shift_template=night, assigned_date="2026-08-05"
        )
        day = ShiftTemplate.objects.create(
            tenant_id=test_tenant_id, name="Day", start_time="07:00", end_time="15:00",
            is_night_shift=False, differential_percent="0",
        )
        ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee, shift_template=day, assigned_date="2026-08-06"
        )

        result = calculate_shift_differential_hours(employee.id, date(2026, 8, 1), date(2026, 8, 31))
        assert result == [(Decimal("15.00"), Decimal("8"))]  # only the night shift counts, day has 0%


@pytest.mark.django_db
class TestPayslipGenerationAPI:
    def test_generate_payslip_requires_hr_role(self, clinical_client, test_tenant_id):
        run = PayrollRun.objects.create(tenant_id=test_tenant_id, run_date="2026-08-31")
        resp = clinical_client.post(
            f"/api/v1/erp/payroll/runs/{run.id}/generate-payslip/",
            {"employee_id": str(uuid.uuid4()), "period_start": "2026-08-01", "period_end": "2026-08-31"},
            format="json",
        )
        assert resp.status_code == 403

    def test_generate_payslip_end_to_end(self, hr_client, test_tenant_id, employee):
        run = PayrollRun.objects.create(tenant_id=test_tenant_id, run_date="2026-08-31")
        night = ShiftTemplate.objects.create(
            tenant_id=test_tenant_id, name="Night", start_time="23:00", end_time="07:00",
            is_night_shift=True, differential_percent="15.00",
        )
        ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee, shift_template=night, assigned_date="2026-08-05"
        )
        base = datetime(2026, 8, 10, 8, 0, tzinfo=timezone.get_current_timezone())
        Attendance.objects.create(
            tenant_id=test_tenant_id, employee=employee, check_in=base, check_out=base + timedelta(hours=10)
        )

        resp = hr_client.post(
            f"/api/v1/erp/payroll/runs/{run.id}/generate-payslip/",
            {
                "employee_id": str(employee.id),
                "period_start": "2026-08-01",
                "period_end": "2026-08-31",
                "allowances": "50.00",
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        data = resp.data
        assert Decimal(data["overtime_hours"]) == Decimal("2.00")
        assert Decimal(data["basic_salary"]) == Decimal("650.00")
        assert Decimal(data["social_security_deduction"]) == Decimal("48.75")
        # gross = 650 + 50 allowances + overtime_pay + differential_pay > basic
        assert Decimal(data["gross_pay"]) > Decimal("700.00")
        assert Decimal(data["net_salary"]) == Decimal(data["gross_pay"]) - Decimal(data["total_deductions"])

        run.refresh_from_db()
        assert run.total_gross == Payslip.objects.get(id=data["id"]).gross_pay

    def test_generate_payslip_requires_basic_salary_configured(self, hr_client, test_tenant_id):
        run = PayrollRun.objects.create(tenant_id=test_tenant_id, run_date="2026-08-31")
        employee_no_salary = Employee.objects.create(
            tenant_id=test_tenant_id, first_name="No", last_name="Salary", email="none@hospital.io",
            job_title="Intern", hire_date="2026-01-01",
        )
        resp = hr_client.post(
            f"/api/v1/erp/payroll/runs/{run.id}/generate-payslip/",
            {"employee_id": str(employee_no_salary.id), "period_start": "2026-08-01", "period_end": "2026-08-31"},
            format="json",
        )
        assert resp.status_code == 400


@pytest.mark.django_db
class TestWPSExport:
    def test_export_wps_csv(self, hr_client, test_tenant_id, employee):
        run = PayrollRun.objects.create(tenant_id=test_tenant_id, run_date="2026-08-31")
        Payslip.objects.create(
            tenant_id=test_tenant_id, payroll_run=run, employee_id=employee.id,
            basic_salary=Decimal("650.00"), allowances=Decimal("50.00"),
        )

        resp = hr_client.get(f"/api/v1/erp/payroll/runs/{run.id}/export-wps/")
        assert resp.status_code == 200
        assert resp["Content-Type"] == "text/csv"
        body = resp.content.decode("utf-8")
        assert "employee_national_id" in body
        assert employee.national_id in body
        assert employee.bank_iban in body

    def test_export_wps_flags_missing_bank_details(self, hr_client, test_tenant_id):
        run = PayrollRun.objects.create(tenant_id=test_tenant_id, run_date="2026-08-31")
        employee_no_bank = Employee.objects.create(
            tenant_id=test_tenant_id, first_name="No", last_name="Bank", email="nobank@hospital.io",
            job_title="Clerk", hire_date="2026-01-01",
        )
        Payslip.objects.create(
            tenant_id=test_tenant_id, payroll_run=run, employee_id=employee_no_bank.id,
            basic_salary=Decimal("500.00"),
        )

        resp = hr_client.get(f"/api/v1/erp/payroll/runs/{run.id}/export-wps/")
        assert resp.status_code == 200
        assert str(employee_no_bank.id) in resp["X-WPS-Missing-Bank-Details"]
