# Phase 3.10 — Healthcare Workforce Management (HWM)

**Status:** COMPLETE  
**Date:** 2026-06-25  
**Module path:** `backend/products/cymed/workforce_management/`  

---

## Summary

Phase 3.10 implements the CyMed Healthcare Workforce Management module — the clinical scheduling, staffing validation, and workforce compliance engine covering all hospital types (Government, Private, Academic, Teaching, Multi-Hospital, Specialty, IDN).

---

## Apps Built (10)

| App | Label | Models | Description |
|-----|-------|--------|-------------|
| `workforce_profiles` | `cymed_hwm_profiles` | 3 | Staff profiles, credentials, competency matrix |
| `scheduling` | `cymed_hwm_scheduling` | 5 | Shift templates, roster cycles, slots, self-schedule windows, quotas |
| `shift_swaps` | `cymed_hwm_swaps` | 3 | Swap requests, approval flows, validation logs |
| `float_pool` | `cymed_hwm_float_pool` | 4 | Float pool members, deployments, agency staff registration, shortage alerts |
| `acuity` | `cymed_hwm_acuity` | 4 | NEWS2 acuity scores, ward coverage requirements, coverage validation, skill mix |
| `oncall` | `cymed_hwm_oncall` | 5 | On-call rosters, assignments (primary/secondary/backup), pages, SLA escalations, call swaps |
| `compliance` | `cymed_hwm_compliance` | 4 | Country/region compliance configs, Ramadan rules, ward ratio configs, audit logs |
| `fatigue` | `cymed_hwm_fatigue` | 4 | Duty hour logs, weekly summaries, fatigue violations, disaster overrides |
| `forecasting` | `cymed_hwm_forecasting` | 4 | Census data points, CyAI-integrated staffing forecasts, adjustments, roster mappings |
| `analytics` | `cymed_hwm_analytics` | 3 | Monthly/weekly analytics snapshots, workforce reports, on-call SLA metrics |

**Total: 39 models, 69 Python files, 3 test files**

---

## Key Capabilities

### Workforce Profiles
- 40+ role types across physician grades (intern → medical director), nursing tiers (15 types including float/travel/agency), allied health
- Clinical credentials with expiry tracking and status (valid/expiring_soon/expired/revoked)
- Competency matrix — codes enforced before specialty ward assignment
- CyIdentity SCIM sync via cached `identity_user_id`; CyCom HR sync via event consumption

### Scheduling
- Shift templates: 8h (morning/afternoon/night), 12h (day/night), fixed, rotating, on-call, research blocks
- Roster cycles with draft → pending_approval → published → closed lifecycle
- Self-scheduling windows (7-day open window, 30 days before target month)
- Slot quotas — auto-lock when target count reached
- Shift check-in / check-out with timestamp tracking

### Shift Swaps
- Full swap workflow: proposed → pending_validation → pending_approval → committed
- Validation log records each check (fatigue, credentials, rest period)
- Committed swaps publish `cymed.hwm.swap.committed` event to outbox

### Float Pool & Agency Staff
- Priority-matrix float deployment (highest vacancy / highest acuity ward first)
- Network float across multi-facility tenants
- Agency staff dual-verification gate: credential + CyIdentity digital check-in → EHR access token issued
- 4-level shortage escalation (Level 0: float pool → Level 1: Head Nurse → Level 2: Nurse Manager → Level 3: Diversion/admission caps)

### Acuity & Coverage Validation
- NEWS2-based patient acuity scoring (Level 1–4 with HPPD targets: 4.0h / 6.5h / 9.5h / 21.0h)
- Dynamic staffing formula: `Target FTE = Σ HPPD(Patient_i) / Shift_Duration × Skill_Mix_Factor`
- Ward coverage requirements per ward type (ICU, NICU, ED, L&D, Pediatrics, Med-Surg, OR)
- Skill mix validation: charge nurse present, ≥30% senior nurse, 100% specialty cert for ICU/NICU/OR
- Roster block on validation failure — non-bypassable constraint

