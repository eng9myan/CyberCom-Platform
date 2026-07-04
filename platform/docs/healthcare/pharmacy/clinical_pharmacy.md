# Clinical Pharmacy — CyMed Pharmacy Edition
*Program 3.5*

---

## Overview

The Clinical Pharmacy module enables pharmacists to perform formal medication reviews, document clinical interventions, provide prescriber recommendations, and manage Medication Therapy Management (MTM) programs.

---

## Medication Review Types

| Type | Description |
|------|-------------|
| `dur` | Drug Utilization Review |
| `cmr` | Comprehensive Medication Review |
| `tmr` | Targeted Medication Review |
| `admission` | Admission Medication Review |
| `discharge` | Discharge Medication Review |
| `transfer` | Transfer Medication Review |

---

## AI Integration (CyAI — Advisory Only)

```
POST /pharmacy/clinical/reviews/{id}/ai-analyze/
{
  "patient_age": 72
}
```

CyAI returns:
- `risk_score` → `ai_polypharmacy_score`
- `risk_level` → low | moderate | high | critical
- `adherence_score` → 0.0–1.0

**CyAI cannot modify prescriptions, orders, or recommendations. Pharmacist acts on CyAI findings.**

---

## Clinical Intervention Types

- Dose Optimization
- Drug Substitution
- Therapy Addition / Discontinuation
- Drug Interaction Resolution
- Allergy Resolution
- Compliance Counseling
- Cost Optimization
- Route of Administration Change
- Monitoring Recommendation

---

## MTM Programs (Retail Pharmacy)

`MedicationTherapyManagement` supports:
- Initial Assessment
- Follow-Up Sessions
- Annual Comprehensive Review
- Targeted Intervention

Tracks: conditions addressed, medications addressed, barriers, action plan, follow-up date, patient satisfaction (1–5), billing CPT code.

---

## Polypharmacy Risk Levels

| Level | Description |
|-------|-------------|
| low | < 5 concurrent medications |
| moderate | 5–9 medications, manageable interactions |
| high | 10+ medications or clinically significant interactions |
| critical | Contraindicated combinations or unsafe polypharmacy |
