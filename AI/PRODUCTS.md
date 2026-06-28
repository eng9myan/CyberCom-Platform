# Product Reference

## CyMed — Healthcare Platform

**Owner:** `products/cymed/`
**Purpose:** Complete healthcare management system for hospitals, clinics, labs, imaging, and pharmacies.
**Standards:** FHIR R4, ICD-11, SNOMED CT, LOINC, ICF, HL7, DICOM

### CyMed Core (`products/cymed/core/`)

Shared clinical foundation consumed by all CyMed sub-products.

| Module | Contents |
|--------|---------|
| `patients/` | Patient demographics, identifiers, master patient index |
| `providers/` | Clinician registry, credentials, specialties |
| `organizations/` | Health organizations, departments |
| `facilities/` | Physical locations, rooms, beds |
| `encounters/` | Clinical encounters (outpatient, inpatient, emergency) |
| `clinical/` | Diagnoses (ICD-11), allergies, vital signs, clinical findings |
| `documents/` | Clinical documents, notes, discharge summaries |
| `careplans/` | Care plans, goals, interventions |
| `orders/` | Order sets (lab, imaging, medication, procedure) |
| `scheduling/` | Appointment scheduling engine |
| `consents/` | Patient consent management |
| `registries/` | Disease and population registries |

### CyMed Clinic (`products/cymed/clinic/`)

Outpatient clinic management.

Modules: appointments, consultations, triage, specialties, queues, reception, telemedicine, billing_bridge, insurance_bridge, referrals, clinical_forms

Key capabilities:
- Multi-specialty scheduling
- Digital triage and queue management
- Consultation workflows with clinical documentation
- Telemedicine integration
- Billing via CyCom bridge (no duplicate finance logic)
- Insurance verification via CyCom bridge

### CyMed Hospital (`products/cymed/hospital/`)

Complete inpatient hospital operations.

Modules: adt, inpatient, emergency, icu, operating_room, maternity, nursing, bed_management, discharge, transfer_center, anesthesia, capacity_management, clinical_command_center

Key capabilities:
- ADT (Admit, Discharge, Transfer) workflows
- Emergency department with triage scoring
- ICU management with scoring systems
- Operating room scheduling and tracking
- Maternity and NICU workflows
- Real-time bed management
- Clinical command center dashboard

### CyMed Laboratory (`products/cymed/laboratory/`)

Laboratory Information System (LIS).

Modules: orders, accessioning, specimens, results, worklists, microbiology, histopathology, blood_bank_foundation, pathology, quality, reference_lab, analytics

Key capabilities:
- Order-to-result workflow
- Specimen tracking with chain-of-custody
- Auto-verification rules
- Critical value alerting
- Microbiology culture and sensitivity
- Histopathology workflow
- Blood bank foundation
- Reference lab routing
- Quality control charts

### CyMed Imaging (`products/cymed/imaging/`)

Radiology Information System (RIS) + DICOM PACS gateway.

Modules: orders, scheduling, dicom_registry, pacs_gateway, modality_worklist, radiology_reporting, results, teleradiology, quality, analytics

Key capabilities:
- DICOM image registry
- PACS gateway integration
- Modality worklist (MWL)
- Structured radiology reporting
- Teleradiology workflow
- Quality assurance
- Report release with radiologist signature

### CyMed Pharmacy (`products/cymed/pharmacy/`)

Clinical pharmacy and dispensing system.

Modules: prescriptions, dispensing, drug_interactions, medication_reconciliation, formulary, clinical_pharmacy, inventory_bridge, procurement_bridge, automation, analytics

Key capabilities:
- Prescription management
- Drug interaction checking (drug-drug, drug-allergy, drug-diagnosis, drug-age, drug-pregnancy)
- Medication reconciliation
- Formulary management
- Clinical pharmacy services
- Inventory via CyCom bridge
- Procurement via CyCom bridge
- Dispensing automation
- Pharmacist approval workflow for all overrides

### CyMed Patient Portal (`products/cymed/patient_portal/`)

Patient-facing digital health engagement platform.

Modules: accounts, appointments, medical_records, laboratory_results, imaging_results, prescriptions, messaging, payments, wallet, consents, insurance, telemedicine, health_journey, family_accounts, directory, notifications

### CyMed Provider Portal (`products/cymed/provider_portal/`)

Clinical workforce platform.

Modules: workspace, patient_lists, orders, results, clinical_documentation, clinical_messaging, clinical_tasks, care_team, rounding, approvals, telemedicine, analytics, mobile, workforce

