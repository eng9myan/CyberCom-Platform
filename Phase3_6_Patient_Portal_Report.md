# Phase 3.6 — CyMed Patient Portal & Digital Health Experience Platform: Delivery Report

**Program:** CyMed Patient Portal (Patient Engagement Platform)
**Date:** 2026-06-23
**Status:** Production Ready

---

## Executive Summary

CyMed Patient Portal is a world-class, cloud-native patient engagement platform
serving as the unified digital front door for the entire CyMed healthcare ecosystem.
It competes directly with:

| Competitor | Geography |
|---|---|
| Epic MyChart | Global (US-dominant) |
| Cerner HealtheLife (Oracle Health) | Global |
| InterSystems Personal Community | Global |
| Mayo Clinic / Cleveland Clinic Patient Portals | US premium health systems |
| NHS App | United Kingdom national |
| Seha UAE App | UAE national health |
| Hakeem Patient Portal | Jordan national health |
| MOH Mawid / Nphies | Saudi Arabia national |

CyMed Patient Portal delivers a superior experience through integrated telemedicine,
digital wallet, health journey mapping, AI-assisted explanations, and a multi-edition
commercial structure supporting clinic, hospital, government, and national deployments.

---

## Deliverables

### 16 Django Applications

| App | Label | Tables | Models | Description |
|---|---|---|---|---|
| `accounts` | `cymed_portal_accounts` | 5 | 5 | Account registration, profile, preferences, security, device management |
| `directory` | `cymed_portal_directory` | 7 | 7 | Hospital, clinic, lab, imaging, pharmacy listings + specialty catalog + reviews |
| `appointments` | `cymed_portal_appointments` | 4 | 4 | Booking requests, waitlist, reminders, post-visit ratings |
| `telemedicine` | `cymed_portal_telemedicine` | 4 | 4 | Video/audio/chat sessions, documents, in-session chat, ratings |
| `medical_records` | `cymed_portal_medical_records` | 4 | 4 | Record access audit, secure sharing, download history, patient documents |
| `laboratory_results` | `cymed_portal_laboratory_results` | 4 | 4 | Lab result views, trend data, critical result acknowledgement, share links |
| `imaging_results` | `cymed_portal_imaging_results` | 4 | 4 | Radiology reports, DICOM series metadata, access log, share links |
| `prescriptions` | `cymed_portal_prescriptions` | 4 | 4 | Prescription views, refill requests, medication instructions, adherence log |
| `payments` | `cymed_portal_payments` | 4 | 4 | Invoices, payment transactions, payment methods, installment plans |
| `insurance` | `cymed_portal_insurance` | 4 | 4 | Insurance cards, coverage verification, preauthorizations, claim status |
| `messaging` | `cymed_portal_messaging` | 4 | 4 | Secure message threads, messages, attachments, recipients |
| `notifications` | `cymed_portal_notifications` | 4 | 4 | Push/email/SMS notifications, preferences, templates, subscriptions |
| `family_accounts` | `cymed_portal_family_accounts` | 4 | 4 | Family groups, members, ABAC permissions, dependent profiles |
| `consents` | `cymed_portal_consents` | 4 | 4 | Consent types, records, requests, immutable history |
| `wallet` | `cymed_portal_wallet` | 4 | 4 | Health wallet, digital cards, health passes, vaccination records |
| `health_journey` | `cymed_portal_health_journey` | 5 | 5 | Timeline, events, patient journey, milestones, care episodes |

**Total: 69 database tables**

---

### Provider Network Directory

| Provider Type | Listing Model | Search Dimensions |
|---|---|---|
| Hospital | `HospitalListing` | City, country, specialty, insurance, accreditation |
| Clinic | `ClinicListing` | Specialty (20+ types), city, telemedicine availability |
| Laboratory | `LaboratoryListing` | City, home collection, accreditation, turnaround time |
| Imaging Center | `ImagingCenterListing` | City, modality (MRI/CT/X-Ray/Ultrasound/PET) |
| Pharmacy | `PharmacyListing` | City, 24-hour, home delivery |

**Clinic Specialties Catalog:** Cardiology, Dermatology, Orthopedics, Pediatrics, Neurology,
ENT, Ophthalmology, Internal Medicine, Family Medicine, Psychiatry, Gynecology, Urology,
Endocrinology, Oncology, Pulmonology, Gastroenterology, Rheumatology, Nephrology,
Hematology, Infectious Disease — all with SNOMED codes via TerminologyService.

---

### Standards & Interoperability

