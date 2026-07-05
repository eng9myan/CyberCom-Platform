from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("warehouses", views.WarehouseViewSet, basename="warehouse")
router.register("stock-items", views.StockItemViewSet, basename="stock-item")
router.register("movements", views.StockMovementViewSet, basename="stock-movement")
router.register("reorder-alerts", views.ReorderAlertViewSet, basename="reorder-alert")

urlpatterns = router.urls
