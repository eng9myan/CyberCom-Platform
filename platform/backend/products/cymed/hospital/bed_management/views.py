from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.bed_management.models import (
    BedAssignment,
    BedBlocking,
    BedCleaning,
    BedMaintenance,
    BedOccupancy,
    BedReservation,
)
from products.cymed.hospital.bed_management.serializers import (
    BedAssignmentSerializer,
    BedBlockingSerializer,
    BedCleaningSerializer,
    BedMaintenanceSerializer,
    BedOccupancySerializer,
    BedReservationSerializer,
)
from products.cymed.hospital.services import BedManagementService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class BedAssignmentViewSet(HospitalModelViewSet):
    queryset = BedAssignment.objects.all()
    serializer_class = BedAssignmentSerializer

    @action(detail=False, methods=["post"])
    def assign(self, request):
        """Assigns a bed to a patient, releasing any prior active assignment."""
        data = request.data
        return run_service_action(
            lambda: BedManagementService.assign_bed(
                tenant_id=request.tenant_id,
                bed_id=data.get("bed_id"),
                patient_id=data.get("patient_id"),
                encounter_id=data.get("encounter_id"),
                assigned_by=data.get("assigned_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"])
    def release(self, request):
        """Releases a bed assignment and marks the bed available (triggers cleaning on discharge)."""
        data = request.data
        return run_service_action(
            lambda: BedManagementService.release_bed(
                tenant_id=request.tenant_id,
                bed_id=data.get("bed_id"),
                reason=data.get("reason", "discharge"),
            )
        )

    @action(detail=False, methods=["get"])
    def available(self, request):
        """Lists available beds, optionally filtered by ward or room type."""
        beds = BedManagementService.get_available_beds(
            tenant_id=request.tenant_id,
            ward_id=request.query_params.get("ward_id"),
            room_type=request.query_params.get("room_type"),
        )
        return run_service_action(lambda: beds)

    @action(detail=False, methods=["get"])
    def census(self, request):
        """Returns bed occupancy counts (total/occupied/available/maintenance/cleaning)."""
        return run_service_action(
            lambda: BedManagementService.get_census(
                tenant_id=request.tenant_id,
                facility_id=request.query_params.get("facility_id"),
            )
        )


class BedOccupancyViewSet(HospitalModelViewSet):
    queryset = BedOccupancy.objects.all()
    serializer_class = BedOccupancySerializer


class BedReservationViewSet(HospitalModelViewSet):
    queryset = BedReservation.objects.all()
    serializer_class = BedReservationSerializer


class BedCleaningViewSet(HospitalModelViewSet):
    """
    Creation only via request_cleaning/complete -- both keep core.facilities.Bed.status
    in sync. A raw POST here would create a cleaning row without ever touching the
    bed's own status, letting the two desync (found in Hospital_Enterprise_Report gap
    analysis).
    """

    queryset = BedCleaning.objects.all()
    serializer_class = BedCleaningSerializer

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Use the request_cleaning/ or {id}/complete/ actions, not a raw POST."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=False, methods=["post"])
    def request_cleaning(self, request):
        """Creates a cleaning task for a bed and marks it reserved/turnover."""
        data = request.data
        return run_service_action(
            lambda: BedManagementService.request_cleaning(
                tenant_id=request.tenant_id,
                bed_id=data.get("bed_id"),
                priority=data.get("priority", "routine"),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Marks the cleaning done and returns the bed to the available pool."""
        data = request.data
        return run_service_action(
            lambda: BedManagementService.complete_cleaning(
                tenant_id=request.tenant_id,
                cleaning_id=pk,
                cleaner_name=data.get("cleaner_name", ""),
            )
        )


class BedMaintenanceViewSet(HospitalModelViewSet):
    queryset = BedMaintenance.objects.all()
    serializer_class = BedMaintenanceSerializer


class BedBlockingViewSet(HospitalModelViewSet):
    """Creation only via block/unblock -- see BedCleaningViewSet docstring for why."""

    queryset = BedBlocking.objects.all()
    serializer_class = BedBlockingSerializer

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Use the block/ or {id}/unblock/ actions, not a raw POST."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=False, methods=["post"])
    def block(self, request):
        """Blocks a bed for maintenance/cleaning, taking it out of the available pool."""
        data = request.data
        return run_service_action(
            lambda: BedManagementService.block_bed(
                tenant_id=request.tenant_id,
                bed_id=data.get("bed_id"),
                reason=data.get("reason", ""),
                blocked_by=data.get("blocked_by", str(request.user)),
                until=data.get("until"),
            ),
            success_status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def unblock(self, request, pk=None):
        """Clears the block and returns the bed to the available pool."""
        return run_service_action(
            lambda: BedManagementService.unblock_bed(tenant_id=request.tenant_id, blocking_id=pk)
        )
