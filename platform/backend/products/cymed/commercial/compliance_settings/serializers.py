from rest_framework import serializers

from .models import TenantComplianceSettings


class TenantComplianceSettingsSerializer(serializers.ModelSerializer):
    # Secrets are write-only: the API returns whether a value is SET, never
    # the plaintext back. Editing means the caller sends a new value; leaving
    # a field blank on PATCH leaves the stored value untouched (see view).
    jofotara_client_secret = serializers.CharField(write_only=True, required=False, allow_blank=True)
    zatca_csid = serializers.CharField(write_only=True, required=False, allow_blank=True)
    zatca_production_csid = serializers.CharField(write_only=True, required=False, allow_blank=True)
    zatca_onboarding_otp = serializers.CharField(write_only=True, required=False, allow_blank=True)

    jofotara_client_secret_set = serializers.SerializerMethodField()
    zatca_csid_set = serializers.SerializerMethodField()
    zatca_production_csid_set = serializers.SerializerMethodField()
    zatca_onboarding_otp_set = serializers.SerializerMethodField()

    class Meta:
        model = TenantComplianceSettings
        fields = [
            "id",
            "jofotara_enabled", "jofotara_tax_registration_number", "jofotara_activity_code",
            "jofotara_client_secret", "jofotara_client_secret_set",
            "zatca_enabled", "zatca_csid", "zatca_csid_set",
            "zatca_production_csid", "zatca_production_csid_set",
            "zatca_onboarding_otp", "zatca_onboarding_otp_set",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

    def get_jofotara_client_secret_set(self, obj):
        return bool(obj.jofotara_client_secret)

    def get_zatca_csid_set(self, obj):
        return bool(obj.zatca_csid)

    def get_zatca_production_csid_set(self, obj):
        return bool(obj.zatca_production_csid)

    def get_zatca_onboarding_otp_set(self, obj):
        return bool(obj.zatca_onboarding_otp)

    def update(self, instance, validated_data):
        # Blank string on a secret field means "leave unchanged", not "clear it" --
        # clearing is only ever explicit via the connector after OTP consumption,
        # not something a blank form submit should silently trigger.
        for secret_field in ("jofotara_client_secret", "zatca_csid", "zatca_production_csid", "zatca_onboarding_otp"):
            if secret_field in validated_data and not validated_data[secret_field]:
                validated_data.pop(secret_field)
        return super().update(instance, validated_data)
