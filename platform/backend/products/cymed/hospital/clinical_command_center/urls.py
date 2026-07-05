from django.urls import path

from products.cymed.hospital.clinical_command_center.views import (
    ClinicalCommandCenterMetricsView,
    ClinicalCommandCenterTrendView,
    HospitalAIAssistantView,
)

urlpatterns = [
    path("metrics/", ClinicalCommandCenterMetricsView.as_view(), name="command-center-metrics"),
    path("trend/", ClinicalCommandCenterTrendView.as_view(), name="command-center-trend"),
    path("ai/ask/", HospitalAIAssistantView.as_view(), name="hospital-ai-ask"),
]
