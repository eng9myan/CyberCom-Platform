# CyGov Integration Guide

## Overview

CyMed Population Health integrates with CyGov (the CyberCom Government Platform) for national identity verification, professional licensing, citizen services, and government registry synchronization. All integration uses CyIntegrationHub events — no direct database access, no shared ORM.

## Integration Architecture

```
CyMed Population Health
        │
        ▼ (CyIntegrationHub events only)
CyIntegrationHub (P2.X)
        │
        ├─► CyGov Identity
        │       └── National Health ID verification
        │           Patient deduplication via national_id_hash
        │
        ├─► CyGov Licensing
        │       └── National Provider registration sync
        │           Facility license validation
        │           Credential verification
        │
        ├─► CyGov Citizen Services
        │       └── Health pass issuance notification
        │           Vaccination certificate for travel
        │           Digital health wallet (citizen portal)
        │
        └─► CyGov Registries
                └── National disease registry reporting
                    Program enrollment reporting
                    Outbreak notification (IHR events)
```

## Event Catalog

### CyMed Population Health → CyGov

| Event Type | Destination | Trigger |
|---|---|---|
| `cymed.ph.national_id.verify_request` | cygov_identity | NationalHealthID.verify action |
| `cymed.ph.outbreak.detected` | cygov_health | Outbreak.created |
| `cymed.ph.outbreak.alert` | cygov_health | OutbreakAlert created (orange/red) |
| `cymed.ph.case.notified` | cygov_health | SurveillanceCase.notify_authority |
| `cymed.ph.program.enrollment` | cygov_registries | ProgramEnrollment.created |
| `cymed.ph.health_pass.issued` | cygov_citizen_services | HealthPass.created |
| `cymed.ph.vaccination_cert.issued` | cygov_citizen_services | VaccinationCertificate.created |
| `cymed.ph.registry.outcome` | cygov_registries | RegistryOutcome.created (national registry) |

### CyGov → CyMed Population Health (inbound via OutboxEvent)

| Event Type | Handler | Action |
|---|---|---|
| `cygov.identity.verified` | ph_signals | Update NationalHealthID.id_status → active |
| `cygov.licensing.provider_suspended` | ph_signals | Update NationalProvider.registration_status → suspended |
| `cygov.licensing.facility_revoked` | ph_signals | Update NationalFacility.license_status → revoked |

## Security Boundary

- No shared database schema between CyMed and CyGov
- No direct API calls from CyMed models to CyGov endpoints
- All inbound CyGov events are authenticated by CyIntegrationHub with signature verification
- `national_id_hash` is a one-way hash — raw national ID numbers are never stored in CyMed
- Patient-CyGov identity linkage uses `national_id_number` (in NationalHealthID) which is managed by CyGov Identity, not derived locally

## IHR Event Reporting Flow

```
1. SurveillanceCase created (is_notifiable=True)
2. POST /surveillance/cases/{id}/notify_authority/ (human-initiated)
3. CyIntegrationHub.send(destination="cygov_health", event_type="cymed.ph.case.notified")
4. CyGov Health relays to Ministry / WHO IHR focal point
5. Reference number returned → stored in CaseInvestigation.findings
```

AI cannot initiate step 2. Human authorization is required at every notification step.
