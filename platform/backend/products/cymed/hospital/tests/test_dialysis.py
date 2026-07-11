import time
import uuid

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from django.conf import settings
from django.utils import timezone
from rest_framework.test import APIClient

from products.cymed.hospital.dialysis.models import (
    DialysisCarePlan,
    DialysisComplication,
    DialysisMachine,
    DialysisOrder,
    DialysisSession,
    VascularAccess,
)


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture(scope="session")
def _dialysis_rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_key, public_pem


def _make_role_client(test_tenant_id, private_key, roles: list[str], sub: str):
    client = APIClient()
    now = int(time.time())
    payload = {
        "sub": sub,
        "email": f"{sub}@cymed.io",
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
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {token}",
        HTTP_X_TENANT_ID=str(test_tenant_id),
    )
    return client


@pytest.fixture
def _mock_jwks(_dialysis_rsa_keypair, monkeypatch):
    from types import SimpleNamespace

    _private_key, public_pem = _dialysis_rsa_keypair
    monkeypatch.setattr(
        "shared.auth.auth_middleware._get_jwks_client",
        lambda: SimpleNamespace(get_signing_key_from_jwt=lambda token: SimpleNamespace(key=public_pem)),
    )


@pytest.fixture
def physician_client(test_tenant_id, _dialysis_rsa_keypair, _mock_jwks):
    private_key, _ = _dialysis_rsa_keypair
    return _make_role_client(test_tenant_id, private_key, ["physician"], sub="11111111-1111-1111-1111-111111111111")


@pytest.fixture
def technician_client(test_tenant_id, _dialysis_rsa_keypair, _mock_jwks):
    private_key, _ = _dialysis_rsa_keypair
    return _make_role_client(
        test_tenant_id, private_key, ["dialysis_technician"], sub="22222222-2222-2222-2222-222222222222"
    )


@pytest.fixture
def receptionist_client(test_tenant_id, _dialysis_rsa_keypair, _mock_jwks):
    private_key, _ = _dialysis_rsa_keypair
    return _make_role_client(
        test_tenant_id, private_key, ["receptionist"], sub="33333333-3333-3333-3333-333333333333"
    )


@pytest.fixture
def patient_id():
    return uuid.uuid4()


