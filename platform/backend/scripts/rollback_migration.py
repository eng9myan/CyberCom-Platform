#!/usr/bin/env python
"""
Rolls back everything import_patients.py / import_inventory.py created
under a given --batch-id (see platform.common.models.MigrationRecord).

Patients: soft-deactivated (Patient.is_active = False), never hard-deleted
-- this is real PHI, and an accidental full delete of a patient record
during a botched cutover is a much worse outcome than a batch rollback
leaving an inactive row behind. Re-running the import afterward will hit
the existing MRN and be skipped as "already exists" (see
import_patients.py), which is the correct, safe behavior for a fix-and-
retry cutover.

Inventory: hard-deleted, since StockItem has no soft-delete flag to set.
Deleted in dependency-safe order -- StockMovement before StockBatch
(StockMovement.batch is on_delete=PROTECT, so deleting the batch first
would raise ProtectedError) before StockItem, and a StockItem is only
deleted if this rollback removes its last remaining batch (it may be
shared with data from a different, still-valid batch).

Usage:
    python scripts/rollback_migration.py --batch-id <uuid> --tenant-id <uuid> \
        [--dry-run]
"""
from __future__ import annotations

import argparse
import os
import sys
import uuid
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django  # noqa: E402

django.setup()

from django.db import transaction  # noqa: E402
from django.utils import timezone  # noqa: E402

# Deletion order matters for FK safety -- movements before batches (PROTECT),
# batches before items. Patients aren't in this list; they're deactivated,
# not deleted, handled separately below.
INVENTORY_ROLLBACK_ORDER = ["stock_movement", "stock_batch", "stock_item"]


def rollback(batch_id: str, tenant_id: str, *, dry_run: bool) -> dict:
    from platform.common.models import MigrationRecord
    from products.cycom.inventory.models import StockBatch, StockItem, StockMovement
    from products.cymed.core.patients.models import Patient

    batch_uuid = uuid.UUID(batch_id)
    tenant_uuid = uuid.UUID(tenant_id)

    records = list(
        MigrationRecord.objects.filter(tenant_id=tenant_uuid, batch_id=batch_uuid, rolled_back_at__isnull=True)
    )
    if not records:
        return {"error": "No un-rolled-back MigrationRecord rows found for this batch/tenant.", "stats": {}}

    by_entity_type: dict[str, list] = {}
    for record in records:
        by_entity_type.setdefault(record.entity_type, []).append(record)

    stats = {
        "patients_deactivated": 0,
        "stock_movements_deleted": 0,
        "stock_batches_deleted": 0,
        "stock_items_deleted": 0,
        "stock_items_kept_shared": 0,
        "records_marked_rolled_back": 0,
    }

    with transaction.atomic():
        # Patients: deactivate, never delete.
        for record in by_entity_type.get("patient", []):
            updated = Patient.objects.filter(id=record.object_id).update(is_active=False)
            if updated:
                stats["patients_deactivated"] += 1
            record.rolled_back_at = timezone.now()
            record.save(update_fields=["rolled_back_at"])
            stats["records_marked_rolled_back"] += 1

        # Inventory: hard-delete in dependency-safe order.
        for entity_type in INVENTORY_ROLLBACK_ORDER:
            for record in by_entity_type.get(entity_type, []):
                if entity_type == "stock_movement":
                    deleted, _ = StockMovement.objects.filter(id=record.object_id).delete()
                    if deleted:
                        stats["stock_movements_deleted"] += 1
                elif entity_type == "stock_batch":
                    deleted, _ = StockBatch.objects.filter(id=record.object_id).delete()
                    if deleted:
                        stats["stock_batches_deleted"] += 1
                elif entity_type == "stock_item":
                    stock_item = StockItem.objects.filter(id=record.object_id).first()
                    if stock_item is None:
                        continue
                    if stock_item.batches.exists():
                        # Still has batches this rollback didn't touch (shared
                        # with another, still-valid import) -- keep it.
                        stats["stock_items_kept_shared"] += 1
                        continue
                    stock_item.delete()
                    stats["stock_items_deleted"] += 1

                record.rolled_back_at = timezone.now()
                record.save(update_fields=["rolled_back_at"])
                stats["records_marked_rolled_back"] += 1

        if dry_run:
            transaction.set_rollback(True)

    return {"stats": stats}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--batch-id", required=True, help="Migration batch UUID to roll back.")
    parser.add_argument("--tenant-id", required=True, help="Tenant UUID.")
    parser.add_argument("--dry-run", action="store_true", help="Report what would happen without writing anything.")
    args = parser.parse_args()

    result = rollback(args.batch_id, args.tenant_id, dry_run=args.dry_run)

    if "error" in result:
        print(f"FATAL: {result['error']}", file=sys.stderr)
        return 1

    mode = "DRY RUN" if args.dry_run else "LIVE ROLLBACK"
    print(f"=== rollback_migration.py [{mode}] batch {args.batch_id} ===")
    for key, value in result["stats"].items():
        print(f"  {key}: {value}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
