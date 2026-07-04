# Provider Registry Architecture

## 1. Overview
The Provider Registry (`providers` app) serves as the source of truth for all healthcare professionals (physicians, nurses, allied health practitioners) working within the health system. It manages credentialing, state licensing, medical specialties, clinical roles, availability rules, and shift schedules.

## 2. Domain Models
The registry defines a series of models supporting clinician profiling and tracking:

*   **`Provider`**: Core model containing the user link, name, type (physician, nurse, pharmacist, radiologist, lab technician, therapist, administrator), and national provider identifier (NPI).
*   **`ProviderIdentifier`**: Other practitioner numbers (e.g., local health department registrations, Medicare IDs).
*   **`ProviderLicense`**: Tracks state license numbers, issuing bodies, start dates, and expiration dates.
*   **`ProviderCredential`**: Post-nominal designations and verified credentials (e.g., MD, DO, PhD, DDS).
*   **`ProviderSpecialty`**: Medical specialties (e.g., cardiology, pediatrics, general surgery).
*   **`ProviderAvailability`**: Declared office/clinic operating hours (days of week, start/end times).
*   **`ProviderSchedule`**: Calendar allocations for on-call duties, clinics, and surgeries.
*   **`ProviderRole`**: Roles a provider holds within specific departments or facilities (e.g., Chief Resident, Staff Nurse).
*   **`ProviderEducation`**: Medical school, residency, and fellowship details.
*   **`ProviderCertification`**: Board certifications (e.g., American Board of Internal Medicine) and expiration details.

## 3. Provider Types
The registry classifies providers into distinct roles to enforce RBAC and ABAC policies:
*   **Physician**: Full clinical admitting and prescribing privileges.
*   **Nurse**: Care coordination, observations, and medication administration.
*   **Pharmacist**: Prescription review, compounding, and drug-safety checks.
*   **Radiologist**: Medical imaging reading and reporting.
*   **Lab Technician**: Specimen processing and analysis.
*   **Therapist**: Physical, occupational, or speech therapy.
*   **Administrator**: Operational, billing, and scheduling workflows.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/providers/` | GET | List and filter active providers |
| `/api/v1/providers/` | POST | Create provider profile (publishes `cymed.provider.created`) |
| `/api/v1/providers/{id}/` | PUT/PATCH | Update provider profile (publishes `cymed.provider.updated`) |
| `/api/v1/providers/{id}/schedule/` | GET/POST | Manage provider calendar schedule |

## 5. Event Specifications
Events are published to `cymed.provider.events`:
*   **`cymed.provider.created`**: Triggered when a new practitioner is registered.
*   **`cymed.provider.updated`**: Triggered when license, role, or contact details are modified.

## 6. FHIR Mapping
Mapped structures in the integration serializers layer:
*   `Provider` ──> **FHIR Practitioner**
*   `ProviderRole` ──> **FHIR PractitionerRole**
*   `ProviderSpecialty` ──> **FHIR Practitioner.qualification**
