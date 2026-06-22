# FHIR Mapping Guide

## 1. Overview
The CyMed Clinic Edition supports standard HL7 FHIR (Fast Healthcare Interoperability Resources) data models to enable seamless data interchange with external health information networks and national registries.

## 2. Resource Mappings

| Clinic App Model | FHIR Resource | Description |
| :--- | :--- | :--- |
| `CheckIn` / `CheckOut` | **Encounter** | Tracks arrival method, status history, and patient links. |
| `ClinicAppointment` | **Appointment** | Maps start/end times, slots, participants, and specialty codes. |
| `TriageAssessment` | **Observation** | Group resource wrapping triage categorizations. |
| `TriageVitalSigns` | **Observation** | Standard LOINC-coded observations for temperature, BP, pulse, and RR. |
| `Consultation` | **ClinicalImpression** | SOAP assessments and general clinical reviews. |
| `ConsultationDiagnosis` | **Condition** | ICD-11/SNOMED CT-coded diagnostic entries. |
| `ConsultationProcedure` | **Procedure** | SNOMED-coded clinical interventions. |
| `Referral` | **ReferralRequest** / **ServiceRequest** | Outgoing medical referrals. |
| `EligibilityCheck` | **CoverageEligibilityRequest** | Insurance eligibility check records. |
| `AuthorizationRequest` | **Claim** / **ClaimResponse** | Prior authorization requests and approvals. |
| `ChargeItem` | **ChargeItem** | Individual charge entries billed to patient accounts. |

## 3. Data Integration Mappings
When exporting resources, data formatting utilizes standard FHIR JSON payloads:
*   Identifiers use system URIs containing tenant contexts to ensure global uniqueness.
*   Terminology codes use standard URIs (e.g., `http://hl7.org/fhir/sid/icd-11` or `http://snomed.info/sct`).
*   Dates and times are serialized in ISO 8601 UTC formats.
