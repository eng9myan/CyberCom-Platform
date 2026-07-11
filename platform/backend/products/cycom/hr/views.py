from platform.cyidentity.permissions import HasHRAccess
from datetime import date, timedelta

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import (
    Attendance,
    ClinicalCredential,
    Department,
    Employee,
    LeaveRequest,
    PerformanceReview,
    ShiftAssignment,
    ShiftSwapRequest,
    ShiftTemplate,
)
from .serializers import (
    AttendanceSerializer,
    ClinicalCredentialSerializer,
    DepartmentSerializer,
    EmployeeSerializer,
    LeaveRequestSerializer,
    PerformanceReviewSerializer,
    ShiftAssignmentSerializer,
    ShiftSwapRequestSerializer,
    ShiftTemplateSerializer,
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


class ShiftTemplateViewSet(BaseHRViewSet):
    queryset = ShiftTemplate.objects.all()
    serializer_class = ShiftTemplateSerializer


class ShiftAssignmentViewSet(BaseHRViewSet):
    queryset = ShiftAssignment.objects.all()
    serializer_class = ShiftAssignmentSerializer

    def get_queryset(self):
        qs = super().get_queryset().select_related("employee", "shift_template")
        employee_id = self.request.query_params.get("employee")
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(assigned_date__gte=date_from)
        if date_to:
            qs = qs.filter(assigned_date__lte=date_to)
        return qs

    @action(detail=False, methods=["post"])
    def bulk_publish(self, request):
        """
        Publish a roster in one call instead of one POST per slot --
        [{"employee": id, "shift_template": id, "assigned_date": "YYYY-MM-DD"}, ...].
        """
        tenant_id = getattr(request, "tenant_id", None)
        entries = request.data.get("assignments")
        if not isinstance(entries, list) or not entries:
            raise ValidationError({"assignments": "Must be a non-empty list of assignment entries."})

        to_create = []
        for entry in entries:
            serializer = ShiftAssignmentSerializer(data=entry)
            serializer.is_valid(raise_exception=True)
            to_create.append(ShiftAssignment(tenant_id=tenant_id, **serializer.validated_data))
        created = ShiftAssignment.objects.bulk_create(to_create)
        return Response(
            ShiftAssignmentSerializer(created, many=True).data, status=status.HTTP_201_CREATED
        )


class ShiftSwapRequestViewSet(BaseHRViewSet):
    queryset = ShiftSwapRequest.objects.all()
    serializer_class = ShiftSwapRequestSerializer

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """
        Approving a swap marks the original assignment "swapped" and, if a
        covering employee was named, creates a fresh assignment for them
        on the same date/shift -- the roster stays fully accounted for
        rather than just deleting the original slot.
        """
        swap = self.get_object()
        if swap.status != "pending":
            return Response(
                {"detail": f"Cannot approve a swap request in status '{swap.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        claims = getattr(request, "auth_claims", {}) or {}
        swap.status = "approved"
        swap.reviewed_by = claims.get("sub") or None
        swap.reviewed_at = timezone.now()
        swap.save(update_fields=["status", "reviewed_by", "reviewed_at"])

        original = swap.original_assignment
        original.status = "swapped"
        original.save(update_fields=["status"])

        if swap.covering_employee_id:
            ShiftAssignment.objects.create(
                tenant_id=original.tenant_id,
                employee=swap.covering_employee,
                shift_template=original.shift_template,
                assigned_date=original.assigned_date,
                status="scheduled",
                notes=f"Covering swap for {original.employee}",
            )
        return Response(ShiftSwapRequestSerializer(swap).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        swap = self.get_object()
        if swap.status != "pending":
            return Response(
                {"detail": f"Cannot reject a swap request in status '{swap.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        claims = getattr(request, "auth_claims", {}) or {}
        swap.status = "rejected"
        swap.reviewed_by = claims.get("sub") or None
        swap.reviewed_at = timezone.now()
        swap.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        return Response(ShiftSwapRequestSerializer(swap).data)
