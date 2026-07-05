from rest_framework import serializers

from .models import (
    Attendance,
    ClinicalCredential,
    Department,
    Employee,
    LeaveRequest,
    PerformanceReview,
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "code", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "department",
            "job_title",
            "hire_date",
            "status",
            "is_clinical_staff",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ["id", "employee", "check_in", "check_out", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "employee",
            "leave_type",
            "start_date",
            "end_date",
            "status",
            "approved_by",
            "reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClinicalCredentialSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)

    class Meta:
        model = ClinicalCredential
        fields = [
            "id",
            "employee",
            "employee_name",
            "credential_type",
            "license_number",
            "issuing_body",
            "issue_date",
            "expiry_date",
            "status",
            "verified",
            "verified_by",
            "verified_at",
            "document_ref",
            "is_expired",
            "days_until_expiry",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "status", "verified", "verified_by", "verified_at",
            "created_at", "updated_at",
        ]

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"


class PerformanceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceReview
        fields = [
            "id",
            "employee",
            "reviewer_id",
            "review_date",
            "rating",
            "feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