| Standard | Implementation |
|---|---|
| FHIR R4 DiagnosticReport | `LabResultView.fhir_diagnostic_report_id`, `ImagingResultView.fhir_diagnostic_report_id` |
| FHIR R4 ImagingStudy | `ImagingResultView.fhir_imaging_study_id` |
| FHIR R4 MedicationRequest | `PortalPrescriptionView.fhir_medication_request_id` |
| FHIR R4 Immunization | `VaccinationRecord.fhir_immunization_id` |
| FHIR R4 Bundle | `PortalConsentRecord.fhir_bundle_id` (via CyMed Core) |
| LOINC | `LabResultView.loinc_code`, `LabResultTrend.loinc_code` |
| CVX (vaccine codes) | `VaccinationRecord.cvx_code` — CDC standard |
| NDC | `VaccinationRecord.lot_number` traceability |
| SNOMED CT | `ClinicSpecialty.snomed_code`, diagnosis codes via TerminologyService |
| ICD-11 | `PatientJourney.icd11_code`, `CareEpisode.icd11_code` |
| NCC MERP | (via CyMed Pharmacy) `MedicationAdherenceLog` links |
| PKPASS / Google Wallet | `DigitalCard` pass format support |
| FIDO2 WebAuthn | `PatientSecuritySettings.passkey_enabled` |
| OAuth2 / OIDC | CyIdentity authentication |

---

### Clinical System Integrations

| Portal Module | CyMed System | Integration Method |
|---|---|---|
| `appointments` | CyMed Clinic (P3.1), Hospital (P3.2) | `cymed_appointment_id` FK + events |
| `telemedicine` | CyMed Clinic telemedicine (P3.1) | `cymed_telemedicine_id` + CyIntegrationHub |
| `laboratory_results` | CyMed Laboratory (P3.3) | `cymed_lab_result_id` + result feed events |
| `imaging_results` | CyMed Imaging (P3.4) | `cymed_imaging_result_id` + FHIR IDs |
| `prescriptions` | CyMed Pharmacy (P3.5) | `cymed_prescription_id` + `cymed_dispense_id` |
| `payments` | CyCom Finance | `cycom_invoice_id` + `cycom_transaction_id` |
| `insurance` | CyIntegrationHub (payer APIs) | Coverage verification via Hub |
| `messaging` | CyConnect | `cyconnect_thread_id` |
| `medical_records` | CyMed Core (P3.0) | API reads, access audited locally |
| `notifications` | Event Framework (P2.5) | Kafka consumer → PatientNotification |
| `wallet` | TerminologyService | CVX codes; CyMed Core immunizations |

---

### Commercial Editions

| Edition | Modules | Target |
|---|---|---|
| Standard | 9 | Clinics, outpatient, retail pharmacy |
| Enterprise | 16 (all) | Hospital systems, HMOs |
| Government | 16 + national features | Ministry of Health, public hospitals |
| National Digital Health Portal | 16 + national + federated | National health transformation programs |

Consumes Program 3.C0: licensing, feature flags, white-labeling, government branding,
deployment profiles, subscriptions, usage metering.

---

### AI Integration (CyAI Advisory)

| Feature | Model Field | Human Control |
|---|---|---|
| Medication explanations | `MedicationInstruction.ai_explanation` | Patient reads only; pharmacist wrote instruction |
| Polypharmacy summaries | `HealthTimeline` event grouping | Patient controls timeline view |
| Visit summaries | Available via `CareEpisode.discharge_summary` | Clinician authored; AI cannot alter |
| Health reminders | `PatientNotification.notification_type=health_reminder` | Patient controls via NotificationPreference |

**AI Guardrails:**
- AI cannot create prescriptions — `PortalPrescriptionView` is populated from CyMed Pharmacy only
- AI cannot alter medical records — `MedicalRecordAccess` requires a human `account_id`
- AI cannot diagnose — `PatientJourney.primary_diagnosis` requires ICD-11 code from clinical encounter

---

## Test Results

**64 tests — 64 passed — 0 failed**

| Test File | Tests | Coverage |
|---|---|---|
| `test_portal_core.py` | 28 | Accounts (6), Directory (7), Family accounts (4), Consents (4), Appointments (4), Telemedicine (4), Medical records (4) |
| `test_portal_clinical.py` | 24 | Lab results (5), Imaging results (4), Prescriptions (4), Health journey (5), Payments (4), Insurance (4), Digital wallet (4) |
| `test_portal_security.py` | 12 | Messaging (4), Notifications (5), Tenant isolation (3), FHIR linking (4), AI guardrails (2), E2E workflow (1) |

---

## Documentation

Generated in `docs/healthcare/patient_portal/`:

