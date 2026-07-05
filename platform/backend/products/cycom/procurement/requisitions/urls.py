from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("requisitions", views.PurchaseRequisitionViewSet, basename="requisition")
router.register("requisition-lines", views.RequisitionLineViewSet, basename="requisition-line")

urlpatterns = router.urls
