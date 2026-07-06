"""
Broadcasts real hospital command-center KPIs to any WebSocket clients
connected to `ws/hospital/command-center/`. Push cadence is a Celery beat
schedule (10s), not per-event signals -- wiring a real-time invalidation
signal on every admission/discharge/bed-change across a dozen models would
be a much larger change; a 10s server push already beats the frontend's
15s HTTP poll and needs no per-model signal wiring.
"""
from __future__ import annotations

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer

from platform.tenant.models import Tenant, TenantStatus
from products.cymed.hospital.services import HospitalOperationsService


@shared_task(name="hospital_command_center.broadcast_kpis")
def broadcast_hospital_kpis_task() -> int:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return 0

    broadcast_count = 0
    for tenant in Tenant.objects.filter(status=TenantStatus.ACTIVE).only("id"):
        try:
            snapshot = HospitalOperationsService.get_snapshot(str(tenant.id))
        except Exception:
            continue

        async_to_sync(channel_layer.group_send)(
            f"hospital_kpis_{tenant.id}",
            {"type": "kpi.update", "data": snapshot},
        )
        broadcast_count += 1

    return broadcast_count
