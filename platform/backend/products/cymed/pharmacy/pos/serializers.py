from decimal import Decimal

from rest_framework import serializers

from .models import PharmacySale, PharmacySaleLine


class PharmacySaleLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacySaleLine
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "sale", "line_total"]


class PharmacySaleSerializer(serializers.ModelSerializer):
    lines = PharmacySaleLineSerializer(many=True, read_only=True)

    class Meta:
        model = PharmacySale
        fields = "__all__"
        read_only_fields = [
            "id", "created_at", "updated_at", "sale_number",
            "subtotal", "tax_amount", "total_amount", "status", "voided_at",
        ]


class CheckoutLineInputSerializer(serializers.Serializer):
    stock_item_id = serializers.UUIDField()
    item_name = serializers.CharField(max_length=255)
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=Decimal("0.001"))
    unit_price = serializers.DecimalField(max_digits=18, decimal_places=2, min_value=Decimal("0"))


class CheckoutSerializer(serializers.Serializer):
    cashier_id = serializers.UUIDField()
    patient_id = serializers.UUIDField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(choices=PharmacySale.PAYMENT_METHOD_CHOICES)
    discount_amount = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, default=Decimal("0"), min_value=Decimal("0"))
    lines = CheckoutLineInputSerializer(many=True)

    def validate_lines(self, value):
        if not value:
            raise serializers.ValidationError("A sale must have at least one line item.")
        return value
