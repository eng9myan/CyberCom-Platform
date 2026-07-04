from rest_framework.decorators import action

from products.cymed.hospital.capacity_management.models import (
    CapacityRule,
    CapacityThreshold,
    OverflowUnit,
    SurgePlan,
)
from products.cymed.hospital.capacity_management.serializers import (
    CapacityRuleSerializer,
    CapacityThresholdSerializer,
    OverflowUnitSerializer,
    SurgePlanSerializer,
)
from products.cymed.hospital.services import CapacityService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class CapacityRuleViewSet(HospitalModelViewSet):
    queryset = CapacityRule.objects.all()
    serializer_class = CapacityRuleSerializer

    @action(detail=False, methods=["get"])
    def facility_capacity(self, request):
        """Returns per-ward and facility-wide bed utilization."""
        return run_service_action(
            lambda: CapacityService.get_facility_capacity(
                tenant_id=request.tenant_id,
                facility_id=request.query_params.get("facility_id"),
            )
        )

    @action(detail=False, methods=["get"])
    def forecast(self, request):
        """Returns a projected admissions/discharges forecast for the facility."""
        return run_service_action(
            lambda: CapacityService.get_capacity_forecast(
                tenant_id=request.tenant_id,
                facility_id=request.query_params.get("facility_id"),
                hours_ahead=int(request.query_params.get("hours_ahead", 24)),
            )
        )

    @action(detail=False, methods=["post"])
    def check_surge(self, request):
        """Evaluates current occupancy against surge thresholds."""
        data = request.data
        return run_service_action(
            lambda: CapacityService.check_surge_threshold(
                tenant_id=request.tenant_id,
                facility_id=data.get("facility_id"),
            )
        )


class CapacityThresholdViewSet(HospitalModelViewSet):
    queryset = CapacityThreshold.objects.all()
    serializer_class = CapacityThresholdSerializer


class SurgePlanViewSet(HospitalModelViewSet):
    queryset = SurgePlan.objects.all()
    serializer_class = SurgePlanSerializer

    @action(detail=False, methods=["post"])
    def activate(self, request):
        """Activates a surge protocol and opens an overflow unit."""
        from rest_framework import status

        data = request.data
        return run_service_action(
            lambda: CapacityService.activate_surge_plan(
                tenant_id=request.tenant_id,
                facility_id=data.get("facility_id"),
                surge_level=data.get("surge_level", "1"),
                activated_by=data.get("activated_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )


class OverflowUnitViewSet(HospitalModelViewSet):
    queryset = OverflowUnit.objects.all()
    serializer_class = OverflowUnitSerializer
