# Core Clinical Architecture

## 1. Introduction & Philosophy
The CyMed Core Clinical Platform (Program 3.0) represents the central clinical operating kernel for all CyberCom healthcare solutions. It is designed **not** as an end-user application (like a clinic or hospital module), but as a highly reusable, multi-tenant clinical foundation. All CyMed product editions (Clinic, Hospital, Laboratory, Imaging, Pharmacy, Portals, Registries, and AI modules) build directly on top of this package, inheriting its database structures, services, and event patterns without code duplication.

```
       ┌─────────────────────────────────────────────────────────────┐
       │   CyMed Hospital / Clinic / Lab / Pharmacy Editions / AI     │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ (Inherits/Extends)
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │             CyMed Core Clinical Platform (3.0)               │
       │    (Patients, Encounters, Providers, Clinical, Careplans)   │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ (Terminology Lookup & Auth)
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │               CyberCom Platform Services (2.x)              │
       │    (CyIdentity, Tenant, Audit, TerminologyService, CyAI)   │
       └─────────────────────────────────────────────────────────────┘
```

## 2. Directory Layout & Module Structure
The platform is organized into 12 lightweight, domain-focused Django applications located within `backend/products/cymed/core/`:

*   **`patients/`**: Master Patient Index (MPI), MRN generation, search, and patient merge history.
*   **`providers/`**: Care team practitioners, education, licenses, schedules, and clinical roles.
*   **`organizations/`**: Healthcare institutions, clinical groups, and accreditations.
*   **`facilities/`**: Campus topology including buildings, floors, departments, wards, rooms, and beds.
*   **`encounters/`**: Outpatient, inpatient, ER, and telemedicine visits, plus Episode of Care management.
*   **`clinical/`**: Health records including conditions, vital signs, observations, allergies, and flags.
*   **`documents/`**: SOAP notes, consult notes, and discharge summaries with version control and digital signatures.
*   **`careplans/`**: Care plans, care goals, care tasks, and clinical pathways.
*   **`orders/`**: Service requests for lab tests, imaging, medications, procedures, and referrals.
*   **`scheduling/`**: Multi-participant appointments and calendar slot management.
*   **`consents/`**: Privacy agreements (treatment, research, telemedicine, and data sharing consents).
*   **`registries/`**: Disease cohorts, clinical quality trackers, and population health patient registries.

## 3. Core Architectural Principles

### 3.1 Strict Scoping & Multi-Tenancy
All domain models inherit from `platform.common.models.BaseModel`, which automatically injects a `tenant_id` UUID field. Tenant isolation is enforced at the database level using Row-Level Security (RLS) and Django middleware, ensuring data from different healthcare networks remains completely segregated.

### 3.2 Decoupled Terminology Layer (Zero Direct Code References)
To prevent hardcoded terminology definitions, **no direct ICD-11, SNOMED CT, or LOINC lookup logic exists inside the products package**. 
*   All validation, translations, and searches are routed through the shared `TerminologyService`.
*   The clinical models store code values (e.g., `"FA81"`) and terminology system identifiers (e.g., `"icd11"` or `"snomed"`) and query the `TerminologyService` at runtime to validate records.

### 3.3 Event-Driven Integrity via Outbox Pattern
State changes in core modules publish domain events to the platform's central event stream using the Transactional Outbox Pattern (`platform.events.models.OutboxEvent`). This guarantees event delivery even during database connection drops.
Key event types published:
*   `cymed.patient.created`, `cymed.patient.merged`, `cymed.patient.unmerged`
*   `cymed.encounter.started`, `cymed.encounter.closed`
*   `cymed.appointment.created`, `cymed.appointment.cancelled`
*   `cymed.document.signed`
*   `cymed.breakglass.used`

### 3.4 Audit Compliance
Every action modifying patient health records, executing a break glass emergency authorization, or viewing sensitive documents automatically triggers audit trail records through the `Audit Framework` (`platform.audit`).

### 3.5 Artificial Intelligence & Gateways
Clinical summarization, coding suggestions, and risk assessments are routed through the `CyAI` gateway. Under no circumstances does the AI modify a patient's clinical record directly; all suggestions require review and digital approval from a licensed clinician.
