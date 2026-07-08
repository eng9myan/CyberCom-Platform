from rest_framework import serializers

from .models import LaundryBatch, LinenCart


class LinenCartSerializer(serializers.ModelSerializer):
    needs_attention = serializers.BooleanField(read_only=True)

    class Meta:
        model = LinenCart
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class LaundryBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaundryBatch
        fields = "__all__"
        read_only_fields = ["id", "collected_at", "created_at", "updated_at"]
