from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.views import HospitalModelViewSet

from .models import IncidentReport, RootCauseAnalysis
from .serializers import IncidentReportSerializer, RootCauseAnalysisSerializer


class IncidentReportViewSet(HospitalModelViewSet):
    queryset = IncidentReport.objects.all()
    serializer_class = IncidentReportSerializer

    @action(detail=True, methods=["post"])
    def start_investigation(self, request, pk=None):
        incident = self.get_object()
        if incident.status != "reported":
            return Response({"detail": f"Cannot investigate an incident in status '{incident.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        incident.status = "under_investigation"
        incident.save(update_fields=["status"])
        return Response(IncidentReportSerializer(incident).data)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        incident = self.get_object()
        if incident.status != "under_investigation":
            return Response({"detail": "Only an incident under investigation can be closed."}, status=status.HTTP_400_BAD_REQUEST)
        incident.status = "closed"
        incident.save(update_fields=["status"])
        return Response(IncidentReportSerializer(incident).data)


class RootCauseAnalysisViewSet(HospitalModelViewSet):
    queryset = RootCauseAnalysis.objects.all()
    serializer_class = RootCauseAnalysisSerializer
