# Disease Surveillance & Outbreak Management

## Purpose

Real-time tracking of notifiable diseases, outbreak detection, case investigation, and public health event management. Supports mandatory notification workflows to national health authorities.

## Models

### SurveillanceCase
Core surveillance record linking a patient to a reportable disease event. `case_type`: confirmed / probable / suspected / not_a_case. `is_notifiable` flags diseases requiring mandatory reporting (e.g., cholera, COVID-19, measles). `notification_sent` + `notification_sent_at` provide an audit trail of authority notifications. `outbreak_id` links cases to an Outbreak when clustering is detected.

### Outbreak
Groups multiple cases of the same disease into an outbreak event. `severity_level` (low/medium/high/critical) triggers alert escalation. `is_reported_to_authority` tracks mandatory reporting compliance. Tracked counts: `affected_count`, `suspected_count`, `confirmed_count`, `deaths_count`.

### OutbreakAlert
Time-stamped alerts issued during an outbreak lifecycle. `alert_level` (green/yellow/orange/red) drives notification logic — orange and red alerts publish to the OutboxEvent bus and are forwarded to CyGov via CyIntegrationHub.

### PublicHealthEvent
Broader public health events not tied to a specific disease: mass gatherings, natural disasters, environmental hazards, vaccination drives. `response_status` tracks: planning / active / completed / cancelled.

### CaseInvestigation
Epidemiological investigation record for a confirmed/probable case. Tracks exposure history, contact identification and tracing counts, and investigation outcome.

## Notification Flow

```
SurveillanceCase.is_notifiable = True
        │
        ▼
POST /surveillance/cases/{id}/notify_authority/
        │
        ├─► OutboxEvent: cymed.ph.case.notified
        └─► CyIntegrationHub → cygov_health: cymed.ph.case.notified
```

## Outbreak Signal Flow

```
Outbreak created (severity_level any)
        │
        ├─► OutboxEvent: cymed.ph.outbreak.detected
        └─► CyIntegrationHub → cygov_health (always)

OutbreakAlert created with alert_level in (orange, red)
        └─► OutboxEvent: cymed.ph.outbreak.alert
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/surveillance/cases/` | List / create surveillance cases |
| POST | `/surveillance/cases/{id}/notify_authority/` | Send mandatory notification |
| GET/POST | `/surveillance/outbreaks/` | List / create outbreaks |
| POST | `/surveillance/outbreaks/{id}/contain/` | Mark outbreak contained |
| POST | `/surveillance/outbreaks/{id}/resolve/` | Mark outbreak resolved |
| GET/POST | `/surveillance/alerts/` | Outbreak alerts |
| GET/POST | `/surveillance/events/` | Public health events |
| GET/POST | `/surveillance/investigations/` | Case investigations |

## IHR Compliance

Disease codes follow ICD-11 sourced from TerminologyService. For International Health Regulations (IHR 2005) notifiable events, `is_notifiable=True` and `is_reported_to_authority=True` on the Outbreak model.

## AI Integration (Advisory Only)

CyAI Outbreak Prediction generates `OutbreakForecast` records in the analytics module. These are strictly advisory (`is_advisory_only=True`) — CyAI cannot declare an outbreak, escalate an alert level, or notify any authority autonomously.
