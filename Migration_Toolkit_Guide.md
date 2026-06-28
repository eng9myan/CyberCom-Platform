# Migration Toolkit Guide

**Version:** 1.0
**Date:** 2026-06-28

---

## Overview

This guide covers data migration and integration tools for CyberCom customer deployments.

Migration is handled via the CyberCom Import API (`/api/v1/import/`) combined with CSV/Excel template files and FHIR bulk import for clinical data.

---

## Supported Import Formats

| Format | Use Case |
|--------|---------|
| CSV | Administrative data, bulk imports |
| Excel (.xlsx) | Complex structured data with multiple sheets |
| FHIR Bundle (JSON) | Clinical data (patients, encounters, observations) |
| HL7 ADT | Patient demographics from existing HIS |
| DICOM Study list | Imaging study registry migration |

---

## Entity Migration Catalog

### 1. Patients

**Template:** `templates/migration/patients.csv`

| Field | Type | Required | Notes |
|-------|------|---------|-------|
| `mrn` | string | Yes | Medical Record Number from source system |
| `first_name` | string | Yes | |
| `last_name` | string | Yes | |
| `first_name_ar` | string | No | Arabic first name |
| `last_name_ar` | string | No | Arabic last name |
| `date_of_birth` | date | Yes | YYYY-MM-DD |
| `gender` | string | Yes | `male`, `female`, `other`, `unknown` |
| `national_id` | string | No | National ID / passport |
| `phone_mobile` | string | No | E.164 format (+962XXXXXXXXX) |
| `email` | string | No | |
| `address_line1` | string | No | |
| `city` | string | No | |
| `country_code` | string | No | ISO 3166-1 alpha-2 |
| `blood_group` | string | No | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `allergies` | JSON | No | `[{"code": "penicillin", "system": "snomed", "severity": "severe"}]` |
| `source_system` | string | Yes | Source system identifier for reconciliation |

**Validation rules:**
- Date of birth must be valid and in the past
- MRN must be unique within tenant
- Duplicate MRN detection with merge workflow

**Import endpoint:** `POST /api/v1/import/patients/`

**FHIR alternative:**
```json
{
  "resourceType": "Bundle",
  "type": "batch",
  "entry": [{"resource": {"resourceType": "Patient", ...}}]
}
```
Endpoint: `POST /api/v1/fhir/r4/` via CyIntegrationHub

---

### 2. Providers (Clinical Staff)

**Template:** `templates/migration/providers.csv`

| Field | Type | Required | Notes |
|-------|------|---------|-------|
| `provider_id` | string | Yes | Source system ID |
| `first_name` | string | Yes | |
| `last_name` | string | Yes | |
| `specialty_code` | string | Yes | SNOMED specialty code or custom code |
| `department` | string | No | Department name |
| `license_number` | string | No | Medical license number |
| `license_expiry` | date | No | YYYY-MM-DD |
| `npi` | string | No | National Provider Identifier (US) |
| `email` | string | Yes | Used for Keycloak account creation |
| `role` | string | Yes | `physician`, `nurse`, `pharmacist`, `lab_technician`, `radiologist`, `admin` |

---

### 3. Employees (HR/Admin Staff)

**Template:** `templates/migration/employees.csv`

| Field | Type | Required | Notes |
|-------|------|---------|-------|
| `employee_id` | string | Yes | Source HR system ID |
| `first_name` | string | Yes | |
| `last_name` | string | Yes | |
| `department` | string | Yes | |
| `job_title` | string | Yes | |
| `email` | string | Yes | |
| `hire_date` | date | Yes | YYYY-MM-DD |
| `contract_type` | string | No | `full_time`, `part_time`, `contract` |
| `salary` | decimal | No | Base salary (for payroll) |

**Route:** → CyCom HR module (`products/cycom/hr/`)

---

### 4. Pharmacy Catalog (Formulary)

**Template:** `templates/migration/pharmacy_catalog.csv`

| Field | Type | Required | Notes |
|-------|------|---------|-------|
| `drug_code` | string | Yes | RxNorm code preferred |
| `drug_name` | string | Yes | Generic name |
| `brand_name` | string | No | Brand/trade name |
| `dosage_form` | string | Yes | `tablet`, `capsule`, `injection`, `suspension`, `cream`, etc. |
| `strength` | string | Yes | e.g., `500mg`, `10mg/5ml` |
| `route` | string | Yes | `oral`, `iv`, `im`, `topical`, etc. |
| `atc_code` | string | No | WHO ATC classification |
| `controlled_substance` | boolean | No | true/false |
| `controlled_schedule` | string | No | Schedule II, III, IV, V |
| `formulary_status` | string | Yes | `formulary`, `non_formulary`, `restricted` |
| `unit_price` | decimal | No | |
| `storage_conditions` | string | No | `room_temp`, `refrigerated`, `frozen` |
| `high_alert` | boolean | No | Flag as high-alert medication |

