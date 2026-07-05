from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("vendor-invoices", views.VendorInvoiceViewSet, basename="vendor-invoice")

urlpatterns = router.urls
