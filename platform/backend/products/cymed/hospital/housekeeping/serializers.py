from rest_framework import serializers

from .models import CleaningTask, HygieneAudit


class CleaningTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = CleaningTask
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class HygieneAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = HygieneAudit
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
