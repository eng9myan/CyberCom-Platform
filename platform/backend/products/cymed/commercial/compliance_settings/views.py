from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import TenantComplianceSettings
from .serializers import TenantComplianceSettingsSerializer


class TenantComplianceSettingsViewSet(viewsets.ModelViewSet):
    """
    Singleton-per-tenant resource: there is exactly one compliance-settings
    row per tenant, auto-created on first access. list()/retrieve()/update()
    all resolve to that one row regardless of pk, so the frontend can treat
    this as GET/PUT/PATCH on a single object rather than a collection.
    """

    serializer_class = TenantComplianceSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        if not tenant_id:
            return TenantComplianceSettings.objects.none()
        return TenantComplianceSettings.objects.filter(tenant_id=tenant_id)

    def get_object(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        obj, _ = TenantComplianceSettings.objects.get_or_create(tenant_id=tenant_id)
        return obj

    def list(self, request, *args, **kwargs):
        # Collapse "list" to "the one object" so GET /compliance-settings/
        # behaves like a singleton fetch without the frontend needing to know
        # a pk. retrieve() reuses the same serializer/response shape.
        return self.retrieve(request, *args, **kwargs)
