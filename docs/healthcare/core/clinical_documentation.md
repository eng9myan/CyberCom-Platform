# Clinical Documentation Architecture

## 1. Overview
The Clinical Documentation module (`documents` app) manages unstructured clinical notes and structured medical documents (SOAP notes, consultation notes, discharge summaries). It provides cryptographic signing, immutable version histories, and detailed access audits to ensure compliance with medical record regulations.

## 2. Domain Models
*   **`ClinicalDocument`**: Parent document metadata containing title, type (soap, progress, procedure, consultation, discharge), current status (draft, final, amended, entered_in_error), version, and raw markdown or JSON content.
*   **`DocumentSection`**: Sub-sections within a document (e.g., "History of Present Illness", "Review of Systems").
*   **`ClinicalNote`**: Free-text clinical notes.
*   **`SOAPNote`**: Structured clinical documentation following the Subjective, Objective, Assessment, and Plan template.
*   **`ProgressNote`**: Standard ward progress reviews.
*   **`ProcedureNote`**: Summary reports logged after surgeries or bedside procedures.
*   **`ConsultationNote`**: Specialty consultation reports.
*   **`DischargeNote`**: Inpatient discharge summaries containing recovery plans, follow-up dates, and prescriptions.

## 3. Version Control & Cryptographic Signatures
*   **Draft State**: Clinicians can edit documents freely in `draft` status.
*   **Digital Signatures**: When finalized, the document moves to `final` status. The system applies a digital signature:
    *   Hastes the document content and metadata.
    *   Saves the clinician UUID (`signed_by`) and timestamps.
    *   Locks the document from future edits.
    *   Publishes a `cymed.document.signed` event.
*   **Version History (Amending Documents)**: If a signed document must be edited, the system creates a new version, increments the version number, marks the old version as `amended`, and links the records in an audit chain.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/documents/` | GET | Search clinical documents |
| `/api/v1/documents/` | POST | Create draft clinical document |
| `/api/v1/documents/{id}/sign/` | POST | Digitally sign and finalize document (publishes `cymed.document.signed`) |

## 5. FHIR Mapping
*   `ClinicalDocument` ──> **FHIR DocumentReference**
*   `DocumentSection` / `SOAPNote` ──> **FHIR Composition**
