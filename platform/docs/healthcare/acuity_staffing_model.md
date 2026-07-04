# CyMed Acuity-Based Staffing & Safety Model

> **Status:** Approved — Phase 1.2
> **Owner:** Clinical Safety Architect + Chief Nursing Informatics Architect
> **Related Documents:** [healthcare_workforce_architecture.md](healthcare_workforce_architecture.md), [nursing_model.md](nursing_model.md)

This document establishes the formulas, ratios, acuity-scoring integrations, and fatigue-management safety limits that govern staffing allocations in CyMed.

---

## 1. Nurse-to-Patient & Physician Coverage Ratios

CyMed enforces ward-specific staffing ratios. These are default configurations that can be overridden at the hospital or regional level (e.g., California state mandates vs. Middle East regional guidelines).

| Ward Type | Day Shift Ratio (Nurse:Patient) | Night Shift Ratio (Nurse:Patient) | Minimum Physician Presence (On-Site) |
|---|---|---|---|
| **Intensive Care (ICU)** | 1:1 or 1:2 | 1:1 or 1:2 | 1 Dedicated Intensivist (24/7) |
| **Neonatal ICU (NICU)** | 1:1 or 1:2 | 1:1 or 1:2 | 1 Neonatologist (24/7) |
| **Emergency Department (ED)** | 1:3 (Triage is 1:1) | 1:3 | 2 Emergency Physicians (24/7) |
| **Labor & Delivery (L&D)** | 1:1 (Active labor) | 1:2 | 1 OB-GYN Attending (24/7) |
| **Pediatrics** | 1:4 | 1:5 | 1 Pediatrician (24/7) |
| **Medical-Surgical Ward** | 1:4 or 1:5 | 1:6 or 1:8 | 1 Hospitalist / Intern (24/7) |

---

## 2. Dynamic Acuity-Based Staffing (HPPD Model)

Fixed ratios act as a baseline, but CyMed's validator evaluates **patient acuity** dynamically in real-time by consuming data from the CyMed EHR module. 

### 2.1 Acuity Level Classification (NEWS2 Integration)
CyMed uses the National Early Warning Score (NEWS2) and clinical parameters to score patient acuity:

```
[EHR Patient Vitals & Notes] ➔ [Acuity Calculator] ➔ Patient Classification:
  - Level 1: Stable (HPPD = 4.0h)
  - Level 2: Moderate Care (HPPD = 6.5h)
  - Level 3: High Dependency (HPPD = 9.5h)
  - Level 4: Intensive Care (HPPD = 18.0h - 24.0h)
```

*   **HPPD (Hours per Patient Day):** The target nursing hours allocated to a patient over a 24-hour cycle.
*   **Dynamic Staffing Formula:**
    $$\text{Target Ward FTE} = \frac{\sum_{i=1}^{N} \text{HPPD}(\text{Patient}_i)}{\text{Shift Duration (Hours)}} \times \text{Skill Mix Factor}$$

### 2.2 Skill Mix Validation Rules
The scheduler validates that the shift team contains the proper blend of skills and certifications:
*   **Charge Nurse Requirement:** Every ward must have at least one active Charge Nurse or Head Nurse scheduled on every shift.
*   **Experience Mix:** A minimum of **30%** of scheduled nurses on duty must hold "Senior Nurse" or higher credentials.
*   **Specialty Certification Check:** ICU, NICU, and OR wards require **100%** of their direct care staff to hold specialty-specific certifications.

---

## 3. Fatigue Management & Safety Controls

To protect clinicians and patients from the risks of fatigue, CyMed enforces non-bypassable scheduling gates across all contract types.

```
+-------------------------------------------------------------------+
|                  Fatigue Management Gateways                      |
+-------------------------------------------------------------------+
| Max Consecutive Days  : 6 Days (Med-Surg) / 4 Days (ICU 12h)      |
| Max Weekly Work Hours : 60 Hours (Staff) / 80 Hours (Residency)   |
| Max Shift Length      : 12.5 Hours (Nurses) / 28 Hours (Residents)|
| Mandatory Rest Period : 11 Hours off between shifts               |
| Consecutive Night Caps: Maximum 3 night shifts in a row           |
+-------------------------------------------------------------------+
```

### Safety Override Protocol:
1.  **Block:** A scheduler attempting to assign a clinician to a shift that violates these parameters is blocked.
2.  **Emergency Elevation:** In disaster scenarios, the Medical Director or Director of Nursing can enter a **Disaster Overrides Bypass** token, which requires:
    *   Selecting the active Incident ID.
    *   Acknowledge that all fatigue indicators will be tracked and flagged for post-incident review.
    *   Dynamic security logging to the Immutable Audit Sink.
