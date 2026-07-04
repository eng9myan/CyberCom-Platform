# CyMed Provider Portal — Commercial Packaging

## Product Editions

### CyMed Provider Portal (Standard)

**Target:** Clinics, outpatient centers, specialist groups
**Price Point:** Per-provider-seat/month

Included modules:
- `workspace` — unified dashboard for all provider types
- `patient_lists` — my patients, clinic lists
- `clinical_tasks` — task creation, assignment, completion
- `results` — result review, trend charts, critical alerts
- `clinical_documentation` — SOAP, progress, consult notes; templates; smart phrases

---

### CyMed Provider Portal Enterprise

**Target:** Hospitals, multi-specialty groups, health systems
**Price Point:** Per-facility + per-seat

Adds to Standard:
- `care_team` — MDT teams, coverage scheduling, ABAC
- `telemedicine` — video visits, consult requests, second opinions
- `clinical_messaging` — secure encrypted team messaging (CyConnect)
- `analytics` — provider productivity, clinical quality metrics, AI insights
- `mobile` — iOS/Android app with biometric login, push notifications
- `orders` — full order management (lab/imaging/medication/procedure)
- `rounding` — ward rounds, ICU rounds, MDT rounds
- `approvals` — clinical approvals, controlled substances, leave
- `workforce` — schedules, attendance, credential expiry

---

### CyMed Academic Medical Center Portal

**Target:** Teaching hospitals, academic health systems, residency programs
**Price Point:** Per-institution contract

Adds to Enterprise:
- Resident and intern management (supervision workflows)
- Teaching team assignments (resident to attending pairing)
- Co-signature workflows for trainee orders and notes
- Research workflow integration
- Training analytics (resident productivity, supervision metrics)
- Grand rounds scheduling integration

---

### CyMed Government Healthcare Workforce Portal

**Target:** Ministry of Health, national health authorities, government hospital networks
**Price Point:** National/regional government contract

Adds to Enterprise:
- National workforce management (cross-facility provider registry)
- Regional assignment tracking (provider deployment across facilities)
- Public health workforce analytics (staffing ratios, geographic distribution)
- Government branding (ministry theming)
- Air-gapped deployment support
- National credential registry integration

---

## Commercial Foundation Integration (P3.C0)

| Feature | Integration Point |
|---|---|
| Licensing | `FeatureFlagService` — each module gated by edition flag |
| Feature Flags | `PROVIDER_EDITIONS` map in `provider_portal/views.py` |
| White Labeling | Workspace logo, color scheme, facility name tokens |
| Government Branding | Ministry of Health theme + national flag branding |
| Subscriptions | `ProviderWorkspace` → tenant subscription tier |
| Usage Metering | `WorkspaceSession`, `ProviderClinicalNote`, `ProviderOrderRequest` events |

## Deployment Profiles

| Profile | Notes |
|---|---|
| Cloud SaaS | Multi-tenant, CyberCom-managed |
| Private Cloud | Single-tenant, hospital-managed |
| Government Cloud | Sovereignty zone |
| Hybrid | Cloud portal + on-prem EHR integration |
| Air-Gapped | Disconnected from internet; internal hospital network only |