**Drug interaction rules are NOT migrated from the source system.** They must be loaded from a licensed clinical database (Micromedex, First DataBank, or equivalent) via CyIntegrationHub.

---

### 5. Laboratory Catalog

**Template:** `templates/migration/lab_catalog.csv`

| Field | Type | Required | Notes |
|-------|------|---------|-------|
| `test_code` | string | Yes | Internal code |
| `loinc_code` | string | Yes | LOINC code |
| `test_name` | string | Yes | |
| `specimen_type` | string | Yes | `blood`, `urine`, `csf`, `tissue`, `swab`, etc. |
| `specimen_volume_ml` | decimal | No | |
| `tube_type` | string | No | `EDTA`, `SST`, `citrate`, etc. |
| `turnaround_hours` | integer | No | Routine TAT |
| `stat_turnaround_hours` | integer | No | STAT TAT |
| `critical_low` | decimal | No | Critical low value |
| `critical_high` | decimal | No | Critical high value |
| `reference_low` | decimal | No | |
| `reference_high` | decimal | No | |
| `units` | string | No | e.g., `g/dL`, `mmol/L` |
| `category` | string | No | `hematology`, `biochemistry`, `microbiology`, etc. |

---

### 6. Imaging Catalog

**Template:** `templates/migration/imaging_catalog.csv`

| Field | Type | Required | Notes |
|-------|------|---------|-------|
| `procedure_code` | string | Yes | CPT or local code |
| `procedure_name` | string | Yes | |
| `modality` | string | Yes | `CT`, `MRI`, `XR`, `US`, `NM`, `MG`, `PT`, `RF` |
| `body_part` | string | No | SNOMED body part code or name |
| `duration_minutes` | integer | No | Typical exam duration |
| `requires_contrast` | boolean | No | |
| `preparation_instructions` | text | No | Patient prep instructions |
| `price` | decimal | No | |

---

### 7. Appointments (Historical)

**Template:** `templates/migration/appointments.csv`

| Field | Type | Required | Notes |
|-------|------|---------|-------|
| `appointment_id` | string | Yes | Source system ID |
| `patient_mrn` | string | Yes | Must match migrated patient |
| `provider_id` | string | Yes | Must match migrated provider |
| `appointment_date` | datetime | Yes | ISO 8601 |
| `appointment_type` | string | Yes | `new`, `follow_up`, `procedure` |
| `status` | string | Yes | `completed`, `cancelled`, `no_show` |
| `specialty` | string | No | |
| `notes` | text | No | |

**Note:** Only migrate historical appointments as needed for audit trail. Future appointments should be re-entered in CyberCom.

---

### 8. Financial Data

**Route:** → CyCom Finance module (`products/cycom/finance/`)

**Template:** `templates/migration/financial/invoices.csv`

| Field | Type | Required |
|-------|------|---------|
| `invoice_number` | string | Yes |
| `patient_mrn` | string | Yes |
| `invoice_date` | date | Yes |
| `total_amount` | decimal | Yes |
| `paid_amount` | decimal | No |
| `balance` | decimal | No |
| `status` | string | Yes |
| `payer_type` | string | Yes |

**Note:** Open AR balances require financial team validation before migration.

---

### 9. Insurance Data

**Template:** `templates/migration/insurance.csv`

| Field | Type | Required | Notes |
|-------|------|---------|-------|
| `patient_mrn` | string | Yes | |
| `payer_name` | string | Yes | Insurance company name |
| `payer_id` | string | No | Clearinghouse payer ID |
| `policy_number` | string | Yes | |
| `group_number` | string | No | |
| `subscriber_name` | string | Yes | |
| `subscriber_id` | string | Yes | |
| `relationship` | string | Yes | `self`, `spouse`, `child`, `other` |
| `effective_date` | date | Yes | YYYY-MM-DD |
| `expiry_date` | date | No | |
| `copay` | decimal | No | |
| `deductible` | decimal | No | |
| `priority` | integer | Yes | 1=primary, 2=secondary |

---

## Migration Process

### Step 1: Data Extract

Request data extracts from customer's current system. Provide CSV templates. Data must be anonymized for testing.

### Step 2: Data Assessment

```bash
# Run data quality assessment script
python scripts/migration/assess_data_quality.py \
  --input patients.csv \
  --entity patients \
  --tenant-id <UUID>
```

Report generated: `migration_quality_report.html`

