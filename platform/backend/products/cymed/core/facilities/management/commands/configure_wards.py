"""
Config-driven ward/nurse-station/room/bed provisioning for a facility.

Real hospitals don't share a bed layout, so this is intentionally
config-driven rather than hardcoded: point it at a JSON file describing
each accommodation tier (nurse stations, rooms per station, beds per room)
and it provisions the whole Department -> Ward -> Room -> Bed tree,
matching NursingAssignment.ward_id's existing "ward == nurse station
coverage area" convention.

Idempotent: every object lookup is get_or_create'd on its natural business
key (facility code, department code, ward code, room number, bed number),
so re-running against an already-provisioned tenant is a no-op except for
whatever changed in the config file.

Example config JSON:

{
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
      "beds_per_room": 4
    },
    {
      "code_prefix": "STD-SINGLE",
      "name": "Standard Single-Bed",
      "accommodation_tier": "single_bed",
      "room_type": "standard",
      "stations": 5,
      "rooms_per_station": 10,
      "beds_per_room": 1
    },
    {
      "code_prefix": "VIP",
      "name": "VIP",
      "accommodation_tier": "vip",
      "room_type": "standard",
      "stations": 4,
      "rooms_per_station": 5,
      "beds_per_room": 1
    }
  ]
}

Usage:
    python manage.py configure_wards --tenant-id <uuid> --config wards.json
    python manage.py configure_wards --tenant-id <uuid> --config wards.json --dry-run
"""

import json
import uuid
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from products.cymed.core.facilities.models import Bed, Department, Facility, Room, Ward

REQUIRED_TIER_KEYS = {
    "code_prefix",
    "name",
    "accommodation_tier",
    "room_type",
    "stations",
    "rooms_per_station",
    "beds_per_room",
}


class Command(BaseCommand):
    help = "Provision a facility's ward/nurse-station/room/bed tree from a JSON config file."

    def add_arguments(self, parser):
        parser.add_argument("--tenant-id", required=True, help="Tenant UUID this facility belongs to.")
        parser.add_argument("--config", required=True, help="Path to the ward-layout JSON config file.")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be created without writing to the database.",
        )

    def handle(self, *args, **options):
        tenant_id = self._parse_uuid(options["tenant_id"])
        config = self._load_config(options["config"])
        dry_run = options["dry_run"]

        facility = self._get_facility(tenant_id, config["facility_code"])

        plan = self._build_plan(tenant_id, facility, config)

        if dry_run:
            self._print_plan(plan)
            return

        with transaction.atomic():
            self._apply_plan(plan)

        self._print_summary(plan)

    def _parse_uuid(self, raw: str) -> uuid.UUID:
        try:
            return uuid.UUID(raw)
        except ValueError as exc:
            raise CommandError(f"--tenant-id is not a valid UUID: {raw}") from exc

    def _load_config(self, path: str) -> dict:
        config_path = Path(path)
        if not config_path.is_file():
            raise CommandError(f"Config file not found: {path}")
        try:
            config = json.loads(config_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Config file is not valid JSON: {exc}") from exc

        for key in ("facility_code", "department_code", "department_name", "tiers"):
            if key not in config:
                raise CommandError(f"Config is missing required top-level key: {key!r}")
        if not config["tiers"]:
            raise CommandError("Config 'tiers' must contain at least one accommodation tier.")
        for i, tier in enumerate(config["tiers"]):
            missing = REQUIRED_TIER_KEYS - tier.keys()
            if missing:
                raise CommandError(f"tiers[{i}] is missing required key(s): {sorted(missing)}")
        return config

    def _get_facility(self, tenant_id: uuid.UUID, facility_code: str) -> Facility:
        try:
            return Facility.objects.get(tenant_id=tenant_id, code=facility_code)
        except Facility.DoesNotExist as exc:
            raise CommandError(
                f"No Facility with code={facility_code!r} for tenant {tenant_id}. "
                "Create the facility first (this command provisions wards/rooms/beds "
                "under an existing facility, not the facility itself)."
            ) from exc

    def _build_plan(self, tenant_id: uuid.UUID, facility: Facility, config: dict) -> dict:
        """
        Computes every ward/room/bed the config implies, without touching the
        database -- lets --dry-run print an accurate plan and keeps the
        apply step a pure "create what's in the plan" loop.
        """
        wards = []
        for tier in config["tiers"]:
            for station_num in range(1, tier["stations"] + 1):
                ward_code = f"{tier['code_prefix']}-STN{station_num}"
                ward_name = f"{tier['name']} — Nurse Station {station_num}"
                rooms = []
                for room_num in range(1, tier["rooms_per_station"] + 1):
                    room_number = f"{ward_code}-RM{room_num:02d}"
                    beds = [
                        f"{room_number}-BED{bed_num}" for bed_num in range(1, tier["beds_per_room"] + 1)
                    ]
                    rooms.append(
                        {
                            "room_number": room_number,
                            "room_type": tier["room_type"],
                            "accommodation_tier": tier["accommodation_tier"],
                            "beds": beds,
                        }
                    )
                wards.append({"code": ward_code, "name": ward_name, "rooms": rooms})

        return {
            "tenant_id": tenant_id,
            "facility": facility,
            "department_code": config["department_code"],
            "department_name": config["department_name"],
            "wards": wards,
        }

    def _apply_plan(self, plan: dict) -> None:
        tenant_id = plan["tenant_id"]
        department, _ = Department.objects.get_or_create(
            tenant_id=tenant_id,
            facility=plan["facility"],
            code=plan["department_code"],
            defaults={"name": plan["department_name"]},
        )

        for ward_plan in plan["wards"]:
            ward, _ = Ward.objects.get_or_create(
                tenant_id=tenant_id,
                department=department,
                code=ward_plan["code"],
                defaults={"name": ward_plan["name"]},
            )
            for room_plan in ward_plan["rooms"]:
                room, _ = Room.objects.get_or_create(
                    tenant_id=tenant_id,
                    ward=ward,
                    room_number=room_plan["room_number"],
                    defaults={
                        "room_type": room_plan["room_type"],
                        "accommodation_tier": room_plan["accommodation_tier"],
                    },
                )
                for bed_number in room_plan["beds"]:
                    Bed.objects.get_or_create(
                        tenant_id=tenant_id,
                        room=room,
                        bed_number=bed_number,
                        defaults={"status": "available"},
                    )

    def _print_plan(self, plan: dict) -> None:
        total_rooms = sum(len(w["rooms"]) for w in plan["wards"])
        total_beds = sum(len(r["beds"]) for w in plan["wards"] for r in w["rooms"])
        self.stdout.write(
            f"DRY RUN — would provision department {plan['department_code']!r} "
            f"under facility {plan['facility'].code!r}:"
        )
        for ward in plan["wards"]:
            self.stdout.write(f"  Ward {ward['code']} ({ward['name']}): {len(ward['rooms'])} room(s)")
        self.stdout.write(
            f"Total: {len(plan['wards'])} ward(s) / nurse station(s), "
            f"{total_rooms} room(s), {total_beds} bed(s)."
        )

    def _print_summary(self, plan: dict) -> None:
        total_rooms = sum(len(w["rooms"]) for w in plan["wards"])
        total_beds = sum(len(r["beds"]) for w in plan["wards"] for r in w["rooms"])
        self.stdout.write(
            self.style.SUCCESS(
                f"Provisioned {len(plan['wards'])} ward(s)/nurse station(s), "
                f"{total_rooms} room(s), {total_beds} bed(s) under "
                f"{plan['department_code']} / {plan['facility'].code}."
            )
        )
