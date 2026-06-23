# CyMed Patient Portal — Commercial Packaging

## Product Editions

### CyMed Patient Portal (Standard)

**Target:** Clinics, outpatient centers, small hospitals, retail pharmacies
**Price Point:** Per-provider licensing

Included modules:
- `accounts` — self-registration, profile, preferences, MFA
- `directory` — provider search and listing
- `appointments` — book, reschedule, cancel, waitlist, reminders
- `medical_records` — view diagnoses, allergies, immunizations, documents
- `laboratory_results` — result viewing, trend charts, PDF download
- `imaging_results` — radiology reports, study metadata
- `prescriptions` — active prescriptions, medication instructions
- `notifications` — push, email, SMS
- `consents` — treatment and data sharing consents

---

### CyMed Patient Portal Enterprise

**Target:** Hospital systems, multi-specialty groups, health maintenance organizations
**Price Point:** Per-facility licensing + usage metering

Adds to Standard:
- `telemedicine` — video, audio, chat, document sharing
- `messaging` — secure provider-patient messaging (CyConnect)
- `wallet` — digital health cards, health passes, vaccination records
- `payments` — invoice management, online payments, installment plans
- `insurance` — insurance cards, coverage verification, preauth, claims
- `family_accounts` — dependent management, caregiver access
- `health_journey` — timeline, patient journey, milestones, care episodes

---

### CyMed Patient Portal Government

**Target:** National health systems, ministry of health deployments, public hospitals
**Price Point:** National licensing + sovereign deployment

Adds to Enterprise:
- National identity integration (Absher, MOHAP, eHealth, Unified Health ID)
- National health wallet (government-issued passes)
- Public health programs (vaccination campaigns, screening programs)
- Government branding (white-label theming)
- Air-gapped deployment support
- National analytics (aggregate health statistics, population health)

---

### CyMed National Digital Health Portal

**Target:** National digital health transformation programs
**Price Point:** Government contract licensing

Adds to Government:
- Multi-provider national network directory
- Federated identity across providers
- National vaccination registry integration
- Cross-border health credential verification
- Population health analytics (CyData + CyAI)
- National health data lake integration

---

## Commercial Foundation Integration

Consumes Program 3.C0 Commercial Foundation:

| Feature | Integration Point |
|---|---|
| Licensing | `FeatureFlagService` — each module gated by feature flag |
| Feature Flags | `PORTAL_EDITIONS` map in `patient_portal/views.py` |
| White Labeling | `ClinicListing.logo_url`, `HospitalListing.cover_image_url`, branding config |
| Government Branding | Deployment profile → portal theme tokens |
| Subscriptions | `PatientPortalAccount` → tenant subscription tier |
| Usage Metering | `MedicalRecordAccess`, `TelemedicineSession`, `MessageThread` events |

## Deployment Profiles

| Profile | Notes |
|---|---|
| Cloud SaaS | Multi-tenant, CyberCom-managed |
| Private Cloud | Single-tenant, customer-managed cloud |
| Government Cloud | Sovereignty zone, government network only |
| Hybrid | Cloud portal + on-prem clinical systems |
| Air-Gapped | Disconnected from internet; local patient access |
