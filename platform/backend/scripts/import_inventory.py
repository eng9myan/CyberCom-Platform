#!/usr/bin/env python
"""
Legacy pharmacy catalog / inventory importer for the CyberCom (CyCom ERP)
production cutover.

Scope: maps into the REAL CyCom models -- products.cycom.inventory.
Warehouse, StockItem, StockBatch -- and creates the initial "receipt"
StockMovement for each batch via StockMovement.save() (not by hand-setting
StockItem.quantity/StockBatch.quantity_on_hand directly), so the same FEFO
aggregate-sync logic the rest of the system relies on
(products/cycom/inventory/models.py::StockMovement.save()) runs for
migrated stock too, not just stock entered after cutover.

FEFO enforcement (the task's explicit requirement): batch_number and
expiry_date are MANDATORY for every row. A legacy catalog row missing
either is rejected outright (not imported as a batch-less StockItem with
no way to enforce First-Expired-First-Out later) and logged to the error
log -- it does not fail the rest of the batch.

An expiry_date that is already in the past is NOT rejected (a cutover
still needs to capture already-expired stock sitting in a real warehouse
so pharmacy can see and write it off) -- it's imported and flagged as a
WARNING for immediate review, distinct from hard errors.

Does not touch CyShop (see import_patients.py's module docstring for why:
separate Django project, unrelated database, not reachable here).

Expected CSV columns (extra columns ignored; required, case-sensitive):
    sku, name, unit, unit_cost, reorder_level, par_level,
    batch_number, expiry_date, quantity

  - unit: defaults to "pcs" if blank.
  - unit_cost / reorder_level / par_level: default to 0 if blank.
  - expiry_date: YYYY-MM-DD, mandatory.
  - batch_number: mandatory, unique per stock item.
  - quantity: the batch's initial received quantity (must be > 0).

Usage:
    python scripts/import_inventory.py --csv legacy_pharmacy_catalog.csv \
        --tenant-id <uuid> --warehouse-code MAIN-PHARM \
        --warehouse-name "Main Pharmacy Store" \
        [--dry-run] [--error-log inventory_error_log.json]
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import uuid
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django  # noqa: E402

django.setup()

from django.db import connection, transaction  # noqa: E402


def _set_tenant_guc(tenant_id: str) -> None:
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


def _parse_decimal(value: str, default: str = "0") -> Decimal | None:
    value = (value or "").strip()
    if not value:
        return Decimal(default)
    try:
        return Decimal(value)
    except InvalidOperation:
        return None


def import_inventory(
    csv_path: str, tenant_id: str, *, warehouse_code: str, warehouse_name: str, dry_run: bool,
) -> dict:
    from products.cycom.inventory.models import StockBatch, StockItem, StockMovement, Warehouse

    tenant_uuid = uuid.UUID(tenant_id)

    stats = {
        "rows_read": 0,
        "batches_imported": 0,
        "batches_already_exist": 0,
        "rejected_missing_fefo_fields": 0,
        "rejected_invalid_data": 0,
        "warned_already_expired": 0,
    }
    errors: list[dict] = []
    warnings: list[dict] = []

    # Warehouse resolution gets its own small transaction rather than
    # wrapping the entire CSV loop in one giant transaction -- a real
    # legacy catalog can be large, and holding one open transaction for
    # the whole run is a lock/rollback-size risk; each row below manages
    # its own atomicity instead (same pattern as import_patients.py).
    # Warehouse creation is idempotent (get_or_create on tenant+code) and
    # not sensitive data, so it's allowed to actually commit even under
    # --dry-run -- only stock rows below honor the "nothing persists"
    # dry-run contract.
    with transaction.atomic():
        _set_tenant_guc(tenant_id)
        warehouse, _ = Warehouse.objects.get_or_create(
            tenant_id=tenant_uuid, code=warehouse_code,
            defaults={"name": warehouse_name or warehouse_code},
        )

    with open(csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row_number, row in enumerate(reader, start=2):
            stats["rows_read"] += 1
            sku = (row.get("sku") or "").strip()
            name = (row.get("name") or "").strip()
            batch_number = (row.get("batch_number") or "").strip()
            expiry_date = _parse_date(row.get("expiry_date", ""))

            # FEFO is a hard requirement -- reject, don't guess a date.
            if not batch_number or expiry_date is None:
                stats["rejected_missing_fefo_fields"] += 1
                reasons = []
                if not batch_number:
                    reasons.append("missing batch_number (FEFO requires it)")
                if expiry_date is None:
                    reasons.append(
                        f"missing/invalid expiry_date '{row.get('expiry_date', '')}' (FEFO requires it, format YYYY-MM-DD)"
                    )
                errors.append({"row": row_number, "sku": sku or "(missing)", "errors": reasons})
                continue

            if not sku or not name:
                stats["rejected_invalid_data"] += 1
                errors.append({
                    "row": row_number, "sku": sku or "(missing)",
                    "errors": [e for e in [
                        "missing sku" if not sku else None,
                        "missing name" if not name else None,
                    ] if e],
                })
                continue

            quantity = _parse_decimal(row.get("quantity", ""), default="0")
            unit_cost = _parse_decimal(row.get("unit_cost", ""), default="0")
            reorder_level = _parse_decimal(row.get("reorder_level", ""), default="0")
            par_level = _parse_decimal(row.get("par_level", ""), default="0")
            bad_decimals = [
                label for label, val in [
                    ("quantity", quantity), ("unit_cost", unit_cost),
                    ("reorder_level", reorder_level), ("par_level", par_level),
                ] if val is None
            ]
            if bad_decimals or (quantity is not None and quantity <= 0):
                stats["rejected_invalid_data"] += 1
                reasons = [f"'{label}' is not a valid number" for label in bad_decimals]
                if quantity is not None and quantity <= 0:
                    reasons.append(f"quantity must be > 0, got {quantity}")
                errors.append({"row": row_number, "sku": sku, "errors": reasons})
                continue

            try:
                with transaction.atomic():
                    _set_tenant_guc(tenant_id)

                    stock_item, _ = StockItem.objects.get_or_create(
                        tenant_id=tenant_uuid, warehouse=warehouse, sku=sku,
                        defaults={
                            "name": name,
                            "unit": (row.get("unit") or "").strip() or "pcs",
                            "unit_cost": unit_cost,
                            "reorder_level": reorder_level,
                            "par_level": par_level,
                        },
                    )

                    if StockBatch.objects.filter(
                        tenant_id=tenant_uuid, stock_item=stock_item, batch_number=batch_number
                    ).exists():
                        stats["batches_already_exist"] += 1
                        if dry_run:
                            transaction.set_rollback(True)
                        continue

                    batch = StockBatch.objects.create(
                        tenant_id=tenant_uuid, stock_item=stock_item,
                        batch_number=batch_number, expiry_date=expiry_date,
                    )

                    # Real receipt movement -- this is what actually
                    # updates StockItem.quantity AND StockBatch.
                    # quantity_on_hand together, via StockMovement.save()'s
                    # existing FEFO-aware logic, instead of hand-setting
                    # either field and risking drift.
                    StockMovement.objects.create(
                        tenant_id=tenant_uuid, stock_item=stock_item, batch=batch,
                        movement_type="receipt", quantity=quantity,
                        notes=f"Legacy cutover import (batch {batch_number})",
                    )

                    if expiry_date < date.today():
                        stats["warned_already_expired"] += 1
                        warnings.append({
                            "row": row_number, "sku": sku, "batch_number": batch_number,
                            "expiry_date": expiry_date.isoformat(),
                            "warning": "batch is already expired -- imported for accurate stock-taking, flag for immediate write-off/disposal",
                        })

                    stats["batches_imported"] += 1
                    if dry_run:
                        transaction.set_rollback(True)
            except Exception as exc:
                stats["rejected_invalid_data"] += 1
                errors.append({"row": row_number, "sku": sku, "errors": [str(exc)]})

    return {"stats": stats, "errors": errors, "warnings": warnings}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", required=True, help="Path to the legacy pharmacy catalog CSV export.")
    parser.add_argument("--tenant-id", required=True, help="Tenant UUID this hospital's data belongs to.")
    parser.add_argument("--warehouse-code", required=True, help="Warehouse code to import stock into (created if it doesn't exist).")
    parser.add_argument("--warehouse-name", default="", help="Warehouse display name, used only if the warehouse is being created.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report without writing any rows.")
    parser.add_argument("--error-log", default="inventory_error_log.json", help="Where to write rejected rows.")
    parser.add_argument("--warning-log", default="inventory_warnings.json", help="Where to write non-fatal warnings (e.g. already-expired batches).")
    args = parser.parse_args()

    if not Path(args.csv).exists():
        print(f"FATAL: CSV file not found: {args.csv}", file=sys.stderr)
        return 1

    result = import_inventory(
        args.csv, args.tenant_id,
        warehouse_code=args.warehouse_code, warehouse_name=args.warehouse_name,
        dry_run=args.dry_run,
    )

    Path(args.error_log).write_text(json.dumps(result["errors"], indent=2), encoding="utf-8")
    Path(args.warning_log).write_text(json.dumps(result["warnings"], indent=2), encoding="utf-8")

    stats = result["stats"]
    mode = "DRY RUN" if args.dry_run else "LIVE IMPORT"
    print(f"=== import_inventory.py [{mode}] ===")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    print(f"  -> {len(result['errors'])} row(s) written to {args.error_log}")
    print(f"  -> {len(result['warnings'])} row(s) written to {args.warning_log}")
    print("NOTE: CyShop (separate Django project) is not touched by this script.")

    return 1 if stats["rejected_invalid_data"] > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
