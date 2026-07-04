# Microbiology

**App**: `products.cymed.laboratory.microbiology` (label: `lab_microbiology`)

---

## Models

| Model | Purpose |
|-------|---------|
| `MicrobiologyCulture` | Culture request from specimen |
| `Organism` | Identified organism with SNOMED code |
| `SensitivityTest` | Antibiotic susceptibility per organism |
| `ResistanceProfile` | Resistance mechanism (MRSA, ESBL, CRE, VRE, MDR...) |
| `MicrobiologyResult` | Final interpretive result |

---

## Culture Lifecycle

```
ORDERED → INOCULATED → INCUBATING → PRELIMINARY_RESULT → FINAL_RESULT
                                          ↓
                                     NO_GROWTH (at 48h / 5d)
```

---

## Organism Identification

`Organism.snomed_code` resolved via `TerminologyService.search(system="snomed", query=organism_name)`. No local SNOMED store.

---

## Sensitivity (MIC / Zone)

```python
SensitivityTest(
    organism=organism, antibiotic_code="AMX", antibiotic_name="Amoxicillin",
    method="disk_diffusion",  # broth_microdilution | etest | disk_diffusion
    mic_value=None, zone_diameter=22.0,
    interpretation="S",  # S | I | R | SDD
)
```

EUCAST/CLSI breakpoints applied by the analyzer — interpretation field stored as-is.

---

## Resistance Mechanisms

`ResistanceProfile.resistance_mechanism`:
- `mrsa` — Methicillin-resistant S. aureus
- `esbl` — Extended-spectrum beta-lactamase
- `cre` — Carbapenem-resistant Enterobacteriaceae
- `vre` — Vancomycin-resistant Enterococcus
- `mdr` — Multi-drug resistant
- `xdr` — Extensively drug resistant
- `pdr` — Pan-drug resistant

Published as `OutboxEvent(event_type="lab.resistance.detected")` for infection control alerting.

---

## Feature Flag

`required_feature = "lab.microbiology"` — Advanced edition and above.
