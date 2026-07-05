from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def run_service_action(service_call, *, success_status=status.HTTP_200_OK):
    """
    Runs a hospital services.py workflow call and translates its outcome into
    a DRF Response. Service layer raises ValueError for business-rule
    violations (400) and Django's ObjectDoesNotExist for missing references (404).
    """
    try:
        result = service_call()
    except ObjectDoesNotExist as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    if hasattr(result, "id"):
        from django.forms.models import model_to_dict

        data = model_to_dict(result)
        data["id"] = str(result.id)
    else:
        data = result
    return Response(data, status=success_status)


class HospitalModelViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for CyMed Hospital Edition.
    Edition- and feature-gate enforcement: subclasses declare
    `required_feature` (str) to activate per-endpoint feature checks.
    Bed-based and facility-based licensing limits are enforced at the
    service layer (not here) to keep views thin.

    Role gating: subclasses declare `action_required_roles` (dict mapping
    action name -> set of acceptable realm roles) to restrict specific
    actions to specific clinical roles -- e.g. only physicians can change a
    patient's code status. `platform_admin` always passes (matches the
    existing convention in platform/api/permissions.py). Previously every
    hospital endpoint only required IsAuthenticated -- any authenticated
    user of any role could call any action for their tenant (see
    HIPAA_Readiness_Report.md gap).
    """

    permission_classes = [IsAuthenticated]
    required_feature: str = ""
    action_required_roles: dict = {}

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        if tenant_id:
            return self.queryset.filter(tenant_id=tenant_id)
        return self.queryset.none()

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if self.required_feature:
            self._check_feature(request, self.required_feature)
        required_roles = self.action_required_roles.get(self.action)
        if required_roles:
            self._check_roles(request, required_roles)

    def _check_feature(self, request, feature_code: str) -> None:
        from products.cymed.commercial.feature_flags.services import FeatureFlagService

        tenant_id = getattr(request, "tenant_id", None)
        if not FeatureFlagService.is_enabled(
            feature_code, tenant_id=str(tenant_id) if tenant_id else None
        ):
            raise PermissionDenied(
                detail=f"Feature '{feature_code}' is not enabled for your hospital edition."
            )

    def _check_roles(self, request, required_roles: set) -> None:
        claims = getattr(request, "auth_claims", {}) or {}
        user_roles = set(claims.get("realm_access", {}).get("roles", []))
        if "platform_admin" in user_roles:
            return
        if not (user_roles & required_roles):
            raise PermissionDenied(
                detail=(
                    f"This action requires one of the following roles: "
                    f"{', '.join(sorted(required_roles))}."
                )
            )

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id)
