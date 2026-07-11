import json
import uuid

import pytest
from django.core.management import CommandError, call_command

from products.cymed.core.facilities.models import Bed, Department, Facility, Room, Ward
from products.cymed.core.organizations.models import Organization


@pytest.fixture
def tenant_id():
    return uuid.uuid4()


@pytest.fixture
def facility(tenant_id):
    org = Organization.objects.create(
        tenant_id=tenant_id, name="Test Hospital Org", slug="test-hosp-org", organization_type="hospital"
    )
    return Facility.objects.create(
        tenant_id=tenant_id, organization=org, name="Test Hospital", code="HOSP-MAIN"
    )


@pytest.fixture
def ward_config(tmp_path):
    config = {
        "facility_code": "HOSP-MAIN",
        "department_code": "DEPT-INPATIENT",
        "department_name": "Inpatient Wards",
        "tiers": [
            {
                "code_prefix": "STD-MULTI",
                "name": "Standard Multi-Bed",
                "accommodation_tier": "multi_bed",
                "room_type": "standard",
                "stations": 5,
                "rooms_per_station": 10,
                "beds_per_room": 4,
            },
            {
                "code_prefix": "STD-SINGLE",
                "name": "Standard Single-Bed",
                "accommodation_tier": "single_bed",
                "room_type": "standard",
                "stations": 5,
                "rooms_per_station": 10,
                "beds_per_room": 1,
            },
            {
                "code_prefix": "VIP",
                "name": "VIP",
                "accommodation_tier": "vip",
                "room_type": "standard",
                "stations": 4,
                "rooms_per_station": 5,
                "beds_per_room": 1,
            },
        ],
    }
    path = tmp_path / "wards.json"
    path.write_text(json.dumps(config), encoding="utf-8")
    return path


@pytest.mark.django_db
class TestConfigureWards:
    def test_provisions_full_hospital_layout(self, facility, tenant_id, ward_config):
        call_command("configure_wards", f"--tenant-id={tenant_id}", f"--config={ward_config}")

        department = Department.objects.get(tenant_id=tenant_id, code="DEPT-INPATIENT")
        wards = Ward.objects.filter(tenant_id=tenant_id, department=department)

        # 5 multi-bed + 5 single-bed + 4 VIP nurse stations
        assert wards.count() == 14

        rooms = Room.objects.filter(tenant_id=tenant_id, ward__department=department)
        # (5*10) + (5*10) + (4*5) = 120 rooms
        assert rooms.count() == 120

        beds = Bed.objects.filter(tenant_id=tenant_id, room__ward__department=department)
        # (50 rooms * 4 beds) + (50 rooms * 1 bed) + (20 rooms * 1 bed) = 270 beds
        assert beds.count() == 270

        vip_rooms = rooms.filter(accommodation_tier="vip")
        assert vip_rooms.count() == 20
        assert all(r.room_type == "standard" for r in vip_rooms)

    def test_idempotent_on_rerun(self, facility, tenant_id, ward_config):
        call_command("configure_wards", f"--tenant-id={tenant_id}", f"--config={ward_config}")
        call_command("configure_wards", f"--tenant-id={tenant_id}", f"--config={ward_config}")

        department = Department.objects.get(tenant_id=tenant_id, code="DEPT-INPATIENT")
        assert Ward.objects.filter(tenant_id=tenant_id, department=department).count() == 14
        assert Room.objects.filter(tenant_id=tenant_id, ward__department=department).count() == 120

    def test_dry_run_writes_nothing(self, facility, tenant_id, ward_config):
        call_command("configure_wards", f"--tenant-id={tenant_id}", f"--config={ward_config}", "--dry-run")

        assert not Department.objects.filter(tenant_id=tenant_id, code="DEPT-INPATIENT").exists()
        assert not Ward.objects.filter(tenant_id=tenant_id).exists()

    def test_unknown_facility_raises(self, tenant_id, ward_config):
        with pytest.raises(CommandError, match="No Facility with code"):
            call_command("configure_wards", f"--tenant-id={tenant_id}", f"--config={ward_config}")

    def test_missing_config_file_raises(self, facility, tenant_id):
        with pytest.raises(CommandError, match="Config file not found"):
            call_command(
                "configure_wards", f"--tenant-id={tenant_id}", "--config=/nonexistent/path.json"
            )

    def test_invalid_tenant_id_raises(self, ward_config):
        with pytest.raises(CommandError, match="not a valid UUID"):
            call_command("configure_wards", "--tenant-id=not-a-uuid", f"--config={ward_config}")
