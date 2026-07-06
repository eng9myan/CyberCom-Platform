from platform.cyidentity.permissions import HasHRAccess
from datetime import date, timedelta

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Attendance, ClinicalCredential, Department, Employee, LeaveRequest, PerformanceReview
from .serializers import (
    AttendanceSerializer,
    ClinicalCredentialSerializer,
    DepartmentSerializer,
    EmployeeSerializer,
    LeaveRequestSerializer,
    PerformanceReviewSerializer,
)


class BaseHRViewSet(viewsets.ModelViewSet):
    permission_classes = [HasHRAccess]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        return self.queryset.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id)


class DepartmentViewSet(BaseHRViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class EmployeeViewSet(BaseHRViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer


class AttendanceViewSet(BaseHRViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer


class LeaveRequestViewSet(BaseHRViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer


class PerformanceReviewViewSet(BaseHRViewSet):
    queryset = PerformanceReview.objects.all()
    serializer_class = PerformanceReviewSerializer


class ClinicalCredentialViewSet(BaseHRViewSet):
    queryset = ClinicalCredential.objects.all()
    serializer_class = ClinicalCredentialSerializer

    @action(detail=False, methods=["get"], url_path="expiring-soon")
    def expiring_soon(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        horizon_days = int(request.query_params.get("days", 60))
        cutoff = date.today() + timedelta(days=horizon_days)
        qs = ClinicalCredential.objects.filter(
            tenant_id=tenant_id,
            status="active",
            expiry_date__lte=cutoff,
        ).order_by("expiry_date")
        return Response(ClinicalCredentialSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        credential = self.get_object()
        claims = getattr(request, "auth_claims", {}) or {}
        credential.verified = True
        credential.verified_by = claims.get("sub") or None
        credential.verified_at = timezone.now()
        credential.save(update_fields=["verified", "verified_by", "verified_at"])
        return Response(ClinicalCredentialSerializer(credential).data)
