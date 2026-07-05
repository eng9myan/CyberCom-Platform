"""
National/WHO/MoH report content aggregation engine.
Populates NationalReport.content from real clinical data for the report's
period -- never a hand-typed or fabricated summary.
"""
from __future__ import annotations

from typing import Any

from django.db.models import Count

from .models import NationalReport

SURVEILLANCE_REPORT_TYPES = {"disease_surveillance", "outbreak_report", "who_report"}
VACCINATION_REPORT_TYPES = {"vaccination_coverage"}


class NationalReportGenerationService:
    @classmethod
    def generate(cls, tenant_id, report: NationalReport) -> dict[str, Any]:
        if report.report_type in SURVEILLANCE_REPORT_TYPES:
            content = cls._build_surveillance_content(
                tenant_id, report.reporting_period_start, report.reporting_period_end
            )
        elif report.report_type in VACCINATION_REPORT_TYPES:
            content = cls._build_vaccination_content(
                tenant_id, report.reporting_period_start, report.reporting_period_end
            )
        else:
            content = cls._build_generic_encounter_content(
                tenant_id, report.reporting_period_start, report.reporting_period_end
            )

        content["generated_from"] = "live_aggregation"
        content["period_start"] = report.reporting_period_start.isoformat()
        content["period_end"] = report.reporting_period_end.isoformat()

        report.content = content
        report.save(update_fields=["content", "updated_at"])
        return content

    @staticmethod
    def _build_surveillance_content(tenant_id, period_start, period_end) -> dict[str, Any]:
        from products.cymed.population_health.surveillance.models import (
            Outbreak,
            SurveillanceCase,
        )

        cases = SurveillanceCase.objects.filter(
            tenant_id=tenant_id, case_date__gte=period_start, case_date__lte=period_end
        )
        by_disease = list(
            cases.values("disease_code", "disease_name")
            .annotate(case_count=Count("id"))
            .order_by("-case_count")
        )
        by_case_type = dict(
            cases.values("case_type").annotate(n=Count("id")).values_list("case_type", "n")
        )
        notifiable_count = cases.filter(is_notifiable=True).count()

        outbreaks = Outbreak.objects.filter(
            tenant_id=tenant_id, start_date__gte=period_start, start_date__lte=period_end
        )
        outbreak_summary = list(
            outbreaks.values("status").annotate(n=Count("id")).values_list("status", "n")
        )

        return {
            "total_cases": cases.count(),
            "notifiable_cases": notifiable_count,
            "cases_by_disease": by_disease,
            "cases_by_type": by_case_type,
            "outbreaks_by_status": dict(outbreak_summary),
            "total_deaths": sum(o.deaths_count for o in outbreaks),
        }

    @staticmethod
    def _build_vaccination_content(tenant_id, period_start, period_end) -> dict[str, Any]:
        from products.cymed.core.clinical.models import Immunization

        immunizations = Immunization.objects.filter(
            tenant_id=tenant_id,
            administered_date__gte=period_start,
            administered_date__lte=period_end,
        )
        by_vaccine = list(
            immunizations.filter(status="completed")
            .values("vaccine_code", "vaccine_display")
            .annotate(doses_given=Count("id"))
            .order_by("-doses_given")
        )
        return {
            "total_doses_administered": immunizations.filter(status="completed").count(),
            "doses_by_vaccine": by_vaccine,
            "not_done_count": immunizations.filter(status="not_done").count(),
        }

    @staticmethod
    def _build_generic_encounter_content(tenant_id, period_start, period_end) -> dict[str, Any]:
        from products.cymed.core.encounters.models import Encounter

        encounters = Encounter.objects.filter(
            tenant_id=tenant_id,
            start_time__date__gte=period_start,
            start_time__date__lte=period_end,
        )
        by_type = dict(
            encounters.values("encounter_type")
            .annotate(n=Count("id"))
            .values_list("encounter_type", "n")
        )
        return {
            "total_encounters": encounters.count(),
            "encounters_by_type": by_type,
        }
