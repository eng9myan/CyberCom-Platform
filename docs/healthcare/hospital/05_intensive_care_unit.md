# Intensive Care Unit (ICU)
**CyMed Hospital Edition | Module: ICU**

---

## Overview

The ICU module provides comprehensive critical care tracking including ventilator management, physiological scoring, and critical event logging. It is the clinical system of record for all ICU-level care.

---

## Models

| Model | Description |
|---|---|
| `ICUStay` | ICU admission linked to a `HospitalStay`; tracks ventilator status and invasive line count |
| `ICURound` | Frequent vital signs charting (HR, MAP, Temp, RR, SpO2) |
| `ICUAssessment` | Multi-organ dysfunction scoring (SOFA, APACHE II, GCS) |
| `VentilatorRecord` | Per-session ventilator settings log (mode, FiO2, PEEP, rate) |
| `CriticalEvent` | Real-time logging of critical events (cardiac arrest, intubation, line displacement) |

---

## API Endpoints

```
POST  /api/v1/hospital/icu/stays/
POST  /api/v1/hospital/icu/rounds/
POST  /api/v1/hospital/icu/assessments/
POST  /api/v1/hospital/icu/ventilators/
POST  /api/v1/hospital/icu/critical-events/
```

---

## Clinical Scoring Integration

### SOFA (Sequential Organ Failure Assessment)
- Score ≥ 10 triggers `cymed.hospital.icu.alert` (alert_type: `high_sofa_score`)
- Indicates imminent risk of multi-organ failure

### APACHE II
- Stored for mortality risk prediction and benchmarking

### Glasgow Coma Scale (GCS)
- Tracked on each `ICUAssessment`

---

## Events Emitted (OutboxEvent)

| Trigger | Event Type | Topic |
|---|---|---|
| ICU Stay created | `cymed.charge.created` (charge_type: icu_room, AED 1,200/day) | `cymed.billing.events` |
| FiO2 ≥ 60% on ventilator | `cymed.hospital.icu.alert` (alert_type: critical_ventilator_settings) | `cymed.hospital.events` |
| Ventilator record created | `cymed.charge.created` (charge_type: ventilator_use) | `cymed.billing.events` |
| SOFA score ≥ 10 | `cymed.hospital.icu.alert` (alert_type: high_sofa_score) | `cymed.hospital.events` |
| Critical event logged | `cymed.hospital.icu.alert` (alert_type: critical_event_{type}) | `cymed.hospital.events` |

---

## Ventilator Modes Supported

| Code | Mode |
|---|---|
| AC / ACMV | Assist-Control / Volume-Controlled |
| SIMV | Synchronized Intermittent Mandatory Ventilation |
| PSV | Pressure Support Ventilation |
| CPAP | Continuous Positive Airway Pressure |
