#!/usr/bin/env python3
"""
CyberCom Migration — Data Quality Assessment
Validates CSV/Excel files before import.

Usage:
    python assess_data_quality.py --input patients.csv --entity patients --tenant-id <UUID>
"""
import argparse
import csv
import json
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

ENTITY_SCHEMAS = {
    "patients": {
        "required": ["mrn", "first_name", "last_name", "date_of_birth", "gender", "source_system"],
        "date_fields": ["date_of_birth"],
        "enum_fields": {"gender": ["male", "female", "other", "unknown"]},
        "unique_fields": ["mrn"],
    },
    "providers": {
        "required": ["provider_id", "first_name", "last_name", "specialty_code", "email", "role"],
        "date_fields": ["license_expiry"],
        "enum_fields": {"role": ["physician", "nurse", "pharmacist", "lab_technician", "radiologist", "admin"]},
        "unique_fields": ["provider_id", "email"],
    },
    "employees": {
        "required": ["employee_id", "first_name", "last_name", "department", "job_title", "email", "hire_date"],
        "date_fields": ["hire_date"],
        "enum_fields": {},
        "unique_fields": ["employee_id", "email"],
    },
    "pharmacy_catalog": {
        "required": ["drug_code", "drug_name", "dosage_form", "strength", "route", "formulary_status"],
        "date_fields": [],
        "enum_fields": {
            "formulary_status": ["formulary", "non_formulary", "restricted"],
        },
        "unique_fields": ["drug_code"],
    },
    "lab_catalog": {
        "required": ["test_code", "loinc_code", "test_name", "specimen_type"],
        "date_fields": [],
        "enum_fields": {},
        "unique_fields": ["test_code", "loinc_code"],
    },
    "imaging_catalog": {
        "required": ["procedure_code", "procedure_name", "modality"],
        "date_fields": [],
        "enum_fields": {
            "modality": ["CT", "MRI", "XR", "US", "NM", "MG", "PT", "RF"],
        },
        "unique_fields": ["procedure_code"],
    },
}


def assess_file(
    file_path: Path,
    entity: str,
    tenant_id: str,
) -> Dict[str, Any]:
    schema = ENTITY_SCHEMAS.get(entity)
    if not schema:
        raise ValueError(f"Unknown entity: {entity}. Valid: {list(ENTITY_SCHEMAS.keys())}")

    errors: List[Dict] = []
    warnings: List[Dict] = []
    seen_unique: Dict[str, set] = {f: set() for f in schema["unique_fields"]}
    total_rows = 0
    valid_rows = 0

    with open(file_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        headers = reader.fieldnames or []

        # Check required columns present
        missing_cols = [c for c in schema["required"] if c not in headers]
        if missing_cols:
            return {
                "status": "FAILED",
                "entity": entity,
                "file": str(file_path),
                "errors": [{"type": "missing_columns", "columns": missing_cols}],
                "warnings": [],
                "total_rows": 0,
                "valid_rows": 0,
                "error_rows": 0,
            }

        for row_num, row in enumerate(reader, start=2):
            total_rows += 1
            row_errors = []

            # Required fields
            for field in schema["required"]:
                val = (row.get(field) or "").strip()
                if not val:
                    row_errors.append({"field": field, "type": "missing_required"})

            # Date validation
            for field in schema["date_fields"]:
                val = (row.get(field) or "").strip()
                if val:
                    try:
                        datetime.strptime(val, "%Y-%m-%d")
                    except ValueError:
                        row_errors.append({"field": field, "type": "invalid_date", "value": val})

            # Enum validation
            for field, valid_values in schema["enum_fields"].items():
                val = (row.get(field) or "").strip()
                if val and val not in valid_values:
                    row_errors.append({"field": field, "type": "invalid_enum", "value": val, "valid": valid_values})

            # Unique field check
            for field in schema["unique_fields"]:
                val = (row.get(field) or "").strip()
                if val:
                    if val in seen_unique[field]:
                        row_errors.append({"field": field, "type": "duplicate", "value": val})
                    else:
                        seen_unique[field].add(val)

            if row_errors:
                errors.append({"row": row_num, "errors": row_errors})
            else:
                valid_rows += 1

    status = "PASSED" if not errors else "FAILED"
    report = {
        "status": status,
        "entity": entity,
        "file": str(file_path),
        "tenant_id": tenant_id,
        "assessed_at": datetime.utcnow().isoformat(),
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "error_rows": len(errors),
        "errors": errors[:100],  # limit to first 100 errors in report
        "warnings": warnings,
    }
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="CyberCom data quality assessment")
    parser.add_argument("--input", required=True, help="Input CSV file path")
    parser.add_argument("--entity", required=True, help=f"Entity type: {list(ENTITY_SCHEMAS.keys())}")
    parser.add_argument("--tenant-id", required=True, help="Tenant UUID")
    parser.add_argument("--output", default=None, help="Output JSON report file (default: stdout)")
    args = parser.parse_args()

    file_path = Path(args.input)
    if not file_path.exists():
        print(f"ERROR: File not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    try:
        uuid.UUID(args.tenant_id)
    except ValueError:
        print(f"ERROR: Invalid tenant-id UUID: {args.tenant_id}", file=sys.stderr)
        sys.exit(1)

    report = assess_file(file_path, args.entity, args.tenant_id)

    output = json.dumps(report, indent=2)
    if args.output:
        Path(args.output).write_text(output)
        print(f"Report written to: {args.output}")
    else:
        print(output)

    print(f"\nAssessment: {report['status']}")
    print(f"Total rows: {report['total_rows']}")
    print(f"Valid rows: {report['valid_rows']}")
    print(f"Error rows: {report['error_rows']}")

    if report["status"] == "FAILED":
        sys.exit(1)


if __name__ == "__main__":
    main()
