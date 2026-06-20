# ADR-0007: Healthcare Interoperability Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Healthcare Domain Architect, Chief Software Architect, Compliance Architect |
| **Affects** | CyMed; CyIntegration Hub; partner integrations |
| **Tags** | healthcare, interoperability, FHIR, HL7, DICOM |
| **Related** | [ADR-0006](ADR-0006-icd-11-strategy.md), [ADR-0003](ADR-0003-api-strategy.md), [ADR-0004](ADR-0004-event-driven-architecture-strategy.md) |

---

## 1. Context

CyMed will exchange data with EHRs, labs, pharmacies, imaging systems, payers, public health agencies, and patient apps. Healthcare interoperability is governed by mature standards (HL7, IHE) and increasingly by FHIR-based regulation (US ONC, EU EHDS, national MOH frameworks).

## 2. Problem Statement

What is CyberCom's healthcare interoperability strategy — standards, profiles, integration patterns, and governance?

## 3. Decision Drivers

- Regulatory direction toward FHIR R4.
- Need to interoperate with legacy HL7 v2 and DICOM endpoints.
- Patient access / SMART on FHIR expectations.
- Public-health reporting (notifiable diseases, immunizations).
- Multi-country deployments with different national IGs.

## 4. Considered Options

1. **FHIR R4 as canonical model + HL7 v2 / CDA / DICOM bridged via CyIntegration Hub** (chosen).
2. HL7 v2 primary, FHIR optional.
3. Proprietary internal model + per-partner adapters.

## 5. Decision

- **Canonical model:** **HL7 FHIR R4** (track FHIR R5 readiness).
- **Profiles:** start with **US Core / International Patient Summary (IPS)** as foundational baselines; adopt national IGs per deployment (e.g. UK Core, AU Base, MOH-specific IGs).
- **Terminologies:** ICD-11 (per [ADR-0006](ADR-0006-icd-11-strategy.md)), SNOMED CT (where licensed), LOINC, RxNorm / national drug codes, UCUM units.
- **APIs:**
  - **External:** FHIR REST API (`/fhir/R4/...`) with OAuth 2.1 + **SMART on FHIR** for patient/clinician apps.
  - **Bulk:** **FHIR Bulk Data Access** ($export) for analytics and payer transmission.
  - **Subscriptions:** FHIR Subscription / Subscription-Notifications for event-driven partners.
- **Legacy bridging via CyIntegration Hub:**
  - **HL7 v2.x** (MLLP) inbound/outbound with v2 ⇄ FHIR mapping.
  - **CDA / CCDA** import/export.
  - **DICOM / DICOMweb** for imaging (QIDO-RS, WADO-RS, STOW-RS) with FHIR `ImagingStudy` references.
  - **X12 / NCPDP** for claims and pharmacy (US) where required.
- **IHE profiles** adopted where relevant: PIX/PDQ, XDS.b/MHD (document sharing), ATNA (audit), PIXm/PDQm/MHD for FHIR.
- **Identity:** patient identity reconciliation via EMPI; provider via national directories where available.
- **Consent & privacy:** FHIR `Consent` resource; purpose-of-use enforced via policy engine (see [ADR-0005](ADR-0005-identity-access-management-strategy.md)).
- **Validation:** every FHIR resource validated against profile; CI checks for IG conformance.
- **Versioning:** profiles versioned; deprecation windows mirror [`api_standards`](../standards/api_standards.md).

## 6. Rationale

- FHIR is the regulatory direction and the most ergonomic for modern apps.
- A canonical FHIR model + integration hub keeps CyMed clean while still meeting partners on their terms.
- IHE profiles cover the harder cross-enterprise patterns FHIR alone doesn't fully solve.

## 7. Consequences

### 7.1 Positive
- Future-proof; aligns with national programs and patient-access regulation.
- Bulk export and subscriptions enable analytics and event-driven partners.

### 7.2 Trade-offs
- Profile + IG management is real ongoing work.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | National IG fragmentation | High | Medium | Per-deployment IG packs; conformance test harness |
| 2 | Performance on large bulk exports | Medium | Medium | NDJSON streaming + paged $export; off-peak scheduling |
| 3 | SMART app threat model | Medium | High | Strict scopes, redirect URI allowlist, app registration review |
| 4 | Legacy v2 brittleness | High | Medium | Hub abstraction; integration tests with vendor sample messages |

## 8. Compliance & Security Impact

- Aligns with HIPAA, EU EHDS direction, ONC certification expectations.
- ATNA-aligned audit; consent-aware access.
- All inbound/outbound flows logged to audit per [`audit_logging_strategy`](../security/audit_logging_strategy.md).

## 9. Alternatives Rejected

- **HL7 v2 primary** — incompatible with patient-access and modern app expectations.
- **Proprietary internal model** — re-creates 20 years of standards; raises every integration cost.

## 10. References

- HL7 FHIR R4 specification; US Core; IPS
- IHE Technical Frameworks
- DICOMweb (QIDO/WADO/STOW)
- SMART on FHIR
- FHIR Bulk Data Access

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Healthcare Domain Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
