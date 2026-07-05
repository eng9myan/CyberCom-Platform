from rest_framework import serializers

from products.cymed.pharmacy.administration.models import MedicationAdministrationRecord


class MedicationAdministrationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationAdministrationRecord
        fields = [
            "id",
            "medication_order",
            "dispense_item",
            "patient_id",
            "scheduled_at",
            "status",
            "administered_at",
            "administered_by",
            "dose_given",
            "route_given",
            "site",
            "hold_reason",
            "refused_reason",
            "notes",
            "patient_barcode_scanned",
            "drug_barcode_scanned",
            "barcode_match_verified",
            "barcode_override_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "administered_at",
            "barcode_match_verified",
            "created_at",
            "updated_at",
        ]
