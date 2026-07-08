from rest_framework import serializers

from .models import DietOrder, MealTrayTicket, NutritionScreening


class DietOrderSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = DietOrder
        fields = "__all__"
        read_only_fields = ["id", "ordered_at", "created_at", "updated_at"]


class NutritionScreeningSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionScreening
        fields = "__all__"
        read_only_fields = ["id", "screening_date", "created_at", "updated_at"]


class MealTrayTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealTrayTicket
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
