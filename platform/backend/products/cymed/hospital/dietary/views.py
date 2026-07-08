from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.views import HospitalModelViewSet

from .models import DietOrder, MealTrayTicket, NutritionScreening
from .serializers import DietOrderSerializer, MealTrayTicketSerializer, NutritionScreeningSerializer


class DietOrderViewSet(HospitalModelViewSet):
    queryset = DietOrder.objects.all()
    serializer_class = DietOrderSerializer

    @action(detail=True, methods=["post"])
    def discontinue(self, request, pk=None):
        order = self.get_object()
        if order.discontinued_at is not None:
            return Response({"detail": "Diet order already discontinued."}, status=status.HTTP_400_BAD_REQUEST)
        order.discontinued_at = timezone.now()
        order.save(update_fields=["discontinued_at", "updated_at"])
        return Response(DietOrderSerializer(order).data)


class NutritionScreeningViewSet(HospitalModelViewSet):
    queryset = NutritionScreening.objects.all()
    serializer_class = NutritionScreeningSerializer


class MealTrayTicketViewSet(HospitalModelViewSet):
    queryset = MealTrayTicket.objects.all()
    serializer_class = MealTrayTicketSerializer

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = "delivered"
        ticket.delivered_at = timezone.now()
        ticket.save(update_fields=["status", "delivered_at", "updated_at"])
        return Response(MealTrayTicketSerializer(ticket).data)
