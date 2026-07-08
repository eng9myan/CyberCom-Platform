from rest_framework import serializers

from .models import Asset, AssetDepreciation, BiomedicalEquipment, EquipmentServiceRecord


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "code",
            "asset_type",
            "purchase_date",
            "purchase_cost",
            "salvage_value",
            "useful_life_years",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssetDepreciationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetDepreciation
        fields = [
            "id",
            "asset",
            "depreciation_date",
            "amount",
            "accumulated_depreciation",
            "book_value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BiomedicalEquipmentSerializer(serializers.ModelSerializer):
    is_available_for_use = serializers.BooleanField(read_only=True)
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    asset_code = serializers.CharField(source="asset.code", read_only=True)

    class Meta:
        model = BiomedicalEquipment
        fields = [
            "id", "asset", "asset_name", "asset_code",
            "manufacturer", "model_number", "serial_number", "department",
            "status", "calibration_interval_days", "last_calibration_date",
            "next_calibration_due", "is_available_for_use",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EquipmentServiceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentServiceRecord
        fields = [
            "id", "equipment", "service_type", "service_date",
            "performed_by", "next_due_date", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
