# Specimen Management

**App**: `products.cymed.laboratory.specimens` (label: `lab_specimens`)

---

## Models

| Model | Purpose |
|-------|---------|
| `Specimen` | Specimen with barcode, QR code, SNOMED type code |
| `SpecimenContainer` | Tube/container type within a specimen |
| `SpecimenCollectionEvent` | Time, site, collector, volume |
| `SpecimenTransport` | Courier tracking from collection to lab |
| `SpecimenRejection` | Rejection reason with workflow |
| `SpecimenChainOfCustody` | Immutable custody audit (ordered by action_timestamp) |

---

## Lifecycle

```
ORDERED → COLLECTED → IN_TRANSIT → RECEIVED → PROCESSING → STORED | EXHAUSTED
                                                   ↓
                                              REJECTED
```

---

## Barcode & QR Code

Every specimen gets:
- `barcode` — 1D barcode (LIS-assigned, unique)
- `qr_code` — 2D QR payload for mobile scanning
- `snomed_specimen_code` — lookup via `TerminologyService.search(system="snomed")`

---

## Chain of Custody

`SpecimenChainOfCustody` records are **never updated** — only created. Each custody event has:
- `action` — collected, transported, received, accessioned, processed, stored, rejected, discarded
- `performed_by` — UUID of actor
- `location` — free text or site code
- `temperature_celsius` — cold chain compliance

---

## Service: `SpecimenService`

```python
SpecimenService.record_collection(specimen_id, collector_id, collection_site, volume_ml)
SpecimenService.reject_specimen(specimen_id, reason, rejected_by)
```

`reject_specimen` publishes `OutboxEvent(event_type="lab.specimen.rejected")`.

---

## Integration

CyIntegrationHub routes barcode scan events (from mobile apps / label printers) to update specimen status in real time.
