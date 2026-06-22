# Order Management Architecture

## 1. Overview
The Order Management module (`orders` app) acts as the routing engine for all clinical orders. It handles service requests for diagnostic tests (labs/imaging), medication prescriptions, referrals, and procedures, ensuring complete lifecycle auditing from creation to result reporting.

## 2. Domain Models
*   **`Order`**: Root request containing order type (laboratory, imaging, medication, procedure, referral), status (draft, active, suspended, completed, entered_in_error, cancelled), priority (routine, urgent, asap, stat), and clinician details.
*   **`OrderItem`**: The specific procedures, lab panels, or drugs ordered (e.g., "Complete Blood Count", "Lisinopril 10mg").
*   **`OrderPriority`**: Clinical urgency tags mapping to statutory processing SLAs.
*   **`OrderStatus`**: Status transition histories.
*   **`OrderAttachment`**: Supporting documents, clinical notes, or external files related to the order.
*   **`OrderResult`**: Linkages to clinical observations or documentation produced as a result of executing the order.

## 3. Order Types
*   **Laboratory**: Blood chemistry, hematology, urinalysis, microbiology panels.
*   **Imaging**: X-Rays, MRIs, CT scans, ultrasounds.
*   **Medication**: Outpatient or inpatient prescriptions (e-prescribing).
*   **Procedure**: Surgical operations, physical interventions.
*   **Referral**: Requests transferring patient care to external specialists.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/orders/` | GET | List and filter orders |
| `/api/v1/orders/` | POST | Place a clinical order (publishes `cymed.order.created`) |
| `/api/v1/orders/{id}/results/` | GET/POST | Query and link results to the order |

## 5. FHIR Mapping
*   `Order` (for labs, imaging, procedures) ──> **FHIR ServiceRequest**
*   `Order` (for medications) ──> **FHIR MedicationRequest**
*   `OrderResult` ──> **FHIR DiagnosticReport** or **FHIR Observation**
