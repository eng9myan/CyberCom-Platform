# Digital Health Platform

## Purpose

Issues and manages National Health IDs, vaccination certificates, health passes, and digital health wallet entries. Enables citizen-facing digital health credentials that integrate with CyGov Citizen Services and international health regulatory frameworks.

## Models

### NationalHealthID
Links a patient (`patient_id` UUIDField) to a government-issued national identifier. `id_type`: national_id / resident_id / passport / gulfid. `id_status`: active / suspended / revoked / pending_verification. Cross-referenced with CyGov Identity via CyIntegrationHub before issuance — no direct API calls to government systems from this model. One Health ID per patient per tenant (unique_together constraint).

### VaccinationCertificate
A verifiable record of a vaccination event meeting certificate issuance criteria (typically full primary series). `certificate_number` is globally unique. `qr_code_data` contains an offline-verifiable encoded payload (credential data + digital signature). `is_international=True` flags IHR-compliant international travel certificates. `fhir_immunization_id` references the source FHIR Immunization resource.

### HealthPass
A time-limited access credential based on health conditions being met. `pass_type`: travel / event / workplace / education / healthcare_access. `conditions_met` (JSONField) records which criteria were verified at issuance (vaccination status, negative test, recovery certificate). `qr_code_data` enables contactless verification.

### DigitalHealthWalletEntry
A citizen's personal health document store. Supports: medical_record / vaccination_certificate / insurance_card / prescription / lab_result / imaging_report / allergy_record / health_pass. `content_reference` is a CyData file URL. `is_shareable` governs patient consent for sharing entries with third parties. `is_verified` indicates the entry was verified by an authoritative source.

## Integration with CyGov

```
NationalHealthID verification:
CyIntegrationHub.send(
    destination="cygov_identity",
    event_type="cymed.ph.national_id.verify_request",
    payload={"patient_id": "...", "national_id_number": "..."}
)

Health pass issuance notification:
CyIntegrationHub.send(
    destination="cygov_citizen_services",
    event_type="cymed.ph.health_pass.issued",
    payload={"patient_id": "...", "pass_type": "...", "valid_until": "..."}
)
```

## FHIR Mapping

| Model | FHIR Resource |
|---|---|
| VaccinationCertificate | `Immunization` |
| HealthPass | `DocumentReference` |
| DigitalHealthWalletEntry | `DocumentReference` |
| NationalHealthID | `Patient.identifier` |

## QR Code Security

- `qr_code_data` stores a digitally-signed, base64-encoded payload
- Payload includes: certificate_number, patient_id_hash, vaccine_code, dates, issuing_authority
- Verification is offline-capable (signature checked against public key)
- Private key management is handled by `platform.crypto` — never stored in the database

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/digital-health/national-ids/` | Issue / view National Health IDs |
| POST | `/digital-health/national-ids/{id}/verify/` | Verify ID against CyGov Identity |
| GET/POST | `/digital-health/vaccination-certs/` | Issue / view vaccination certificates |
| POST | `/digital-health/vaccination-certs/{id}/revoke/` | Revoke certificate |
| GET/POST | `/digital-health/health-passes/` | Issue / view health passes |
| POST | `/digital-health/health-passes/{id}/revoke/` | Revoke health pass |
| GET/POST | `/digital-health/wallet/` | Patient health wallet entries |
