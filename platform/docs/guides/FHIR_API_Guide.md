# FHIR API Guide

## Overview

CyberCom exposes FHIR R4 (stable) and FHIR R5 (preview) endpoints for clinical interoperability. Authentication uses SMART on FHIR via CyIdentity (ADR-0034 S4.2). Per ADR-0030, all FHIR endpoints use cursor pagination and return `application/fhir+json`.

## Supported Resources

| Resource | FHIR Version | Endpoint | Description |
|---|---|---|---|
| Patient | R4 | `/fhir/R4/Patient/` | Demographics, identifiers |
| Encounter | R4 | `/fhir/R4/Encounter/` | Clinical visits |
| Practitioner | R4 | `/fhir/R4/Practitioner/` | Provider registry |
| Observation | R4 | `/fhir/R4/Observation/` | Vitals, labs, findings |
| MedicationRequest | R4 | `/fhir/R4/MedicationRequest/` | Prescriptions |
| Appointment | R4 | `/fhir/R4/Appointment/` | Scheduling |
| CarePlan | R4 | `/fhir/R4/CarePlan/` | Care coordination |
| DiagnosticReport | R5 | `/fhir/R5/DiagnosticReport/` | Diagnostic results (preview) |

## Authentication (SMART on FHIR)

### Standalone Launch (M2M)
```http
POST /auth/realms/cybercom/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=your-client-id
&client_secret=your-secret
&scope=patient/Patient.read patient/Encounter.read
```

### EHR Launch
Initiated by the EMR system via CyIdentity SMART launch endpoint. Receives `launch` context and `iss` parameters.

## Searching Resources

```http
GET /api/v1/api/fhir/R4/Patient/?patient=patient-123&limit=20
Authorization: Bearer <smart_token>
Accept: application/fhir+json
```

Response (FHIR Bundle):
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "link": [
    {"relation": "self", "url": "..."},
    {"relation": "next", "url": "..._page_token=..."}
  ],
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient-123",
        "active": true,
        "identifier": [...]
      }
    }
  ]
}
```

## Creating Resources

```http
POST /api/v1/api/fhir/R4/Observation/
Authorization: Bearer <smart_token>
Content-Type: application/fhir+json
Idempotency-Key: unique-client-uuid

{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "coding": [{"system": "http://loinc.org", "code": "55284-4"}]
  },
  "subject": {"reference": "Patient/patient-123"},
  "valueQuantity": {"value": 120, "unit": "mmHg"}
}
```

## SMART Scopes Reference

| Scope | Access |
|---|---|
| `patient/Patient.read` | Read patient demographics |
| `patient/Patient.write` | Create/update patient records |
| `patient/Observation.read` | Read clinical observations |
| `patient/Observation.write` | Create observations |
| `patient/Encounter.read` | Read encounters |
| `patient/MedicationRequest.read` | Read prescriptions |
| `patient/MedicationRequest.write` | Create prescriptions |
| `user/Practitioner.read` | Read provider registry |
| `system/Patient.read` | Server-level patient read (M2M) |

## Error Handling

FHIR errors return `OperationOutcome` resources:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "not-found",
      "diagnostics": "Patient/unknown-id not found in this tenant."
    }
  ]
}
```

## Architecture Note (ADR-0034)

The Django layer (`backend/platform/api/views.py`) handles:
- Authentication, authorization, audit trail
- Rate limiting, pagination, idempotency
- Request/response transformation

Heavy HL7/FHIR parsing and DICOM processing delegates to the Go FHIR gateway service (ADR-0034 S4.2). The Django REST layer acts as a façade.

## Compliance

| Regulation | Requirement |
|---|---|
| HIPAA | PHI access logged to AuditEvent with `compliance_tags: ["hipaa"]` |
| GDPR | Patient data requests logged; right-of-access support via export |
| Saudi PDPL | Patient consent recorded before PHI processing |
| UAE DHA | All UAE patient records tagged `DHA` in audit trail |
| Jordan | MOH-Jordan requirements enforced per tenant configuration |
