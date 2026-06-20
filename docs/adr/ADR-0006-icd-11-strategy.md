# ADR-0006: ICD-11 Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Software Architect, Compliance Architect, Healthcare Domain Architect |
| **Affects** | CyMed; CyData (analytics); CyGov (public-health reporting) |
| **Tags** | healthcare, terminology, interoperability, compliance |
| **Related** | [ADR-0007 Healthcare Interoperability Strategy](ADR-0007-healthcare-interoperability-strategy.md) |

---

## 1. Context

Diagnosis coding is foundational for clinical documentation, billing, public-health reporting, and analytics. WHO's **ICD-11** is the current global standard, with mature multilingual support, a linearization for mortality and morbidity, foundation/extension codes, and post-coordination. ICD-10 / ICD-10-AM / ICD-10-CM remain in active use in many jurisdictions.

## 2. Problem Statement

Which terminology version(s) does CyberCom adopt for diagnosis coding, and how do we handle legacy/local code systems?

## 3. Decision Drivers

- Long-term global alignment (WHO direction).
- Multilingual support (CyberCom targets multiple languages including Arabic, French, Spanish).
- National regulations and payer systems still requiring ICD-10 variants.
- Need for analytics across mixed code systems.
- Healthcare interoperability (FHIR R4 has ICD-11 CodeSystem support).

## 4. Considered Options

1. **ICD-11 as primary, multi-coding with ICD-10 variants where required, with bi-directional mapping** (chosen).
2. ICD-10 primary, defer ICD-11.
3. ICD-11 only, no legacy.

## 5. Decision

- **Primary terminology:** **ICD-11** (Mortality and Morbidity Statistics linearization, MMS).
- **Multi-coding supported:** ICD-11 + locally-mandated code system (e.g. ICD-10-CM in the US, ICD-10-AM in AU/NZ, country-specific) on the same encounter.
- **Mapping:** maintain bi-directional maps (ICD-11 ⇄ ICD-10/-CM/-AM) via WHO/national mapping tables, exposed as a terminology service.
- **Storage:** code, code-system URI, version, display, language; post-coordination expressions stored in canonical form.
- **APIs:** FHIR `Condition`, `Observation`, `Procedure` resources carry `CodeableConcept` with multiple `coding` entries.
- **UI:** clinicians code in their preferred system; UI shows ICD-11 and the locally-required code.
- **Terminology service:** central, versioned; exposes lookup, validate-code, translate, $expand operations (FHIR Terminology Service compatible).
- **Updates:** track WHO ICD-11 release cadence; controlled rollouts with deprecation windows.

## 6. Rationale

- ICD-11 is the long-term destination; building on it now avoids re-platforming later.
- Multi-coding accommodates real-world reimbursement and reporting needs without forcing a switch.
- A central terminology service prevents inconsistent code handling across products.

## 7. Consequences

### 7.1 Positive
- Future-proof; multilingual; public-health-ready.
- Cleaner analytics with canonical ICD-11 layer.

### 7.2 Trade-offs
- Mapping maintenance is real ops work; quality varies by jurisdiction.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Mapping gaps cause billing/reporting errors | Medium | High | Adopt official maps + tenant-specific overrides with review; reconciliation reports |
| 2 | Clinician resistance to ICD-11 | Medium | Medium | Show both codes; smart-search; training assets |
| 3 | Terminology service downtime blocks coding | Low | High | Cache + edge replicas; offline lookup in mobile |

## 8. Compliance & Security Impact

- Aligns with WHO recommendations and emerging national mandates.
- No PHI handled by terminology service (codes only); standard authN/Z still applies.

## 9. Alternatives Rejected

- **ICD-10 primary** — short-term simpler, long-term migration debt.
- **ICD-11 only** — incompatible with current reimbursement requirements in major markets.

## 10. References

- WHO ICD-11 (MMS) Reference Guide
- HL7 FHIR R4 Terminology Module
- WHO ICD-10 / ICD-11 mapping tables

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Healthcare Domain Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
