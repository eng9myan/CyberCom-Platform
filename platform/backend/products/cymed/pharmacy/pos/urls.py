from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PharmacySaleViewSet

router = DefaultRouter()
router.register("sales", PharmacySaleViewSet, basename="pharmacy-pos-sale")

urlpatterns = [
    path("", include(router.urls)),
]
