from rest_framework import serializers

from .models import ResearchAdverseEvent, ResearchProtocol, StudyEnrollment


class ResearchProtocolSerializer(serializers.ModelSerializer):
    is_actively_enrolling = serializers.BooleanField(read_only=True)

    class Meta:
        model = ResearchProtocol
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class StudyEnrollmentSerializer(serializers.ModelSerializer):
    protocol_title = serializers.CharField(source="protocol.title", read_only=True)

    class Meta:
        model = StudyEnrollment
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        status = attrs.get("status", getattr(self.instance, "status", None))
        consent_obtained = attrs.get("consent_obtained", getattr(self.instance, "consent_obtained", False))
        if status == "enrolled" and not consent_obtained:
            raise serializers.ValidationError("Cannot mark a subject enrolled without consent_obtained=True.")
        return attrs


class ResearchAdverseEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchAdverseEvent
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
