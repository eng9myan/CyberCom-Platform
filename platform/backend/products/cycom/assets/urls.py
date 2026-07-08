from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("items", views.AssetViewSet, basename="asset")
router.register("depreciations", views.AssetDepreciationViewSet, basename="asset-depreciation")
router.register("biomedical-equipment", views.BiomedicalEquipmentViewSet, basename="biomedical-equipment")
router.register("equipment-service-records", views.EquipmentServiceRecordViewSet, basename="equipment-service-record")

urlpatterns = router.urls
