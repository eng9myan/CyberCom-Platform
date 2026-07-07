"""
NPHIES (Saudi National Platform for Health Information Exchange Services)
connector -- eligibility checks and pre-authorization submission.

Scope, same honest-stub pattern as zatca.py/jofotara.py: builds real FHIR R4
message Bundles from real EligibilityRequest/Preauthorization rows (nothing
invented -- every value traces back to a real model field), and will submit
to NPHIES' Health Service Bus (HSB) if credentials are configured. No live
NPHIES credentials exist in this environment, so submission always resolves
to the honest "not_submitted" path.

Conformance caveat (read before trusting this against a real NPHIES sandbox):
NPHIES' Implementation Guide binds many elements to specific mandatory
KSA-profile extensions and ValueSets -- e.g. site-eligibility flags,
episode/encounter-class extensions, Practitioner license-authority
extensions, benefit-subCategory-specific fields, and exact CodeSystem/
ValueSet URIs published in the NPHIES IG's own artifact registry. This
module does NOT attempt to reproduce that registry from memory: the
system/CodeSystem URIs below (ksa-message-events,
CodeSystem/benefit-category) are plausible, real-shaped FHIR URIs that
match NPHIES' general naming convention, but have NOT been verified
against the live IG or a sandbox conformance run, and the mandatory
extensions the IG requires beyond the base resource fields are not
included at all. Calling this "IG-conformant" would be a false claim;
what's real here is: every value comes from an actual Patient/
InsuranceMember/EligibilityRequest/Preauthorization row (nothing
invented), the message-Bundle transport shape (MessageHeader + focus +
supporting resources) is structurally correct FHIR, and the submit path's
transport-error handling is real. Closing the conformance gap requires
the actual NPHIES IG artifact set (StructureDefinitions, ValueSets) as
input, which isn't available in this environment.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone as dt_timezone
from typing import Any

import httpx

NPHIES_BASE_URL = "https://HSB.nphies.sa"
NPHIES_PROCESS_MESSAGE_URL = f"{NPHIES_BASE_URL}/$process-message"

NPHIES_SERVICE_TYPE_MAP = {
    "medical": "medical-care",
    "pharmacy": "pharmacy",
    "dental": "oral-services",
    "vision": "vision-care",
    "mental_health": "mental-health-care",
    "substance_abuse": "substance-abuse-care",
    "preventive": "medical-care",
    "emergency": "emergency-services",
}

NPHIES_AUTH_TYPE_MAP = {
    "service": "institutional",
    "procedure": "institutional",
    "medication": "pharmacy",
    "imaging": "institutional",
    "hospitalization": "institutional",
    "home_health": "institutional",
    "dme": "institutional",
    "rehabilitation": "institutional",
}


def _now_iso() -> str:
    return datetime.now(dt_timezone.utc).isoformat()


def _message_header(event_code: str, provider_license: str, focus_reference: str) -> dict:
    return {
        "resourceType": "MessageHeader",
        "id": str(uuid.uuid4()),
        "eventCoding": {
            "system": "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
            "code": event_code,
        },
        "source": {"endpoint": f"http://nphies.sa/license/provider-license/{provider_license}"},
        "focus": [{"reference": focus_reference}],
    }


def build_coverage_resource(member, *, coverage_id: str, patient_id: str) -> dict:
    """
    Builds a real FHIR Coverage resource from a real rcm.insurance.
    InsuranceMember row. Shared by build_eligibility_bundle() and
    build_preauth_bundle() (previously duplicated inline in both).
    """
    return {
        "resourceType": "Coverage",
        "id": coverage_id,
        "status": "active" if member.is_active else "cancelled",
        "identifier": [{"value": member.member_id}],
        "beneficiary": {"reference": f"Patient/{patient_id}"},
        "payor": [{"identifier": {"value": member.insurance_plan.company.payer_id}}],
    }


def build_eligibility_bundle(eligibility_request, *, provider_license: str) -> dict[str, Any]:
    """
    Builds a real NPHIES eligibility-request message Bundle from a real
    rcm.eligibility.EligibilityRequest row.
    """
    from products.cymed.core.patients.models import Patient
    from products.cymed.rcm.insurance.models import InsuranceMember

    patient = Patient.objects.filter(
        tenant_id=eligibility_request.tenant_id, id=eligibility_request.patient_id
    ).first()
    member = InsuranceMember.objects.filter(
        tenant_id=eligibility_request.tenant_id, id=eligibility_request.insurance_member_id
    ).first()

    coverage_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())
    request_id = str(eligibility_request.id)

    coverage_eligibility_request = {
        "resourceType": "CoverageEligibilityRequest",
        "id": request_id,
        "status": "active",
        "purpose": ["validation"],
        "patient": {"reference": f"Patient/{patient_id}"},
        "servicedDate": eligibility_request.service_date.isoformat(),
        "created": _now_iso(),
        "provider": {"identifier": {"value": provider_license}},
        "insurer": {"identifier": {"value": member.insurance_plan.company.payer_id if member else ""}},
        "insurance": [{"coverage": {"reference": f"Coverage/{coverage_id}"}}],
        "item": [
            {
                "category": {
                    "coding": [
                        {
                            "system": "http://nphies.sa/terminology/CodeSystem/benefit-category",
                            "code": NPHIES_SERVICE_TYPE_MAP.get(eligibility_request.service_type, "medical-care"),
                        }
                    ]
                }
            }
        ],
    }

    entries = [
        {"resource": _message_header("eligibility-request", provider_license, f"CoverageEligibilityRequest/{request_id}")},
        {"resource": coverage_eligibility_request},
    ]
    if patient is not None:
        entries.append({
            "resource": {
                "resourceType": "Patient",
                "id": patient_id,
                "identifier": [{"system": "http://nphies.sa/identifier/nationalid", "value": patient.national_id or ""}],
                "name": [{"given": [patient.first_name], "family": patient.last_name}],
                "gender": patient.gender,
                "birthDate": patient.dob.isoformat(),
            }
        })
    if member is not None:
        entries.append({"resource": build_coverage_resource(member, coverage_id=coverage_id, patient_id=patient_id)})

    return {
        "resourceType": "Bundle",
        "id": str(uuid.uuid4()),
        "type": "message",
        "timestamp": _now_iso(),
        "entry": entries,
    }


def build_preauth_bundle(preauthorization, *, provider_license: str) -> dict[str, Any]:
    """
    Builds a real NPHIES priorauth-request message Bundle (FHIR Claim,
    use=preauthorization) from a real rcm.preauthorization.Preauthorization
    row.
    """
    from products.cymed.rcm.insurance.models import InsuranceMember

    member = InsuranceMember.objects.filter(
        tenant_id=preauthorization.tenant_id, id=preauthorization.insurance_member_id
    ).first()

    claim_id = str(preauthorization.id)
    patient_id = str(uuid.uuid4())
    coverage_id = str(uuid.uuid4())

    claim = {
        "resourceType": "Claim",
        "id": claim_id,
        "status": "active",
        "type": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/claim-type",
                    "code": NPHIES_AUTH_TYPE_MAP.get(preauthorization.authorization_type, "institutional"),
                }
            ]
        },
        "use": "preauthorization",
        "patient": {"reference": f"Patient/{patient_id}"},
        "created": _now_iso(),
        "provider": {"identifier": {"value": provider_license}},
        "priority": {"coding": [{"code": preauthorization.priority}]},
        "insurance": [
            {
                "sequence": 1,
                "focal": True,
                "coverage": {"reference": f"Coverage/{coverage_id}"},
            }
        ],
        "diagnosis": [
            {"sequence": i + 1, "diagnosisCodeableConcept": {"coding": [{"code": code}]}}
            for i, code in enumerate(preauthorization.icd11_diagnosis_codes)
        ],
        "item": [
            {
                "sequence": 1,
                "productOrService": {"text": preauthorization.service_description},
                "quantity": {"value": preauthorization.requested_units},
                "servicedPeriod": {
                    "start": preauthorization.requested_start_date.isoformat(),
                    **(
                        {"end": preauthorization.requested_end_date.isoformat()}
                        if preauthorization.requested_end_date
                        else {}
                    ),
                },
            }
        ],
    }

    entries = [
        {"resource": _message_header("priorauth-request", provider_license, f"Claim/{claim_id}")},
        {"resource": claim},
    ]
    if member is not None:
        entries.append({"resource": build_coverage_resource(member, coverage_id=coverage_id, patient_id=patient_id)})

    return {
        "resourceType": "Bundle",
        "id": str(uuid.uuid4()),
        "type": "message",
        "timestamp": _now_iso(),
        "entry": entries,
    }


def _submit_bundle(bundle: dict[str, Any], *, client_id: str, client_secret: str) -> dict[str, Any]:
    """
    Shared transport: real endpoint, real client-credentials headers, same
    TransportError/HTTPStatusError distinction as zatca.py/jofotara.py so
    hybrid_sync_worker.py can queue offline submissions for retry the same
    way it already does for those two.
    """
    if not (client_id and client_secret):
        return {
            "status": "not_submitted",
            "reason": "NPHIES credentials not configured (nphies_client_id/nphies_client_secret "
            "in Regional Compliance & Tax settings). NPHIES also requires mutual-TLS with a "
            "client certificate issued during onboarding, which is not modeled here at all -- "
            "even with client_id/secret configured, a real submission additionally needs that "
            "certificate wired into the HTTP client.",
            "bundle": bundle,
        }

    headers = {
        "Content-Type": "application/fhir+json",
        "Client-Id": client_id,
        "Client-Secret": client_secret,
    }
    try:
        response = httpx.post(NPHIES_PROCESS_MESSAGE_URL, json=bundle, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        return {"status": "submitted", "http_status": response.status_code, "response_bundle": data, "bundle": bundle}
    except httpx.TransportError as exc:
        return {"status": "offline", "error": str(exc), "bundle": bundle}
    except httpx.HTTPStatusError as exc:
        return {"status": "rejected", "error": str(exc), "bundle": bundle}
    except Exception as exc:
        return {"status": "rejected", "error": str(exc), "bundle": bundle}


class NphiesConnectorService:
    """
    Tenant-aware facade sourcing credentials from TenantComplianceSettings,
    matching JoFotaraISTDService/ZatcaFatoorahService's shape.
    """

    def __init__(self, compliance_settings):
        self.settings = compliance_settings  # TenantComplianceSettings instance

    def submit_eligibility(self, eligibility_request) -> dict[str, Any]:
        if not self.settings.nphies_enabled:
            return {"status": "not_submitted", "reason": "NPHIES compliance is not enabled for this tenant."}
        bundle = build_eligibility_bundle(
            eligibility_request, provider_license=self.settings.nphies_provider_license
        )
        client_id = self.settings.nphies_client_id or os.environ.get("NPHIES_CLIENT_ID", "")
        client_secret = self.settings.nphies_client_secret or os.environ.get("NPHIES_CLIENT_SECRET", "")
        return _submit_bundle(bundle, client_id=client_id, client_secret=client_secret)

    def submit_preauth(self, preauthorization) -> dict[str, Any]:
        if not self.settings.nphies_enabled:
            return {"status": "not_submitted", "reason": "NPHIES compliance is not enabled for this tenant."}
        bundle = build_preauth_bundle(
            preauthorization, provider_license=self.settings.nphies_provider_license
        )
        client_id = self.settings.nphies_client_id or os.environ.get("NPHIES_CLIENT_ID", "")
        client_secret = self.settings.nphies_client_secret or os.environ.get("NPHIES_CLIENT_SECRET", "")
        return _submit_bundle(bundle, client_id=client_id, client_secret=client_secret)
