# Drug Interaction Engine — CyMed Pharmacy Edition
*Program 3.5*

---

## Overview

The Drug Interaction Engine checks 5 interaction types before dispensing and provides AI-assisted priority scoring via CyAI. **All override decisions require human pharmacist approval.**

---

## Interaction Types

| Type | Description | Severity Range |
|------|-------------|----------------|
| `drug_drug` | Drug-Drug Interaction | All levels |
| `drug_allergy` | Drug-Allergy Cross-Reaction | Severe / Contraindicated |
| `drug_diagnosis` | Drug-Diagnosis Contraindication | Moderate / Severe |
| `drug_age` | Age-Inappropriate Medication | Minor / Moderate |
| `drug_pregnancy` | Pregnancy Category Risk | C / D / X |
| `drug_renal` | Renal Impairment Adjustment | Moderate / Severe |
| `drug_hepatic` | Hepatic Impairment Adjustment | Moderate / Severe |
| `drug_food` | Drug-Food Interaction | Minor / Moderate |
| `duplicate_therapy` | Duplicate Therapeutic Class | Informational |

---

## Severity Levels

| Level | Auto-Block | Pharmacist Required |
|-------|-----------|---------------------|
| `contraindicated` | Configurable | Always |
| `severe` | Optional | Always |
| `moderate` | No | Yes |
| `minor` | No | Optional |
| `informational` | No | No |

---

## AI Integration (CyAI)

- CyAI provides `ai_priority_score` (0.0–1.0) for each detected interaction.
- CyAI provides `ai_clinical_context` — explanation of clinical significance.
- **AI cannot override or approve interactions.**
- **Human pharmacist approval required for all overrides.**

---

## Interaction Check API

```
POST /api/v1/pharmacy/interactions/detected/check/
{
  "patient_id": "<UUID>",
  "drug_codes": ["RXN-001", "RXN-002"],
  "patient_allergies": ["ALLERGEN-PCN"],
  "patient_diagnoses": ["B20"],
  "patient_age_years": 72,
  "is_pregnant": false
}
```

Response:
```json
{
  "interaction_count": 2,
  "interactions": [...]
}
```

---

## Override API

```
POST /api/v1/pharmacy/interactions/detected/{id}/override/
{
  "override_reason": "Patient has documented tolerance. Benefits outweigh risks per specialist consultation."
}
```

Override reason minimum: 10 characters. Pharmacist authentication required.

---

## Events Published

- `cymed.pharmacy.interaction.detected` — on detection
- `cymed.pharmacy.interaction.overridden` — on pharmacist override
