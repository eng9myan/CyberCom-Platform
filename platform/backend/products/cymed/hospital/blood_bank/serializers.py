from rest_framework import serializers

from .models import BloodCompatibility, BloodDonor, BloodInventory, BloodIssue, BloodUnit, CrossmatchRequest


class BloodDonorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodDonor
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class BloodUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodUnit
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class BloodIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodIssue
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "issued_at"]


class CrossmatchRequestSerializer(serializers.ModelSerializer):
    issues = BloodIssueSerializer(many=True, read_only=True)

    class Meta:
        model = CrossmatchRequest
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class BloodCompatibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodCompatibility
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class BloodInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodInventory
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "last_updated"]
