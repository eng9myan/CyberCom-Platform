from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("cases", views.MortuaryCaseViewSet, basename="mortuary-case")
router.register("release-records", views.ReleaseRecordViewSet, basename="mortuary-release-record")

urlpatterns = router.urls
