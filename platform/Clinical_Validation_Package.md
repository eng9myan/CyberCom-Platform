# Clinical Validation Package

**Version:** 1.0
**Date:** 2026-06-28
**Purpose:** UAT scenarios, acceptance criteria, and sign-off forms for clinical staff validation of CyberCom workflows.

---

## Instructions

1. Assign each scenario to the correct clinical role.
2. Perform each scenario in the UAT environment with real workflows.
3. Record actual result and pass/fail for each step.
4. Escalate any P0 or P1 failures immediately.
5. Obtain sign-off from clinical lead before go-live.

---

## Validation Kits by Role

---

## 1. Physician Validation Kit

### Scenario PH-01: Outpatient Consultation

**Role:** Physician
**Module:** CyMed Clinic

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Log in with physician credentials | Physician workspace loads | | |
| 2 | View today's appointment list | All scheduled patients visible | | |
| 3 | Call next patient | Patient moves to "In Progress" on queue | | |
| 4 | Open patient record | Patient demographics, allergies, history load correctly | | |
| 5 | Record chief complaint | Saved to encounter | | |
| 6 | Record vitals (BP, HR, temperature, weight) | Values saved with units | | |
| 7 | Add ICD-11 diagnosis | ICD-11 search works, correct code selected | | |
| 8 | Order lab test (CBC) | Lab order created with LOINC code | | |
| 9 | Order imaging (CXR) | Imaging order created | | |
| 10 | Write e-Prescription | Prescription created, drug interaction check runs | | |
| 11 | If interaction found: review alert | Alert shown with severity and recommendation | | |
| 12 | Write clinical note | Note saved to encounter with timestamp | | |
| 13 | Discharge patient | Encounter closed, discharge summary generated | | |

**Acceptance Criteria:** All 13 steps pass.
**Sign-off:** _________________________ Date: _________

### Scenario PH-02: Drug Interaction Alert

**Role:** Physician / Pharmacist
**Module:** CyMed Pharmacy / Clinic

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Enter prescription for drug known to interact with patient's current medication | Drug interaction alert fires immediately | | |
| 2 | Verify alert severity is correctly classified | Severity matches clinical rule | | |
| 3 | Attempt to proceed without acknowledgment | System blocks proceed without review | | |
| 4 | Review alert and document clinical justification | Override requires text reason | | |
| 5 | Audit log shows override with user, timestamp, and reason | Query audit log | | |

**Acceptance Criteria:** All 5 steps pass. Clinical Safety Officer must sign this scenario.
**Sign-off:** _________________________ Date: _________

### Scenario PH-03: Inpatient Admission (Hospital)

**Role:** Physician + Nurse
**Module:** CyMed Hospital

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Register patient for emergency admission | ADT admission event created | | |
| 2 | Assign bed | Bed marked occupied in bed board | | |
| 3 | Write admission orders | Orders visible to nursing | | |
| 4 | Nurse acknowledge orders | Orders acknowledged with timestamp | | |
| 5 | Order morning labs | Lab orders created for next morning | | |
| 6 | Critical lab result returned | Notification sent to ordering physician immediately | | |
| 7 | Physician acknowledges critical result | Acknowledgment logged | | |
| 8 | Discharge patient | ADT discharge event, bed freed | | |

**Sign-off:** _________________________ Date: _________

---

## 2. Nurse Validation Kit

### Scenario NU-01: Nursing Assessment and MAR

**Role:** Nurse
**Module:** CyMed Hospital — Nursing

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Log in as nurse | Nursing workspace and assigned patients visible | | |
| 2 | Open patient nursing assessment | Assessment form loads | | |
| 3 | Complete nursing assessment | All assessment fields saved | | |
| 4 | Record vital signs | Vitals saved with nurse name and time | | |
| 5 | View medication administration record (MAR) | All prescribed medications listed | | |
| 6 | Administer medication | MAR updated with nurse, time, dose | | |
| 7 | Record patient outcome (pain score, mobility) | Saved to nursing notes | | |
| 8 | Escalate abnormal vital | Alert sent to physician | | |

**Sign-off:** _________________________ Date: _________

### Scenario NU-02: Patient Triage (Clinic)

**Role:** Triage Nurse
**Module:** CyMed Clinic — Triage

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Patient arrives at reception | Patient registered and added to queue | | |
| 2 | Call patient for triage | Patient status updated | | |
| 3 | Record chief complaint | Saved | | |
| 4 | Record vital signs | Saved | | |
| 5 | Assign triage priority | Priority updated on queue board | | |
| 6 | Route to appropriate physician | Patient assigned to physician queue | | |

**Sign-off:** _________________________ Date: _________

---

## 3. Pharmacist Validation Kit

### Scenario PH-PHARM-01: Prescription Dispensing Workflow

**Role:** Pharmacist
**Module:** CyMed Pharmacy

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Log in as pharmacist | Pharmacy workspace loads with pending prescriptions | | |
| 2 | Review incoming prescription | Patient info, drug, dose, route, frequency visible | | |
| 3 | Check drug interaction | Interaction check runs automatically | | |
| 4 | Check allergy | Allergy alert shown if applicable | | |
| 5 | Verify formulary status | Drug formulary status shown | | |
| 6 | Approve prescription | Prescription moves to dispensing queue | | |
| 7 | Print label | Label with patient, drug, dose, instructions generated | | |
| 8 | Dispense | Dispensing logged with pharmacist, time, quantity | | |
| 9 | Inventory decremented | Stock level updated | | |
| 10 | Patient counseling note added | Saved | | |

