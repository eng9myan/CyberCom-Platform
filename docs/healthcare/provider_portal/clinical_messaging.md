# CyMed Provider Portal — Clinical Messaging

## Overview

CyMed Provider Portal clinical messaging is an end-to-end encrypted, audit-trailed,
HIPAA-compliant secure communication system for clinical teams. It integrates with
CyConnect for persistent message storage and cross-platform delivery.

## Thread Types

| Type | Use Case |
|---|---|
| `direct` | Physician-to-physician or physician-to-nurse |
| `team` | Unit or department team channel |
| `patient_discussion` | Case discussion attached to a patient |
| `handoff` | Structured handover communication |
| `consult_request` | Asynchronous specialist consult |
| `escalation` | Urgent escalation requiring immediate attention |
| `clinical_group` | Specialty or committee group message |

## Security Architecture

- All messages encrypted in transit (TLS 1.3)
- End-to-end encryption for direct messages
- `is_encrypted=True` default on all threads
- Retention policy: `ClinicalGroup.message_retention_days` (default 365)
- `ClinicalMessage` immutable after send (audit integrity)
- Thread audit trail via `MessageThreadParticipant.last_read_at`

## Urgent/Escalation Threading

`ClinicalMessageThread.is_urgent=True`:
- Triggers `MobilePushNotification` with `priority=critical`
- Bypasses quiet hours on mobile
- Shows red banner in desktop workspace
- Thread cannot be archived until `status=resolved`

## Patient-Context Messaging

`ClinicalMessageThread.patient_id` links a thread to a specific patient:
- Appears in patient context sidebar during rounds
- Automatically attached to `CareEpisode` on discharge
- Accessible in care team message history

## CyConnect Integration

`ClinicalMessageThread.cyconnect_thread_id` links to CyConnect (P2.x) for:
- Cross-device message sync (desktop + mobile)
- External provider messaging (outside portal)
- Read receipts via CyConnect
- Long-term message archival

## Clinical Groups

`ClinicalGroup` models standing teams/departments/committees:
- `group_type`: department/unit/specialty/on_call/committee/ad_hoc
- `members` JSONField — curated membership list
- `admin_provider_id` — group admin manages membership
- Used to broadcast announcements and shift-change communications

## Message Retention Compliance

Per regulatory requirements:
- Direct clinical messages: retained 7 years
- Patient discussion threads: retained 10 years
- Administrative messages: retained 3 years
- `message_retention_days` on `ClinicalGroup` configures group-level policy
