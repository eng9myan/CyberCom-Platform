from products.cymed.hospital.views import HospitalModelViewSet

from .models import OutcomeMeasurement, RehabReferral, TherapySession, TreatmentPlan
from .serializers import (
    OutcomeMeasurementSerializer,
    RehabReferralSerializer,
    TherapySessionSerializer,
    TreatmentPlanSerializer,
)


class RehabReferralViewSet(HospitalModelViewSet):
    queryset = RehabReferral.objects.all()
    serializer_class = RehabReferralSerializer


class TreatmentPlanViewSet(HospitalModelViewSet):
    queryset = TreatmentPlan.objects.all()
    serializer_class = TreatmentPlanSerializer


class TherapySessionViewSet(HospitalModelViewSet):
    queryset = TherapySession.objects.all()
    serializer_class = TherapySessionSerializer


class OutcomeMeasurementViewSet(HospitalModelViewSet):
    queryset = OutcomeMeasurement.objects.all()
    serializer_class = OutcomeMeasurementSerializer
