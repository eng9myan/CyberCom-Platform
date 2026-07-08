from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.views import HospitalModelViewSet

from .models import ResearchAdverseEvent, ResearchProtocol, StudyEnrollment
from .serializers import (
    ResearchAdverseEventSerializer,
    ResearchProtocolSerializer,
    StudyEnrollmentSerializer,
)


class ResearchProtocolViewSet(HospitalModelViewSet):
    queryset = ResearchProtocol.objects.all()
    serializer_class = ResearchProtocolSerializer

    @action(detail=False, methods=["get"], url_path="actively-enrolling")
    def actively_enrolling(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        protocols = [p for p in ResearchProtocol.objects.filter(tenant_id=tenant_id) if p.is_actively_enrolling]
        return Response(ResearchProtocolSerializer(protocols, many=True).data)


class StudyEnrollmentViewSet(HospitalModelViewSet):
    queryset = StudyEnrollment.objects.all()
    serializer_class = StudyEnrollmentSerializer


class ResearchAdverseEventViewSet(HospitalModelViewSet):
    queryset = ResearchAdverseEvent.objects.all()
    serializer_class = ResearchAdverseEventSerializer
