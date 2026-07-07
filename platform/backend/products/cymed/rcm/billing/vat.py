"""
Demographic, line-level VAT resolution (Phase: Medical Compliance).

IMPORTANT -- legal accuracy caveat: this implements the rate rule exactly as
specified ("0% VAT for qualifying citizens, 15% for non-citizens or
elective/retail items, resolved per invoice line"). Real Saudi VAT law's
healthcare zero-rating is narrower and more conditional in practice than a
blanket citizen/non-citizen split (it typically applies to specific services
under government health programs, not automatically to every line on every
private invoice). This module gives you a real, working, auditable RATE
RESOLUTION ENGINE with the exact citizen/classification logic requested --
it does not constitute tax advice, and the CITIZEN_ZERO_RATE_COUNTRY /
STANDARD_VAT_RATE / which classifications qualify should be confirmed
against current ZATCA guidance and your own tax/legal counsel before this
governs real invoices. Treat the numbers below as configurable defaults,
not verified law.
"""
from __future__ import annotations

from decimal import Decimal

from .models import ServiceClassification

STANDARD_VAT_RATE = Decimal("0.15")  # KSA standard VAT rate
ZERO_VAT_RATE = Decimal("0.00")

# Nationality (PatientNationality.country_code) that qualifies for the
# citizen zero-rate. Single-country default since the two schemes this
# session built (ZATCA/JoFotara) are KSA/JO-specific; a Jordan-resident
# tenant would need its own equivalent constant/rule, not a blind reuse of
# "SA" -- deliberately not generalized further without a real second case
# to design against.
CITIZEN_ZERO_RATE_COUNTRY = "SA"

# Only these service classifications are EVER eligible for the zero rate,
# regardless of nationality -- elective/retail lines are always standard-
# rated even for a qualifying citizen, per the explicit rule.
ZERO_RATE_ELIGIBLE_CLASSIFICATIONS = {ServiceClassification.MEDICAL_NECESSITY}


def resolve_vat_rate(*, nationality_codes: set[str], service_classification: str) -> Decimal:
    """
    Pure function: no DB access, no side effects, trivially unit-testable.
    `nationality_codes` is the set of PatientNationality.country_code values
    for the patient (a patient can have zero, one, or several -- see
    products/cymed/core/patients/models.py::PatientNationality).
    """
    if service_classification not in ZERO_RATE_ELIGIBLE_CLASSIFICATIONS:
        return STANDARD_VAT_RATE
    if CITIZEN_ZERO_RATE_COUNTRY in nationality_codes:
        return ZERO_VAT_RATE
    return STANDARD_VAT_RATE


def nationality_codes_for_patient(patient_id) -> set[str]:
    """
    Real cross-app read (rcm.billing -> core.patients) -- no FK, matching
    the loose-UUID convention already used throughout rcm/* for referencing
    Patient (see PatientAccount.patient_id, InsuranceMember.patient_id,
    etc.) -- this is a query, not a schema coupling.
    """
    from products.cymed.core.patients.models import PatientNationality

    return set(PatientNationality.objects.filter(patient_id=patient_id).values_list("country_code", flat=True))


def apply_vat_to_line(line, *, nationality_codes: set[str] | None = None) -> None:
    """
    Computes and stores tax_rate + tax_amount on an InvoiceLine, in place.
    Does NOT call line.save() -- caller controls when to persist (matches
    the same convention as tax_providers.py's apply_result()).

    If nationality_codes isn't passed explicitly, resolves it from the
    line's invoice.patient_account.patient_id (one extra query) -- pass it
    explicitly when computing VAT for many lines on the same invoice/patient
    to avoid N+1 queries.
    """
    if nationality_codes is None:
        nationality_codes = nationality_codes_for_patient(line.invoice.patient_account.patient_id)

    rate = resolve_vat_rate(nationality_codes=nationality_codes, service_classification=line.service_classification)
    line.tax_rate = rate

    discounted_subtotal = line.quantity * line.unit_price * (1 - line.discount_percentage / Decimal("100"))
    line.tax_amount = (discounted_subtotal * rate).quantize(Decimal("0.01"))