Checks:
- Required fields present
- Data types valid
- Date formats correct
- Duplicate detection
- Reference integrity (patients in appointment file exist in patient file)

### Step 3: Mapping

For each entity, complete the field mapping form:

```json
{
  "source_field": "PATIENT_FNAME",
  "target_field": "first_name",
  "transformation": "trim_whitespace",
  "default_if_null": ""
}
```

Mapping templates in: `templates/migration/mappings/`

### Step 4: Staging Migration

```bash
python scripts/migration/run_migration.py \
  --entity patients \
  --input patients_mapped.csv \
  --tenant-id <UUID> \
  --environment staging \
  --dry-run    # Remove for actual import
```

### Step 5: Validation

```bash
python scripts/migration/validate_migration.py \
  --entity patients \
  --tenant-id <UUID> \
  --source-count 15420 \
  --generate-report
```

Validation checks:
- Record count matches source
- Spot sample of records against source
- Clinical data integrity (allergies, diagnoses)
- No orphaned references

### Step 6: Production Migration

Run during agreed cutover window. Requires approval from customer IT lead and clinical lead.

```bash
python scripts/migration/run_migration.py \
  --entity patients \
  --input patients_mapped.csv \
  --tenant-id <UUID> \
  --environment production
```

---

## Integration Guide

### Laboratory Analyzer Interfaces

**Protocol:** HL7 v2.5 ORM/ORU via CyIntegrationHub

**Configuration:**
```json
{
  "partner_name": "Sysmex XN-Series",
  "protocol": "hl7v2",
  "direction": "bidirectional",
  "endpoint_url": "mllp://analyzer-ip:2575",
  "message_types": ["ORM_O01", "ORU_R01"],
  "encoding": "utf-8"
}
```

**Test procedure:**
1. Configure connector in CyIntegrationHub admin
2. Send test ORM (lab order) message
3. Verify order appears on analyzer worklist
4. Submit test result from analyzer
5. Verify ORU result received and auto-verified in LIS

### PACS Integration (DICOM)

**Protocols:** DICOM C-STORE, C-FIND, C-MOVE, Modality Worklist (MWL)

**Configuration:**
```json
{
  "partner_name": "Sectra IDS7",
  "protocol": "dicom",
  "aet_title": "CYBERCOM",
  "remote_aet": "SECTRA_IDS7",
  "remote_host": "pacs-server",
  "remote_port": 11112,
  "tls_enabled": true
}
```

**Test procedure (DICOM Echo):**
```bash
dcmecho -c SECTRA_IDS7 pacs-server:11112
```

**Test MWL:**
- Place imaging order in CyberCom
- Verify modality worklist item appears on modality
- Acquire test images and send via C-STORE
- Verify images appear in CyberCom imaging module

### Insurance Clearinghouse

**Protocol:** REST API (X12 270/271 wrapped in JSON) or direct EDI

**Test procedure:**
1. Submit eligibility check (270) for test patient
2. Verify 271 response with coverage details
3. Submit test claim (837)
4. Verify acknowledgment (999)

### SMS Gateway

**Supported:** Twilio, AWS SNS, local SMS gateways

**Configuration:** `NOTIFICATIONS_SMS_PROVIDER`, `NOTIFICATIONS_SMS_API_KEY` in settings

**Test:** Send test appointment reminder to test phone number

### Email

**Protocol:** SMTP or SES

**Configuration:** `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`

**Test:** Send test email from notifications module

### Payment Gateways

**Supported:** Stripe, local payment gateways (via REST adapter in CyIntegrationHub)

**Test procedure:** Process test transaction in sandbox mode, verify receipt

### Identity Providers (SSO)

**Protocol:** OIDC or SAML 2.0 via Keycloak Identity Provider federation

**Configuration:** In Keycloak Admin → Identity Providers → Add Provider

**Test:** Initiate SSO login flow, verify user provisioned in CyberCom with correct roles

---

## Integration Test Scripts

Location: `tests/integration/`

```bash
# Run all integration tests
pytest tests/integration/ --tenant-id <UUID> -v

# Test specific integration
pytest tests/integration/test_hl7_interface.py -v
pytest tests/integration/test_dicom_gateway.py -v
pytest tests/integration/test_fhir_export.py -v
```

---

## Migration Rollback

If data quality issues are found post-migration:

```bash
# Soft-delete all migrated records for a batch
python scripts/migration/rollback_migration.py \
  --entity patients \
  --batch-id <BATCH_UUID> \
  --tenant-id <UUID>

# Hard rollback (restore database backup)
# Only if batch rollback is insufficient
# See Deployment_Readiness_Report.md — Rollback section
```