**Sign-off:** _________________________ Date: _________

### Scenario PH-PHARM-02: Medication Reconciliation

**Role:** Clinical Pharmacist
**Module:** CyMed Pharmacy — Medication Reconciliation

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Open medication reconciliation for admitted patient | Home medications list shows | | |
| 2 | Compare home meds to admission orders | Discrepancies highlighted | | |
| 3 | Document reconciliation decision for each drug | Continued / modified / discontinued choices | | |
| 4 | Notify physician of discrepancies | Notification sent | | |
| 5 | Physician acknowledges | Acknowledgment logged | | |

**Sign-off:** _________________________ Date: _________

---

## 4. Laboratory Staff Validation Kit

### Scenario LAB-01: Order to Result Workflow

**Role:** Lab Technician, Lab Supervisor
**Module:** CyMed Laboratory

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Log in as lab technician | Pending orders worklist visible | | |
| 2 | Accession incoming specimen | Barcode generated, specimen received | | |
| 3 | Assign to worklist | Order assigned to correct analyzer worklist | | |
| 4 | Enter result | Result entry with units | | |
| 5 | Delta check runs | Flag shown if value differs significantly from previous | | |
| 6 | Auto-verification triggers | Result auto-verified if within rules | | |
| 7 | Critical result detected | Alert fires, notification sent | | |
| 8 | Result released | Available to ordering physician | | |
| 9 | QC lot result entry | QC chart updated | | |
| 10 | QC rule violation | Alert flagged, batch held | | |

**Acceptance Criteria:** All 10 steps pass. Lab Director must sign this scenario.
**Sign-off:** _________________________ Date: _________

---

## 5. Radiologist Validation Kit

### Scenario RAD-01: Order to Report Workflow

**Role:** Radiologist, Radiographer
**Module:** CyMed Imaging

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Log in as radiographer | Modality worklist loads | | |
| 2 | Select patient from worklist | Patient details confirmed | | |
| 3 | Perform exam (simulated) | Exam status updated | | |
| 4 | Images received in PACS (DICOM C-STORE test) | Images visible in viewer | | |
| 5 | Log in as radiologist | Reading worklist loads | | |
| 6 | Open study | Images load in viewer | | |
| 7 | Dictate/write report | Report draft saved | | |
| 8 | Sign report | Report status changes to Signed, notification to referring physician | | |
| 9 | Critical finding: mark as critical | Notification sent immediately | | |
| 10 | Critical finding: referring physician acknowledges | Acknowledgment logged | | |

**Acceptance Criteria:** All 10 steps pass. Radiologist must sign this scenario.
**Sign-off:** _________________________ Date: _________

---

## 6. Registration Staff Validation Kit

### Scenario REG-01: Patient Registration

**Role:** Registration / Receptionist
**Module:** CyMed Clinic / Hospital — Reception

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Log in as receptionist | Registration workspace loads | | |
| 2 | Search for existing patient | Patient found by name/MRN | | |
| 3 | Register new patient | Patient created with unique MRN | | |
| 4 | Capture insurance information | Insurance saved and verified | | |
| 5 | Book appointment | Appointment in calendar, patient in queue | | |
| 6 | Check in patient on arrival | Status updated to arrived | | |
| 7 | Collect consent forms | Consent captured and saved | | |
| 8 | Print visit summary | Print job generated | | |

**Sign-off:** _________________________ Date: _________

---

## 7. Billing Staff Validation Kit

### Scenario BILL-01: Charge Capture and Claim

**Role:** Billing Specialist
**Module:** CyMed Revenue Cycle

| # | Step | Expected Result | Actual | P/F |
|---|------|----------------|--------|-----|
| 1 | Log in as billing specialist | Revenue cycle workspace loads | | |
| 2 | View completed encounters pending billing | List of unbilled encounters | | |
| 3 | Review charges for encounter | CPT/procedure codes listed | | |
| 4 | Verify insurance eligibility | Eligibility response returned | | |
| 5 | Generate claim | CMS-1500 or UB-04 generated | | |
| 6 | Submit claim to clearinghouse | Claim submitted, acknowledgment received | | |
| 7 | Track claim status | Status visible in claim management | | |
| 8 | Process payment | Payment posted, patient balance updated | | |
| 9 | Denial management | Denial reason coded, appeal created | | |

**Sign-off:** _________________________ Date: _________

---

## UAT Sign-Off Summary Form

| Module | Scenario | Clinical Lead | Role | Date | Status |
|--------|---------|--------------|------|------|--------|
| Clinic | PH-01 | | Physician | | |
| Pharmacy | PH-02 | | Physician + Pharmacist + CSO | | |
| Hospital | PH-03 | | Physician + Nurse | | |
| Hospital Nursing | NU-01 | | Charge Nurse | | |
| Clinic Triage | NU-02 | | Triage Nurse | | |
| Pharmacy | PH-PHARM-01 | | Chief Pharmacist | | |
| Pharmacy | PH-PHARM-02 | | Clinical Pharmacist | | |
| Laboratory | LAB-01 | | Laboratory Director | | |
| Imaging | RAD-01 | | Chief Radiologist | | |
| Registration | REG-01 | | Registration Manager | | |
| Billing | BILL-01 | | Billing Manager | | |

**Overall UAT Sign-Off:**

Medical Director: _________________________ Date: _________

IT Lead: _________________________ Date: _________

Implementation Lead: _________________________ Date: _________

**Go-Live Cleared:** YES / NO
