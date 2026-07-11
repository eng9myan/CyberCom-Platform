import csv
import io

from platform.cyidentity.permissions import HasHRAccess
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from products.cycom.hr.models import Employee

from .models import PayrollRun, Payslip
from .serializers import GeneratePayslipSerializer, PayrollRunSerializer, PayslipSerializer
from .services import PayrollCalculationService


class BasePayrollViewSet(viewsets.ModelViewSet):
    permission_classes = [HasHRAccess]

    def get_queryset(self):
        tenant_id = getattr(self.request, "tenant_id", None)
        return self.queryset.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        tenant_id = getattr(self.request, "tenant_id", None)
        serializer.save(tenant_id=tenant_id)


class PayrollRunViewSet(BasePayrollViewSet):
    queryset = PayrollRun.objects.all()
    serializer_class = PayrollRunSerializer

    @action(detail=True, methods=["post"], url_path="generate-payslip")
    def generate_payslip(self, request, pk=None):
        """
        Generates one payslip against this run from real Attendance/
        ShiftAssignment data -- overtime and shift-differential pay are
        calculated, not hand-entered.
        """
        payroll_run = self.get_object()
        tenant_id = getattr(request, "tenant_id", None)
        serializer = GeneratePayslipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        employee = Employee.objects.filter(id=data["employee_id"], tenant_id=tenant_id).first()
        if employee is None:
            raise ValidationError({"employee_id": "No employee found for that id."})

        try:
            payslip = PayrollCalculationService.generate_payslip(
                payroll_run=payroll_run,
                employee=employee,
                period_start=data["period_start"],
                period_end=data["period_end"],
                allowances=data["allowances"],
                other_deductions=data["other_deductions"],
            )
        except ValueError as exc:
            raise ValidationError({"employee_id": str(exc)}) from exc

        return Response(PayslipSerializer(payslip).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="export-wps")
    def export_wps(self, request, pk=None):
        """
        WPS (Wage Protection System) salary information export -- one row
        per payslip in this run, the fields a bank's WPS SIF upload
        commonly requires (employee national ID, IBAN, basic/gross/net).

        This is a generic export, not pinned to one specific bank's exact
        column spec -- confirm the receiving bank/WPS agent's required
        format before using this for a real compliance submission.
        """
        payroll_run = self.get_object()
        tenant_id = getattr(request, "tenant_id", None)
        payslips = payroll_run.payslips.all().order_by("employee_id")

        employees_by_id = {
            e.id: e
            for e in Employee.objects.filter(
                id__in=[p.employee_id for p in payslips], tenant_id=tenant_id
            )
        }

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "employee_national_id",
                "employee_name",
                "iban",
                "basic_salary",
                "gross_pay",
                "total_deductions",
                "net_salary",
                "payment_date",
            ]
        )
        missing_bank_details = []
        for payslip in payslips:
            employee = employees_by_id.get(payslip.employee_id)
            employee_name = f"{employee.first_name} {employee.last_name}" if employee else ""
            iban = employee.bank_iban if employee else ""
            national_id = employee.national_id if employee else ""
            if not iban or not national_id:
                missing_bank_details.append(str(payslip.employee_id))
            writer.writerow(
                [
                    national_id,
                    employee_name,
                    iban,
                    payslip.basic_salary,
                    payslip.gross_pay,
                    payslip.total_deductions,
                    payslip.net_salary,
                    payroll_run.run_date,
                ]
            )

        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="wps_{payroll_run.run_date}.csv"'
        if missing_bank_details:
            response["X-WPS-Missing-Bank-Details"] = ",".join(missing_bank_details)
        return response


class PayslipViewSet(BasePayrollViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
