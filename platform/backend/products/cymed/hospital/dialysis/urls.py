from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("vascular-access", views.VascularAccessViewSet, basename="dialysis-vascular-access")
router.register("machines", views.DialysisMachineViewSet, basename="dialysis-machine")
router.register("orders", views.DialysisOrderViewSet, basename="dialysis-order")
router.register("care-plans", views.DialysisCarePlanViewSet, basename="dialysis-care-plan")
router.register("sessions", views.DialysisSessionViewSet, basename="dialysis-session")
router.register("complications", views.DialysisComplicationViewSet, basename="dialysis-complication")

urlpatterns = router.urls
