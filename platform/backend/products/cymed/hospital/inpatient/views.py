from rest_framework import status
from rest_framework.decorators import action

from products.cymed.hospital.inpatient.models import (
    DailyRound,
    DischargePlanning,
    HospitalStay,
    InpatientCarePlan,
    ProgressReview,
)
from products.cymed.hospital.inpatient.serializers import (
    DailyRoundSerializer,
    DischargePlanningSerializer,
    HospitalStaySerializer,
    InpatientCarePlanSerializer,
    ProgressReviewSerializer,
)
from products.cymed.hospital.services import DischargeService
from products.cymed.hospital.views import HospitalModelViewSet, run_service_action


class HospitalStayViewSet(HospitalModelViewSet):
    queryset = HospitalStay.objects.all()
    serializer_class = HospitalStaySerializer


class DailyRoundViewSet(HospitalModelViewSet):
    queryset = DailyRound.objects.all()
    serializer_class = DailyRoundSerializer


class ProgressReviewViewSet(HospitalModelViewSet):
    queryset = ProgressReview.objects.all()
    serializer_class = ProgressReviewSerializer


class InpatientCarePlanViewSet(HospitalModelViewSet):
    queryset = InpatientCarePlan.objects.all()
    serializer_class = InpatientCarePlanSerializer


class DischargePlanningViewSet(HospitalModelViewSet):
    queryset = DischargePlanning.objects.all()
    serializer_class = DischargePlanningSerializer

    @action(detail=False, methods=["post"])
    def initiate(self, request):
        """Opens the discharge-planning track for an admission with a target date."""
        data = request.data
        return run_service_action(
            lambda: DischargeService.initiate_discharge_planning(
                tenant_id=request.tenant_id,
                admission_id=data.get("admission_id"),
                target_date=data.get("target_date"),
                planned_by=data.get("planned_by", str(request.user)),
            ),
            success_status=status.HTTP_201_CREATED,
        )