### CyMed Revenue Cycle (`products/cymed/rcm/`)

Revenue cycle management and insurance.

Modules: billing, charge_capture, claims, eligibility, preauthorization, insurance, denials, collections, payer_portal, contracts, pricing, revenue_analytics

### CyMed Population Health (`products/cymed/population_health/`)

Population health management and analytics.

Modules: cohorts, care_gaps, registries, risk_management, quality, epidemiology, surveillance, national_programs, digital_health, public_health, reporting, analytics

---

## CyCom — Enterprise ERP

**Owner:** `products/cycom/`
**Purpose:** Full ERP suite consumed by all CyberCom products. Healthcare products access CyCom via service bridges, never by duplicating logic.

| Module | Path | Contents |
|--------|------|---------|
| General Ledger | `finance/gl/` | Chart of accounts, journal entries |
| Accounts Receivable | `finance/ar/` | Invoices, payments, aging |
| Accounts Payable | `finance/ap/` | Bills, vendor payments |
| Procurement | `procurement/` | Purchase orders, vendors, contracts |
| Inventory | `inventory/` | Warehouses, stock items, movements |
| HR | `hr/` | Employees, departments, contracts |
| Payroll | `payroll/` | Payroll runs, payslips |
| Assets | `assets/` | Asset register, depreciation |
| CRM | `crm/` | Accounts, contacts, pipeline |
| BI | `bi/` | Reports, dashboard metrics |
| Retail | `retail/` | Retail operations |

**ERP Bridges in CyMed:**
- `cymed/clinic/billing_bridge/` → CyCom AR
- `cymed/clinic/insurance_bridge/` → CyCom AR
- `cymed/pharmacy/inventory_bridge/` → CyCom Inventory
- `cymed/pharmacy/procurement_bridge/` → CyCom Procurement

---

## CyIdentity — Identity & Access Management

**Owner:** `platform/cyidentity/`
**Provider:** Keycloak 24

Models: IdentityRealm, RealmConfiguration, IdentityProvider, ServicePrincipal, ApplicationClient, ClientSecret, Role, Permission, RoleAssignment, Group, GroupMembership, UserProfile, UserSession, LoginAudit, DeviceRegistration, WebAuthnCredential, BreakGlassAccess

Capabilities: OAuth2.1, OIDC, SAML 2.0, RBAC, ABAC, MFA (TOTP, WebAuthn, Passkeys), Break Glass, Session management

---

## CyIntegrationHub — Integration Platform

**Owner:** `platform/cyintegrationhub/`

Protocols: FHIR R4, HL7 v2, DICOM, REST, LDAP, SMTP, SOAP, SFTP, Kafka

No product may implement direct external system integration — route through CyIntegrationHub.

---

## CyAI — Artificial Intelligence Platform

**Owner:** `platform/cyai/`

Capabilities: Prompt registry, provider management (multi-LLM), guardrails, advisory output only

**Rule:** CyAI output is always advisory. Clinical decisions require human approval. CyAI cannot prescribe, diagnose, or dispense.

---

## CyData — Analytics & Data Platform

**Owner:** `platform/cydata/`

Capabilities: Data pipelines, analytics models, reporting foundations

---

## CyGov — Government Platform

**Owner:** `products/cygov/`

Digital government services platform for public sector deployments.

---

## CyCitizen — Citizen Services

**Owner:** `products/cycitizen/`

Citizen-facing government services and digital identity.

---

## CyConnect — Communications Platform

**Owner:** `platform/notifications/` (core), `products/cyconnect/` (extended)

Capabilities: In-app, push, email, SMS notifications. Clinical messaging. Secure provider communication.

---

## Commercial Platform (`products/cymed/commercial/`)

Licensing, editions, feature flags, subscriptions, branding, deployment profiles, product catalog, usage metering, customer management, partner management.

**Editions:** Basic, Professional, Enterprise, Government

**Feature Flags:** Per-tenant, per-edition capability gating

**White Label:** Per-tenant branding (logo, colors, name) via `BrandingMiddleware`

---

## Supporting Products

| Product | Path | Purpose |
|---------|------|---------|
| Demo Engine | `products/demo/` | Demo environment with synthetic data |
| Implementation | `products/implementation/` | Implementation methodology and tooling |
| Academy | `products/academy/` | Training and certification platform |
| Partner Ecosystem | `products/partner_ecosystem/` | Partner management and marketplace |
| Commercial Readiness | `products/commercial_readiness/` | Sales and commercial tools |
| Website CMS | `products/website/` | Public website APIs (lead capture, content) |
