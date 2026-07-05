from django.urls import include, path
from rest_framework.routers import DefaultRouter

from products.cymed.pharmacy.administration.views import MedicationAdministrationRecordViewSet

router = DefaultRouter()
router.register("records", MedicationAdministrationRecordViewSet, basename="mar-record")

urlpatterns = [
    path("", include(router.urls)),
]
