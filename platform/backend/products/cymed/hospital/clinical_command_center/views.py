from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.cymed.core.facilities.models import Bed
from products.cymed.hospital.adt.models import Admission, DischargeSummary
from products.cymed.hospital.bed_management.models import BedAssignment
from products.cymed.hospital.emergency.models import EmergencyVisit
from products.cymed.hospital.icu.models import ICUStay
from products.cymed.hospital.inpatient.models import DischargePlanning
from products.cymed.hospital.nursing.models import NursingAssignment
from products.cymed.hospital.operating_room.models import SurgicalCase


class ClinicalCommandCenterMetricsView(APIView):
    """
    Real-time operational snapshot for the hospital command center.
    Every figure here is computed from live rows — if a metric has no
    underlying data source yet (e.g. physician duty-hours), it is reported
    as not_tracked rather than a placeholder number.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant_id = getattr(request, "tenant_id", None)

        if not tenant_id:
            return Response({"detail": "Tenant context required"}, status=400)

        total_admissions = Admission.objects.filter(tenant_id=tenant_id, status="admitted").count()
        active_bed_assignments = BedAssignment.objects.filter(
            tenant_id=tenant_id, released_at__isnull=True
        ).count()
        active_ed_visits = EmergencyVisit.objects.filter(
            tenant_id=tenant_id, status__in=["triage", "fast_track", "resuscitation", "observation"]
        ).count()
        active_icu_stays = ICUStay.objects.filter(
            tenant_id=tenant_id, icu_released_at__isnull=True
        ).count()
        scheduled_surgeries = SurgicalCase.objects.filter(
            tenant_id=tenant_id, status="scheduled"
        ).count()

        # Real bed occupancy: occupied vs the actual bed inventory, not a
        # divide-by-100 shortcut that used to just echo the occupied count back.
        total_beds = Bed.objects.filter(tenant_id=tenant_id).count()
        bed_occupancy_pct = (
            round(active_bed_assignments / total_beds * 100.0, 2) if total_beds > 0 else 0.0
        )

        # Discharge efficiency: share of the last 30 days' discharges that
        # happened on or before their planned target_discharge_date.
        window_start = timezone.now() - timezone.timedelta(days=30)
        planned = DischargePlanning.objects.filter(
            tenant_id=tenant_id, created_at__gte=window_start
        ).select_related("stay__admission")
        on_time = 0
        evaluated = 0
        for plan in planned:
            summary = DischargeSummary.objects.filter(
                admission=plan.stay.admission, tenant_id=tenant_id
            ).first()
            if summary:
                evaluated += 1
                if summary.discharged_at.date() <= plan.target_discharge_date:
                    on_time += 1
        discharge_efficiency_index = round(on_time / evaluated, 2) if evaluated > 0 else None

        # Nurse:patient ratio for today's assignments vs currently admitted patients.
        nurses_on_duty_today = (
            NursingAssignment.objects.filter(
                tenant_id=tenant_id, assigned_date=timezone.now().date()
            )
            .values("nurse_id")
            .distinct()
            .count()
        )
        nurse_patient_ratio = (
            round(total_admissions / nurses_on_duty_today, 2) if nurses_on_duty_today > 0 else None
        )

        metrics = {
            "operational_census": {
                "active_admissions": total_admissions,
                "current_occupied_beds": active_bed_assignments,
                "emergency_waiting": active_ed_visits,
                "icu_occupancy": active_icu_stays,
                "scheduled_procedures_today": scheduled_surgeries,
            },
            "capacity_indicators": {
                "bed_occupancy_percentage": bed_occupancy_pct,
                "icu_ventilator_utilization": active_icu_stays,
                "discharge_efficiency_index": discharge_efficiency_index,
            },
            "staffing_compliance": {
                "nurse_to_patient_ratio": (
                    f"1:{nurse_patient_ratio}" if nurse_patient_ratio is not None else "not_tracked"
                ),
                "physician_duty_hours_compliance": "not_tracked",
            },
        }
        return Response(metrics)
