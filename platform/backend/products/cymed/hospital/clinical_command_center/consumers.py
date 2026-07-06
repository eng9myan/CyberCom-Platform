"""
Real-time push for the CyAnalytics Executive Wall / hospital command center.
Replaces the frontend's 15s poll for connected clients: on connect the
consumer sends the current real snapshot immediately, then forwards
"kpi.update" broadcasts published by the `broadcast_hospital_kpis` Celery
beat task (products/cymed/hospital/clinical_command_center/tasks.py).
"""
from __future__ import annotations

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from products.cymed.hospital.services import HospitalOperationsService


class HospitalKpiConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        claims = self.scope.get("auth_claims")
        tenant_id = self.scope.get("tenant_id")
        if not claims or not tenant_id:
            await self.close(code=4001)
            return

        self.tenant_id = tenant_id
        self.group_name = f"hospital_kpis_{tenant_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        bundle = await self._get_bundle()
        await self.send_json({"type": "snapshot", "data": bundle})

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def kpi_update(self, event):
        """Handler for group_send({"type": "kpi.update", ...}) -- forwards to the client."""
        await self.send_json({"type": "kpi_update", "data": event["data"]})

    @database_sync_to_async
    def _get_bundle(self) -> dict:
        return get_hospital_kpi_bundle(self.tenant_id)


def get_hospital_kpi_bundle(tenant_id: str) -> dict:
    """Shared by the consumer (sync-wrapped) and the broadcast Celery task."""
    return {
        "census": HospitalOperationsService.get_snapshot(tenant_id),
        "modules": HospitalOperationsService.get_module_summary(tenant_id),
    }
