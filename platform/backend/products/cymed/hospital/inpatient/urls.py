from django.urls import include, path
from rest_framework.routers import DefaultRouter

from products.cymed.hospital.inpatient.views import (
    CodeStatusOrderViewSet,
    DailyRoundViewSet,
    DeviceAssociatedInfectionViewSet,
    DischargePlanningViewSet,
    HospitalStayViewSet,
    IndwellingDeviceViewSet,
    InpatientCarePlanViewSet,
    ProgressReviewViewSet,
    VTEProphylaxisOrderViewSet,
)

router = DefaultRouter()
router.register("stays", HospitalStayViewSet)
router.register("rounds", DailyRoundViewSet)
router.register("reviews", ProgressReviewViewSet)
router.register("careplans", InpatientCarePlanViewSet)
router.register("discharge-planning", DischargePlanningViewSet)
router.register("code-status-orders", CodeStatusOrderViewSet)
router.register("devices", IndwellingDeviceViewSet)
router.register("device-infections", DeviceAssociatedInfectionViewSet)
router.register("vte-prophylaxis", VTEProphylaxisOrderViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
