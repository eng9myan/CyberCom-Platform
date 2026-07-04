# Emergency Department (ED)
**CyMed Hospital Edition | Module: Emergency**

---

## Overview

The Emergency Department module manages the full ED patient flow from arrival through disposition. It implements ESI (Emergency Severity Index) triage, NEWS2 physiological deterioration scoring, real-time tracking, and automated clinical alerts.

---

## Models

| Model | Description |
|---|---|
| `EmergencyVisit` | Primary ED record — patient arrival, presenting complaint, status |
| `EmergencyTriage` | ESI level (1–5) triage assessment with nurse assignment |
| `EmergencyAcuity` | NEWS2 physiological acuity score tracking |
| `EmergencyDisposition` | Final ED disposition (admitted, discharged, transferred, DAMA) |
| `EmergencyObservation` | Vital signs charting during ED stay |
| `EmergencyTracking` | Location-based patient tracking within the ED |

---

## API Endpoints

```
POST   /api/v1/hospital/emergency/visits/
POST   /api/v1/hospital/emergency/triage/
POST   /api/v1/hospital/emergency/acuities/
POST   /api/v1/hospital/emergency/observations/
POST   /api/v1/hospital/emergency/tracking/
POST   /api/v1/hospital/emergency/dispositions/
```

---

## ESI Triage Logic

| ESI Level | Clinical Meaning | Visit Status Assigned |
|---|---|---|
| 1 | Resuscitation | `resuscitation` + ICU alert triggered |
| 2 | Emergent | `resuscitation` |
| 3–5 | Urgent / Less Urgent / Non-urgent | `fast_track` |

---

## Events Emitted (OutboxEvent)

| Trigger | Event Type | Topic |
|---|---|---|
| ED Visit created | `cymed.charge.created` (charge_type: emergency_admission) | `cymed.billing.events` |
| ESI Level 1 triage | `cymed.hospital.icu.alert` (alert_type: critical_esi_level_1) | `cymed.hospital.events` |
| NEWS2 score ≥ 5 | `cymed.hospital.icu.alert` (alert_type: high_news2_deterioration) | `cymed.hospital.events` |

---

## Clinical Scoring Systems

### NEWS2 (National Early Warning Score 2)
- Score ≥ 5 = Clinical deterioration / Sepsis alert
- Automatic `cymed.hospital.icu.alert` event fired
- Triggers downstream ICU escalation workflow

### ESI (Emergency Severity Index)
- 5-level triage acuity scale
- Level 1 = immediate life threat → ICU alert + resuscitation status
