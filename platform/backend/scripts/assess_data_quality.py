#!/usr/bin/env python
"""
Pre-flight data-quality assessment for a legacy CSV export, run BEFORE
import_patients.py / import_inventory.py -- catches structural problems
(missing required fields, bad dates, duplicate natural keys) against the
source file itself, so a bad export gets fixed before a real import run
rather than discovered row-by-row mid-migration.

Deliberately does NOT touch the database or require DJANGO_SETTINGS_MODULE
-- this only reads the CSV, it doesn't need Django set up at all. Keeps
this runnable by whoever's staging the export (often before a tenant even
exists yet) without needing backend credentials.

Supported --entity values: patients, inventory. The required/date/decimal
field lists mirror the column contracts documented in import_patients.py
and import_inventory.py's module docstrings exactly -- if those change,
update ENTITY_SPECS here too.

Usage:
    python scripts/assess_data_quality.py --input legacy_patients.csv \
        --entity patients [--report migration_quality_report.html]
"""
from __future__ import annotations

import argparse
import csv
import sys
from collections import Counter
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

ENTITY_SPECS = {
    "patients": {
        "natural_key": "mrn",
        "required_fields": ["mrn", "first_name", "last_name", "dob", "gender"],
        "date_fields": ["dob"],
        "decimal_fields": [],
        "choice_fields": {"gender": {"male", "female", "other", "unknown"}},
    },
    "inventory": {
        "natural_key": "sku",
        "required_fields": ["sku", "name", "batch_number", "expiry_date"],
        "date_fields": ["expiry_date"],
        "decimal_fields": ["quantity", "unit_cost", "reorder_level", "par_level"],
        "choice_fields": {},
    },
}


def _valid_date(value: str) -> bool:
    value = (value or "").strip()
    if not value:
        return False
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def _valid_decimal(value: str) -> bool:
    value = (value or "").strip()
    if not value:
        return True  # decimal fields are allowed blank -- scripts default them to 0
    try:
        Decimal(value)
        return True
    except InvalidOperation:
        return False


def assess(csv_path: str, entity: str) -> dict:
    spec = ENTITY_SPECS[entity]
    natural_key_field = spec["natural_key"]

    row_count = 0
    missing_required: dict[str, int] = Counter()
    bad_dates: dict[str, int] = Counter()
    bad_decimals: dict[str, int] = Counter()
    bad_choices: dict[str, int] = Counter()
    natural_keys: list[str] = []
    row_issues: list[dict] = []

    with open(csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        header = reader.fieldnames or []
        missing_columns = [f for f in spec["required_fields"] if f not in header]

        for row_number, row in enumerate(reader, start=2):
            row_count += 1
            issues: list[str] = []

            for field in spec["required_fields"]:
                if not (row.get(field) or "").strip():
                    missing_required[field] += 1
                    issues.append(f"missing required field '{field}'")

            for field in spec["date_fields"]:
                value = row.get(field, "")
                if (value or "").strip() and not _valid_date(value):
                    bad_dates[field] += 1
                    issues.append(f"'{field}' is not a valid YYYY-MM-DD date: {value!r}")

            for field in spec["decimal_fields"]:
                value = row.get(field, "")
                if not _valid_decimal(value):
                    bad_decimals[field] += 1
                    issues.append(f"'{field}' is not a valid number: {value!r}")

            for field, allowed in spec["choice_fields"].items():
                value = (row.get(field) or "").strip().lower()
                if value and value not in allowed:
                    bad_choices[field] += 1
                    issues.append(f"'{field}' value {value!r} not in {sorted(allowed)}")

            key = (row.get(natural_key_field) or "").strip()
            if key:
                natural_keys.append(key)

            if issues:
                row_issues.append({"row": row_number, natural_key_field: key or "(missing)", "issues": issues})

    key_counts = Counter(natural_keys)
    duplicate_keys = {k: c for k, c in key_counts.items() if c > 1}

    return {
        "entity": entity,
        "csv_path": csv_path,
        "row_count": row_count,
        "missing_columns": missing_columns,
        "missing_required_counts": dict(missing_required),
        "bad_date_counts": dict(bad_dates),
        "bad_decimal_counts": dict(bad_decimals),
        "bad_choice_counts": dict(bad_choices),
        "duplicate_natural_keys": duplicate_keys,
        "rows_with_issues": len(row_issues),
        "row_issues": row_issues[:500],  # cap -- a report with 50k rows of detail isn't reviewable anyway
        "row_issues_truncated": len(row_issues) > 500,
    }


def render_html_report(result: dict) -> str:
    rows_html = "".join(
        f"<tr><td>{r['row']}</td><td>{r.get(next(iter(r)), '')}</td><td>{'; '.join(r['issues'])}</td></tr>"
        for r in result["row_issues"]
    )
    duplicates_html = "".join(
        f"<li>{key} appears {count} times</li>" for key, count in result["duplicate_natural_keys"].items()
    )
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Migration Data Quality Report</title></head>
<body>
<h1>Data Quality Report -- {result['entity']}</h1>
<p>Source: {result['csv_path']}</p>
<p>Rows read: {result['row_count']}</p>
<p>Rows with issues: {result['rows_with_issues']}{' (showing first 500)' if result['row_issues_truncated'] else ''}</p>
<h2>Missing required columns entirely</h2>
<p>{', '.join(result['missing_columns']) or 'none'}</p>
<h2>Duplicate natural keys</h2>
<ul>{duplicates_html or '<li>none</li>'}</ul>
<h2>Row-level issues</h2>
<table border="1" cellpadding="4"><tr><th>Row</th><th>Key</th><th>Issues</th></tr>{rows_html}</table>
</body></html>"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input", required=True, help="Path to the legacy CSV export to assess.")
    parser.add_argument("--entity", required=True, choices=sorted(ENTITY_SPECS), help="Which entity's field contract to check against.")
    parser.add_argument("--report", default="migration_quality_report.html", help="Path to write the HTML report to.")
    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"FATAL: CSV file not found: {args.input}", file=sys.stderr)
        return 1

    result = assess(args.input, args.entity)
    Path(args.report).write_text(render_html_report(result), encoding="utf-8")

    print(f"=== assess_data_quality.py [{args.entity}] ===")
    print(f"  rows read: {result['row_count']}")
    print(f"  rows with issues: {result['rows_with_issues']}")
    print(f"  missing columns entirely: {result['missing_columns'] or 'none'}")
    print(f"  duplicate natural keys: {len(result['duplicate_natural_keys'])}")
    print(f"  -> full report: {args.report}")

    has_blocking_issues = bool(result["missing_columns"]) or result["rows_with_issues"] > 0
    return 1 if has_blocking_issues else 0


if __name__ == "__main__":
    sys.exit(main())