@pytest.mark.django_db
class TestDialysisDepartment:
    def _create_access(self, physician_client, test_tenant_id, patient_id) -> str:
        resp = physician_client.post(
            "/api/v1/hospital/dialysis/vascular-access/",
            {
                "patient_id": str(patient_id),
                "access_type": "av_fistula",
                "site": "left forearm",
                "placed_by_provider_id": str(uuid.uuid4()),
                "placed_at": "2026-01-15",
                "status": "active",
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        return resp.data["id"]

    def _create_order(self, physician_client, patient_id) -> str:
        resp = physician_client.post(
            "/api/v1/hospital/dialysis/orders/",
            {
                "patient_id": str(patient_id),
                "modality": "hemodialysis",
                "referring_provider_id": str(uuid.uuid4()),
                "diagnosis": "ESRD secondary to diabetic nephropathy",
                "status": "active",
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        return resp.data["id"]

    def test_vascular_access_requires_physician(self, technician_client, test_tenant_id, patient_id):
        resp = technician_client.post(
            "/api/v1/hospital/dialysis/vascular-access/",
            {
                "patient_id": str(patient_id),
                "access_type": "av_fistula",
                "site": "left forearm",
                "placed_by_provider_id": str(uuid.uuid4()),
                "placed_at": "2026-01-15",
            },
            format="json",
        )
        assert resp.status_code == 403

    def test_full_dialysis_workflow(self, physician_client, technician_client, test_tenant_id, patient_id):
        access_id = self._create_access(physician_client, test_tenant_id, patient_id)
        order_id = self._create_order(physician_client, patient_id)

        # Care plan — physician only
        plan_resp = physician_client.post(
            "/api/v1/hospital/dialysis/care-plans/",
            {
                "order": order_id,
                "vascular_access": access_id,
                "frequency_per_week": 3,
                "session_duration_hours": "4.0",
                "dry_weight_kg": "72.50",
                "dialyzer_type": "high-flux polysulfone",
                "nephrologist_id": str(uuid.uuid4()),
                "status": "active",
            },
            format="json",
        )
        assert plan_resp.status_code == 201, plan_resp.data
        plan_id = plan_resp.data["id"]
        assert DialysisCarePlan.objects.filter(tenant_id=test_tenant_id).count() == 1

        # Machine — technician can register
        machine_resp = technician_client.post(
            "/api/v1/hospital/dialysis/machines/",
            {"asset_tag": "DIAL-001", "manufacturer": "Fresenius", "model": "4008S", "status": "available"},
            format="json",
        )
        assert machine_resp.status_code == 201, machine_resp.data
        machine_id = machine_resp.data["id"]

        # Session — technician logs the actual treatment
        session_resp = technician_client.post(
            "/api/v1/hospital/dialysis/sessions/",
            {
                "plan": plan_id,
                "machine": machine_id,
                "technician_id": str(uuid.uuid4()),
                "session_date": timezone.now().date().isoformat(),
                "start_time": timezone.now().isoformat(),
                "pre_weight_kg": "75.20",
                "pre_bp_sys": 140,
                "pre_bp_dia": 88,
                "blood_flow_rate_ml_min": 350,
            },
            format="json",
        )
        assert session_resp.status_code == 201, session_resp.data
        session_id = session_resp.data["id"]
        assert DialysisSession.objects.filter(tenant_id=test_tenant_id, plan_id=plan_id).count() == 1

        # Complication — structured, queryable, not buried in notes
        complication_resp = technician_client.post(
            "/api/v1/hospital/dialysis/complications/",
            {
                "session": session_id,
                "complication_type": "hypotension",
                "severity": "moderate",
                "action_taken": "Reduced ultrafiltration rate, administered 100mL saline bolus.",
                "reported_by_id": str(uuid.uuid4()),
            },
            format="json",
        )
        assert complication_resp.status_code == 201, complication_resp.data
        assert DialysisComplication.objects.filter(session_id=session_id).count() == 1

        # Session detail includes nested complications
        detail_resp = physician_client.get(f"/api/v1/hospital/dialysis/sessions/{session_id}/")
        assert detail_resp.status_code == 200
        assert len(detail_resp.data["complications"]) == 1
        assert detail_resp.data["complications"][0]["complication_type"] == "hypotension"

    def test_session_logging_forbidden_for_non_dialysis_staff(
        self, physician_client, technician_client, receptionist_client, test_tenant_id, patient_id
    ):
        access_id = self._create_access(physician_client, test_tenant_id, patient_id)
        order_id = self._create_order(physician_client, patient_id)
        plan_resp = physician_client.post(
            "/api/v1/hospital/dialysis/care-plans/",
            {
                "order": order_id,
                "vascular_access": access_id,
                "frequency_per_week": 3,
                "session_duration_hours": "4.0",
                "dry_weight_kg": "72.50",
                "nephrologist_id": str(uuid.uuid4()),
            },
            format="json",
        )
        plan_id = plan_resp.data["id"]

        resp = receptionist_client.post(
            "/api/v1/hospital/dialysis/sessions/",
            {
                "plan": plan_id,
                "technician_id": str(uuid.uuid4()),
                "session_date": timezone.now().date().isoformat(),
                "start_time": timezone.now().isoformat(),
                "pre_weight_kg": "75.20",
                "pre_bp_sys": 140,
                "pre_bp_dia": 88,
            },
            format="json",
        )
        assert resp.status_code == 403

    def test_machine_status_tracking(self, technician_client, test_tenant_id):
        resp = technician_client.post(
            "/api/v1/hospital/dialysis/machines/",
            {"asset_tag": "DIAL-002", "status": "available"},
            format="json",
        )
        assert resp.status_code == 201
        machine_id = resp.data["id"]

        update_resp = technician_client.patch(
            f"/api/v1/hospital/dialysis/machines/{machine_id}/",
            {"status": "maintenance"},
            format="json",
        )
        assert update_resp.status_code == 200
        assert DialysisMachine.objects.get(id=machine_id).status == "maintenance"

    def test_vascular_access_status_lifecycle(self, physician_client, test_tenant_id, patient_id):
        access_id = self._create_access(physician_client, test_tenant_id, patient_id)
        access = VascularAccess.objects.get(id=access_id)
        assert access.status == "active"
        assert access.tenant_id == test_tenant_id

    def test_order_requires_physician_role(self, technician_client, patient_id):
        resp = technician_client.post(
            "/api/v1/hospital/dialysis/orders/",
            {
                "patient_id": str(patient_id),
                "modality": "hemodialysis",
                "referring_provider_id": str(uuid.uuid4()),
                "diagnosis": "ESRD",
            },
            format="json",
        )
        assert resp.status_code == 403
