from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.imaging.views import ImagingModelViewSet

from .models import (
    CriticalFinding,
    RadiologyFinding,
    RadiologyImpression,
    RadiologyReport,
    ReportAmendment,
    ReportTemplate,
    StructuredReport,
)
from .serializers import (
    CriticalFindingSerializer,
    RadiologyFindingSerializer,
    RadiologyImpressionSerializer,
    RadiologyReportSerializer,
    ReportAmendmentSerializer,
    ReportTemplateSerializer,
    StructuredReportSerializer,
)


class ReportTemplateViewSet(ImagingModelViewSet):
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    required_feature = "imaging.reporting"


class RadiologyReportViewSet(ImagingModelViewSet):
    queryset = RadiologyReport.objects.select_related("report_template").prefetch_related(
        "structured_findings", "structured_impressions", "critical_findings", "amendments"
    )
    serializer_class = RadiologyReportSerializer
    required_feature = "imaging.reporting"


FINDING_SEVERITY_TO_CRITICAL_SEVERITY = {
    "severe": "urgent",
    "critical": "emergent",
}


class RadiologyFindingViewSet(ImagingModelViewSet):
    queryset = RadiologyFinding.objects.select_related("report")
    serializer_class = RadiologyFindingSerializer
    required_feature = "imaging.reporting"

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        obj = serializer.save(tenant_id=tenant_id)
        critical_severity = FINDING_SEVERITY_TO_CRITICAL_SEVERITY.get(obj.severity)
        if critical_severity:
            CriticalFinding.objects.get_or_create(
                report=obj.report,
                finding_description=obj.description,
                defaults={
                    "tenant_id": tenant_id,
                    "snomed_code": obj.finding_code,
                    "severity": critical_severity,
                },
            )


class RadiologyImpressionViewSet(ImagingModelViewSet):
    queryset = RadiologyImpression.objects.select_related("report")
    serializer_class = RadiologyImpressionSerializer
    required_feature = "imaging.reporting"


class CriticalFindingViewSet(ImagingModelViewSet):
    queryset = CriticalFinding.objects.select_related("report")
    serializer_class = CriticalFindingSerializer
    required_feature = "imaging.reporting"

    @action(detail=True, methods=["post"])
    def notify(self, request, pk=None):
        cf = self.get_object()
        if cf.notification_status not in ("pending",) and not cf.escalated:
            return Response(
                {"detail": f"Cannot notify from status '{cf.notification_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cf.notification_status = "notified"
        cf.notified_clinician_id = request.data.get("notified_clinician_id")
        cf.notification_method = request.data.get("notification_method", "system")
        cf.notified_at = timezone.now()
        cf.save(
            update_fields=[
                "notification_status", "notified_clinician_id",
                "notification_method", "notified_at",
            ]
        )
        return Response(CriticalFindingSerializer(cf).data)

    @action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        cf = self.get_object()
        if cf.notification_status != "notified":
            return Response(
                {"detail": f"Cannot acknowledge from status '{cf.notification_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.data.get("read_back_verified"):
            return Response(
                {"detail": "read_back_verified must be confirmed to acknowledge a critical finding."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cf.notification_status = "acknowledged"
        cf.acknowledged_at = timezone.now()
        cf.read_back_verified = True
        cf.save(update_fields=["notification_status", "acknowledged_at", "read_back_verified"])
        return Response(CriticalFindingSerializer(cf).data)


class StructuredReportViewSet(ImagingModelViewSet):
    queryset = StructuredReport.objects.select_related("report")
    serializer_class = StructuredReportSerializer
    required_feature = "imaging.reporting"


class ReportAmendmentViewSet(ImagingModelViewSet):
    queryset = ReportAmendment.objects.select_related("original_report")
    serializer_class = ReportAmendmentSerializer
    required_feature = "imaging.reporting"
    http_method_names = ["get", "post", "head", "options"]
