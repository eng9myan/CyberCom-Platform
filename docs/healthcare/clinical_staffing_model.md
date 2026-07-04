# CyMed Clinical Staffing Model (Clinical Support Departments)

> **Status:** Approved — Phase 1.2
> **Owner:** Hospital Operations Architect + Clinical Safety Architect
> **Related Documents:** [healthcare_workforce_architecture.md](healthcare_workforce_architecture.md), [shift_management_architecture.md](shift_management_architecture.md)

This document establishes the staffing frameworks, coverage formulas, and minimum operational parameters for clinical support and auxiliary departments.

---

## 1. Auxiliary Department Profiles & Staffing Frameworks

Auxiliary departments scale their staffing dynamically based on active clinical service lines (such as active operating theaters, ICU bed occupancy, or Emergency Department volume).

```
                      [Support Staffing Allocator]
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   [Pharmacy]                 [Laboratory]               [Imaging]
 - Outpatient Queue         - Analyzer Tiers          - Modality Coverage
 - Inpatient Dispensing     - Blood Bank Match        - PACS QC Validation
```

### 1.1 Pharmacy Department

*   **Tiers:** Pharmacist Assistant, Staff Pharmacist, Clinical Pharmacist, Pharmacy Supervisor, Director of Pharmacy Services.
*   **Responsibilities:** Formulary compliance, sterile compounding, clinical drug-interaction checks, patient counseling, retail and ward dispensing.
*   **Coverage Rules:**
    *   *Inpatient Dispensing:* Minimum 1 Staff Pharmacist per 50 occupied inpatient beds.
    *   *Intensive Care (ICU/NICU):* 1 Dedicated Clinical Pharmacist per ICU unit during day shifts.
    *   *Outpatient Dispensing:* 1 Pharmacist + 1 Assistant per 80 projected prescriptions per hour.

### 1.2 Laboratory Department

*   **Tiers:** Laboratory Technician, Laboratory Technologist, Senior Technologist, Pathologist, Lab Director.
*   **Responsibilities:** Specimen processing, analyzer validation, diagnostic reporting, critical value notification, quality control runs.
*   **Coverage Rules:**
    *   *Routine Testing:* 1 Technologist per department tier (Hematology, Biochemistry, Immunology) per shift.
    *   *Emergency Lab (STAT):* 2 Technologists on-site 24/7/365.
    *   *Blood Bank:* Minimum 1 certified Blood Bank Technologist on-site 24/7/365.

### 1.3 Imaging Department

*   **Tiers:** Radiologic Technologist, Senior MRI/CT Specialist, Medical Physicist, Radiologist, Department Chair.
*   **Responsibilities:** Radiography execution (X-Ray, CT, MRI, Ultrasound), patient positioning, radiation safety checks, PACS quality control.
*   **Coverage Rules:**
    *   *Routine Modality:* 1 Technologist per active MRI/CT suite.
    *   *Emergency Coverage:* 1 X-Ray/CT Technologist on-call (In-House) 24/7.
    *   *PACS Quality Control:* Minimum 1 certified PACS Administrator during core day shifts.

---

## 2. Specialized Care & Operational Support Units

### 2.1 Respiratory Therapy (RT)
*   **Tiers:** Junior RT, Staff RT, ICU RT Specialist, RT Coordinator.
*   **Responsibilities:** Ventilator management, arterial blood gas (ABG) draws, airway clearance therapy, aerosol delivery, resuscitation support.
*   **Coverage Rules:**
    *   *ICU Ventilator Coverage:* 1 RT per 6 active mechanically ventilated patients.
    *   *General Wards:* 1 RT per 20 respiratory therapy orders per shift.

### 2.2 Blood Bank (Transfusion Services)
*   **Tiers:** Blood Bank Technician, Transfusion Specialist, Transfusion Medical Director.
*   **Responsibilities:** Blood product inventory management, cross-matching, donor screening, antibody screening, component prep.
*   **Coverage Rules:**
    *   *Inventory Safety:* Minimum 2-person verification (dual control) required for issuing cross-matched blood products.
    *   *High-Risk Coverage:* 1 Dedicated Transfusion Specialist active during planned high-risk surgeries (e.g., transplants, open-heart).

### 2.3 Dialysis Unit (Support Staffing)
*   **Tiers:** Dialysis Technician, Clinical Nephrology Technologist.
*   **Responsibilities:** Dialysis machine setup, water treatment testing (RO system checks), machine sanitization, monitoring patient machine parameters.
*   **Coverage Rules:**
    *   *Technician-to-Machine Ratio:* Minimum 1 Dialysis Technician per 4 active hemodialysis stations.

### 2.4 Rehabilitation Services
*   **Tiers:** Physical Therapist (PT), Occupational Therapist (OT), Rehab Assistant, Chief of Rehabilitation.
*   **Responsibilities:** Post-op mobility, occupational retraining, outpatient rehab, pediatric development therapy, discharge assessments.
*   **Coverage Rules:**
    *   *Patient Caseload:* Maximum 8 patient contact hours per therapist per shift.

### 2.5 Central Sterile Services Department (CSSD)
*   **Tiers:** CSSD Technician, Senior Sterilization Specialist, CSSD Supervisor.
*   **Responsibilities:** Decontamination, assembly, packaging, sterilization, and distribution of medical devices and surgical trays.
*   **Coverage Rules:**
    *   *Surgical Alignment:* 1 CSSD Technician per 2 active Operating Rooms (OR) scheduled.
    *   *Sterilization Verification:* Minimum 1 Senior Specialist on-duty to sign off biological indicators (BI) before tray release.

### 2.6 Biomedical Engineering
*   **Tiers:** Biomedical Technician, Senior Engineer, Director of Clinical Engineering.
*   **Responsibilities:** Preventative maintenance, life-support device calibration (ventilators, defibrillators, anesthesia machines), emergency repairs.
*   **Coverage Rules:**
    *   *In-House Response:* Minimum 1 Biomedical Technician on-call 24/7.
    *   *Calibration Audits:* Quarterly verification cycles tracked in the local compliance registers.
