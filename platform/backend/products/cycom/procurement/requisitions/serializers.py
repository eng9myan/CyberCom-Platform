from rest_framework import serializers

from .models import PurchaseRequisition, RequisitionLine


class RequisitionLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequisitionLine
        fields = [
            "id",
            "requisition",
            "stock_item_id",
            "description",
            "quantity",
            "estimated_unit_price",
        ]
        read_only_fields = ["id"]


class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    lines = RequisitionLineSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseRequisition
        fields = [
            "id",
            "requested_by",
            "department",
            "justification",
            "needed_by",
            "status",
            "approved_by",
            "approved_at",
            "rejection_reason",
            "source_reorder_alert_id",
            "purchase_order_id",
            "lines",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "status", "approved_by", "approved_at", "rejection_reason",
            "purchase_order_id", "created_at", "updated_at",
        ]
