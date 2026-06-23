# Clinical Command Center & Capacity Management
**CyMed Hospital Edition | Modules: Clinical Command Center, Capacity Management**

---

## Clinical Command Center Overview

The Clinical Command Center provides hospital leadership and operations managers with a real-time operational dashboard. It aggregates live data from all clinical modules into a single normalized response.

### API Endpoint

```
GET  /api/v1/hospital/command-center/metrics/
```

### Response Structure

```json
{
  "operational_census": {
    "active_admissions": 142,
    "current_occupied_beds": 138,
    "emergency_waiting": 23,
    "icu_occupancy": 18,
    "scheduled_procedures_today": 14
  },
  "capacity_indicators": {
    "bed_occupancy_percentage": 92.0,
    "icu_ventilator_utilization": 18,
    "discharge_efficiency_index": 0.85
  },
  "staffing_compliance": {
    "nurse_to_patient_ratio_adherence": "100% compliant",
    "physician_duty_hours_compliance": "98.2% compliant"
  }
}
```

### Data Sources

| Metric | Source Model |
|---|---|
| active_admissions | `Admission` (status=admitted) |
| current_occupied_beds | `BedAssignment` (released_at is null) |
| emergency_waiting | `EmergencyVisit` (status in triage/fast_track/resuscitation/observation) |
| icu_occupancy | `ICUStay` (icu_released_at is null) |
| scheduled_procedures_today | `SurgicalCase` (status=scheduled) |

---

## Capacity Management Module Overview

The Capacity Management module enables proactive hospital surge planning and overflow management.

### Capacity Management Models

| Model | Description |
|---|---|
| `CapacityRule` | Threshold rule linking a metric source to an action plan |
| `CapacityThreshold` | Real-time threshold monitor (normal, warning, critical) |
| `SurgePlan` | Mass casualty / surge event plan with allocated bed count |
| `OverflowUnit` | Temporary overflow unit (capacity + current occupancy + open/closed status) |

### Capacity Management API Endpoints

```
POST  /api/v1/hospital/capacity/rules/
POST  /api/v1/hospital/capacity/thresholds/
POST  /api/v1/hospital/capacity/surge-plans/
POST  /api/v1/hospital/capacity/overflow-units/
```

### Metric Source Types

| Value | Description |
|---|---|
| `census` | Overall hospital occupancy |
| `ed_waiting` | Emergency department waiting volume |
| `icu_occupancy` | ICU bed utilization |

### Surge Activation

- Surge plans are activated by setting `is_active = True`
- This triggers an outbound event to notify the operations center and capacity command
- `allocated_beds_count` defines the emergency bed allocation for the surge
