# CyMed Patient Portal — Telemedicine

## Session Lifecycle

```
Schedule → TelemedicineSession (status=scheduled)
Patient joins → patient_joined_at set, status=in_progress
Provider joins → provider_joined_at set
Session ends → ended_at, duration_minutes, status=completed
Rating prompt → TelemedicineRating created
```

## Session Types

| Type | Use Case |
|---|---|
| `video` | Full HD video consultation (default) |
| `audio` | Audio-only for bandwidth-constrained environments |
| `chat` | Asynchronous secure chat consultation |

## Document Sharing

`TelemedicineDocument` allows sharing during or before a session:
- Uploaded by patient: lab results, previous reports, photos
- Uploaded by provider: prescriptions, referrals
- Stored in CyData, referenced by URL
- Types: lab_result, imaging, referral, previous_report, prescription, other

## Secure Chat

`TelemedicineChat` provides in-session messaging:
- `sender_type`: patient, provider, system
- `is_system_message=True` for automated status messages (e.g., "Provider has joined")
- `read_at` tracks message acknowledgment

## Integration

Meeting infrastructure is provided via CyIntegrationHub (P2.6):
- `meeting_url` — HTTPS video session URL (Zoom, MS Teams, Jitsi, or custom)
- `meeting_id` + `meeting_password` — client join credentials
- No video infrastructure inside CyMed — Hub manages the integration

## Follow-Up

After session:
- `follow_up_required=True` → `follow_up_date` set
- Portal creates a new `PortalAppointmentRequest` with `appointment_type=follow_up`
- Patient receives `PatientNotification` with follow-up reminder

## Quality Metrics

`TelemedicineRating` captures:
- `audio_quality_rating`, `video_quality_rating` — technical quality feedback
- `provider_rating` — clinical quality
- `would_use_again` — NPS proxy
- Feeds into `ProviderReview` aggregation for directory ratings
