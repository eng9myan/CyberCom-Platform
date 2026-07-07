import datetime
import uuid

import pytest

from products.cymed.core.patients.models import Patient
from products.cymed.hospital.blood_bank.models import (
    BloodCompatibility,
    BloodDonor,
    BloodInventory,
    BloodIssue,
    BloodUnit,
    CrossmatchRequest,
)

TENANT = uuid.uuid4()
PROVIDER = uuid.uuid4()


@pytest.fixture
def patient(db):
    return Patient.objects.create(
        tenant_id=TENANT,
        first_name="Test",
        last_name="Patient",
        dob=datetime.date(1990, 1, 1),
        mrn=f"MRN-{uuid.uuid4().hex[:8]}",
    )


@pytest.mark.django_db
class TestBloodDonor:
    def test_create(self):
        donor = BloodDonor.objects.create(
            tenant_id=TENANT, first_name="Jane", last_name="Doe", blood_type="O-",
        )
        assert donor.is_eligible is True


@pytest.mark.django_db
class TestBloodUnit:
    def test_create_defaults_to_quarantine(self):
        unit = BloodUnit.objects.create(
            tenant_id=TENANT,
            unit_number=f"UNIT-{uuid.uuid4().hex[:8]}",
            blood_type="O-",
            collection_date=datetime.date(2026, 1, 1),
            expiry_date=datetime.date(2026, 12, 31),
        )
        assert unit.status == "quarantine"

    def test_supplier_sourced_component(self):
        unit = BloodUnit.objects.create(
            tenant_id=TENANT,
            unit_number=f"UNIT-{uuid.uuid4().hex[:8]}",
            blood_type="AB+",
            component_type="albumin",
            supplier="Acme Plasma Products",
            collection_date=datetime.date(2026, 1, 1),
            expiry_date=datetime.date(2027, 1, 1),
        )
        assert unit.component_type == "albumin"
        assert unit.donor is None


@pytest.mark.django_db
class TestCrossmatchRequest:
    def test_defaults(self, patient):
        req = CrossmatchRequest.objects.create(
            tenant_id=TENANT,
            patient=patient,
            blood_type_required="O-",
            requested_by=PROVIDER,
        )
        assert req.status == "pending"
        assert req.urgency == "elective"

    def test_massive_hemorrhage_protocol(self, patient):
        req = CrossmatchRequest.objects.create(
            tenant_id=TENANT,
            patient=patient,
            blood_type_required="O-",
            requested_by=PROVIDER,
            urgency="massive_hemorrhage_protocol",
            units_requested=6,
        )
        assert req.urgency == "massive_hemorrhage_protocol"
        assert req.units_requested == 6


@pytest.mark.django_db
class TestBloodIssue:
    def test_issue_links_unit_and_request(self, patient):
        unit = BloodUnit.objects.create(
            tenant_id=TENANT,
            unit_number=f"UNIT-{uuid.uuid4().hex[:8]}",
            blood_type="O-",
            status="issued",
            collection_date=datetime.date(2026, 1, 1),
            expiry_date=datetime.date(2026, 12, 31),
        )
        req = CrossmatchRequest.objects.create(
            tenant_id=TENANT,
            patient=patient,
            blood_type_required="O-",
            requested_by=PROVIDER,
            status="fulfilled",
        )
        issue = BloodIssue.objects.create(
            tenant_id=TENANT, crossmatch_request=req, blood_unit=unit, issued_by=PROVIDER,
        )
        assert issue.blood_unit_id == unit.id
        assert issue.crossmatch_request_id == req.id


@pytest.mark.django_db
class TestBloodCompatibility:
    def test_antibody_screen(self, patient):
        compat = BloodCompatibility.objects.create(
            tenant_id=TENANT,
            patient=patient,
            blood_type="A+",
            antibody_screen="negative",
        )
        assert compat.antibody_screen == "negative"

    def test_positive_screen_with_identified_antibodies(self, patient):
        compat = BloodCompatibility.objects.create(
            tenant_id=TENANT,
            patient=patient,
            blood_type="B+",
            antibody_screen="positive",
            antibodies_identified=["anti-K"],
            special_requirements=["kell_negative_units"],
        )
        assert compat.antibodies_identified == ["anti-K"]


@pytest.mark.django_db
class TestBloodInventory:
    def test_aggregate_stock_row(self):
        inv = BloodInventory.objects.create(
            tenant_id=TENANT,
            component_type="rbc",
            blood_type="O-",
            storage_location="Main Fridge",
            available_units=10,
            minimum_threshold=2,
        )
        assert inv.available_units == 10

    def test_unique_per_component_type_location(self):
        BloodInventory.objects.create(
            tenant_id=TENANT, component_type="rbc", blood_type="O-", storage_location="Main Fridge",
        )
        with pytest.raises(Exception):
            BloodInventory.objects.create(
                tenant_id=TENANT, component_type="rbc", blood_type="O-", storage_location="Main Fridge",
            )
