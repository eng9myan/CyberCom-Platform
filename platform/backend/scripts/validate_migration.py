#!/usr/bin/env python
"""
Post-import validation for a migration batch created by
import_patients.py / import_inventory.py -- confirms what MigrationRecord
says was imported for --batch-id actually exists in the database with the
right data, and spot-checks a sample against the original source CSV.

Requires Django (unlike assess_data_quality.py) since it reads the real
imported rows, not just the CSV.

Checks:
  1. Every MigrationRecord for this batch still resolves to a live DB row
     (nothing silently deleted since import -- if you meant to undo the
     batch, use rollback_migration.py, not manual deletes).
  2. A random sample (--sample-size) of imported patient rows are spot-
     checked against their original CSV row by natural key (mrn/sku).
  3. Record count summary by entity_type, for a human to eyeball against
     the expected row count from the source file.

Usage:
    python scripts/validate_migration.py --batch-id <uuid> --tenant-id <uuid> \
        --csv legacy_patients.csv --entity patients [--sample-size 20] \
        [--report validation_report.json]
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import random
import sys
import uuid
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django  # noqa: E402

django.setup()

# Natural-key field name to spot-check by, per entity, matching
# ENTITY_SPECS in assess_data_quality.py.
NATURAL_KEY_FIELD = {"patients": "mrn", "inventory": "sku"}

# What field(s) on the real model should match the CSV's spot-check
# comparison, per entity_type stored on MigrationRecord.
SPOT_CHECK_FIELDS = {
    "patient": ["first_name", "last_name"],
    "stock_item": ["name"],
}


def _resolve_model(model_label: str):
    from django.apps import apps

    app_label, model_name = model_label.split(".")
    return apps.get_model(app_label, model_name)


def validate(batch_id: str, tenant_id: str, csv_path: str, entity: str, sample_size: int) -> dict:
    from platform.common.models import MigrationRecord

    batch_uuid = uuid.UUID(batch_id)
    tenant_uuid = uuid.UUID(tenant_id)

    records = list(MigrationRecord.objects.filter(tenant_id=tenant_uuid, batch_id=batch_uuid))
    if not records:
        return {
            "batch_id": batch_id, "error": "No MigrationRecord rows found for this batch/tenant.",
            "orphaned": [], "spot_check_results": [], "counts_by_entity_type": {},
        }

    counts_by_entity_type: dict[str, int] = {}
    for record in records:
        counts_by_entity_type[record.entity_type] = counts_by_entity_type.get(record.entity_type, 0) + 1

    # Check 1: every record still resolves to a live row.
    orphaned = []
    for record in records:
        model = _resolve_model(record.model_label)
        if not model.objects.filter(id=record.object_id).exists():
            orphaned.append(
                {"model_label": record.model_label, "object_id": str(record.object_id),
                 "source_row_identifier": record.source_row_identifier}
            )

    # Check 2: spot-check a random sample against the source CSV.
    natural_key_field = NATURAL_KEY_FIELD.get(entity)
    csv_rows_by_key = {}
    if natural_key_field and Path(csv_path).exists():
        with open(csv_path, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                key = (row.get(natural_key_field) or "").strip()
                if key:
                    csv_rows_by_key[key] = row

    spot_checkable = [r for r in records if r.entity_type in SPOT_CHECK_FIELDS and r.source_row_identifier in csv_rows_by_key]
    sample = random.sample(spot_checkable, min(sample_size, len(spot_checkable))) if spot_checkable else []

    spot_check_results = []
    for record in sample:
        model = _resolve_model(record.model_label)
        db_obj = model.objects.filter(id=record.object_id).first()
        csv_row = csv_rows_by_key.get(record.source_row_identifier)
        if db_obj is None or csv_row is None:
            spot_check_results.append({"source_row_identifier": record.source_row_identifier, "match": False, "reason": "missing db row or csv row"})
            continue

        mismatches = []
        for field in SPOT_CHECK_FIELDS[record.entity_type]:
            db_value = str(getattr(db_obj, field, ""))
            csv_value = (csv_row.get(field) or "").strip()
            if db_value != csv_value:
                mismatches.append(f"{field}: db={db_value!r} csv={csv_value!r}")

        spot_check_results.append({
            "source_row_identifier": record.source_row_identifier,
            "match": not mismatches,
            "mismatches": mismatches,
        })

    return {
        "batch_id": batch_id,
        "total_records": len(records),
        "counts_by_entity_type": counts_by_entity_type,
        "orphaned": orphaned,
        "spot_check_sample_size": len(sample),
        "spot_check_results": spot_check_results,
        "spot_check_failures": sum(1 for r in spot_check_results if not r["match"]),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--batch-id", required=True, help="Migration batch UUID to validate.")
    parser.add_argument("--tenant-id", required=True, help="Tenant UUID.")
    parser.add_argument("--csv", required=True, help="Original source CSV, for spot-check comparison.")
    parser.add_argument("--entity", required=True, choices=sorted(NATURAL_KEY_FIELD), help="Which entity this batch imported.")
    parser.add_argument("--sample-size", type=int, default=20, help="How many records to spot-check.")
    parser.add_argument("--report", default="validation_report.json", help="Where to write the full JSON report.")
    args = parser.parse_args()

    result = validate(args.batch_id, args.tenant_id, args.csv, args.entity, args.sample_size)
    Path(args.report).write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")

    if "error" in result:
        print(f"FATAL: {result['error']}", file=sys.stderr)
        return 1

    print(f"=== validate_migration.py [batch {args.batch_id}] ===")
    print(f"  total records: {result['total_records']}")
    print(f"  counts by entity_type: {result['counts_by_entity_type']}")
    print(f"  orphaned records (imported row no longer exists): {len(result['orphaned'])}")
    print(f"  spot-checked: {result['spot_check_sample_size']}, failures: {result['spot_check_failures']}")
    print(f"  -> full report: {args.report}")

    return 1 if (result["orphaned"] or result["spot_check_failures"]) else 0


if __name__ == "__main__":
    sys.exit(main())
