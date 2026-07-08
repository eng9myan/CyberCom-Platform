from rest_framework import serializers

from .models import HaulerManifest, WasteCollectionLog


class HaulerManifestSerializer(serializers.ModelSerializer):
    class Meta:
        model = HaulerManifest
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        status = attrs.get("status", getattr(self.instance, "status", None))
        rep_signed = attrs.get("facility_representative_signed", getattr(self.instance, "facility_representative_signed", False))
        driver_signed = attrs.get("driver_signature_confirmed", getattr(self.instance, "driver_signature_confirmed", False))
        if status == "in_transit" and not (rep_signed and driver_signed):
            raise serializers.ValidationError(
                "Cannot mark a manifest in_transit without both facility_representative_signed and driver_signature_confirmed."
            )
        return attrs


class WasteCollectionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteCollectionLog
        fields = "__all__"
        read_only_fields = ["id", "collected_at", "created_at", "updated_at"]
