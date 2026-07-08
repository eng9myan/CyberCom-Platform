from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("isolation-precautions", views.IsolationPrecautionViewSet, basename="isolation-precaution")
router.register("hai-cases", views.HAICaseViewSet, basename="hai-case")
router.register("hand-hygiene-observations", views.HandHygieneObservationViewSet, basename="hand-hygiene-observation")
router.register("outbreaks", views.OutbreakInvestigationViewSet, basename="outbreak-investigation")

urlpatterns = router.urls
