from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.views import HospitalModelViewSet

from .models import BloodCompatibility, BloodDonor, BloodInventory, BloodIssue, BloodUnit, CrossmatchRequest
from .serializers import (
    BloodCompatibilitySerializer,
    BloodDonorSerializer,
    BloodInventorySerializer,
    BloodIssueSerializer,
    BloodUnitSerializer,
    CrossmatchRequestSerializer,
)

# Blood banking is an enterprise-tier hospital capability (donor/unit/crossmatch
# workflow); gated the same way ICU/OR are (see HOSPITAL_ENTERPRISE_FEATURES).
BLOOD_BANK_FEATURE = "hospital.blood_bank"
BLOOD_BANK_STAFF_ROLES = {"physician", "nurse", "lab_technician", "blood_bank_technologist"}


class BloodDonorViewSet(HospitalModelViewSet):
    queryset = BloodDonor.objects.all()
    serializer_class = BloodDonorSerializer
    required_feature = BLOOD_BANK_FEATURE
    action_required_roles = {
        "create": BLOOD_BANK_STAFF_ROLES,
        "update": BLOOD_BANK_STAFF_ROLES,
        "partial_update": BLOOD_BANK_STAFF_ROLES,
    }


class BloodUnitViewSet(HospitalModelViewSet):
    queryset = BloodUnit.objects.all()
    serializer_class = BloodUnitSerializer
    required_feature = BLOOD_BANK_FEATURE
    action_required_roles = {
        "create": BLOOD_BANK_STAFF_ROLES,
        "update": BLOOD_BANK_STAFF_ROLES,
        "partial_update": BLOOD_BANK_STAFF_ROLES,
        "discard_expired": BLOOD_BANK_STAFF_ROLES,
        "quarantine_release": BLOOD_BANK_STAFF_ROLES,
    }

    @action(detail=False, methods=["post"], url_path="discard-expired")
    def discard_expired(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        expired = self.get_queryset().filter(
            tenant_id=tenant_id, expiry_date__lt=timezone.now().date(), status="available"
        )
        count = expired.update(status="discarded")
        return Response({"discarded": count})

    @action(detail=True, methods=["post"])
    def quarantine_release(self, request, pk=None):
        unit = self.get_object()
        if unit.status != "quarantine":
            return Response({"detail": f"Cannot release a unit in status '{unit.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        unit.status = "available"
        unit.save(update_fields=["status"])
        return Response(BloodUnitSerializer(unit).data)


class CrossmatchRequestViewSet(HospitalModelViewSet):
    queryset = CrossmatchRequest.objects.all()
    serializer_class = CrossmatchRequestSerializer
    required_feature = BLOOD_BANK_FEATURE
    action_required_roles = {
        "create": BLOOD_BANK_STAFF_ROLES,
        "update": BLOOD_BANK_STAFF_ROLES,
        "partial_update": BLOOD_BANK_STAFF_ROLES,
        "resolve": BLOOD_BANK_STAFF_ROLES,
        "issue": BLOOD_BANK_STAFF_ROLES,
    }

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        req = self.get_object()
        compatible = bool(request.data.get("compatible", True))
        req.status = "compatible" if compatible else "incompatible"
        req.save(update_fields=["status"])
        return Response(CrossmatchRequestSerializer(req).data)

    @action(detail=True, methods=["post"])
    def issue(self, request, pk=None):
        req = self.get_object()
        if req.status != "compatible":
            return Response({"detail": "Only a compatible crossmatch can be issued."}, status=status.HTTP_400_BAD_REQUEST)
        unit_id = request.data.get("blood_unit_id")
        tenant_id = getattr(request, "tenant_id", None)
        unit = BloodUnit.objects.filter(id=unit_id, tenant_id=tenant_id, status="available").first()
        if not unit:
            return Response({"detail": "Blood unit not available."}, status=status.HTTP_400_BAD_REQUEST)
        unit.status = "issued"
        unit.save(update_fields=["status"])
        issue = BloodIssue.objects.create(
            tenant_id=tenant_id, crossmatch_request=req, blood_unit=unit,
            issued_by=request.data.get("issued_by"),
        )
        req.status = "fulfilled"
        req.save(update_fields=["status"])
        return Response(BloodIssueSerializer(issue).data, status=status.HTTP_201_CREATED)


class BloodIssueViewSet(HospitalModelViewSet):
    queryset = BloodIssue.objects.all()
    serializer_class = BloodIssueSerializer
    required_feature = BLOOD_BANK_FEATURE


class BloodCompatibilityViewSet(HospitalModelViewSet):
    queryset = BloodCompatibility.objects.all()
    serializer_class = BloodCompatibilitySerializer
    required_feature = BLOOD_BANK_FEATURE
    action_required_roles = {
        "create": BLOOD_BANK_STAFF_ROLES,
        "update": BLOOD_BANK_STAFF_ROLES,
        "partial_update": BLOOD_BANK_STAFF_ROLES,
    }


class BloodInventoryViewSet(HospitalModelViewSet):
    queryset = BloodInventory.objects.all()
    serializer_class = BloodInventorySerializer
    required_feature = BLOOD_BANK_FEATURE
    action_required_roles = {
        "create": BLOOD_BANK_STAFF_ROLES,
        "update": BLOOD_BANK_STAFF_ROLES,
        "partial_update": BLOOD_BANK_STAFF_ROLES,
    }
