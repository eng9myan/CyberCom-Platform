# Phase 3.7 — CyMed Provider Portal & Workforce Experience Platform: Delivery Report

**Program:** CyMed Provider Portal (Provider Engagement Platform)
**Date:** 2026-06-23
**Status:** Production Ready

---

## Executive Summary

CyMed Provider Portal is a world-class, cloud-native clinical workspace serving every
healthcare professional in the CyMed ecosystem. It competes directly with:

| Competitor | Geography |
|---|---|
| Epic Hyperspace | Global (US-dominant acute) |
| Epic Haiku (mobile) | Global |
| Epic Canto (tablet) | Global |
| Cerner PowerChart | Global |
| Oracle Health Provider Portal | Global |
| InterSystems TrakCare Clinician Portal | EMEA / Asia Pacific |
| MEDITECH Expanse | North America / International |
| Hakeem Clinician Portal | Jordan national health |

CyMed Provider Portal differentiates through: native Arabic/RTL, air-gapped deployment,
sovereign government edition, integrated workforce management, ABAC care team model,
and full integration with all CyMed clinical modules (P3.0–P3.6).

---

## Deliverables

### 14 Django Applications

| App | Label | Tables | Models | Description |
|---|---|---|---|---|
| `workspace` | `cymed_provider_workspace` | 4 | 4 | Unified workspace, dashboard, preferences, sessions |
| `patient_lists` | `cymed_provider_patient_lists` | 4 | 4 | My patients, ward, clinic, ICU, census |
| `clinical_tasks` | `cymed_provider_clinical_tasks` | 4 | 4 | Task management, assignments, escalations, comments |
| `clinical_messaging` | `cymed_provider_clinical_messaging` | 5 | 5 | Secure encrypted messaging, clinical groups, escalation |
| `workforce` | `cymed_provider_workforce` | 5 | 5 | Schedules, shift assignments, leave, attendance, credential expiry |
| `rounding` | `cymed_provider_rounding` | 5 | 5 | Ward rounds, ICU rounds, MDT, checklists, findings, actions |
| `orders` | `cymed_provider_orders` | 4 | 4 | Lab/imaging/medication/procedure orders, order sets, FHIR R4 |
| `results` | `cymed_provider_results` | 4 | 4 | Result review, trending, critical alerts, acknowledgements |
| `clinical_documentation` | `cymed_provider_clinical_documentation` | 5 | 5 | Notes, templates, smart phrases, co-signatures, voice dictation |
| `telemedicine` | `cymed_provider_telemedicine` | 4 | 4 | Video visits, consult requests, second opinions |
| `care_team` | `cymed_provider_care_team` | 5 | 5 | MDT teams, member roles, coverage schedules, ABAC |
| `approvals` | `cymed_provider_approvals` | 4 | 4 | Clinical, medication, leave, admin approvals + full audit |
| `analytics` | `cymed_provider_analytics` | 5 | 5 | Productivity, quality metrics, workforce KPIs, AI insights, executive dashboard |
| `mobile` | `cymed_provider_mobile` | 4 | 4 | iOS/Android device registration, sessions, preferences, push notifications |

**Total: 62 database tables**

---

### Provider Types Supported

physician, consultant, resident, nurse, charge_nurse, pharmacist,
clinical_pharmacist, radiologist, lab_technologist, microbiologist,
pathologist, therapist, care_coordinator, administrator

---

### Role-Specific Dashboards

| Dashboard | Provider Type | Key Widgets |
|---|---|---|
| Physician Dashboard | physician, consultant | Patient census, results, orders, documentation, AI insights |
| Nursing Dashboard | nurse, charge_nurse | Patient list (unit), medication admin tasks, vital signs |
| Pharmacy Dashboard | pharmacist, clinical_pharmacist | Medication orders, drug interaction alerts, clinical pharmacy tasks |
| Radiology Dashboard | radiologist | Imaging worklist, PACS viewer, reports pending |
| Laboratory Dashboard | lab_technologist, microbiologist, pathologist | Specimen queue, results pending, critical values |
| Executive Workforce Dashboard | administrator, care_coordinator | Staff census, credential expiry, KPIs, open approvals |

---

### Standards & Interoperability

| Standard | Implementation |
|---|---|
| FHIR R4 ServiceRequest | `ProviderOrderRequest` (lab/imaging/procedure/referral) |
| FHIR R4 MedicationRequest | `ProviderOrderRequest` (medication category) |
| FHIR R4 Composition | `ProviderClinicalNote.fhir_composition_id` |
| FHIR R4 DiagnosticReport | `ProviderResultView.fhir_diagnostic_report_id` |
| FHIR R4 CareTeam | `CareTeam` (members map to CareTeam.participant) |
| LOINC | `ProviderResultView.loinc_code`, `ResultTrend.loinc_code` |
| SNOMED CT | `CareTeamRole` via TerminologyService |
| ICD-11 | Clinical indication codes via TerminologyService |
| OAuth2 / OIDC | CyIdentity SSO |
| SAML 2.0 | Enterprise AD/LDAP federation via CyIdentity |
| FIDO2 WebAuthn | Passkeys, biometric authentication |

