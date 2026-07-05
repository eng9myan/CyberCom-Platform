"""
CyMed Pharmacy — Drug Interaction Services
Interaction checking engine with CyAI integration for priority scoring.
Pharmacist approval required for all overrides.
AI cannot dispense or approve prescriptions.
"""

import uuid
from decimal import Decimal, InvalidOperation

import django.utils.timezone as tz

from .models import DoseRangeAlert, DosingGuideline, DrugInteraction, InteractionRule, InteractionType


class DrugInteractionService:
    """
    Core drug interaction checking service.
    Checks incoming medications against known interaction rules.
    Uses CyAI for priority scoring — humans make final decisions.
    """

    @classmethod
    def check_prescription(
        cls,
        patient_id: uuid.UUID,
        drug_codes: list[str],
        prescription_id: uuid.UUID | None = None,
        encounter_id: uuid.UUID | None = None,
        admission_id: uuid.UUID | None = None,
        patient_allergies: list[str] | None = None,
        patient_diagnoses: list[str] | None = None,
        patient_age_years: int | None = None,
        is_pregnant: bool = False,
        pregnancy_trimester: str | None = None,
        tenant_id: uuid.UUID | None = None,
    ) -> list[DrugInteraction]:
        """
        Check all interactions for a given set of drug codes.
        Returns list of detected DrugInteraction objects.
        """
        detected = []

        # Drug-Drug interactions
        detected.extend(
            cls._check_drug_drug(
                drug_codes, patient_id, prescription_id, encounter_id, admission_id, tenant_id
            )
        )

        # Drug-Allergy interactions
        if patient_allergies:
            detected.extend(
                cls._check_drug_allergy(
                    drug_codes,
                    patient_allergies,
                    patient_id,
                    prescription_id,
                    encounter_id,
                    tenant_id,
                )
            )

        # Drug-Diagnosis contraindications
        if patient_diagnoses:
            detected.extend(
                cls._check_drug_diagnosis(
                    drug_codes,
                    patient_diagnoses,
                    patient_id,
                    prescription_id,
                    encounter_id,
                    tenant_id,
                )
            )

        # Drug-Age
        if patient_age_years is not None:
            detected.extend(
                cls._check_drug_age(
                    drug_codes,
                    patient_age_years,
                    patient_id,
                    prescription_id,
                    encounter_id,
                    tenant_id,
                )
            )

        # Drug-Pregnancy
        if is_pregnant:
            detected.extend(
                cls._check_drug_pregnancy(
                    drug_codes,
                    pregnancy_trimester,
                    patient_id,
                    prescription_id,
                    encounter_id,
                    tenant_id,
                )
            )

        # AI priority scoring via CyAI
        cls._apply_ai_priority(detected)

        return detected

    @classmethod
    def _check_drug_drug(
        cls, drug_codes, patient_id, prescription_id, encounter_id, admission_id, tenant_id
    ):
        """Check all drug pairs for drug-drug interactions."""
        detected = []
        rules = InteractionRule.objects.filter(
            interaction_type=InteractionType.DRUG_DRUG, is_active=True, drug_a_code__in=drug_codes
        ).filter(drug_b_code__in=drug_codes)

        for rule in rules:
            if rule.drug_a_code == rule.drug_b_code:
                continue
            interaction = DrugInteraction.objects.create(
                tenant_id=tenant_id,
                patient_id=patient_id,
                prescription_id=prescription_id,
                encounter_id=encounter_id,
                admission_id=admission_id,
                rule=rule,
                interaction_type=InteractionType.DRUG_DRUG,
                severity=rule.severity,
                drug_a_code=rule.drug_a_code,
                drug_a_name=rule.drug_a_name,
                drug_b_code=rule.drug_b_code,
                drug_b_name=rule.drug_b_name,
            )
            detected.append(interaction)
        return detected

    @classmethod
    def _check_drug_allergy(
        cls, drug_codes, allergen_codes, patient_id, prescription_id, encounter_id, tenant_id
    ):
        """Check drug-allergy interactions."""
        detected = []
        rules = InteractionRule.objects.filter(
            interaction_type=InteractionType.DRUG_ALLERGY,
            is_active=True,
            drug_a_code__in=drug_codes,
            allergen_code__in=allergen_codes,
        )
        for rule in rules:
            interaction = DrugInteraction.objects.create(
                tenant_id=tenant_id,
                patient_id=patient_id,
                prescription_id=prescription_id,
                encounter_id=encounter_id,
                rule=rule,
                interaction_type=InteractionType.DRUG_ALLERGY,
                severity=rule.severity,
                drug_a_code=rule.drug_a_code,
                drug_a_name=rule.drug_a_name,
                drug_b_code=rule.allergen_code,
                drug_b_name=f"Allergen: {rule.allergen_code}",
            )
            detected.append(interaction)
        return detected

    @classmethod
    def _check_drug_diagnosis(
        cls, drug_codes, diagnosis_codes, patient_id, prescription_id, encounter_id, tenant_id
    ):
        """Check drug-diagnosis contraindications."""
        detected = []
        rules = InteractionRule.objects.filter(
            interaction_type=InteractionType.DRUG_DIAGNOSIS,
            is_active=True,
            drug_a_code__in=drug_codes,
            diagnosis_code__in=diagnosis_codes,
        )
        for rule in rules:
            interaction = DrugInteraction.objects.create(
                tenant_id=tenant_id,
                patient_id=patient_id,
                prescription_id=prescription_id,
                encounter_id=encounter_id,
                rule=rule,
                interaction_type=InteractionType.DRUG_DIAGNOSIS,
                severity=rule.severity,
                drug_a_code=rule.drug_a_code,
                drug_a_name=rule.drug_a_name,
                drug_b_code=rule.diagnosis_code,
                drug_b_name=f"Diagnosis: {rule.diagnosis_code}",
            )
            detected.append(interaction)
        return detected

    @classmethod
    def _check_drug_age(
        cls, drug_codes, age_years, patient_id, prescription_id, encounter_id, tenant_id
    ):
        """Check drug-age appropriateness."""
        detected = []
        rules = InteractionRule.objects.filter(
            interaction_type=InteractionType.DRUG_AGE, is_active=True, drug_a_code__in=drug_codes
        )
        for rule in rules:
            age_issue = False
            if rule.min_age_years is not None and age_years < rule.min_age_years:
                age_issue = True
            if rule.max_age_years is not None and age_years > rule.max_age_years:
                age_issue = True
            if age_issue:
                interaction = DrugInteraction.objects.create(
                    tenant_id=tenant_id,
                    patient_id=patient_id,
                    prescription_id=prescription_id,
                    encounter_id=encounter_id,
                    rule=rule,
                    interaction_type=InteractionType.DRUG_AGE,
                    severity=rule.severity,
                    drug_a_code=rule.drug_a_code,
                    drug_a_name=rule.drug_a_name,
                    drug_b_name=f"Patient Age: {age_years} years",
                )
                detected.append(interaction)
        return detected

    @classmethod
    def _check_drug_pregnancy(
        cls, drug_codes, trimester, patient_id, prescription_id, encounter_id, tenant_id
    ):
        """Check drug-pregnancy safety."""
        detected = []
        rules = InteractionRule.objects.filter(
            interaction_type=InteractionType.DRUG_PREGNANCY,
            is_active=True,
            drug_a_code__in=drug_codes,
        ).exclude(pregnancy_category__in=["A", "B"])
        for rule in rules:
            interaction = DrugInteraction.objects.create(
                tenant_id=tenant_id,
                patient_id=patient_id,
                prescription_id=prescription_id,
                encounter_id=encounter_id,
                rule=rule,
                interaction_type=InteractionType.DRUG_PREGNANCY,
                severity=rule.severity,
                drug_a_code=rule.drug_a_code,
                drug_a_name=rule.drug_a_name,
                drug_b_name=f"Pregnancy Category {rule.pregnancy_category}",
            )
            detected.append(interaction)
        return detected

    @classmethod
    def _apply_ai_priority(cls, interactions: list[DrugInteraction]) -> None:
        """
        Apply CyAI priority scoring to detected interactions.
        AI assists with prioritization — pharmacist makes all decisions.
        """
        try:
            from platform.cyai.services import CyAIService

            for interaction in interactions:
                score = CyAIService.score_interaction_priority(
                    interaction_type=interaction.interaction_type,
                    severity=interaction.severity,
                    drug_a=interaction.drug_a_name,
                    drug_b=interaction.drug_b_name,
                )
                interaction.ai_priority_score = score
                interaction.save(update_fields=["ai_priority_score"])
        except Exception:
            pass  # AI scoring is advisory only

    @classmethod
    def override_interaction(
        cls,
        interaction_id: uuid.UUID,
        pharmacist_id: uuid.UUID,
        override_reason: str,
        tenant_id: uuid.UUID | None = None,
    ) -> DrugInteraction:
        """
        Allow pharmacist to override an interaction with justification.
        AI cannot approve — this requires human pharmacist decision.
        """
        interaction = DrugInteraction.objects.get(id=interaction_id)
        if not interaction.rule.override_allowed:
            raise ValueError(
                f"Interaction {interaction.rule.rule_code} is contraindicated and cannot be overridden."
            )
        interaction.alert_status = "overridden"
        interaction.overridden_by = pharmacist_id
        interaction.overridden_at = tz.now()
        interaction.override_reason = override_reason
        interaction.save(
            update_fields=["alert_status", "overridden_by", "overridden_at", "override_reason"]
        )

        # Publish event
        try:
            from platform.events.models import OutboxEvent

            OutboxEvent.objects.create(
                tenant_id=str(tenant_id) if tenant_id else None,
                topic="cymed.pharmacy.interaction.detected",
                event_type="cymed.pharmacy.interaction.overridden",
                payload={
                    "interaction_id": str(interaction.id),
                    "overridden_by": str(pharmacist_id),
                    "reason": override_reason,
                },
            )
        except Exception:
            pass

        return interaction


