from products.cymed.hospital.views import HospitalModelViewSet

from .models import (
    AccreditationStandard,
    PerformanceImprovementProject,
    QualityIndicator,
    QualityMeasurement,
    StandardComplianceAssessment,
)
from .serializers import (
    AccreditationStandardSerializer,
    PerformanceImprovementProjectSerializer,
    QualityIndicatorSerializer,
    QualityMeasurementSerializer,
    StandardComplianceAssessmentSerializer,
)


class QualityIndicatorViewSet(HospitalModelViewSet):
    queryset = QualityIndicator.objects.all()
    serializer_class = QualityIndicatorSerializer


class QualityMeasurementViewSet(HospitalModelViewSet):
    queryset = QualityMeasurement.objects.all()
    serializer_class = QualityMeasurementSerializer


class PerformanceImprovementProjectViewSet(HospitalModelViewSet):
    queryset = PerformanceImprovementProject.objects.all()
    serializer_class = PerformanceImprovementProjectSerializer


class AccreditationStandardViewSet(HospitalModelViewSet):
    queryset = AccreditationStandard.objects.all()
    serializer_class = AccreditationStandardSerializer


class StandardComplianceAssessmentViewSet(HospitalModelViewSet):
    queryset = StandardComplianceAssessment.objects.all()
    serializer_class = StandardComplianceAssessmentSerializer
