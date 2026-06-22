# Consent Management Architecture

## 1. Overview
The Consent Management module (`consents` app) tracks patient consent agreements. It enforces legal and regulatory compliance concerning medical procedures, clinical trials, telemedicine usage, and data sharing between healthcare organizations.

## 2. Domain Models
*   **`Consent`**: Core record storing patient links, category (treatment, research, data_sharing, telemedicine), active status (draft, active, inactive, proposed), and policy rules.
*   **`ConsentCategory`**: Categorization tags.
*   **`ConsentSignature`**: Clinician, patient, or guardian digital signatures validating the agreement.
*   **`ConsentWitness`**: Identifies witnesses to the signing process, which is mandatory for high-risk surgical consents.
*   **`ConsentAudit`**: Tracks view and revocation actions for compliance.

## 3. Supported Consent Types
*   **Treatment Consent**: Permissions for surgeries, anesthesia, or standard clinical treatments.
*   **Research Consent**: Informed consent for participation in clinical trials.
*   **Data Sharing Consent**: Patient options concerning sharing health records with third-party networks (e.g., opt-in vs. opt-out rules).
*   **Telemedicine Consent**: Explicit authorization to conduct clinical consults via remote audio-visual channels.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/consents/` | GET | List and check active patient consents |
| `/api/v1/consents/` | POST | Log signed consent (publishes `cymed.consent.created`) |
| `/api/v1/consents/{id}/revoke/` | POST | Revoke consent (status set to `inactive`, publishes `cymed.consent.revoked`) |

## 5. FHIR Mapping
*   `Consent` ──> **FHIR Consent**
