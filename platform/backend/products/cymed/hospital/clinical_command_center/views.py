from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.cymed.hospital.services import (
    HospitalAIAssistant,
    HospitalOperationsService,
    MedicalDirectorService,
)


class ClinicalCommandCenterMetricsView(APIView):
    """
    Real-time operational snapshot for the hospital command center.
    Delegates to HospitalOperationsService.get_snapshot() -- the same
    source of truth used by the hospital AI assistant -- so the dashboard
    and natural-language Q&A never drift apart.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant_id = getattr(request, "tenant_id", None)

        if not tenant_id:
            return Response({"detail": "Tenant context required"}, status=400)

        return Response(HospitalOperationsService.get_snapshot(tenant_id))


class ClinicalCommandCenterTrendView(APIView):
    """
    Real per-day admission/discharge counts for the trailing window --
    backs the dashboard trend chart. No synthetic data.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            return Response({"detail": "Tenant context required"}, status=400)

        days = int(request.query_params.get("days", 7))
        return Response(HospitalOperationsService.get_weekly_trend(tenant_id, days=days))


class ClinicalCommandCenterModuleSummaryView(APIView):
    """
    Plain tenant-scoped counts backing the dashboard's ERP-embedded module
    grid badges (patients, appointments, providers, billing, inventory,
    HR, BI). See HospitalOperationsService.get_module_summary() docstring.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            return Response({"detail": "Tenant context required"}, status=400)

        return Response(HospitalOperationsService.get_module_summary(tenant_id))


class MedicalDirectorDashboardView(APIView):
    """
    Clinical-quality KPIs (LOS, mortality, readmissions, bed utilization,
    consultant productivity, ICU critical events). Every number is a real
    query against Admission/DischargeSummary/CriticalEvent -- see
    MedicalDirectorService.get_dashboard() docstring for what's honestly
    reported as 0/None when the tenant hasn't configured the underlying
    data (e.g. no mortality-coded discharge disposition).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            return Response({"detail": "Tenant context required"}, status=400)

        period_days = int(request.query_params.get("period_days", 30))
        return Response(MedicalDirectorService.get_dashboard(tenant_id, period_days=period_days))


class HospitalAIAssistantView(APIView):
    """
    Natural-language Q&A over the hospital's real operational snapshot
    (admissions, beds, staffing, infection control). Advisory only -- see
    HospitalAIAssistant docstring. Every call is guardrailed and audited by
    CyAI's ModelGateway (InferenceLog), same as any other CyAI consumer.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            return Response({"detail": "Tenant context required"}, status=400)

        question = request.data.get("question", "").strip()
        if not question:
            return Response({"detail": "'question' is required"}, status=400)

        try:
            result = HospitalAIAssistant.ask(
                tenant_id=tenant_id,
                question=question,
                model_config_id=request.data.get("model_config_id"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

        return Response(result)
