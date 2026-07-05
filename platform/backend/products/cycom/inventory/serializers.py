from rest_framework import serializers

from .models import ReorderAlert, StockItem, StockMovement, Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "code", "location", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class StockItemSerializer(serializers.ModelSerializer):
    needs_reorder = serializers.BooleanField(read_only=True)

    class Meta:
        model = StockItem
        fields = [
            "id",
            "name",
            "sku",
            "warehouse",
            "quantity",
            "unit",
            "unit_cost",
            "reorder_level",
            "par_level",
            "preferred_vendor_id",
            "needs_reorder",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "quantity", "created_at", "updated_at"]


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = [
            "id",
            "stock_item",
            "movement_type",
            "quantity",
            "reference_id",
            "movement_date",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "movement_date", "created_at", "updated_at"]


class ReorderAlertSerializer(serializers.ModelSerializer):
    stock_item_sku = serializers.CharField(source="stock_item.sku", read_only=True)
    stock_item_name = serializers.CharField(source="stock_item.name", read_only=True)

    class Meta:
        model = ReorderAlert
        fields = [
            "id",
            "stock_item",
            "stock_item_sku",
            "stock_item_name",
            "triggered_at",
            "quantity_at_trigger",
            "reorder_level_at_trigger",
            "suggested_order_quantity",
            "status",
            "requisition_id",
        ]
        read_only_fields = [
            "id",
            "triggered_at",
            "quantity_at_trigger",
            "reorder_level_at_trigger",
            "suggested_order_quantity",
            "requisition_id",
        ]
