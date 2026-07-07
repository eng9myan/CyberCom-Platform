from rest_framework import serializers

from .models import IncidentReport, RootCauseAnalysis


class RootCauseAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = RootCauseAnalysis
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "completed_at"]


class IncidentReportSerializer(serializers.ModelSerializer):
    root_cause_analysis = RootCauseAnalysisSerializer(read_only=True)

    class Meta:
        model = IncidentReport
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
