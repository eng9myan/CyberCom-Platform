# CyMed Provider Portal — Architecture

## Overview

CyMed Provider Portal is the unified clinical workspace for every healthcare professional
in the CyMed ecosystem — physicians, nurses, pharmacists, radiologists, lab staff, therapists,
and administrators. It competes directly with Epic Hyperspace/Haiku/Canto, Cerner PowerChart,
and Oracle Health Provider Portal.

## Module Map

```
backend/products/cymed/provider_portal/
├── workspace/              ProviderWorkspace, ProviderDashboard,
│                           ProviderPreferences, WorkspaceSession
├── patient_lists/          PatientList, PatientAssignment,
│                           ProviderAssignment, PatientCensus
├── clinical_tasks/         ClinicalTask, TaskAssignment,
│                           TaskComment, TaskEscalation
├── clinical_messaging/     ClinicalMessageThread, ClinicalMessage,
│                           MessageAttachment, ClinicalGroup,
│                           MessageThreadParticipant
├── workforce/              ProviderSchedule, ShiftAssignment,
│                           LeaveRequest, AttendanceRecord, CredentialExpiry
├── rounding/               ClinicalRound, RoundTeam, RoundChecklist,
│                           RoundFinding, RoundAction
├── orders/                 ProviderOrderRequest, OrderModification,
│                           OrderStatusUpdate, OrderSet
├── results/                ProviderResultView, ResultTrend,
│                           CriticalResultAlert, ResultAcknowledgement
├── clinical_documentation/ DocumentationTemplate, SmartPhrase,
│                           ProviderClinicalNote, NoteCoSignature,
│                           VoiceDictation
├── telemedicine/           ProviderTelemedicineSession, ConsultRequest,
│                           SecondOpinionRequest, TelemedicineDocument
├── care_team/              CareTeam, CareTeamMember, CareTeamAssignment,
│                           CareTeamRole, CoverageSchedule
├── approvals/              ApprovalRequest, ApprovalWorkflow,
│                           ApprovalDecision, ApprovalAuditLog
├── analytics/              ProviderProductivitySnapshot, ClinicalQualityMetric,
│                           WorkforceDashboardSnapshot, ProviderAIInsight,
│                           ExecutiveDashboardMetric
└── mobile/                 ProviderMobileDevice, MobileSession,
                            MobilePreferences, MobilePushNotification
```

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  CyMed Provider Portal                          │
├─────────────────┬───────────────────────────────────────────────┤
│  Portal App     │  CyMed / Platform Layer                       │
├─────────────────┼───────────────────────────────────────────────┤
│ workspace       │  CyIdentity (P2.1) — SSO, MFA, passkeys       │
│ orders          │  CyMed Clinic (P3.1) — outpatient orders       │
│                 │  CyMed Hospital (P3.2) — inpatient orders      │
│                 │  CyMed Lab (P3.3) — lab orders                 │
│                 │  CyMed Imaging (P3.4) — imaging orders         │
│                 │  CyMed Pharmacy (P3.5) — medication orders     │
│ results         │  CyMed Lab (P3.3) — result feed                │
│                 │  CyMed Imaging (P3.4) — radiology reports      │
│ clinical_docs   │  CyMed Core (P3.0) — ClinicalDocument store   │
│ telemedicine    │  CyMed Patient Portal (P3.6) — patient sessions│
│ care_team       │  CyMed Core (P3.0) — patient care plans        │
│ workforce       │  CyCom HR/Workforce — schedule/leave sync      │
│ analytics       │  CyData (P2.7) — analytics data lake           │
│                 │  CyAI (P2.8) — AI insights (advisory only)     │
│ messaging       │  CyConnect — secure encrypted messaging        │
│ mobile          │  CyIntegrationHub (P2.6) — APNs/FCM delivery  │
│ approvals       │  Event Framework (P2.5) — Kafka events         │
└─────────────────┴───────────────────────────────────────────────┘
```

## Multi-Tenancy

Every model extends `platform.common.models.BaseModel`:
- `id` — UUID primary key
- `tenant_id` — UUID, indexed, enforces complete data isolation
- `created_at`, `updated_at` — auto-managed

All ViewSets filter `get_queryset()` by `request.tenant_id`.

## Provider Types

14 provider types supported in `ProviderWorkspace.provider_type`:
physician, consultant, resident, nurse, charge_nurse, pharmacist,
clinical_pharmacist, radiologist, lab_technologist, microbiologist,
pathologist, therapist, care_coordinator, administrator

## FHIR R4 Integration

| Portal Entity | FHIR Resource |
|---|---|
| `ProviderOrderRequest` (lab) | ServiceRequest |
| `ProviderOrderRequest` (medication) | MedicationRequest |
| `ProviderClinicalNote` | Composition |
| `ProviderResultView` | DiagnosticReport |
| `CareTeam` | CareTeam |
| `ConsultRequest` | ServiceRequest (referral) |
