# Accessioning

**App**: `products.cymed.laboratory.accessioning` (label: `lab_accessioning`)

---

## Models

| Model | Purpose |
|-------|---------|
| `AccessionNumberSequence` | Atomic counter per site per year |
| `Accession` | Assigns accession number to specimen |
| `AccessionBatch` | Groups accessions for batch workflow |
| `AccessionAudit` | Immutable log of every accession action |

---

## Accession Number Format

`{PREFIX}-{SITE}-{YEAR}-{SEQUENCE:06d}`

Example: `ACC-HQ-2026-000142`

---

## Atomic Sequence Generation

```python
def next_number(self) -> str:
    with transaction.atomic():
        obj = AccessionNumberSequence.objects.select_for_update().get(pk=self.pk)
        obj.last_sequence += 1
        obj.save(update_fields=["last_sequence"])
        return f"{obj.prefix}-{obj.site_code}-{obj.year}-{obj.last_sequence:06d}"
```

`select_for_update()` prevents duplicate numbers under concurrent load. One row per site per year.

---

## Batch Accessioning

`AccessionBatch` groups multiple specimens processed together (e.g., morning courier delivery). Batch is closed when all specimens are accessioned. Supports multi-site routing.

---

## Feature Flag

`required_feature = "lab.accessioning"`
