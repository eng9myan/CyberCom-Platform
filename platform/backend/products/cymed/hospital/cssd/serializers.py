from rest_framework import serializers

from .models import InstrumentSet, InstrumentTracking, SterilizationLoad


class SterilizationLoadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SterilizationLoad
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class InstrumentTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstrumentTracking
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "logged_at"]


class InstrumentSetSerializer(serializers.ModelSerializer):
    tracking_events = InstrumentTrackingSerializer(many=True, read_only=True)

    class Meta:
        model = InstrumentSet
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
