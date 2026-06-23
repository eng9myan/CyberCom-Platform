# Histopathology

**App**: `products.cymed.laboratory.histopathology` (label: `lab_histopathology`)

---

## Models

| Model | Purpose |
|-------|---------|
| `HistologyCase` | Histology workflow for a pathology case |
| `TissueBlock` | Paraffin block (cassette) |
| `Slide` | Individual glass/digital slide |
| `SlideReview` | Pathologist review with findings |
| `HistologyDiagnosis` | Histological diagnosis |
| `SpecialStain` | Additional stain request (PAS, Ziehl-Neelsen...) |
| `Immunohistochemistry` | IHC panel results |
| `MolecularStudy` | FISH, ISH, PCR on tissue |

---

## Embedding & Sectioning

```
TissueBlock.embedding_status: pending → embedding → embedded → failed
TissueBlock.sectioning_status: pending → sectioning → sectioned → failed
```

---

## Slides

`Slide`:
- `stain_type` — he | pas | masson_trichrome | ziehl_neelsen | giemsa | special
- `barcode` — unique scannable label
- `digital_scan_url` — URL to whole-slide image (digital pathology)
- `scan_magnification` — 20x / 40x

---

## CyAI Integration

`SlideReview.ai_assistance_used` — boolean, set when pathologist invokes AI.  
`SlideReview.ai_suggestions` — JSON blob with AI-generated findings.

AI suggestions are advisory only. Pathologist must explicitly accept, modify, or reject each suggestion before signing `HistologyDiagnosis`.

---

## Immunohistochemistry

`Immunohistochemistry`:
- `marker` — ER, PR, HER2, Ki67, CD20...
- `result` — positive | negative | equivocal
- `staining_intensity` — weak | moderate | strong
- `percentage_positive` — decimal (0.00–100.00)

---

## Feature Flag

`required_feature = "lab.histopathology"` — Advanced edition and above.
