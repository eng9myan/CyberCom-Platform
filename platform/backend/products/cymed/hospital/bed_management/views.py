from rest_framework import status
from rest_framework.decorators import action

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
    queryset = BedCleaning.objects.all()
    serializer_class = BedCleaningSerializer

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


class BedMaintenanceViewSet(HospitalModelViewSet):
    queryset = BedMaintenance.objects.all()
    serializer_class = BedMaintenanceSerializer


class BedBlockingViewSet(HospitalModelViewSet):
    queryset = BedBlocking.objects.all()
    serializer_class = BedBlockingSerializer

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
