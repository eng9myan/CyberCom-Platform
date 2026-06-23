# CyMed Provider Portal — Provider Telemedicine

## Overview

Provider-side telemedicine enables physicians to conduct video visits, request remote
consults, and provide second opinions through the portal. Fully integrated with the
CyMed Patient Portal (P3.6) for patient-side session joining.

## Session Types

| Type | Use Case |
|---|---|
| `video` | Full video consultation |
| `audio` | Audio-only for bandwidth-limited environments |
| `chat` | Asynchronous secure chat |

## Visit Types

| Visit Type | Clinical Context |
|---|---|
| `follow_up` | Post-discharge or routine follow-up |
| `consultation` | New patient or complex case |
| `second_opinion` | Specialist second opinion on diagnosis |
| `remote_monitoring` | Chronic disease remote monitoring check-in |
| `virtual_round` | ICU virtual rounding session |
| `triage` | Initial virtual triage before in-person visit |

## Integration with Patient Portal

`ProviderTelemedicineSession.cymed_patient_session_id` links to the patient-side
`TelemedicineSession` (P3.6 patient_portal). Both sides join the same meeting:
- Patient joins via Patient Portal mobile app or web
- Provider joins via Provider Portal desktop or mobile
- `meeting_url` is the same for both parties

## Consult Request Workflow

```
Requesting provider creates ConsultRequest (status=pending)
         ↓
Consulting provider reviews and accepts (status=accepted)
         ↓
ProviderTelemedicineSession created (visit_type=consultation)
         ↓
Session completed → consult_note_id linked to ProviderClinicalNote
         ↓
Response summary sent back to requesting provider
```

## Second Opinion Flow

`SecondOpinionRequest`:
1. Requesting provider attaches clinical records (JSONField `attached_records`)
2. Specialist reviews: imaging, lab results, clinical notes
3. Specialist provides written opinion via `opinion_text`
4. `status` transitions: pending → accepted → completed

## AI Session Summary

`ProviderTelemedicineSession.ai_session_summary` — CyAI generated session notes.
Advisory only — provider must review and sign a `ProviderClinicalNote` with the
final session documentation. AI cannot sign.

## Follow-Up Automation

`follow_up_required=True` → `follow_up_date` set → automatic `ClinicalTask` created
(type=patient_callback) assigned to the provider's team for follow-up scheduling.
