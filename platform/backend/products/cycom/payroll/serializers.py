from rest_framework import serializers

from .models import PayrollRun, Payslip


class PayslipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payslip
        fields = [
            "id",
            "payroll_run",
            "employee_id",
            "basic_salary",
            "allowances",
            "overtime_hours",
            "overtime_pay",
            "shift_differential_pay",
            "gross_pay",
            "social_security_deduction",
            "income_tax_deduction",
            "other_deductions",
            "total_deductions",
            "deductions",
            "net_salary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "gross_pay", "total_deductions", "net_salary", "created_at", "updated_at",
        ]


class GeneratePayslipSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    allowances = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, default=0)
    other_deductions = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, default=0)

    def validate(self, attrs):
        if attrs["period_end"] < attrs["period_start"]:
            raise serializers.ValidationError("period_end must not be before period_start.")
        return attrs


class PayrollRunSerializer(serializers.ModelSerializer):
    payslips = PayslipSerializer(many=True, read_only=True)

    class Meta:
        model = PayrollRun
        fields = [
            "id",
            "run_date",
            "period_start",
            "period_end",
            "status",
            "total_gross",
            "total_deductions",
            "total_net",
            "processed_by",
            "payslips",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "total_gross", "total_deductions", "total_net", "created_at", "updated_at",
        ]
