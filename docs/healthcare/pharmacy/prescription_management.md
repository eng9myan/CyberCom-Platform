# Prescription Management — CyMed Pharmacy Edition
*Program 3.5*

---

## Models

### Prescription
Core Rx record. Supports outpatient, inpatient, emergency, discharge, controlled, and standing prescriptions.

**Key fields:**
- `prescription_number` (unique, auto-generated `RX-{UUID}`)
- `patient_id`, `prescriber_id` (UUID refs to CyMed Core / CyIdentity)
- `prescription_type`: outpatient | inpatient | emergency | discharge | controlled | standing
- `status`: draft → pending → active → dispensed → completed | cancelled | expired
- `is_controlled`, `dea_schedule` — DEA Schedule I–V tracking
- `refills_authorized`, `refills_dispensed` — refill lifecycle
- `fhir_medication_request_id` — FHIR MedicationRequest ID
- `allergy_override`, `interaction_override` — documented override with reason

**Property:** `can_refill` → True if active and refills remaining.

### PrescriptionItem
Individual medication line within a prescription.

**Key fields:** `drug_code` (RxNorm via TerminologyService), `dose`, `route`, `frequency`, `sig`, `dispense_as_written` (DAW flag)

### MedicationOrder
Hospital inpatient medication order. Linked to admission + ward. Types: scheduled, PRN, one-time, STAT, continuous, unit-dose, IV admixture.

### MedicationRenewal
Renewal request workflow: requested → under_review → pending_prescriber → authorized | denied.

### MedicationRefill
Each physical refill event. Tracks quantity, days supply, pickup method, and who collected.

### PrescriptionAttachment
Scanned handwritten Rx, prior auth, patient ID. File stored in CyData — URL reference only.

### MedicationHistory
Longitudinal per-patient medication history across all encounters. Sources: prescription, admission, patient_reported, transfer, discharge, external. FHIR: `MedicationStatement`.

---

## FHIR

- `Prescription` → `MedicationRequest`
- `MedicationOrder` → `MedicationRequest` (inpatient)
- `MedicationHistory` → `MedicationStatement`

---

## API Endpoints (mounted at `/api/v1/pharmacy/prescriptions/`)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `rx/` | List / create prescriptions |
| GET/PUT/PATCH | `rx/{id}/` | Retrieve / update |
| POST | `rx/{id}/verify/` | Pharmacist verification |
| POST | `rx/{id}/cancel/` | Cancel prescription |
| GET | `rx/{id}/medication-history/` | Patient medication history |
| GET/POST | `orders/` | Medication orders |
| POST | `orders/{id}/verify/` | Pharmacist verify order |
| GET/POST | `renewals/` | Renewal requests |
| GET/POST | `refills/` | Refill events |
| GET/POST | `history/` | Medication history |

---

## Business Rules

1. Pharmacist verification required before dispensing.
2. Controlled substances require prescriber DEA number.
3. Allergy/interaction overrides require documented reason.
4. `can_refill` is False if refills_authorized == refills_dispensed.
5. Prescription status transitions: pending → active (by pharmacist) → dispensed (by dispense) → completed.
