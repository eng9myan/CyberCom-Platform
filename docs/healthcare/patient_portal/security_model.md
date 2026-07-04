# CyMed Patient Portal — Security Model

## Authentication

All portal requests authenticated via CyIdentity (Program 2.1):
- OAuth2 / OpenID Connect token flow
- JWT access tokens (15-minute expiry)
- Refresh tokens (30-day expiry, rotated on use)
- Social login optional (Google, Apple) via CyIdentity

## Multi-Factor Authentication

Configured per account in `PatientSecuritySettings`:

| Method | Field | Notes |
|---|---|---|
| TOTP | `mfa_method=totp` | Google Authenticator, Authy |
| SMS OTP | `mfa_method=sms` | Via CyConnect |
| Email OTP | `mfa_method=email` | Via CyConnect |
| Authenticator App | `mfa_method=authenticator_app` | FIDO TOTP |

## Passkeys (FIDO2 WebAuthn)

`PatientSecuritySettings.passkey_enabled = True` enables FIDO2 WebAuthn.
Device registration stored in `PatientDevice.device_fingerprint`.
Private keys never leave the patient's device.

## Biometric Authentication

Mobile app biometric gate:
- `PatientDevice.device_type` ∈ {ios, android}
- `PatientSecuritySettings.biometric_enabled = True`
- iOS: Face ID / Touch ID; Android: Fingerprint / Face Unlock

## Family Account Access Control

`FamilyAccessPermission` implements ABAC:

| Level | Permissions |
|---|---|
| `view_only` | Read access to selected records |
| `full_access` | All records including payments |
| `emergency_only` | Emergency contact access only |
| `appointments_only` | Booking and viewing appointments |

Granular `permissions` JSONField controls per-module access:
`[appointments, lab_results, imaging_results, prescriptions, medical_records, payments]`

## Consent Framework

`PortalConsentRecord` tracks all patient consents:
- IP address and user agent captured on consent grant
- `ConsentHistory` provides immutable audit trail
- Mandatory consents block portal access if not granted
- Consent can be withdrawn; withdrawal creates history record

## Medical Record Sharing

`SharedRecord` controls external record sharing:
- `share_token` — cryptographic token (never predictable UUIDs)
- `valid_until` — enforced expiry
- `max_access_count` — optional view limit
- `is_revoked` — instant revocation
- `access_count` — tracks every access

## Controlled Substance Guardrails

Portal `prescriptions` app is read-only for patient-facing views:
- Patients can REQUEST refills; pharmacists approve
- `RefillRequest.status` starts at `submitted` — pharmacy controls transition to `dispensed`
- `is_controlled` prescriptions display DEA schedule warnings

## Audit Logging

`MedicalRecordAccess` captures:
- Every record view, download, or share event
- `access_context` (portal/mobile/api)
- Linked to `account_id` and `patient_id` for forensic traceability

## Session Security

- `PatientSecuritySettings.session_timeout_minutes` — configurable per patient
- `PatientSecuritySettings.failed_login_count` — brute-force tracking
- `locked_until` — temporary account lock after failed attempts
- `trusted_devices_enabled` — skip MFA on registered trusted devices

## Device Management

`PatientDevice` registry:
- Each device has a unique `device_fingerprint`
- `is_trusted` — set after MFA verification on new device
- `is_active` — disable without deleting (preserves history)
- Push token rotation tracked via `last_used_at`
