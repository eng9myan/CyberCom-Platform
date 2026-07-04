# CyMed Physician Model

> **Status:** Approved — Phase 1.2
> **Owner:** Workforce Planning Architect + Clinical Safety Architect
> **Related Documents:** [healthcare_workforce_architecture.md](healthcare_workforce_architecture.md), [oncall_architecture.md](oncall_architecture.md)

This document establishes the clinical responsibilities, supervision rules, duty-hour controls, and authority boundaries for all physician levels within CyMed.

---

## 1. Physician Roles & Career Tiers

The physician workforce is structured into training grades, practicing specialists, and clinical directors.

```
       [Medical Director] ➔ Clinical Governance & Quality
               │
      [Department Chair] ➔ Specialty Ward Administration
               │
      [Consultant / Attending] ➔ Ultimate Admitting & Treatment Authority
               │
        [Specialist / Fellow] ➔ Independent / Semi-Independent Practice
               │
      [Chief Resident / Resident] ➔ Clinical Training Grade (Supervised)
               │
            [Intern] ➔ Supervised Foundations
```

### 1.1 Training Grades (Supervised)
*   **Intern:** Medical graduate in their first clinical year. Requires direct supervision for all invasive procedures and order entries.
*   **Resident:** Physicians undergoing specialty training. Broad clinical responsibilities, but orders (such as chemotherapy, blood transfusion, or discharge) require co-signature.
*   **Chief Resident:** Senior resident managing the training schedule, ward calls, and teaching workflows.
*   **Fellow:** Post-residency subspecialty trainee (e.g., Cardiology Fellow). Operates with high autonomy but under Attending oversight.

### 1.2 practicing Specialists (Independent)
*   **Specialist:** Board-certified physician practicing independently in general medicine/surgery.
*   **Consultant:** Senior board-certified physician with overall clinical responsibility for patient outcomes.
*   **Attending:** The primary physician of record for an admitted patient.
*   **Surgeon:** Board-certified physician authorized to perform surgical interventions in active OR suites.
*   **Emergency Physician:** Dedicated ER doctors managing triage, resuscitations, and rapid disposition.
*   **Hospitalist:** Dedicated inpatient care specialist managing admissions, inpatient optimization, and discharge handovers.

### 1.3 Executive & Administrative Grades
*   **Medical Director:** Oversees clinical quality, accreditation alignment, and medical staff bylaws.
*   **Department Chair:** Directs clinical activities, scheduling, and coverage requirements for their specific department.

---

## 2. Supervision & Clinical Sign-Off Matrix

To ensure patient safety, the order entry and validation systems enforce mandatory co-signatures based on physician grade:

| Order Category | Intern | Resident | Fellow / Specialist | Consultant / Attending |
|---|---|---|---|---|
| **Routine Lab / Vitals** | Allowed | Allowed | Allowed | Allowed |
| **Oral Medications** | Requires Co-Sign | Allowed | Allowed | Allowed |
| **High-Alert Meds** | Requires Co-Sign | Requires Co-Sign | Allowed | Allowed |
| **Blood Transfusion** | Gated | Requires Co-Sign | Allowed | Allowed |
| **Admitting Order** | Gated | Requires Co-Sign | Allowed | Allowed |
| **Discharge Order** | Gated | Requires Co-Sign | Requires Co-Sign (Audit) | Allowed |
| **Consent for Surgery** | Gated | Gated | Allowed | Allowed |

*Note: "Gated" means the action is blocked in the system until initiated by a clinician with appropriate authority.*

---

## 3. ACGME Duty-Hour Compliance & Safety Rules

To manage fatigue and comply with global training standards (such as ACGME in the USA, and equivalent residency regulations in KSA and UAE), CyMed enforces the following duty-hour rules for training grades (Interns, Residents, Fellows):

```
+-------------------------------------------------------------------+
|                     ACGME Duty-Hour Gates                         |
+-------------------------------------------------------------------+
| Max Weekly Hours      : 80 Hours (averaged over 4 weeks)          |
| Max Shift Duration    : 24 Hours continuous (plus 4h for handover)|
| Minimum Rest (Shift)  : 10 Hours off between active shifts        |
| Minimum Rest (24h)    : 14 Hours off following a 24h shift        |
| Mandatory Day Off     : 1 day in 7 (averaged over 4 weeks)        |
| Continuous Call Freq  : Maximum 1 in 3 nights                    |
+-------------------------------------------------------------------+
```

### Automated Enforcement:
1.  **Roster Block:** The scheduling engine checks historical shifts. If a resident has worked 75 hours in the past 7 days, they are flagged as **Duty-Hour Warning** and blocked from being assigned to further shifts unless overridden by the Department Chair (with mandatory audit logging).
2.  **Clock-Out Enforcement:** If an active shift reaches 28 hours (24h clinical + 4h handover), the system revokes electronic prescribing authority in the EHR for that user to enforce handovers.
