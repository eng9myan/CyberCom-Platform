from rest_framework import serializers

from .models import (
    AccreditationStandard,
    PerformanceImprovementProject,
    QualityIndicator,
    QualityMeasurement,
    StandardComplianceAssessment,
)


class QualityIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityIndicator
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class QualityMeasurementSerializer(serializers.ModelSerializer):
    value = serializers.FloatField(read_only=True)
    meets_target = serializers.BooleanField(read_only=True, allow_null=True)
    indicator_name = serializers.CharField(source="indicator.name", read_only=True)

    class Meta:
        model = QualityMeasurement
        fields = [
            "id", "indicator", "indicator_name", "period_start", "period_end",
            "numerator", "denominator", "value", "meets_target",
            "recorded_by", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PerformanceImprovementProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceImprovementProject
        fields = "__all__"
        read_only_fields = ["id", "started_at", "created_at", "updated_at"]


class AccreditationStandardSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccreditationStandard
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class StandardComplianceAssessmentSerializer(serializers.ModelSerializer):
    standard_code = serializers.CharField(source="standard.code", read_only=True)

    class Meta:
        model = StandardComplianceAssessment
        fields = [
            "id", "standard", "standard_code", "assessed_at", "compliance_status",
            "assessed_by", "evidence_notes", "corrective_action_due",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "assessed_at", "created_at", "updated_at"]
