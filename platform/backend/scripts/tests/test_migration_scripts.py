"""
Tests for the customer-data-migration script suite (scripts/*.py):
import_patients, import_inventory, assess_data_quality, validate_migration,
rollback_migration. These are standalone scripts (not Django apps), so
they're imported directly here rather than exercised via management
commands.
"""

import csv
import uuid

import pytest

from scripts.assess_data_quality import assess
from scripts.import_inventory import import_inventory
from scripts.import_patients import import_patients
from scripts.rollback_migration import rollback
from scripts.validate_migration import validate


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture
def patients_csv(tmp_path):
    path = tmp_path / "patients.csv"
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["mrn", "first_name", "last_name", "dob", "gender", "national_id"])
        writer.writerow(["MRN-001", "Aisha", "Odeh", "1988-04-12", "female", "1098765432"])
        writer.writerow(["MRN-002", "Omar", "Khatib", "1990-01-01", "male", ""])
        writer.writerow(["MRN-003", "", "Missing First", "1990-01-01", "male", "111"])  # hard error
    return str(path)


@pytest.fixture
def inventory_csv(tmp_path):
    path = tmp_path / "inventory.csv"
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["sku", "name", "unit", "unit_cost", "reorder_level", "par_level", "batch_number", "expiry_date", "quantity"])
        writer.writerow(["DRUG-001", "Paracetamol 500mg", "box", "0.50", "10", "50", "BATCH-A", "2027-01-01", "200"])
        writer.writerow(["DRUG-002", "Amoxicillin 250mg", "box", "1.20", "5", "20", "BATCH-B", "", "100"])  # missing expiry -- FEFO reject
    return str(path)


