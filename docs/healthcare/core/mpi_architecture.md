# Master Patient Index (MPI) Architecture

## 1. Overview
The Master Patient Index (MPI) in the `patients` app is the central identity engine for all healthcare recipients across the enterprise. It provides mechanisms for medical record number (MRN) generation, patient identity verification, multi-criteria searches, fuzzy duplicate detection, and secure transactional patient merging and unmerging.

## 2. Domain Models
The MPI utilizes a normalized relational schema to capture patient identity, contact information, and administrative metadata:

*   **`Patient`**: The root model containing primary fields (first_name, last_name, middle_name, dob, gender, status, is_active, merged_into).
*   **`PatientIdentifier`**: Links the patient to various administrative IDs (e.g., National ID, Passport, insurance card number) with system URI scoping.
*   **`PatientContact`**: Patient contacts (email, phone, home/work).
*   **`PatientAddress`**: Structured address fields (street, city, state, country, postal_code).
*   **`PatientCommunication`**: Preferred communication channels and languages.
*   **`PatientEmergencyContact`**: Emergency contact details, relationships, and phone numbers.
*   **`PatientRelationship`**: Tracks relationships to other patients or RelatedPersons (e.g., parent, guardian).
*   **`PatientConsentReference`**: References active consent agreements for quick validation.
*   **`PatientMergeHistory`**: Audits merge actions, storing the source patient, target patient, user who merged, and timestamp.
*   **`PatientPhoto`**: Binary or cloud URL references for patient headshots.
*   **`PatientLanguage`**: Supported/preferred languages for clinical consultations.
*   **`PatientNationality`**: Nationalities and immigration status.

## 3. Core Features

### 3.1 MRN Generation
Medical Record Numbers (MRNs) are generated using a tenant-isolated thread-safe format:
```text
MRN-[Current Year]-[5-Digit Random Code] (e.g., MRN-2026-88741)
```

### 3.2 Duplicate Detection & Enterprise Resolution
The MPI employs a two-tier duplicate resolution strategy:
1.  **Exact Matching**: Scans across `national_id` or `passport_number` fields.
2.  **Fuzzy Match (Deterministic Heuristics)**: Matches on:
    *   Same Date of Birth (`dob`) AND
    *   First Name prefix match (`first_name__icontains=query_first_name[:3]`) AND
    *   Last Name prefix match (`last_name__icontains=query_last_name[:3]`).

### 3.3 Patient Merge & Unmerge Workflow
*   **Merge**: Deactivates the source patient (`is_active=False`), records the `merged_into` foreign key pointing to the target patient, creates a `PatientMergeHistory` log, and publishes a `cymed.patient.merged` event.
*   **Unmerge**: Restores the source patient (`is_active=True`), clears `merged_into`, updates the `PatientMergeHistory` record with unmerged metadata, and publishes a `cymed.patient.unmerged` event.
*   Both operations run in database transactions to ensure database consistency.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/patients/` | GET | List active patients (supports search) |
| `/api/v1/patients/` | POST | Create patient (triggers MRN generation, publishes `cymed.patient.created`) |
| `/api/v1/patients/search/` | GET/POST | Advanced/fuzzy identity resolution search |
| `/api/v1/patients/merge/` | POST | Merge two patients (source to target) |
| `/api/v1/patients/unmerge/` | POST | Unmerge a previously merged patient pair |

## 5. Event Specifications
Events are published to `cymed.patient.events`:
*   **`cymed.patient.created`**: Fired on patient creation.
*   **`cymed.patient.updated`**: Fired on profile modifications.
*   **`cymed.patient.merged`**: Fired when two records merge.
*   **`cymed.patient.unmerged`**: Fired when records are unmerged.

## 6. FHIR Mapping
Mapped structures in the integration serializers layer:
*   `Patient` ──> **FHIR Patient**
*   `PatientRelationship` / `PatientEmergencyContact` ──> **FHIR RelatedPerson**
*   `Patient` + `PatientIdentifier` ──> **FHIR Person**