### On-Call
- 8 call modes: in-house (< 5 min SLA), home call (< 30 min SLA), emergency
- 3 tiers: primary / secondary / backup with automatic SLA timer and escalation
- SLA-driven escalation cascade: primary → secondary → consultant → department chair alert
- Call swap approval: resident-to-resident (chief resident sign-off), consultant-to-consultant (department chair sign-off)
- Redis policy cache update marker for correct page routing after swaps

### Compliance (Multi-Country)
- Hierarchical config: Country → Region → Hospital Group → Department Unit
- Pre-configured stubs for USA (FLSA, TJC), Saudi Arabia (CBAHI, Article 98/99), Jordan (JCIA, Article 56), UAE (DHA/DOH, JCIA)
- Ramadan rule: reduced Muslim staff hours (6h daily / 36h weekly) per Saudi Article 99
- California Title 22 nurse-to-patient ratio overrides
- Immutable audit log with cryptographic signature field

### Fatigue & Duty Hours
- ACGME duty-hour gates enforced:
  - Max 80h/week (4-week rolling average)
  - Max 28h shift (24h clinical + 4h handover)
  - Min 10h rest between shifts, 14h rest after 24h shift
  - Max 1-in-3 nights continuous call
  - 75h/7-day → duty hour warning → scheduling block
- Prescribing authority revocation flag on 28h breach
- Disaster override: Medical Director / Director of Nursing bypass with incident ID, immutable audit trail
- Staff-wide gates: max 6 consecutive days (Med-Surg), 4 days (ICU 12h), max 60h/week (staff)

### Forecasting (CyAI Integration)
- Census data ingestion from ER visits, inpatient admissions, outpatient calendars, surgical schedules
- CyAI weekly forecast: predicted census → recommended FTE (nurse + physician split)
- Surge detection with reason flag (influenza, heatwave)
- Scheduler adjustments with reason logging
- Forecast-to-roster mapping for applied staffing recommendations

### Analytics
- Monthly/weekly/daily snapshots: coverage compliance %, vacancy rate, overtime hours, agency hours, float deployments
- On-call SLA metrics: pages within SLA, escalation rate, avg response time, compliance %
- Workforce reports: staffing coverage, fatigue compliance, credential expiry, overtime, agency utilization, acuity trends

---

## Editions (4)

| Edition | Key Additions |
|---------|---------------|
| **Standard** | All core apps (profiles, scheduling, swaps, float pool, acuity, oncall, compliance, fatigue) |
| **Enterprise** | + forecasting, analytics |
| **Academic Medical Center** | + ACGME residency gates, research block scheduling |
| **Government** | + Ramadan rules, civil service rosters, government procurement integration |

---

## Integration Points

| Integration | Event / Method | Direction |
|-------------|---------------|-----------|
| CyCom HR → CyMed | `cycom.employee.hired/updated` event consumed | Inbound |
| CyMed → CyCom Payroll | `cymed.hwm.roster.hours_worked` via CyIntegrationHub | Outbound |
| CyMed → CyConnect | Shortage alerts, on-call pages, escalations via CyIntegrationHub | Outbound |
| CyIdentity | SCIM sync for workforce realm, JWT with employee_id | Platform |
| CyAI | Weekly census forecast via CyData → CyAI model pipeline | Platform |

---

## Signals Published

- `cymed.hwm.roster.hours_worked` — slot completed, syncs to CyCom Payroll
- `cymed.hwm.swap.committed` — swap committed, policy cache updated
- `cymed.hwm.shortage.alert` — staffing shortage escalation triggered
- `cymed.hwm.oncall.page` — on-call page sent via CyConnect
- `cymed.hwm.oncall.escalation` — SLA timer expired, next tier notified
- `cymed.hwm.fatigue.violation` — fatigue gate triggered (includes prescribing authority flag)
- `cymed.hwm.profile.deactivated` — clinician profile deactivated

---

## Documentation Source

Architecture defined in `docs/healthcare/`:
- `healthcare_workforce_architecture.md`
- `nursing_model.md`
- `physician_model.md`
- `clinical_staffing_model.md`
- `shift_management_architecture.md`
- `acuity_staffing_model.md`
- `oncall_architecture.md`
- `workforce_compliance_framework.md`
- `workforce_security_model.md`
