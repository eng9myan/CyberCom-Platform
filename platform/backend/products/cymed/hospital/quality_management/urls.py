from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("indicators", views.QualityIndicatorViewSet, basename="quality-indicator")
router.register("measurements", views.QualityMeasurementViewSet, basename="quality-measurement")
router.register("improvement-projects", views.PerformanceImprovementProjectViewSet, basename="pip")
router.register("accreditation-standards", views.AccreditationStandardViewSet, basename="accreditation-standard")
router.register("compliance-assessments", views.StandardComplianceAssessmentViewSet, basename="compliance-assessment")

urlpatterns = router.urls
