from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("protocols", views.ResearchProtocolViewSet, basename="research-protocol")
router.register("enrollments", views.StudyEnrollmentViewSet, basename="study-enrollment")
router.register("adverse-events", views.ResearchAdverseEventViewSet, basename="research-adverse-event")

urlpatterns = router.urls
