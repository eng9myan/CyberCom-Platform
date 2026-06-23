# Dispensing — CyMed Pharmacy Edition
*Program 3.5*

---

## Overview

The Dispensing module manages the complete pharmacy dispensing workflow from prescription receipt to patient pickup. Supports retail counter, bedside delivery, unit-dose cassettes, ADC, robot, and mail-order dispensing.

---

## Dispensing Workflow

```
Prescription Verified
       │
       ▼
DispenseOrder Created (queued)
       │
       ▼
Medication Picked / Barcode Scanned
       │
       ▼
Pharmacist Verification (POST /verify/)
       │
       ▼
Ready for Pickup (status: ready)
       │
       ▼
Patient Pickup (POST /dispense/)
    - Pickup ID verified
    - Counseling documented
       │
       ▼
Events: cymed.pharmacy.dispense.completed
        cymed.inventory.consumed
```

---

## Batch Dispensing (Inpatient)

```
DispenseBatch Created
    ├── Unit Dose Cassette Fill
    ├── Ward Distribution
    ├── ADC Restock
    └── Robot Fill

POST /dispensing/batches/{id}/verify/ → Pharmacist batch verification
```

---

## Barcode Verification

```
POST /dispensing/orders/{id}/barcode-verify/
{
  "item_id": "<DispenseItem UUID>",
  "ndc_code": "0093-2264-01"
}
```

Compares scanned NDC with expected NDC on DispenseItem. Returns 400 on mismatch with expected vs scanned comparison.

---

## Dual Pharmacist Check (High-Risk Medications)

`DispenseVerification` supports:
- `first_check` — initial pharmacist
- `second_check` — second independent pharmacist
- `final_check` — senior pharmacist sign-off

---

## Audit Trail

`DispenseAudit` is immutable. Every action creates a new audit record:
created → assigned → picked → barcode_scanned → verified → dispensed → returned/cancelled

Override actions carry `is_override=True` with reason.

---

## Automation Integration

All automation device commands route through CyIntegrationHub:
```
DispenseOrder → AutomationQueue → CyIntegrationHub → ADC/Robot/Cabinet
                                         ↓
                               hub_request_id (tracked)
                               hub_response (stored)
```

---

## FHIR

`DispenseOrder` → `MedicationDispense`

`fhir_medication_dispense_id` is indexed for cross-system lookups.
