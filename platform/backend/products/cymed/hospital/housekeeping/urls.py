from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CleaningTaskViewSet, HygieneAuditViewSet

router = DefaultRouter()
router.register("tasks", CleaningTaskViewSet, basename="housekeeping-task")
router.register("audits", HygieneAuditViewSet, basename="housekeeping-audit")

urlpatterns = [
    path("", include(router.urls)),
]
