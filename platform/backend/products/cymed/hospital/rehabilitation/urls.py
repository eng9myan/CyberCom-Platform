from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("referrals", views.RehabReferralViewSet, basename="rehab-referral")
router.register("treatment-plans", views.TreatmentPlanViewSet, basename="rehab-treatment-plan")
router.register("sessions", views.TherapySessionViewSet, basename="rehab-session")
router.register("outcome-measurements", views.OutcomeMeasurementViewSet, basename="rehab-outcome-measurement")

urlpatterns = router.urls