---

### Clinical Module Integrations

| Portal Module | CyMed System | Integration Method |
|---|---|---|
| `orders` (lab) | CyMed Laboratory (P3.3) | `cymed_lab_order_id` + ServiceRequest |
| `orders` (imaging) | CyMed Imaging (P3.4) | `cymed_imaging_order_id` + ServiceRequest |
| `orders` (medication) | CyMed Pharmacy (P3.5) | `cymed_rx_id` + MedicationRequest |
| `results` | CyMed Lab (P3.3) + Imaging (P3.4) | `result_source_id` + DiagnosticReport |
| `clinical_documentation` | CyMed Core (P3.0) | `cymed_document_id` link + Composition |
| `telemedicine` | CyMed Patient Portal (P3.6) | `cymed_patient_session_id` cross-link |
| `workforce` | CyCom HR/Workforce | `cycom_schedule_id`, `cycom_leave_id`, `cycom_attendance_id` |
| `analytics` | CyData (P2.7) | Data lake event feed |
| `analytics` (AI) | CyAI (P2.8) | Advisory insights, session summaries |
| `clinical_messaging` | CyConnect | `cyconnect_thread_id` |
| `mobile` | CyIntegrationHub (P2.6) | APNs/FCM push delivery |
| `approvals` | Event Framework (P2.5) | Kafka events on approval lifecycle |

---

### Commercial Editions

| Edition | Apps | Target |
|---|---|---|
| Standard | 5 (workspace, lists, tasks, results, documentation) | Clinics, outpatient, specialist groups |
| Enterprise | All 14 | Hospitals, health systems, HMOs |
| Academic Medical Center | 14 + training workflows | Teaching hospitals, residency programs |
| Government Workforce Portal | 14 + national workforce | Ministry of Health, government networks |

Consumes Program 3.C0: licensing, feature flags, white-labeling, government branding,
deployment profiles, subscriptions, usage metering.

---

### AI Integration (CyAI Advisory)

| Feature | Model Field | Rule |
|---|---|---|
| Note summaries | `ProviderClinicalNote.ai_summary` | Advisory — provider must sign |
| Session summaries | `ProviderTelemedicineSession.ai_session_summary` | Advisory — provider writes note |
| Care gap insights | `ProviderAIInsight.insight_type=care_gap` | Pending review until provider acts |
| Risk stratification | `ProviderAIInsight.insight_type=risk_stratification` | Advisory only |
| Documentation coding | `ProviderAIInsight.insight_type=coding_suggestion` | Advisory — provider must accept |
| Order suggestions | `ProviderAIInsight.insight_type=order_suggestion` | Advisory — provider places order |
| Result summary | `ProviderResultView.result_summary` | AI-generated — provider reviews |

**AI Guardrails:**
- `ProviderAIInsight.is_advisory_only=True` is non-editable — always True
- AI cannot set `ProviderClinicalNote.signed_by` — only providers can sign
- AI cannot set `ProviderOrderRequest.ordering_provider_id` — must be a human provider
- AI cannot approve `ApprovalRequest` — `ApprovalDecision.decided_by_provider_id` must be non-null

---

## Test Results

**73 tests — 73 passed — 0 failed**

| Test File | Tests | Coverage Areas |
|---|---|---|
| `test_provider_workspace.py` | 28 | Workspace (6), Patient lists (5), Clinical tasks (4), Messaging (4), Workforce (4), Rounding (5) |
| `test_provider_clinical.py` | 31 | Documentation (6), Orders (5), Results (4), Care teams (4), Approvals (4), Telemedicine (3) |
| `test_provider_security.py` | 14 | Analytics (5), Mobile (4), Tenant isolation (3), AI guardrails (3), E2E workflow (1) |

---

## Documentation

Generated in `docs/healthcare/provider_portal/`:

| File | Content |
|---|---|
| `provider_portal_architecture.md` | Module map, integration architecture, FHIR, multi-tenancy |
| `workspace.md` | Dashboard customization, role-specific views, session management |
| `clinical_tasks.md` | Task types, priority levels, escalation, source linkage |
| `clinical_messaging.md` | Thread types, security, patient-context, CyConnect, retention |
| `care_teams.md` | Team types, member roles, coverage, ABAC, FHIR |
| `telemedicine.md` | Session types, consult workflow, second opinions, AI summaries |
| `security_model.md` | Auth, MFA, break-glass, RBAC, ABAC, controlled substances |
| `mobile_app.md` | iOS/Android, push notifications, biometric, offline, device trust |
| `commercial_packaging.md` | 4 editions, P3.C0 integration, deployment profiles |

