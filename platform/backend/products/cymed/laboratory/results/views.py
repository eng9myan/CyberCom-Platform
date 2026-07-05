from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from platform.events.models import OutboxEvent

from ..views import LaboratoryModelViewSet
from .models import (
    CriticalResult,
    LabResult,
    ReferenceRange,
    ResultApproval,
    ResultCorrection,
    ResultValue,
)
from .serializers import (
    CriticalResultSerializer,
    LabResultSerializer,
    ReferenceRangeSerializer,
    ResultApprovalSerializer,
    ResultCorrectionSerializer,
    ResultValueSerializer,
)


class LabResultViewSet(LaboratoryModelViewSet):
    queryset = LabResult.objects.prefetch_related("values")
    serializer_class = LabResultSerializer
    required_feature = "lab.results"
    filterset_fields = ["status", "has_critical_value", "has_abnormal_value"]

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        obj = serializer.save(tenant_id=tenant_id)
        OutboxEvent.objects.create(
            tenant_id=str(tenant_id) if tenant_id else None,
            topic="cymed.lab.result.created",
            event_type="cymed.lab.result.created",
            payload={"result_id": str(obj.id), "status": obj.status},
        )


class ResultValueViewSet(LaboratoryModelViewSet):
    queryset = ResultValue.objects.all()
    serializer_class = ResultValueSerializer
    required_feature = "lab.results"
    filterset_fields = ["result", "is_critical", "is_abnormal", "interpretation"]

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        obj = serializer.save(tenant_id=tenant_id)
        self._auto_detect_critical(obj)
        if obj.is_critical:
            CriticalResult.objects.get_or_create(
                result_value=obj, defaults={"tenant_id": tenant_id}
            )
            OutboxEvent.objects.create(
                tenant_id=str(tenant_id) if tenant_id else None,
                topic="cymed.lab.critical_result.created",
                event_type="cymed.lab.critical_result.created",
                payload={
                    "result_value_id": str(obj.id),
                    "analyte": obj.analyte_name,
                    "value": str(obj.value_numeric or obj.value_text),
                },
            )


    @staticmethod
    def _auto_detect_critical(result_value: ResultValue) -> None:
        """
        Compare a numeric result against the test's configured ReferenceRange.
        If it falls at/beyond critical_low/critical_high, flag is_critical --
        we only ever flag against a real, configured range, never a guessed one.
        """
        if result_value.value_numeric is None or result_value.is_critical:
            return
        test = result_value.result.order_item.test
        if test is None:
            return
        ref_range = (
            ReferenceRange.objects.filter(
                tenant_id=result_value.tenant_id, test=test, is_active=True
            )
            .order_by("sex")  # 'all' sorts before 'F'/'M'; good enough default preference
            .first()
        )
        if ref_range is None:
            return
        is_critical = (
            ref_range.critical_low is not None and result_value.value_numeric <= ref_range.critical_low
        ) or (
            ref_range.critical_high is not None and result_value.value_numeric >= ref_range.critical_high
        )
        if is_critical:
            result_value.is_critical = True
            result_value.save(update_fields=["is_critical"])


class ReferenceRangeViewSet(LaboratoryModelViewSet):
    queryset = ReferenceRange.objects.all()
    serializer_class = ReferenceRangeSerializer
    required_feature = "lab.results"
    filterset_fields = ["test", "sex", "is_active"]


class CriticalResultViewSet(LaboratoryModelViewSet):
    queryset = CriticalResult.objects.all()
    serializer_class = CriticalResultSerializer
    required_feature = "lab.results"
    filterset_fields = ["notification_status"]

    @action(detail=True, methods=["post"])
    def notify(self, request, pk=None):
        cr = self.get_object()
        if cr.notification_status not in ("pending", "escalated"):
            return Response(
                {"detail": f"Cannot notify from status '{cr.notification_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cr.notification_status = "notified"
        cr.notified_by = request.data.get("notified_by") or (
            request.user.id if hasattr(request, "user") else None
        )
        cr.notified_to_id = request.data.get("notified_to_id")
        cr.notification_method = request.data.get("notification_method", "system")
        cr.notified_at = timezone.now()
        cr.save(
            update_fields=[
                "notification_status", "notified_by", "notified_to_id",
                "notification_method", "notified_at",
            ]
        )
        return Response(CriticalResultSerializer(cr).data)

    @action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        cr = self.get_object()
        if cr.notification_status not in ("notified", "escalated"):
            return Response(
                {"detail": f"Cannot acknowledge from status '{cr.notification_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        acknowledgement_name = request.data.get("acknowledgement_name")
        if not acknowledgement_name:
            return Response(
                {"detail": "acknowledgement_name is required (read-back verification)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cr.notification_status = "acknowledged"
        cr.acknowledgement_name = acknowledgement_name
        cr.acknowledged_at = timezone.now()
        cr.read_back_verified = bool(request.data.get("read_back_verified", False))
        cr.save(
            update_fields=[
                "notification_status", "acknowledgement_name", "acknowledged_at",
                "read_back_verified",
            ]
        )
        return Response(CriticalResultSerializer(cr).data)


class ResultCorrectionViewSet(LaboratoryModelViewSet):
    queryset = ResultCorrection.objects.all()
    serializer_class = ResultCorrectionSerializer
    required_feature = "lab.results"


class ResultApprovalViewSet(LaboratoryModelViewSet):
    queryset = ResultApproval.objects.all()
    serializer_class = ResultApprovalSerializer
    required_feature = "lab.results"

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        ip = self.request.META.get("REMOTE_ADDR", "")
        obj = serializer.save(tenant_id=tenant_id, ip_address=ip)
        result = obj.result
        if obj.approval_level == "pathologist":
            result.status = "approved"
            result.approved_by = obj.approved_by
            result.approved_at = obj.approved_at
            result.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
            OutboxEvent.objects.create(
                tenant_id=str(tenant_id) if tenant_id else None,
                topic="cymed.lab.result.verified",
                event_type="cymed.lab.result.verified",
                payload={"result_id": str(result.id), "approved_by": str(obj.approved_by)},
            )
