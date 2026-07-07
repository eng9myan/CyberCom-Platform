"""
Demographic, line-level VAT resolution (Phase: Medical Compliance).

Correction (superseding the first version of this module): every line is
taxed at the real ZATCA standard rate -- there is no "government pays the
VAT" tax category in ZATCA's UBL schema (only S=standard, Z=zero-rated,
E=exempt, O=out-of-scope), so citizenship never changes the RATE reported
to ZATCA, and this module no longer emits 0%. What citizenship DOES affect
is a separate government-subsidy allocation: for a qualifying citizen's
medical-necessity line, the government covers the tax amount, reducing
what the PATIENT owes -- this is modeled the same way InsuranceMember/
Claim already split patient-vs-insurer responsibility elsewhere in rcm/,
not as a change to the invoice's actual tax liability. ZATCA still sees
the full 15% under the real "S" category; only the patient's payable total
is reduced.

Legal-accuracy caveat (unchanged in spirit): whether/which citizen
healthcare services actually qualify for a government subsidy is a real
KSA health-financing policy question this module does not independently
verify -- CITIZEN_SUBSIDY_COUNTRY / STANDARD_VAT_RATE / which
classifications qualify are configurable defaults matching the rule as
specified, not confirmed against current government subsidy program
rules. Confirm against real policy before this governs production
invoices.
"""
from __future__ import annotations

from decimal import Decimal

from .models import ServiceClassification

STANDARD_VAT_RATE = Decimal("0.15")  # KSA standard VAT rate -- ZATCA category "S", always

# Nationality (PatientNationality.country_code) that qualifies for the
# government-subsidy allocation. Single-country default -- see vat.py's
# original citizen-zero-rate module docstring history for why this isn't
# generalized further without a real second jurisdiction to design against.
CITIZEN_SUBSIDY_COUNTRY = "SA"

# Only these service classifications are ever subsidy-eligible, regardless
# of nationality -- elective/retail lines are always fully patient-payable
# even for a qualifying citizen, per the explicit rule.
SUBSIDY_ELIGIBLE_CLASSIFICATIONS = {ServiceClassification.MEDICAL_NECESSITY}


def resolve_vat_rate(*, nationality_codes: set[str], service_classification: str) -> Decimal:
    """
    Always the real ZATCA standard rate -- kept as a function (rather than
    just using the STANDARD_VAT_RATE constant directly) so callers don't
    need to change if a genuine rate-varying category (e.g. a real export/
    out-of-scope case) is added later. Parameters are accepted for call-
    site symmetry with resolve_government_subsidy() but do not currently
    change the result.
    """
    return STANDARD_VAT_RATE


def resolve_government_subsidy(
    *, nationality_codes: set[str], service_classification: str, tax_amount: Decimal
) -> Decimal:
    """
    Portion of tax_amount the government covers for a qualifying citizen's
    medical-necessity line. Pure function: no DB access, no side effects.
    """
    if service_classification not in SUBSIDY_ELIGIBLE_CLASSIFICATIONS:
        return Decimal("0.00")
    if CITIZEN_SUBSIDY_COUNTRY not in nationality_codes:
        return Decimal("0.00")
    return tax_amount


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
    Computes and stores tax_rate, tax_amount, and government_subsidy_amount
    on an InvoiceLine, in place. tax_rate/tax_amount are the REAL, full
    legal liability (what ZATCA sees); government_subsidy_amount is a
    separate patient-payable reduction. Does NOT call line.save() -- caller
    controls when to persist (matches tax_providers.py's apply_result()).

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
    line.government_subsidy_amount = resolve_government_subsidy(
        nationality_codes=nationality_codes,
        service_classification=line.service_classification,
        tax_amount=line.tax_amount,
    )
