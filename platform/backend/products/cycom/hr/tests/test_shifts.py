import time
import uuid

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings
from rest_framework.test import APIClient

from products.cycom.hr.models import Employee, ShiftAssignment, ShiftSwapRequest, ShiftTemplate


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture(scope="session")
def _hr_rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_key, public_pem


@pytest.fixture
def _mock_jwks(_hr_rsa_keypair, monkeypatch):
    from types import SimpleNamespace

    _private_key, public_pem = _hr_rsa_keypair
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
def hr_client(test_tenant_id, _hr_rsa_keypair, _mock_jwks):
    private_key, _ = _hr_rsa_keypair
    return _make_role_client(test_tenant_id, private_key, ["hr_admin"], sub="55555555-5555-5555-5555-555555555555")


@pytest.fixture
def clinical_client(test_tenant_id, _hr_rsa_keypair, _mock_jwks):
    """A physician role -- no HR mandate, should be locked out of shift endpoints."""
    private_key, _ = _hr_rsa_keypair
    return _make_role_client(test_tenant_id, private_key, ["physician"], sub="66666666-6666-6666-6666-666666666666")


@pytest.fixture
def employee_a(test_tenant_id):
    return Employee.objects.create(
        tenant_id=test_tenant_id, first_name="Sara", last_name="Nasser", email="sara@hospital.io",
        job_title="Lab Technician", hire_date="2024-01-10",
    )


@pytest.fixture
def employee_b(test_tenant_id):
    return Employee.objects.create(
        tenant_id=test_tenant_id, first_name="Omar", last_name="Khatib", email="omar@hospital.io",
        job_title="Lab Technician", hire_date="2024-02-15",
    )


@pytest.fixture
def night_shift(test_tenant_id):
    return ShiftTemplate.objects.create(
        tenant_id=test_tenant_id, name="Night Shift", start_time="23:00", end_time="07:00",
        is_night_shift=True, differential_percent="15.00",
    )


@pytest.mark.django_db
class TestShiftManagement:
    def test_shift_endpoints_require_hr_role(self, clinical_client, night_shift):
        resp = clinical_client.get("/api/v1/erp/hr/shift-templates/")
        assert resp.status_code == 403

    def test_create_shift_template(self, hr_client, test_tenant_id):
        resp = hr_client.post(
            "/api/v1/erp/hr/shift-templates/",
            {"name": "Day Shift", "start_time": "07:00", "end_time": "15:00", "is_night_shift": False, "differential_percent": "0.00"},
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert ShiftTemplate.objects.filter(tenant_id=test_tenant_id, name="Day Shift").exists()

    def test_bulk_publish_roster(self, hr_client, test_tenant_id, employee_a, employee_b, night_shift):
        resp = hr_client.post(
            "/api/v1/erp/hr/shift-assignments/bulk_publish/",
            {
                "assignments": [
                    {"employee": str(employee_a.id), "shift_template": str(night_shift.id), "assigned_date": "2026-08-01"},
                    {"employee": str(employee_a.id), "shift_template": str(night_shift.id), "assigned_date": "2026-08-02"},
                    {"employee": str(employee_b.id), "shift_template": str(night_shift.id), "assigned_date": "2026-08-01"},
                ]
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert len(resp.data) == 3
        assert ShiftAssignment.objects.filter(tenant_id=test_tenant_id).count() == 3
        assert ShiftAssignment.objects.filter(employee=employee_a).count() == 2

    def test_bulk_publish_rejects_empty(self, hr_client):
        resp = hr_client.post(
            "/api/v1/erp/hr/shift-assignments/bulk_publish/", {"assignments": []}, format="json"
        )
        assert resp.status_code == 400

    def test_filter_assignments_by_employee_and_date_range(
        self, hr_client, test_tenant_id, employee_a, employee_b, night_shift
    ):
        ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee_a, shift_template=night_shift, assigned_date="2026-08-01"
        )
        ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee_a, shift_template=night_shift, assigned_date="2026-09-15"
        )
        ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee_b, shift_template=night_shift, assigned_date="2026-08-01"
        )

        resp = hr_client.get(
            f"/api/v1/erp/hr/shift-assignments/?employee={employee_a.id}&date_from=2026-08-01&date_to=2026-08-31"
        )
        assert resp.status_code == 200
        results = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        assert len(results) == 1
        assert results[0]["assigned_date"] == "2026-08-01"

    def test_swap_request_approval_creates_covering_assignment(
        self, hr_client, test_tenant_id, employee_a, employee_b, night_shift
    ):
        original = ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee_a, shift_template=night_shift, assigned_date="2026-08-05"
        )
        swap_resp = hr_client.post(
            "/api/v1/erp/hr/shift-swap-requests/",
            {
                "original_assignment": str(original.id),
                "covering_employee": str(employee_b.id),
                "reason": "Family emergency",
            },
            format="json",
        )
        assert swap_resp.status_code == 201, swap_resp.data
        swap_id = swap_resp.data["id"]

        approve_resp = hr_client.post(f"/api/v1/erp/hr/shift-swap-requests/{swap_id}/approve/")
        assert approve_resp.status_code == 200
        assert approve_resp.data["status"] == "approved"

        original.refresh_from_db()
        assert original.status == "swapped"

        covering = ShiftAssignment.objects.get(
            employee=employee_b, assigned_date="2026-08-05", shift_template=night_shift
        )
        assert covering.status == "scheduled"

    def test_swap_request_rejection_leaves_original_untouched(
        self, hr_client, test_tenant_id, employee_a, night_shift
    ):
        original = ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee_a, shift_template=night_shift, assigned_date="2026-08-06"
        )
        swap = ShiftSwapRequest.objects.create(
            tenant_id=test_tenant_id, original_assignment=original, reason="Personal"
        )

        reject_resp = hr_client.post(f"/api/v1/erp/hr/shift-swap-requests/{swap.id}/reject/")
        assert reject_resp.status_code == 200
        assert reject_resp.data["status"] == "rejected"

        original.refresh_from_db()
        assert original.status == "scheduled"

    def test_cannot_approve_already_reviewed_swap(self, hr_client, test_tenant_id, employee_a, night_shift):
        original = ShiftAssignment.objects.create(
            tenant_id=test_tenant_id, employee=employee_a, shift_template=night_shift, assigned_date="2026-08-07"
        )
        swap = ShiftSwapRequest.objects.create(
            tenant_id=test_tenant_id, original_assignment=original, status="approved"
        )
        resp = hr_client.post(f"/api/v1/erp/hr/shift-swap-requests/{swap.id}/approve/")
        assert resp.status_code == 400
