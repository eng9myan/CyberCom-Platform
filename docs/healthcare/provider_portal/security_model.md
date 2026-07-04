# CyMed Provider Portal — Security Model

## Authentication

CyIdentity (P2.1) provides all authentication:
- OAuth2 / OpenID Connect token flow
- Single Sign-On (SSO) across all CyMed clinical apps
- JWT access tokens (15-minute expiry), refresh tokens (30-day, rotated)
- Enterprise SSO via SAML 2.0 (hospital AD/LDAP)

## Multi-Factor Authentication

| Method | Use Case |
|---|---|
| TOTP | Any provider on mobile/desktop |
| SMS OTP | Backup MFA channel |
| FIDO2 WebAuthn | Passkeys on desktop/mobile |
| Biometric | iOS Face ID/Touch ID; Android BiometricPrompt |

`PatientSecuritySettings.mfa_enabled` (from CyIdentity) governs enforcement.

## Break Glass Access

Emergency access when normal auth is unavailable:
- Provider invokes break-glass from login screen
- Full audit event: `cymed.provider.break_glass.invoked`
- Access time-limited (4 hours)
- Chief Medical Officer / Privacy Officer notified via CyConnect
- All break-glass sessions logged immutably in Audit Framework (P2.3)

## Role-Based Access Control (RBAC)

`CareTeamRole.can_order` and `can_sign_documents` enforce clinical permissions.
Standard role matrix:

| Provider Type | Can Order | Can Sign Notes | Can Approve |
|---|---|---|---|
| Attending Physician | ✓ | ✓ | ✓ |
| Resident | ✓ (with co-sign) | ✓ (supervised) | ✗ |
| Intern | Limited | ✗ | ✗ |
| Charge Nurse | Nursing orders | Nursing notes | ✗ |
| Clinical Pharmacist | Medication clarify | Pharmacy notes | Medication |
| Administrator | ✗ | ✗ | Leave/Admin |

## Attribute-Based Access Control (ABAC)

Care team membership gates patient record access:
- Provider must be in an active `CareTeamMember` for the patient
- OR have an active `ProviderAssignment` for the patient
- Emergency providers access via break-glass only

## Approval Audit Trail

`ApprovalAuditLog` captures every action on every `ApprovalRequest`:
- `action`: created/submitted/approved/rejected/escalated/delegated/viewed
- `ip_address` — forensic field
- `performed_by_provider_id` — non-repudiation
- Immutable after creation

## Controlled Substance Orders

`ProviderOrderRequest.order_category=medication` for DEA Schedule II-V:
- Requires `ApprovalRequest.approval_type=controlled_substance`
- Attending or senior clinician must approve before dispensing
- Full audit via `ApprovalAuditLog`
- Published as `cymed.provider.approval.requested` Kafka event

## Mobile Security

`ProviderMobileDevice` registry:
- Every device registered with `device_fingerprint`
- `is_trusted` set after MFA verification
- Biometric login gated by `MobilePreferences.biometric_login`
- Session timeout enforced; `MobileSession.ended_at` set on timeout
- Push tokens rotated via `last_used_at` monitoring

## Session Security

`WorkspaceSession`:
- `session_token` — cryptographic token, not guessable
- `is_active=False` on logout or timeout
- `context_patient_id` — tracked for handoff and audit
- Concurrent session limit enforced by CyIdentity
