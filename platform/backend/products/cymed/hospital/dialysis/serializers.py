from rest_framework import serializers

from .models import (
    DialysisCarePlan,
    DialysisComplication,
    DialysisMachine,
    DialysisOrder,
    DialysisSession,
    VascularAccess,
)


class VascularAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = VascularAccess
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class DialysisMachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = DialysisMachine
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class DialysisOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = DialysisOrder
        fields = "__all__"
        read_only_fields = ["id", "ordered_at", "created_at", "updated_at"]


class DialysisCarePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DialysisCarePlan
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class DialysisComplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DialysisComplication
        fields = "__all__"
        read_only_fields = ["id", "reported_at", "created_at", "updated_at"]


class DialysisSessionSerializer(serializers.ModelSerializer):
    complications = DialysisComplicationSerializer(many=True, read_only=True)

    class Meta:
        model = DialysisSession
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