| File | Content |
|---|---|
| `patient_portal_architecture.md` | Module map, integration architecture, multi-tenancy, security overview |
| `provider_directory.md` | Network directory, all 5 provider types, specialty catalog, search/discovery |
| `appointments.md` | Request flow, waitlist, reminders, ratings, clinical integration |
| `telemedicine.md` | Session lifecycle, document sharing, secure chat, quality metrics |
| `medical_records.md` | Record types, access audit, sharing controls, privacy |
| `digital_wallet.md` | HealthWallet, DigitalCard, HealthPass, VaccinationRecord, national IDs |
| `security_model.md` | Auth, MFA, passkeys, biometric, ABAC, consent framework, audit |
| `mobile_app.md` | iOS/Android, device registration, biometric login, push, offline, quiet hours |
| `commercial_packaging.md` | 4 editions, P3.C0 integration, deployment profiles |

---

## Architecture Decisions

### Portal Does Not Duplicate Clinical Records
`laboratory_results`, `imaging_results`, `prescriptions`, and `medical_records` apps
store **view metadata and portal state only** — not clinical data. All clinical reads
proxy to CyMed Core/Lab/Imaging/Pharmacy. This eliminates data drift and ensures
the portal always shows current clinical data.

### AI is Informational Only
`MedicationInstruction.ai_explanation` is the only AI output field in the portal.
It provides patient-friendly plain-language drug explanations. The portal cannot
invoke AI to create records, change statuses, or alter clinical data.

### Family Access via ABAC
`FamilyAccessPermission` implements attribute-based access control:
- `access_level` provides coarse control (view_only / full_access)
- `permissions` JSONField provides fine-grained module-level control
- `valid_from` / `valid_until` enforces time-bounded access
- `revoked_at` enables instant revocation

### Event-Driven Notification Architecture
`PatientNotification` records are created by Kafka consumers (Event Framework P2.5).
Clinical events (lab ready, prescription dispensed, appointment confirmed) publish
to topics. Portal notification workers consume and create notifications.
`PushSubscription` links to device tokens for final delivery.

### Digital Wallet Sovereignty
`DigitalCard.card_type=government_health_id` + `HealthPass` enable national health
credential portability. QR codes work offline. `HealthPass.qr_code_data` stores
digitally signed payloads verifiable without internet access — meeting sovereignty
requirements for air-gapped and low-connectivity environments.

### Shared Record Security
`SharedRecord.share_token` is a cryptographically generated token — not a UUID.
Access is counted (`access_count`), expiry enforced (`valid_until`), and revocable
(`is_revoked`). No unauthenticated user can enumerate records by guessing IDs.

---

## Competitive Analysis

| Feature | CyMed Portal | Epic MyChart | Cerner HealtheLife | NHS App | Seha UAE |
|---|---|---|---|---|---|
| Appointments | ✓ | ✓ | ✓ | ✓ | ✓ |
| Telemedicine | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lab Results + Trends | ✓ | ✓ | ✓ | ✓ | Partial |
| Imaging Reports | ✓ | ✓ | ✓ | Limited | Limited |
| Pharmacy / Refills | ✓ | ✓ | ✓ | ✗ | ✓ |
| Digital Wallet | ✓ | Limited | ✗ | ✓ (NHS) | ✓ |
| Vaccination Records | ✓ (FHIR R4) | ✓ | ✓ | ✓ | ✓ |
| Family Accounts | ✓ (ABAC) | ✓ | ✓ | Limited | Limited |
| Health Journey Timeline | ✓ | ✓ | Partial | ✗ | ✗ |
| Insurance / Claims | ✓ | ✓ | ✓ | ✗ (NHS) | ✓ |
| Installment Payments | ✓ | ✗ | ✗ | ✗ | ✗ |
| National Health ID | ✓ | ✗ | ✗ | ✓ | ✓ |
| Arabic / RTL | ✓ (native) | Third-party | Third-party | ✗ | ✓ |
| Air-Gapped Deployment | ✓ | ✗ | ✗ | ✗ | ✗ |
| Open API (REST + FHIR) | ✓ | Limited | ✓ | ✓ | Limited |
| Government Edition | ✓ | ✗ | ✗ | ✓ (UK only) | ✓ (UAE only) |

**CyMed differentiators:** Installment payment plans; air-gapped deployment; native
Arabic/RTL across all models; health journey care episodes; government health ID wallet;
full ABAC family access; sovereign-ready national health portal edition.

---

## Roadmap

| Feature | Target |
|---|---|
| Patient-generated health data (wearables, glucose monitors) | Phase 4.1 |
| AI-powered appointment recommendations (CyAI) | Phase 4.1 |
| FHIR R4 patient data export (bulk) | Phase 4.2 |
| Social health features (anonymous community support) | Phase 4.3 |
| Chronic disease management programs | Phase 4.3 |
| Smart medication adherence with wearable integration | Phase 4.4 |
| Patient-initiated second opinion marketplace | Phase 4.5 |

---

**Next:** Program 3.7 — CyMed Provider Portal & Workforce Experience Platform
