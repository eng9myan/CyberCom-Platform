# CyMed End-to-End Workflow Report

**Date:** 2026-06-28  
**Version:** Release 1.0  
**Prepared by:** CyberCom Platform Engineering

---

## Executive Summary

This report documents the end-to-end integration workflows validated across the CyMed product line, ensuring that the 9 products operate as a unified commercial ecosystem.

---

## 1. Patient Journey: Check-In to Payment

The following diagram illustrates the complete patient lifecycle, spanning registration, clinical care, lab ordering, imaging, prescribing, and billing:

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    actor Clinician
    participant PatientPortal as CyMed Patient Portal
    participant Clinic as CyMed Clinic
    participant Lab as CyMed Laboratory
    participant Pharmacy as CyMed Pharmacy
    participant RCM as CyMed RCM
    participant ERP as CyCom ERP (Finance)

    Patient->>PatientPortal: Self-registers & Books Appointment
    PatientPortal-->>Clinic: Registers appointment slot
    Clinic->>Clinic: Patient checks in (Triage MEWS calculated)
    Clinic->>RCM: Trigger eligibility verification (270/271)
    RCM-->>Clinic: Return benefit coverage
    Clinic->>Clinician: Consult (SOAP Note, ICD-11 diagnosis)
    Clinician->>Lab: Places lab order (LOINC validated)
    Lab->>Lab: Specimen collected, accessioned, processed
    Lab->>PatientPortal: Publish final result (HL7 ORU)
    Clinician->>Pharmacy: E-prescribes medication (RxNorm)
    Pharmacy->>Pharmacy: Check drug interactions & dispense
    Clinician->>Clinic: Patient check-out
    Clinic->>RCM: Capture charges (CPT/ICD)
    RCM->>RCM: Scrub & Submit Claim to Clearinghouse
    RCM->>ERP: Post gross charges to General Ledger
```

---

## 2. Key Integration Points

### Clinic & RCM Integration
- On patient check-in, Clinic queries the RCM `EligibilityService` to verify insurance coverage.
- On consultation completion, Clinic pushes captured ICD-11 diagnosis codes and procedure codes directly to RCM charge capture.

### Hospital & Laboratory/Imaging Integration
- On ICU/Emergency triage or Operating Room scheduling, orders are placed using LOINC/SNOMED CT.
- Resulting lab or radiology files are pushed directly to the patient's record, and the ordering clinician receives an alert in their results inbox.

### Pharmacy & CyAI Integration
- When prescribing medications in Pharmacy, the system calls `ClinicalAIService.score_drug_interaction_severity()` to assess potential interactions based on age, renal function (eGFR), and pregnancy status.
