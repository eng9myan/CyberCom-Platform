from django.urls import path

from .views import TenantComplianceSettingsViewSet

urlpatterns = [
    path(
        "",
        TenantComplianceSettingsViewSet.as_view({"get": "list", "patch": "partial_update", "put": "update"}),
        name="tenant-compliance-settings",
    ),
]
