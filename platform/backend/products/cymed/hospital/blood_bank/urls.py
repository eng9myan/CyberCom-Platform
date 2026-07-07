from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BloodDonorViewSet, BloodIssueViewSet, BloodUnitViewSet, CrossmatchRequestViewSet

router = DefaultRouter()
router.register("donors", BloodDonorViewSet, basename="blood-donor")
router.register("units", BloodUnitViewSet, basename="blood-unit")
router.register("crossmatch-requests", CrossmatchRequestViewSet, basename="blood-crossmatch")
router.register("issues", BloodIssueViewSet, basename="blood-issue")

urlpatterns = [
    path("", include(router.urls)),
]
