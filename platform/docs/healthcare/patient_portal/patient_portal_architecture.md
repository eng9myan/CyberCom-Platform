# CyMed Patient Portal — Architecture

## Overview

The CyMed Patient Portal is a 16-module Django backend platform delivering patient
engagement capabilities across web, mobile (iOS/Android), kiosk, and API channels.
It serves as the unified digital front door for all CyMed clinical and operational
services.

## Module Map

```
backend/products/cymed/patient_portal/
├── accounts/           PatientPortalAccount, PatientProfile, PatientPreferences,
│                       PatientSecuritySettings, PatientDevice
├── directory/          HospitalListing, ClinicListing, ClinicSpecialty,
│                       LaboratoryListing, ImagingCenterListing,
│                       PharmacyListing, ProviderReview
├── appointments/       PortalAppointmentRequest, WaitlistEntry,
│                       AppointmentReminder, AppointmentRating
├── telemedicine/       TelemedicineSession, TelemedicineDocument,
│                       TelemedicineChat, TelemedicineRating
├── medical_records/    MedicalRecordAccess, SharedRecord,
│                       RecordDownloadHistory, PatientDocument
├── laboratory_results/ LabResultView, LabResultTrend,
│                       CriticalResultAcknowledgement, LabResultShareLink
├── imaging_results/    ImagingResultView, ImagingStudyMetadata,
│                       ImagingReportAccess, ImagingShareLink
├── prescriptions/      PortalPrescriptionView, RefillRequest,
│                       MedicationInstruction, MedicationAdherenceLog
├── payments/           PatientInvoice, PaymentTransaction,
│                       PaymentMethod, InstallmentPlan
├── insurance/          InsuranceCard, CoverageVerification,
│                       PreauthorizationRequest, ClaimStatus
├── messaging/          MessageThread, PatientMessage,
│                       MessageAttachment, SecureMessageRecipient
├── notifications/      PatientNotification, NotificationPreference,
│                       NotificationTemplate, PushSubscription
├── family_accounts/    FamilyGroup, FamilyMember,
│                       FamilyAccessPermission, DependentProfile
├── consents/           PortalConsentType, PortalConsentRecord,
│                       ConsentRequest, ConsentHistory
├── wallet/             HealthWallet, DigitalCard,
│                       HealthPass, VaccinationRecord
└── health_journey/     HealthTimeline, HealthTimelineEvent,
                        PatientJourney, HealthMilestone, CareEpisode
```

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CyMed Patient Portal                         │
├─────────────────┬───────────────────────────────────────────────┤
│  Portal Apps    │  CyMed Platform Layer (Program 2.x)           │
├─────────────────┼───────────────────────────────────────────────┤
│ accounts        │  CyIdentity (P2.1) — auth, MFA, passkeys      │
│ appointments    │  CyMed Clinic (P3.1) — slot availability       │
│                 │  CyMed Hospital (P3.2) — hospital booking      │
│ telemedicine    │  CyMed Clinic telemedicine (P3.1)              │
│ lab_results     │  CyMed Laboratory (P3.3) — result feed         │
│ imaging_results │  CyMed Imaging (P3.4) — report feed            │
│ prescriptions   │  CyMed Pharmacy (P3.5) — rx + refill requests  │
│ payments        │  CyCom Finance — invoices via ERP events        │
│ insurance       │  CyIntegrationHub (P2.6) — payer APIs           │
│ messaging       │  CyConnect — secure provider messaging          │
│ notifications   │  Event Framework (P2.5) — Kafka consumers       │
│ wallet          │  TerminologyService — CVX/NDC vaccine codes      │
│ directory       │  FeatureFlagService — edition gating            │
│ health_journey  │  CyMed Core (P3.0) — encounters, diagnoses      │
└─────────────────┴───────────────────────────────────────────────┘
```

## Multi-Tenancy

Every model extends `platform.common.models.BaseModel` which provides:
- `id` — UUID primary key
- `tenant_id` — UUID, indexed, enforces data isolation
- `created_at`, `updated_at` — auto-managed timestamps

All ViewSets filter `get_queryset()` by `request.tenant_id` ensuring complete
tenant isolation across all 16 modules.

## Security Architecture

- **Authentication:** CyIdentity (OAuth2 / OpenID Connect)
- **MFA:** TOTP, SMS, email, authenticator app (PatientSecuritySettings)
- **Biometrics:** iOS Face ID / Touch ID / Android biometric (PatientDevice)
- **Passkeys:** FIDO2 WebAuthn support (PatientSecuritySettings.passkey_enabled)
- **ABAC:** Attribute-based access for family account permissions
- **Encryption:** All PII fields encrypted at rest via CyData
- **Audit:** MedicalRecordAccess logs every record access event

## AI Integration (CyAI)

AI capabilities are advisory only:
- `MedicationInstruction.ai_explanation` — CyAI patient-friendly drug explanations
- `HealthTimeline` — CyAI suggested event groupings (read-only)
- AI cannot create prescriptions, alter medical records, or diagnose
