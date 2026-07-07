from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import InstrumentSetViewSet, InstrumentTrackingViewSet, SterilizationLoadViewSet

router = DefaultRouter()
router.register("loads", SterilizationLoadViewSet, basename="cssd-load")
router.register("instrument-sets", InstrumentSetViewSet, basename="cssd-instrument-set")
router.register("tracking", InstrumentTrackingViewSet, basename="cssd-tracking")

urlpatterns = [
    path("", include(router.urls)),
]