class DosingCheckService:
    """
    Checks an ordered dose against the drug's DosingGuideline range.
    If the dose string doesn't parse as a plain number (e.g. "1-2 tabs PRN"),
    or no guideline exists for the drug, the check is silently skipped --
    we never fabricate a "safe" verdict for a drug we have no data on.
    """

    @classmethod
    def check_dose(
        cls,
        drug_code: str,
        drug_name: str,
        dose: str,
        dose_unit: str,
        patient_id: uuid.UUID,
        medication_order_id: uuid.UUID,
        patient_weight_kg: Decimal | None = None,
        tenant_id: uuid.UUID | None = None,
    ) -> list[DoseRangeAlert]:
        try:
            dose_value = Decimal(str(dose).strip())
        except (InvalidOperation, ValueError):
            return []

        guideline = DosingGuideline.objects.filter(
            tenant_id=tenant_id, drug_code=drug_code, is_active=True
        ).first()
        if guideline is None or guideline.dose_unit != dose_unit:
            return []

        alerts = []

        def _create(issue, severity, limit):
            alert = DoseRangeAlert.objects.create(
                tenant_id=tenant_id,
                medication_order_id=medication_order_id,
                patient_id=patient_id,
                guideline=guideline,
                drug_code=drug_code,
                drug_name=drug_name,
                ordered_dose=dose_value,
                ordered_dose_unit=dose_unit,
                issue=issue,
                severity=severity,
                guideline_limit=limit,
            )
            alerts.append(alert)

        if guideline.min_single_dose is not None and dose_value < guideline.min_single_dose:
            _create("below_min", "warning", guideline.min_single_dose)

        if guideline.max_single_dose is not None and dose_value > guideline.max_single_dose:
            _create("above_max", "critical", guideline.max_single_dose)

        if guideline.max_daily_dose is not None and dose_value > guideline.max_daily_dose:
            _create("above_max_daily", "critical", guideline.max_daily_dose)

        if guideline.weight_based and guideline.max_dose_per_kg is not None and patient_weight_kg:
            max_by_weight = guideline.max_dose_per_kg * patient_weight_kg
            if dose_value > max_by_weight:
                _create("above_weight_based_max", "critical", max_by_weight)

        return alerts

    @classmethod
    def override_alert(
        cls, alert_id: uuid.UUID, prescriber_or_pharmacist_id: uuid.UUID, reason: str
    ) -> DoseRangeAlert:
        alert = DoseRangeAlert.objects.get(id=alert_id)
        alert.status = "overridden"
        alert.overridden_by = prescriber_or_pharmacist_id
        alert.overridden_at = tz.now()
        alert.override_reason = reason
        alert.save(
            update_fields=["status", "overridden_by", "overridden_at", "override_reason"]
        )
        return alert
