# Referral Management

## 1. Overview
The `referrals` app coordinates incoming and outgoing patients between the clinic and external facilities (e.g. imaging clinics, tertiary hospitals).

## 2. Models
*   **`ReferralReason`**: Categorizes refer purposes (e.g. "Specialist Consultation", "MRI Scan").
*   **`ReferralProvider`**: Directory mapping of target clinics, specialized centers, and external doctors.
*   **`Referral`**: The referral request tracking patient, target provider, clinical notes, and attachments.
*   **`ReferralAttachment`**: References uploaded documents (DICOM reports, lab results) supporting the referral.

## 3. Integration Mappings & Events
*   Creating a referral triggers an outbox event to notify the target partner via `CyIntegrationHub`.
*   Outbox event published: `cymed.clinic.referral.created` containing referral IDs, patient mrn, and target details.
*   Supports mapping to standard HL7 FHIR `ReferralRequest` resources for cross-institution transmission.
