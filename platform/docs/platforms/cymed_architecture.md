# CyMed — Product Architecture

> **Status:** Approved — Program 1, Phase 1.1
> **Owner:** Healthcare Domain Architect
> **Related:** [ADR-0006](../adr/ADR-0006-icd-11-strategy.md), [ADR-0007](../adr/ADR-0007-healthcare-interoperability-strategy.md), [`healthcare/`](../healthcare/)

---

## 1. Mission

**Be CyberCom's hospital management and clinical care system** — running the operations of a hospital and the daily work of clinicians, with FHIR-native data, modern UX, and the safety and audit posture demanded by healthcare.

## 2. Scope

**In scope (clinical & hospital ops)**
- Patient registration, encounter management, scheduling, admission/discharge/transfer (ADT).
- Electronic Health Record (EHR): problems, allergies, vitals, observations, history.
- Computerized Provider Order Entry (CPOE) and Clinical Decision Support hooks (CDS Hooks).
- Electronic Medication Administration Record (eMAR).
- Pharmacy (formulary, dispensing — clinical side; commercial pharmacy belongs to CyShop).
- Laboratory orders & results, microbiology, blood bank.
- Imaging worklists & study referencing (DICOM via CyIntegration Hub).
- Nursing care plans, shift handover, vitals charting.
- Operating room scheduling, perioperative.
- ICU charting (high-frequency observations).
- Maternity, pediatrics, oncology pathways (templated, not separate products).
- Bed management, ward operations, infection control.
- Billing data **production** (claims, charge capture) — invoice/payment **execution** is via CyShop or external payers via CyIntegration Hub.

**Out of scope (delegated)**
- Identity & sign-in → **CyIdentity** (SMART on FHIR for apps).
- External lab / pharmacy / payer / DICOM connectivity → **CyIntegration Hub**.
- Notifications to patients / clinicians → **CyCom**.
- Payments and consumer storefront (e.g. retail pharmacy fulfillment) → **CyShop**.
- AI inference (CDS suggestions, summarization) → **CyAI** (CyMed remains the clinical decision-maker).
- Analytics / public-health reports → **CyData** (Gold + FHIR semantic layer).

## 3. Users

| User class | Examples |
|---|---|
| Clinicians | Physicians, specialists, residents |
| Nurses | Floor, ICU, ED, OR |
| Allied health | Pharmacists, lab techs, radiology techs, therapists |
| Administrative | Registration, scheduling, ward clerks, billers, coders |
| Hospital leadership | Quality, compliance, finance, ops |
| Patients (via apps / portal) | Read access, intake forms, results |
| Public-health partners | Notifiable disease reporting (via CyIntegration Hub) |

## 4. Core Modules

1. **Patient & Encounter** — master patient index (local), encounters, episodes.
2. **EHR Core** — problem list, allergies, vitals, observations, history.
3. **CPOE & CDS Hooks** — orders (med / lab / imaging / referral) with CDS surfaces.
4. **eMAR** — administration recording with barcode / safety checks.
5. **Pharmacy (clinical)** — formulary, dispensing queue.
6. **Lab** — orders, results, microbiology, blood bank.
7. **Imaging** — worklists, study references (no PACS — DICOM via Hub).
8. **Nursing** — care plans, shift handover, vitals.
9. **Scheduling** — clinics, OR, equipment, resources.
10. **Bed & Ward Mgmt** — ADT, bed states, infection control.
11. **Maternity / Peds / Oncology / ICU pathways** — templated clinical workflows.
12. **Charge Capture & Coding** — ICD-11 + local code multi-coding ([ADR-0006](../adr/ADR-0006-icd-11-strategy.md)); produces billing data for CyShop or external payers.
13. **Consent & Purpose-of-Use** — clinical consents; integrated with CyIdentity consent and policy engine.
14. **Audit Pack** — clinical-event auditing on top of platform audit.

## 5. Shared Services Consumed

| Service | Use |
|---|---|
| CyIdentity | Clinician + staff SSO; SMART on FHIR app launch; patient identity |
| CyIntegration Hub | HL7 v2 / DICOM / X12 / NCPDP, public-health reporting, payer connections |
| CyData | Population health, clinical analytics, quality metrics |
| CyAI | CDS suggestions, clinical summarization, coding hints (with SaMD governance) |
| CyCom | Patient/clinician notifications, secure clinician chat, telephony |
| CyShop | Patient billing, payment capture, retail pharmacy fulfillment |
| Platform terminology service | ICD-11, SNOMED CT, LOINC, RxNorm |
| Platform audit / observability / secrets | Standard |

## 6. Owned Data