class TestAssessDataQuality:
    def test_flags_missing_required_field_and_bad_choice(self, patients_csv):
        result = assess(patients_csv, "patients")
        assert result["row_count"] == 3
        assert result["rows_with_issues"] == 1
        assert result["missing_required_counts"].get("first_name") == 1

    def test_flags_duplicate_natural_keys(self, tmp_path):
        path = tmp_path / "dupes.csv"
        with open(path, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(["mrn", "first_name", "last_name", "dob", "gender"])
            writer.writerow(["MRN-DUP", "A", "B", "1990-01-01", "male"])
            writer.writerow(["MRN-DUP", "C", "D", "1990-01-01", "male"])
        result = assess(str(path), "patients")
        assert result["duplicate_natural_keys"] == {"MRN-DUP": 2}

    def test_inventory_missing_fefo_field_flagged(self, inventory_csv):
        result = assess(inventory_csv, "inventory")
        assert result["rows_with_issues"] == 1


@pytest.mark.django_db
class TestImportAndBatchTracking:
    def test_import_patients_tags_migration_records(self, test_tenant_id, patients_csv):
        from platform.common.models import MigrationRecord
        from products.cymed.core.patients.models import Patient

        batch_id = str(uuid.uuid4())
        result = import_patients(patients_csv, str(test_tenant_id), dry_run=False, batch_id=batch_id)

        assert result["stats"]["imported"] == 2
        assert result["stats"]["failed"] == 1

        records = MigrationRecord.objects.filter(tenant_id=test_tenant_id, batch_id=batch_id)
        assert records.count() == 2
        assert set(records.values_list("source_row_identifier", flat=True)) == {"MRN-001", "MRN-002"}
        assert Patient.objects.filter(tenant_id=test_tenant_id, mrn="MRN-001").exists()

    def test_dry_run_creates_no_migration_records(self, test_tenant_id, patients_csv):
        from platform.common.models import MigrationRecord

        batch_id = str(uuid.uuid4())
        import_patients(patients_csv, str(test_tenant_id), dry_run=True, batch_id=batch_id)

        assert not MigrationRecord.objects.filter(tenant_id=test_tenant_id, batch_id=batch_id).exists()

    def test_import_inventory_tags_movement_batch_and_item(self, test_tenant_id, inventory_csv):
        from platform.common.models import MigrationRecord

        batch_id = str(uuid.uuid4())
        result = import_inventory(
            inventory_csv, str(test_tenant_id),
            warehouse_code="TEST-WH", warehouse_name="Test Warehouse",
            dry_run=False, batch_id=batch_id,
        )

        assert result["stats"]["batches_imported"] == 1
        assert result["stats"]["rejected_missing_fefo_fields"] == 1

        records = MigrationRecord.objects.filter(tenant_id=test_tenant_id, batch_id=batch_id)
        entity_types = set(records.values_list("entity_type", flat=True))
        assert entity_types == {"stock_item", "stock_batch", "stock_movement"}


@pytest.mark.django_db
class TestValidateMigration:
    def test_validate_reports_no_orphans_and_passes_spot_check(self, test_tenant_id, patients_csv):
        batch_id = str(uuid.uuid4())
        import_patients(patients_csv, str(test_tenant_id), dry_run=False, batch_id=batch_id)

        result = validate(batch_id, str(test_tenant_id), patients_csv, "patients", sample_size=10)

        assert result["total_records"] == 2
        assert result["orphaned"] == []
        assert result["spot_check_failures"] == 0
        assert result["spot_check_sample_size"] == 2

    def test_validate_detects_orphan_after_manual_delete(self, test_tenant_id, patients_csv):
        from products.cymed.core.patients.models import Patient

        batch_id = str(uuid.uuid4())
        import_patients(patients_csv, str(test_tenant_id), dry_run=False, batch_id=batch_id)

        Patient.objects.filter(tenant_id=test_tenant_id, mrn="MRN-001").delete()

        result = validate(batch_id, str(test_tenant_id), patients_csv, "patients", sample_size=10)
        assert len(result["orphaned"]) == 1


@pytest.mark.django_db
class TestRollbackMigration:
    def test_rollback_deactivates_patients(self, test_tenant_id, patients_csv):
        from platform.common.models import MigrationRecord
        from products.cymed.core.patients.models import Patient

        batch_id = str(uuid.uuid4())
        import_patients(patients_csv, str(test_tenant_id), dry_run=False, batch_id=batch_id)

        result = rollback(batch_id, str(test_tenant_id), dry_run=False)

        assert result["stats"]["patients_deactivated"] == 2
        assert not Patient.objects.filter(tenant_id=test_tenant_id, mrn="MRN-001", is_active=True).exists()
        assert MigrationRecord.objects.filter(
            tenant_id=test_tenant_id, batch_id=batch_id, rolled_back_at__isnull=True
        ).count() == 0

    def test_rollback_inventory_deletes_in_dependency_order(self, test_tenant_id, inventory_csv):
        from products.cycom.inventory.models import StockBatch, StockItem, StockMovement

        batch_id = str(uuid.uuid4())
        import_inventory(
            inventory_csv, str(test_tenant_id),
            warehouse_code="TEST-WH-2", warehouse_name="Test Warehouse 2",
            dry_run=False, batch_id=batch_id,
        )

        result = rollback(batch_id, str(test_tenant_id), dry_run=False)

        assert result["stats"]["stock_movements_deleted"] == 1
        assert result["stats"]["stock_batches_deleted"] == 1
        assert result["stats"]["stock_items_deleted"] == 1
        assert not StockMovement.objects.filter(tenant_id=test_tenant_id).exists()
        assert not StockBatch.objects.filter(tenant_id=test_tenant_id).exists()
        assert not StockItem.objects.filter(tenant_id=test_tenant_id, sku="DRUG-001").exists()

    def test_rollback_keeps_shared_stock_item(self, test_tenant_id, inventory_csv, tmp_path):
        """
        A second batch adds another batch_number under the SAME sku/warehouse
        -- rolling back the first batch must not delete the still-shared
        StockItem out from under the second batch's data.
        """
        from products.cycom.inventory.models import StockItem

        batch_1 = str(uuid.uuid4())
        import_inventory(
            inventory_csv, str(test_tenant_id),
            warehouse_code="SHARED-WH", warehouse_name="Shared Warehouse",
            dry_run=False, batch_id=batch_1,
        )

        second_csv = tmp_path / "inventory2.csv"
        with open(second_csv, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(["sku", "name", "unit", "unit_cost", "reorder_level", "par_level", "batch_number", "expiry_date", "quantity"])
            writer.writerow(["DRUG-001", "Paracetamol 500mg", "box", "0.50", "10", "50", "BATCH-C", "2027-06-01", "150"])
        batch_2 = str(uuid.uuid4())
        import_inventory(
            str(second_csv), str(test_tenant_id),
            warehouse_code="SHARED-WH", warehouse_name="Shared Warehouse",
            dry_run=False, batch_id=batch_2,
        )

        result = rollback(batch_1, str(test_tenant_id), dry_run=False)

        assert result["stats"]["stock_items_kept_shared"] == 1
        assert StockItem.objects.filter(tenant_id=test_tenant_id, sku="DRUG-001").exists()

    def test_dry_run_rollback_writes_nothing(self, test_tenant_id, patients_csv):
        from products.cymed.core.patients.models import Patient

        batch_id = str(uuid.uuid4())
        import_patients(patients_csv, str(test_tenant_id), dry_run=False, batch_id=batch_id)

        rollback(batch_id, str(test_tenant_id), dry_run=True)

        assert Patient.objects.filter(tenant_id=test_tenant_id, mrn="MRN-001", is_active=True).exists()
