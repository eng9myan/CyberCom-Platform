# FHIR R4 Mapping — Population Health

## Overview

CyMed Population Health exchanges data using FHIR R4 resources for national health information exchange, cross-border interoperability, and WHO/IHR reporting.

## Resource Mapping

| Platform Model | FHIR R4 Resource | Key Field |
|---|---|---|
| DiseaseRegistry | `List` (type=patients) | `fhir_list_id` |
| RegistryPatient | `Patient` (reference) | `patient_id` |
| RegistryOutcome | `Condition` / `Observation` | via TerminologyService |
| SurveillanceCase | `Condition` | disease_code → ICD-11 |
| Outbreak | `DetectedIssue` | severity_level |
| HealthProgram | `CarePlan` (population) | `fhir_care_plan_id` |
| ProgramEnrollment | `CarePlan` (patient) | patient_id reference |
| ProgramOutcome | `Observation` / `Goal` | outcome_type |
| VaccinationCertificate | `Immunization` | `fhir_immunization_id` |
| NationalHealthID | `Patient.identifier` | national_id_number |
| HealthPass | `DocumentReference` | pass_type |
| DigitalHealthWalletEntry | `DocumentReference` | entry_type |
| EpidemiologyStudy | `ResearchStudy` | `fhir_research_study_id` |
| DiseaseTrend | `MeasureReport` | disease_code → ICD-11 |
| PopulationIndicator | `Observation` (population) | indicator_type |
| NationalReport | `MeasureReport` | `fhir_measure_report_id` |
| QualityMeasure | `Measure` | measure_code |
| QualityMeasureResult | `MeasureReport` | facility_id reference |
| NationalHealthSnapshot | `MeasureReport` | snapshot_date |
| OutbreakForecast | `RiskAssessment` (population) | is_advisory_only |

## National Exchange Resources

These FHIR resources are used in national health information exchange:

```
Patient          — Demographics, identifiers, contacts
Practitioner     — Provider registry (national_provider_number)
Organization     — Facility registry (national_facility_number)
Location         — Geographic service points
Condition        — Active problems (ICD-11)
Observation      — Lab results, vital signs (LOINC)
DiagnosticReport — Lab/imaging reports
CarePlan         — Program enrollment and care plans
Immunization     — Vaccination records and certificates
Encounter        — Visits for gap/risk calculation
```

## Terminology Systems

| Standard | Used For | Source |
|---|---|---|
| ICD-11 | Disease codes, registry conditions, surveillance cases | TerminologyService (P2.10) |
| SNOMED CT | Clinical findings, procedures | TerminologyService (P2.10) |
| LOINC | Lab tests, observations, measures | TerminologyService (P2.10) |
| ICF | Disability and functioning | TerminologyService (P2.10) |
| CVX | Vaccine codes | TerminologyService (P2.10) |
| NUCC | Provider taxonomy | TerminologyService (P2.10) |

**No local terminology tables exist.** All code lookups go through `TerminologyService.resolve()`.

## IHR 2005 Compliance

International Health Regulations reporting uses:
- `SurveillanceCase.is_notifiable = True` for IHR-notifiable diseases
- `Outbreak.is_reported_to_authority = True` for national/international reporting
- `VaccinationCertificate.is_international = True` for IHR-compliant travel certificates
- CyIntegrationHub → cygov_health for WHO/IHR event notification