- **PHI: this product is the source of record for PHI.**
- Patients (local MPI), encounters, episodes.
- Clinical records: problems, allergies, vitals, observations, results.
- Orders (med/lab/imaging/referral), administrations (eMAR).
- Pharmacy dispensing records (clinical inventory).
- Lab results, microbiology, blood bank.
- Imaging metadata (study references; pixel data via Hub/DICOMweb).
- Scheduling and bed-state records.
- Charge capture / coding output for billing.
- Clinical consents, break-the-glass events.

## 7. Consumed Data

- Identity claims and consents from **CyIdentity**.
- Reference terminologies from the platform terminology service.
- Payer eligibility responses (via Hub).
- External lab / imaging / pharmacy data (via Hub) projected into FHIR.

## 8. APIs

- **FHIR R4 REST** (`/fhir/R4/...`) for Patient, Encounter, Observation, Condition, MedicationRequest, MedicationAdministration, Procedure, AllergyIntolerance, Immunization, DiagnosticReport, ServiceRequest, ImagingStudy, Composition, Consent, etc.
- **FHIR Bulk Data ($export)** for analytics and payer transmission via Hub.
- **SMART on FHIR app launch** for clinician/patient apps.
- **Internal admin APIs** (ward management, scheduling) — OpenAPI 3.1.
- **CDS Hooks** endpoints for inbound suggestions from CyAI / partner CDS services.

## 9. Events

Produced (prefix `cybercom.cymed.*`):

- `patient.registered`, `patient.merged`
- `encounter.admitted`, `encounter.discharged`, `encounter.transferred`
- `order.placed`, `order.completed`, `order.cancelled`
- `medication.administered`
- `result.released`
- `appointment.scheduled`, `appointment.cancelled`
- `consent.granted`, `consent.withdrawn`
- `clinical.note.signed`
- `breakglass.invoked`
- `chargecapture.posted`

Consumed:

- `cybercom.cyidentity.account.*` (clinician/patient lifecycle).
- `cybercom.cyshop.payment.posted` (for hospital billing reconciliation).
- Inbound HL7/DICOM/X12 messages projected as `cybercom.hub.healthcare.*` events.

## 10. Integrations

- Labs, payers, pharmacies, imaging systems via **CyIntegration Hub** (HL7 v2, DICOM/DICOMweb, X12, NCPDP, FHIR).
- Public-health reporting (notifiable diseases, immunization registries).
- SMART on FHIR apps (clinician + patient).
- Wearables / patient devices (via Hub or dedicated ingest service).

## 11. Deployment Model

- Tier-1 service; multi-AZ default; multi-region for SaaS production.
- Sovereign on-prem common for hospitals (per [ADR-0008](../adr/ADR-0008-saas-deployment-strategy.md)); offline-tolerant clinical surfaces for poor-network sites.
- Per-tenant CMK (BYOK) for regulated tenants.
- Backups: PITR ≤ 5 min RPO; restore drill quarterly.
- DR: cross-region replication for multi-tenant SaaS; on-prem uses local backup + immutable cold copy.

## 12. Security Requirements

- All clinical access logged with `purpose_of_use`.
- Break-the-glass (emergency access) explicit, time-boxed, audited, post-reviewed within 24 h.
- Field-level encryption for highest-class data (national ID, MRN, payment instruments).
- PHI never leaves the regulated boundary except under BAA + ADR-approved data-flow (especially toward CyAI vendors).
- HIPAA / national-MOH controls; FDA SaMD pathway for any clinical decision-support feature.
- Cross-tenant isolation enforced at app + DB (RLS) + infra layers; per-tenant residency.

## 13. Component Diagram

```mermaid
flowchart TB
  subgraph CYMED[CyMed]
    PE[Patient & Encounter]
    EHR[EHR Core]
    CPOE[CPOE + CDS Hooks]
    EMAR[eMAR]
    PHARM[Pharmacy (clinical)]
    LAB[Lab]
    IMG[Imaging worklists]
    NUR[Nursing]
    SCH[Scheduling]
    BED[Bed & Ward]
    PATHS[Maternity/Peds/Onc/ICU]
    CC[Charge Capture + Coding]
    CON[Consent & PoU]
  end

  CLIN[Clinicians · Nurses] --> CYMED
  PAT[Patients] -- via app --> CYMED
  CYMED --> ID[CyIdentity]
  CYMED -- FHIR / HL7v2 / DICOM --> HUB[CyIntegration Hub]
  CYMED -- billing data --> SHOP[CyShop]
  CYMED -- notifications --> COM[CyCom]
  CYMED -- inference --> AI[CyAI]
  CYMED -. events .-> DATA[CyData]
  CYMED --> AUDIT[(Platform Audit)]
```
