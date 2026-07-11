#!/usr/bin/env python
"""
Legacy patient/clinical-history importer for the CyberCom (CyMed hospital)
production cutover.

Scope: this maps into the REAL CyMed models -- products.cymed.core.patients.
Patient (+ PatientNationality) and, when a legacy row already carries a
coded diagnosis, products.cymed.core.clinical.Condition. It does NOT touch
CyShop -- CyShop is a separate Django project (cyshop/backend, its own
manage.py/settings/database connection) living elsewhere in this monorepo,
not reachable from this process. If a legacy cutover also needs CyShop
customer/product data migrated, that needs its own script run against that
project.

Security notes (this is explicitly asked to be a "secure" script):
  - No credentials are hardcoded here. Django settings (core.settings) reads
    DB_* from the environment exactly as the real backend does -- run this
    with the same env-var block used to start the backend/management
    commands.
  - error_log.json / needs_clinical_coding.json below contain PATIENT
    IDENTIFIERS (MRN, name) for HIM staff to locate/fix the source row --
    they deliberately do NOT contain national_id/passport_number VALUES
    (only whether the field was present), to avoid writing sensitive PII
    into a plaintext audit file. Treat both output files as PHI-adjacent:
    restrict filesystem permissions and delete them once the cutover issues
    are resolved.
  - Free-text "medical history" is NEVER auto-coded into a Condition --
    inventing an ICD-11/SNOMED code for a legacy free-text note would be
    fabricated clinical data. Rows with only free-text history and no
    coded diagnosis are routed to needs_clinical_coding.json for a human
    coder to review, not silently dropped and not guessed at.

Expected CSV columns (extra columns are ignored; header names below are
required, case-sensitive):
    mrn, first_name, last_name, dob, gender, national_id, passport_number,
    nationality_country_code, diagnosis_icd11_codes, medical_history_notes

  - dob: YYYY-MM-DD
  - gender: male/female/other/unknown (matches Patient.GenderType choices)
  - national_id: the mandatory regional-compliance field the task calls
    out. The Patient model itself allows it to be blank (null=True,
    blank=True) -- a missing value does NOT fail the row, it gets flagged
    in error_log.json as a compliance gap for staff to follow up on, per
    "flag ... rather than failing the entire batch."
  - diagnosis_icd11_codes: semicolon-separated ICD-11 codes, e.g.
    "5A11;BA00" -- each is validated against the real
    platform.terminology.services.TerminologyService before a Condition
    row is created. An unresolvable code is flagged, not guessed at.
  - medical_history_notes: free text. Never auto-coded (see above).

Every row actually written is logged to platform.common.models.MigrationRecord
under --batch-id (auto-generated if not given, printed either way) --
validate_migration.py and rollback_migration.py both key off this to know
exactly what a given run created, separate from pre-existing data.

Usage:
    python scripts/import_patients.py --csv legacy_patients.csv \
        --tenant-id <uuid> [--dry-run] [--batch-id <uuid>] \
        [--error-log error_log.json] \
        [--needs-coding-log needs_clinical_coding.json]
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django  # noqa: E402

django.setup()

from django.db import connection, transaction  # noqa: E402

REQUIRED_MODEL_FIELDS = ("mrn", "first_name", "last_name", "dob", "gender")
VALID_GENDERS = {"male", "female", "other", "unknown"}


def _set_tenant_guc(tenant_id: str) -> None:
    """
    Same real mechanism core/middleware/tenant.py::TenantIsolationMiddleware
    uses per-request -- SET LOCAL only lasts for the current transaction, so
    this must be called inside the same transaction.atomic() block as the
    writes it's meant to scope.
    """
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL app.current_tenant_id = %s;", [tenant_id])


def _parse_date(value: str):
    value = (value or "").strip()
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def import_patients(csv_path: str, tenant_id: str, *, dry_run: bool, batch_id: str) -> dict:
    from products.cymed.core.clinical.models import Condition
    from products.cymed.core.patients.models import Patient, PatientNationality
    from platform.common.models import MigrationRecord
    from platform.terminology.services import TerminologyService

    tenant_uuid = uuid.UUID(tenant_id)
    batch_uuid = uuid.UUID(batch_id)

    stats = {
        "rows_read": 0,
        "imported": 0,
        "skipped_existing": 0,
        "failed": 0,
        "flagged_missing_national_id": 0,
        "conditions_created": 0,
        "rows_needing_coding": 0,
    }
    errors: list[dict] = []
    needs_coding: list[dict] = []

    with open(csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row_number, row in enumerate(reader, start=2):  # header is row 1
            stats["rows_read"] += 1
            mrn = (row.get("mrn") or "").strip()

            # Hard failures: the row genuinely can't become a valid Patient
            # row and is skipped entirely (still counted/logged, batch
            # continues). Compliance flags (missing national_id) are
            # tracked separately and do NOT block the import.
            hard_errors: list[str] = []
            for field in REQUIRED_MODEL_FIELDS:
                if not (row.get(field) or "").strip():
                    hard_errors.append(f"missing required field '{field}'")

            dob = _parse_date(row.get("dob", ""))
            if row.get("dob", "").strip() and dob is None:
                hard_errors.append(f"dob '{row['dob']}' is not a valid YYYY-MM-DD date")
            elif dob is None:
                hard_errors.append("missing required field 'dob'")

            gender = (row.get("gender") or "unknown").strip().lower()
            if gender not in VALID_GENDERS:
                hard_errors.append(f"gender '{row.get('gender')}' not in {sorted(VALID_GENDERS)}")

            national_id = (row.get("national_id") or "").strip()
            missing_national_id = not national_id
            if missing_national_id:
                stats["flagged_missing_national_id"] += 1

            if hard_errors:
                stats["failed"] += 1
                errors.append({
                    "row": row_number, "mrn": mrn or "(missing)",
                    "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
                    "errors": hard_errors,
                })
                continue

            row_imported = False
            try:
                with transaction.atomic():
                    _set_tenant_guc(tenant_id)

                    if Patient.objects.filter(tenant_id=tenant_uuid, mrn=mrn).exists():
                        stats["skipped_existing"] += 1
                        if dry_run:
                            transaction.set_rollback(True)
                        continue

                    patient = Patient(
                        tenant_id=tenant_uuid,
                        mrn=mrn,
                        first_name=row["first_name"].strip(),
                        last_name=row["last_name"].strip(),
                        dob=dob,
                        gender=gender,
                        national_id=national_id or None,
                        passport_number=(row.get("passport_number") or "").strip() or None,
                    )
                    patient.full_clean(exclude=["merged_into"])
                    patient.save()
                    MigrationRecord.objects.create(
                        tenant_id=tenant_uuid, batch_id=batch_uuid, entity_type="patient",
                        model_label="cymed_patients.Patient", object_id=patient.id,
                        source_row_identifier=mrn, imported_by_script="import_patients.py",
                    )

                    country_code = (row.get("nationality_country_code") or "").strip().upper()
                    if country_code:
                        PatientNationality.objects.create(
                            tenant_id=tenant_uuid, patient=patient, country_code=country_code,
                        )

                    icd11_codes = [c.strip() for c in (row.get("diagnosis_icd11_codes") or "").split(";") if c.strip()]
                    unresolved_codes = []
                    for code in icd11_codes:
                        try:
                            is_valid = TerminologyService.validate(
                                provider="icd11", code=code, tenant_id=tenant_uuid,
                                requested_by="import_patients_script",
                            )
                        except Exception as exc:
                            is_valid = False
                            unresolved_codes.append(f"{code} (lookup error: {exc})")
                        if is_valid:
                            Condition.objects.create(
                                tenant_id=tenant_uuid,
                                patient=patient,
                                code=code,
                                display=f"Imported from legacy record (code {code})",
                                system="icd11",
                                clinical_status="active",
                                verification_status="confirmed",
                                recorded_by="legacy_import:import_patients.py",
                            )
                            stats["conditions_created"] += 1
                        elif code not in unresolved_codes:
                            unresolved_codes.append(code)

                    free_text_history = (row.get("medical_history_notes") or "").strip()
                    if unresolved_codes or free_text_history:
                        stats["rows_needing_coding"] += 1
                        needs_coding.append({
                            "row": row_number, "mrn": mrn,
                            "unresolved_icd11_codes": unresolved_codes,
                            "medical_history_notes": free_text_history,
                            "reason": "free-text history and/or unresolvable codes -- requires human clinical coding, not auto-coded",
                        })

                    row_imported = True
                    if dry_run:
                        transaction.set_rollback(True)
            except Exception as exc:
                stats["failed"] += 1
                errors.append({
                    "row": row_number, "mrn": mrn or "(missing)",
                    "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
                    "errors": [str(exc)],
                })
                continue

            if row_imported:
                stats["imported"] += 1
                if missing_national_id:
                    errors.append({
                        "row": row_number, "mrn": mrn,
                        "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
                        "errors": ["missing mandatory regional-compliance field 'national_id' -- imported anyway, flagged for follow-up"],
                    })

    return {"stats": stats, "errors": errors, "needs_coding": needs_coding}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", required=True, help="Path to the legacy patient CSV export.")
    parser.add_argument("--tenant-id", required=True, help="Tenant UUID this hospital's data belongs to.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report without writing any rows.")
    parser.add_argument("--batch-id", default=None, help="UUID to tag this run's rows with (auto-generated if omitted).")
    parser.add_argument("--error-log", default="error_log.json", help="Where to write flagged/failed rows.")
    parser.add_argument("--needs-coding-log", default="needs_clinical_coding.json", help="Where to write rows needing human clinical coding.")
    args = parser.parse_args()

    if not Path(args.csv).exists():
        print(f"FATAL: CSV file not found: {args.csv}", file=sys.stderr)
        return 1

    batch_id = args.batch_id or str(uuid.uuid4())
    result = import_patients(args.csv, args.tenant_id, dry_run=args.dry_run, batch_id=batch_id)

    Path(args.error_log).write_text(json.dumps(result["errors"], indent=2), encoding="utf-8")
    Path(args.needs_coding_log).write_text(json.dumps(result["needs_coding"], indent=2), encoding="utf-8")

    stats = result["stats"]
    mode = "DRY RUN" if args.dry_run else "LIVE IMPORT"
    print(f"=== import_patients.py [{mode}] === batch-id: {batch_id}")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    print(f"  -> {len(result['errors'])} row(s) written to {args.error_log}")
    print(f"  -> {len(result['needs_coding'])} row(s) written to {args.needs_coding_log}")
    print("NOTE: CyShop (separate Django project) is not touched by this script.")

    return 1 if stats["failed"] > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