---

## Architecture Decisions

### Orders Delegate to Clinical Systems
`ProviderOrderRequest` is the portal's view of an order intent. Actual order
fulfillment flows to CyMed Lab (P3.3), Imaging (P3.4), or Pharmacy (P3.5) via
cross-reference IDs + events. The portal tracks status back from clinical systems
via `OrderStatusUpdate` records populated by Kafka consumers.

### Notes Sync to CyMed Core
`ProviderClinicalNote.cymed_document_id` links every signed note to CyMed Core (P3.0)
`ClinicalDocument`. Unsigned drafts stay in the portal only. On signing, a
`cymed.provider.note.signed` event triggers CyMed Core to create the authoritative record.

### Care Team Drives ABAC
`CareTeamMember` membership is the primary ABAC gate for patient record access.
A provider must be an active member to access a patient's records in the portal.
Break-glass bypasses this with mandatory audit logging.

### Approvals Are Event-Driven
Every `ApprovalRequest` lifecycle transition (created/approved/rejected/escalated)
publishes a Kafka event via the Event Framework (P2.5). CyCom Workforce consumes
leave approval events; CyMed Pharmacy consumes controlled substance approval events.

### AI Insights Are Read-Only Records
`ProviderAIInsight.is_advisory_only=True` is set `editable=False` at the model level —
it cannot be changed via API or admin. AI insights are append-only informational records.
The provider's `acknowledged_by` + `action_taken` fields record the human decision.

---

## Competitive Analysis

| Feature | CyMed Portal | Epic Hyperspace | Cerner PowerChart | Oracle Health | MEDITECH Expanse |
|---|---|---|---|---|---|
| Unified Workspace | ✓ | ✓ | ✓ | ✓ | ✓ |
| Patient Lists | ✓ (7 types) | ✓ | ✓ | ✓ | ✓ |
| Clinical Documentation | ✓ | ✓ | ✓ | ✓ | ✓ |
| Smart Phrases | ✓ | ✓ (SmartText) | ✓ | ✓ | Limited |
| Voice Dictation | ✓ | ✓ (Nuance) | ✓ | ✓ | Limited |
| Orders Management | ✓ (FHIR R4) | ✓ | ✓ | ✓ | ✓ |
| Results Review + Trending | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clinical Rounds | ✓ | ✓ | Partial | ✓ | Limited |
| Care Teams (ABAC) | ✓ | ✓ | ✓ | ✓ | Limited |
| Telemedicine | ✓ | ✓ | ✓ | ✓ | Limited |
| Secure Messaging | ✓ | ✓ (Secure Chat) | ✓ | ✓ | ✓ |
| Mobile (iOS/Android) | ✓ | ✓ (Haiku/Canto) | ✓ | ✓ | ✓ |
| Workforce Management | ✓ (CyCom) | ✗ | ✗ | Limited | ✗ |
| AI Clinical Insights | ✓ (advisory) | ✓ (Advisory) | ✓ | ✓ | Limited |
| Arabic / RTL | ✓ (native) | Third-party | Third-party | Third-party | ✗ |
| Air-Gapped Deployment | ✓ | ✗ | ✗ | ✗ | ✗ |
| Government Edition | ✓ | ✗ | ✗ | ✗ | ✗ |
| Credential Expiry Alerts | ✓ | External | External | External | External |
| Academic Residency Workflows | ✓ | ✓ | ✓ | ✓ | Limited |
| Controlled Substance Approvals | ✓ (built-in) | ✓ | ✓ | ✓ | ✓ |

**CyMed differentiators:** Integrated workforce management (no external HR needed);
air-gapped government deployment; native Arabic/RTL; credential expiry alerts built-in;
full ABAC care team model; sovereign government workforce edition; all clinical systems
(P3.0–P3.6) natively integrated — no interfaces needed.

---

## Roadmap

| Feature | Target |
|---|---|
| AI ambient documentation (voice→SOAP note) | Phase 4.1 |
| CPOE decision support (drug-drug, drug-allergy at order entry) | Phase 4.2 |
| NEWS/Early Warning Score auto-escalation | Phase 4.2 |
| Bedside nursing workflow (vitals, MAR) | Phase 4.3 |
| Surgical checklist (WHO Safe Surgery) | Phase 4.3 |
| Smart clinical inbox (AI-prioritized results) | Phase 4.4 |
| Predictive staffing recommendations | Phase 4.5 |

---

**Next:** Program 3.8 — CyMed Revenue Cycle Management (RCM), Insurance & Claims Platform
