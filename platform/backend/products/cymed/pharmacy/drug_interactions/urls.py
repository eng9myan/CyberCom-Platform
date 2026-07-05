"""Drug Interactions URL routing."""

from rest_framework.routers import DefaultRouter

from .views import (
    DoseRangeAlertViewSet,
    DosingGuidelineViewSet,
    DrugInteractionViewSet,
    InteractionAlertViewSet,
    InteractionRuleViewSet,
    InteractionSeverityViewSet,
)

router = DefaultRouter()
router.register(r"rules", InteractionRuleViewSet, basename="interaction-rule")
router.register(r"detected", DrugInteractionViewSet, basename="drug-interaction")
router.register(r"severity", InteractionSeverityViewSet, basename="interaction-severity")
router.register(r"alerts", InteractionAlertViewSet, basename="interaction-alert")
router.register(r"dosing-guidelines", DosingGuidelineViewSet, basename="dosing-guideline")
router.register(r"dose-range-alerts", DoseRangeAlertViewSet, basename="dose-range-alert")

urlpatterns = router.urls
