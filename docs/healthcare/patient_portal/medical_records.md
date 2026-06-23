# CyMed Patient Portal — Medical Records Access

## Record Types Available to Patients

| Record Type | Source System |
|---|---|
| Diagnoses | CyMed Core (P3.0) — `Diagnosis` |
| Conditions | CyMed Core (P3.0) — `Condition` |
| Allergies | CyMed Core (P3.0) — `Allergy` |
| Immunizations | CyMed Core (P3.0) — `Immunization` |
| Care Plans | CyMed Core (P3.0) — `CarePlan` |
| Clinical Notes | CyMed Core (P3.0) — `ClinicalDocument` |
| Discharge Summaries | CyMed Hospital (P3.2) — `DischargeSummary` |
| Visit History | CyMed Core (P3.0) — `Encounter` |

The portal app does **not** duplicate clinical records. All record reads go through the
CyMed Core API. The portal stores only:
- Access audit logs (`MedicalRecordAccess`)
- Share tokens (`SharedRecord`)
- Download history (`RecordDownloadHistory`)
- Patient-uploaded documents (`PatientDocument`)

## Access Audit

Every patient record access is logged in `MedicalRecordAccess`:
- `record_type` + `record_id` identifies the accessed record
- `access_type`: view, download, share
- `access_context`: portal, mobile, api
- Immutable — not editable after creation

## Record Sharing

`SharedRecord` enables controlled sharing with providers, employers, or insurers:

1. Patient creates a share → `share_token` generated (cryptographic, not UUID)
2. Recipient accesses record via share URL using the token
3. `access_count` incremented on each access
4. `max_access_count` optional limit
5. `valid_until` enforced expiry
6. Revoke at any time via `is_revoked=True`

## Download Formats

`RecordDownloadHistory.download_format` supports:
- `pdf` — human-readable report (default)
- `json` — raw JSON data
- `fhir` — FHIR R4 Bundle export
- `csv` — tabular data for lab results / vital signs

## Patient Document Upload

`PatientDocument` stores patient-managed documents:
- External reports, scanned prescriptions, insurance letters
- `source`: uploaded_by_patient, received_from_provider, generated_by_system
- File stored in CyData; `file_url` is a CyData reference
- `tags` JSONField for patient-defined organization
- `is_shared` flag for sharing with providers via portal messaging

## Privacy Controls

- Patient controls all sharing via `SharedRecord`
- `SharedRecord.is_revoked` instantly terminates access
- Family access to records gated by `FamilyAccessPermission.permissions` list
- Research data sharing requires `PortalConsentRecord` with `consent_category=research`
