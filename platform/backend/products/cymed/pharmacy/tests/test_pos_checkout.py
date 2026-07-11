import time
import uuid

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings
from rest_framework.test import APIClient

from products.cycom.inventory.models import StockItem, Warehouse
from products.cymed.pharmacy.pos.models import PharmacySale


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture(scope="session")
def _pos_rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_key, public_pem


@pytest.fixture
def _mock_jwks(_pos_rsa_keypair, monkeypatch):
    from types import SimpleNamespace

    _private_key, public_pem = _pos_rsa_keypair
    monkeypatch.setattr(
        "shared.auth.auth_middleware._get_jwks_client",
        lambda: SimpleNamespace(get_signing_key_from_jwt=lambda token: SimpleNamespace(key=public_pem)),
    )


@pytest.fixture
def auth_client(test_tenant_id, _pos_rsa_keypair, _mock_jwks):
    private_key, _ = _pos_rsa_keypair
    client = APIClient()
    now = int(time.time())
    payload = {
        "sub": "44444444-4444-4444-4444-444444444444",
        "email": "cashier@cymed.io",
        "tenant_id": str(test_tenant_id),
        "realm_access": {"roles": ["platform_admin"]},
        "roles": ["platform_admin"],
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
def er_pharmacy(test_tenant_id):
    return Warehouse.objects.create(tenant_id=test_tenant_id, name="ER Pharmacy", code="ER-PHARM")


@pytest.fixture
def outpatient_pharmacy(test_tenant_id):
    return Warehouse.objects.create(tenant_id=test_tenant_id, name="Outpatient Retail Pharmacy", code="OP-PHARM")


@pytest.fixture
def er_stock_item(test_tenant_id, er_pharmacy):
    return StockItem.objects.create(
        tenant_id=test_tenant_id, name="Epinephrine 1mg/mL", sku="ER-EPI-001", warehouse=er_pharmacy,
        quantity=50, unit_cost="12.00",
    )


@pytest.fixture
def outpatient_stock_item(test_tenant_id, outpatient_pharmacy):
    return StockItem.objects.create(
        tenant_id=test_tenant_id, name="Paracetamol 500mg", sku="OP-PARA-001", warehouse=outpatient_pharmacy,
        quantity=200, unit_cost="0.50",
    )


@pytest.mark.django_db
class TestPOSCheckoutLocationScoping:
    def test_checkout_succeeds_when_stock_matches_location(
        self, auth_client, test_tenant_id, outpatient_pharmacy, outpatient_stock_item
    ):
        resp = auth_client.post(
            "/api/v1/pharmacy/pos/sales/checkout/",
            {
                "cashier_id": str(uuid.uuid4()),
                "location": str(outpatient_pharmacy.id),
                "payment_method": "cash",
                "lines": [
                    {
                        "stock_item_id": str(outpatient_stock_item.id),
                        "item_name": outpatient_stock_item.name,
                        "quantity": "2",
                        "unit_price": "0.50",
                    }
                ],
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        sale = PharmacySale.objects.get(id=resp.data["id"])
        assert sale.location_id == outpatient_pharmacy.id

        outpatient_stock_item.refresh_from_db()
        assert outpatient_stock_item.quantity == 198  # 200 - 2, real StockMovement decrement

    def test_checkout_rejects_cross_location_stock(
        self, auth_client, test_tenant_id, outpatient_pharmacy, er_stock_item
    ):
        """
        The whole point of separate pharmacy locations: outpatient retail
        staff must not be able to ring up the ER pharmacy's stock (or vice
        versa) even though both pools belong to the same tenant.
        """
        resp = auth_client.post(
            "/api/v1/pharmacy/pos/sales/checkout/",
            {
                "cashier_id": str(uuid.uuid4()),
                "location": str(outpatient_pharmacy.id),
                "payment_method": "cash",
                "lines": [
                    {
                        "stock_item_id": str(er_stock_item.id),
                        "item_name": er_stock_item.name,
                        "quantity": "1",
                        "unit_price": "12.00",
                    }
                ],
            },
            format="json",
        )
        assert resp.status_code == 400
        assert "belongs to warehouse" in str(resp.data)
        assert PharmacySale.objects.filter(tenant_id=test_tenant_id).count() == 0

        er_stock_item.refresh_from_db()
        assert er_stock_item.quantity == 50  # untouched -- rejected before any stock movement

    def test_checkout_requires_valid_location(self, auth_client, test_tenant_id, outpatient_stock_item):
        resp = auth_client.post(
            "/api/v1/pharmacy/pos/sales/checkout/",
            {
                "cashier_id": str(uuid.uuid4()),
                "location": str(uuid.uuid4()),
                "payment_method": "cash",
                "lines": [
                    {
                        "stock_item_id": str(outpatient_stock_item.id),
                        "item_name": outpatient_stock_item.name,
                        "quantity": "1",
                        "unit_price": "0.50",
                    }
                ],
            },
            format="json",
        )
        assert resp.status_code == 400
        assert "location" in resp.data["detail"]
