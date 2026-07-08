from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("diet-orders", views.DietOrderViewSet, basename="diet-order")
router.register("nutrition-screenings", views.NutritionScreeningViewSet, basename="nutrition-screening")
router.register("tray-tickets", views.MealTrayTicketViewSet, basename="meal-tray-ticket")

urlpatterns = router.urls
