# FHIR Mapping Guide

## 1. Introduction
This guide defines the semantic mappings between the CyMed Core Clinical database models and the HL7 FHIR R4 (Fast Healthcare Interoperability Resources) specifications. These mappings are implemented within the serializers and service adapters inside `backend/products/cymed/core/` to ensure full interoperability.

## 2. Resource Mapping Catalog

| CyMed Internal Model | FHIR R4 Resource | Mapping Notes & Attributes |
|---|---|---|
| **`Patient`** | `Patient` | Maps `first_name` and `last_name` to `name.given` and `name.family`, `dob` to `birthDate`, `gender` to `gender`, and `mrn` to `identifier` with system `"http://cymed.io/fhir/sid/mrn"`. |
| **`PatientIdentifier`** | `Identifier` | Appended to `Patient.identifier` array. Uses `system` and `value` fields directly. |
| **`PatientRelationship`** | `RelatedPerson` | Maps to RelatedPerson linking back to the patient. |
| **`Provider`** | `Practitioner` | Maps user link and clinician profile fields, including `npi` as the primary identifier. |
| **`ProviderRole`** | `PractitionerRole` | Maps provider, facility location reference, and clinical role codes. |
| **`ProviderSpecialty`** | `CodeableConcept` | Embedded inside `PractitionerRole.specialty`. |
| **`Organization`** | `Organization` | Maps company profiles, hierarchy linkages (`partOf` relationship), and types. |
| **`Facility`** | `Location` | Base Location resource with type `"bu"` (building) or `"of"` (office). |
| **`Room`** / **`Bed`** | `Location` | Hierarchical Location resources using `Location.partOf` references pointing back to the parent Floor/Building/Facility. |
| **`Encounter`** | `Encounter` | Maps patient, participants, type, status, and period. |
| **`EpisodeOfCare`** | `EpisodeOfCare` | Managed for long-term health concerns spanning multiple encounters. |
| **`Condition`** | `Condition` | Maps diagnosis codes (ICD-11 or SNOMED CT verified via `TerminologyService`) to `Condition.code`. |
| **`VitalSign`** / **`Observation`**| `Observation` | Maps numeric results, codes (LOINC), values, and unit details to `Observation.valueQuantity`. |
| **`Allergy`** | `AllergyIntolerance` | Maps substances, type, criticality, and reaction symptoms. |
| **`ClinicalDocument`** | `DocumentReference` | Document index metadata, binary content link, status, and type. |
| **`SOAPNote`** | `Composition` | Document structure containing structured sections (Subjective, Objective, Assessment, Plan). |
| **`CarePlan`** | `CarePlan` | Maps intent, status, goals, and tasks. |
| **`CareGoal`** | `Goal` | Maps targets and description. |
| **`CareTask`** | `Task` | Individual task schedules and execution tracking. |
| **`Order`** (Service) | `ServiceRequest` | Clinic service requests, lab tests, and imaging procedures. |
| **`Order`** (Medication) | `MedicationRequest` | Prescriptions, instructions, and dosage specifications. |
| **`Appointment`** | `Appointment` | Maps start, end, status, and participant references. |
| **`Consent`** | `Consent` | Patient consents, status, policy rules, and category. |
