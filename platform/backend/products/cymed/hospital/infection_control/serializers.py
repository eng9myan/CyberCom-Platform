from rest_framework import serializers

from .models import HAICase, HandHygieneObservation, IsolationPrecaution, OutbreakInvestigation


class IsolationPrecautionSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = IsolationPrecaution
        fields = "__all__"
        read_only_fields = ["id", "started_at", "created_at", "updated_at"]


class HAICaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = HAICase
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class HandHygieneObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HandHygieneObservation
        fields = "__all__"
        read_only_fields = ["id", "observed_at", "created_at", "updated_at"]


class OutbreakInvestigationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutbreakInvestigation
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
