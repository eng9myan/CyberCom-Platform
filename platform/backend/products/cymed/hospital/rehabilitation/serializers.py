from rest_framework import serializers

from .models import OutcomeMeasurement, RehabReferral, TherapySession, TreatmentPlan


class RehabReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = RehabReferral
        fields = "__all__"
        read_only_fields = ["id", "referred_at", "created_at", "updated_at"]


class TreatmentPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentPlan
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class TherapySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TherapySession
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class OutcomeMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutcomeMeasurement
        fields = "__all__"
        read_only_fields = ["id", "measured_at", "created_at", "updated_at"]
