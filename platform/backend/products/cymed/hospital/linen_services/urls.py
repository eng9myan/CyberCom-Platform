from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("carts", views.LinenCartViewSet, basename="linen-cart")
router.register("laundry-batches", views.LaundryBatchViewSet, basename="laundry-batch")

urlpatterns = router.urls
