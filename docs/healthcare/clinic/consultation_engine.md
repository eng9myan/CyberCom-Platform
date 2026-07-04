# Consultation Engine

## 1. Overview
The `consultations` app hosts the Electronic Medical Record (EMR) interfaces utilized by clinicians during consultations. It maps outpatient clinic visits to structured SOAP (Subjective, Objective, Assessment, Plan) records, medications, and procedure orders.

## 2. Models
*   **`Consultation`**: Represents the primary clinical note containing free-text fields for SOAP notes, diagnosis records, and plan directives.
*   **`ConsultationDiagnosis`**: Diagnostic codes linked to the consultation.
*   **`ConsultationProcedure`**: Medical procedures performed during the visit.
*   **`ConsultationPlan`**: Medical instructions, dietary guidelines, and physical activity plans.
*   **`ConsultationFollowUp`**: Schedules follow-up visits.
*   **`ConsultationAttachment`**: Attaches clinical files (scans, reports, patient histories).

## 3. Strict Terminology Validations
To enforce corporate rules:
1. No direct ICD-11 or SNOMED CT lookup lists exist within the database.
2. The serializer intercepts creation calls.
3. For each diagnosis record, the code and terminology system are evaluated against the platform-wide `TerminologyService`:
   * The `validate()` method verifies if the code exists (e.g. `FA81` under system `icd11`).
   * If validation fails, the API throws:
     ```json
     {
         "diagnoses": "Invalid terminology code INVALID-CODE for system icd11"
     }
     ```
   * Only verified diagnosis codes can be committed.
