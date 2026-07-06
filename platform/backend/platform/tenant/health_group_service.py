"""
Cross-tenant aggregation for a HealthGroup (holding company / hospital
network). Powers the Enterprise Command Center and Multi-Hospital
Dashboard's group-level view. This is the one place in the codebase that
legitimately queries across tenants -- every other view is tenant-scoped
by TenantIsolationMiddleware; this endpoint is explicitly exempted from
that middleware (see core/middleware/tenant.py) and gates access via
IsHealthGroupExecutive instead.
"""
from __future__ import annotations

from typing import Any

from platform.tenant.models import HealthGroup, Tenant, TenantStatus


def get_group_snapshot(group: HealthGroup) -> dict[str, Any]:
    from products.cymed.hospital.clinical_command_center.consumers import (
        get_hospital_kpi_bundle,
    )

    tenants = Tenant.objects.filter(health_group=group, status=TenantStatus.ACTIVE)

    per_hospital: list[dict[str, Any]] = []
    totals = {
        "active_admissions": 0,
        "current_occupied_beds": 0,
        "total_beds": 0,
        "emergency_waiting": 0,
        "icu_occupancy": 0,
        "invoices_outstanding": 0,
        "patients_total": 0,
    }

    for tenant in tenants:
        try:
            bundle = get_hospital_kpi_bundle(str(tenant.id))
        except Exception as exc:
            per_hospital.append(
                {
                    "tenant_id": str(tenant.id),
                    "tenant_name": tenant.display_name or tenant.name,
                    "error": str(exc),
                }
            )
            continue

        census = bundle["census"]["operational_census"]
        occupancy = bundle["census"]["capacity_indicators"]["bed_occupancy_percentage"]
        modules = bundle["modules"]

        per_hospital.append(
            {
                "tenant_id": str(tenant.id),
                "tenant_name": tenant.display_name or tenant.name,
                "active_admissions": census["active_admissions"],
                "current_occupied_beds": census["current_occupied_beds"],
                "total_beds": census["total_beds"],
                "bed_occupancy_percentage": occupancy,
                "emergency_waiting": census["emergency_waiting"],
                "icu_occupancy": census["icu_occupancy"],
                "invoices_outstanding": modules["invoices_outstanding"],
                "patients_total": modules["patients_total"],
            }
        )

        totals["active_admissions"] += census["active_admissions"]
        totals["current_occupied_beds"] += census["current_occupied_beds"]
        totals["total_beds"] += census["total_beds"]
        totals["emergency_waiting"] += census["emergency_waiting"]
        totals["icu_occupancy"] += census["icu_occupancy"]
        totals["invoices_outstanding"] += modules["invoices_outstanding"]
        totals["patients_total"] += modules["patients_total"]

    totals["group_bed_occupancy_percentage"] = (
        round(totals["current_occupied_beds"] / totals["total_beds"] * 100, 2)
        if totals["total_beds"]
        else None
    )

    return {
        "group_id": str(group.id),
        "group_name": group.name,
        "hospital_count": len(per_hospital),
        "totals": totals,
        "hospitals": per_hospital,
    }
