from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("collection-logs", views.WasteCollectionLogViewSet, basename="waste-collection-log")
router.register("hauler-manifests", views.HaulerManifestViewSet, basename="hauler-manifest")

urlpatterns = router.urls
