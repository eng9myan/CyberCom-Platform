from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import IncidentReportViewSet, RootCauseAnalysisViewSet

router = DefaultRouter()
router.register("reports", IncidentReportViewSet, basename="incident-report")
router.register("root-cause-analyses", RootCauseAnalysisViewSet, basename="incident-rca")

urlpatterns = [
    path("", include(router.urls)),
]
