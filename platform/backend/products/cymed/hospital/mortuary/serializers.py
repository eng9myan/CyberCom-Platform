from rest_framework import serializers

from .models import MortuaryCase, ReleaseRecord


class MortuaryCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MortuaryCase
        fields = "__all__"
        read_only_fields = ["id", "intake_at", "status", "created_at", "updated_at"]


class ReleaseRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReleaseRecord
        fields = "__all__"
        read_only_fields = ["id", "released_at", "created_at", "updated_at"]

    def validate_id_verified(self, value):
        if not value:
            raise serializers.ValidationError("Cannot release remains without verified identification of the recipient.")
        return value
