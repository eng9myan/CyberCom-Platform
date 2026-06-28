# Pilot Dataset Guide — CyberCom Enterprise

**Date:** 2026-06-28  
**Repository:** CyberCom-Platform  

---

## 1. Overview

This document describes the structure and properties of the seeded pilot dataset, which represents a complete, integrated healthcare network.

---

## 2. Seeded Facility Topology

All facilities belong to the `cybercom-care` tenant and `CyberCom Healthcare Network` Organization:

| Facility Name | Code | Type | Sub-Units |
|---------------|------|------|-----------|
| **Al-Amal General Hospital** | `HOSP-AMAL` | Hospital | ER Ward, Medical Ward, standard beds |
| **Primary Care Clinic** | `CLIN-PRIMARY` | Clinic | Family Medicine |
| **Specialty Pediatrics Clinic** | `CLIN-PEDS` | Clinic | Pediatrics |
| **Dental & Orthodontics Clinic** | `CLIN-DENTAL` | Clinic | Dentistry |
| **Central Diagnostic Laboratory** | `LAB-CENTRAL` | Laboratory | Biochemistry, specimens |
| **Advanced Imaging & Radiology Center** | `IMG-ADVANCED` | Imaging | Ultrasound, CT Scan |
| **Al-Amal Hospital Pharmacy** | `PHARM-AMAL` | Pharmacy | Outpatient/inpatient pharmacy |
| **Community Care Pharmacy** | `PHARM-COMM` | Pharmacy | Community retail |

---

## 3. Seeded Clinical Datasets

### Patients
1. **Aisha Al-Otaibi (`MRN-PAT-001`):** Female, born 1988. Primary insurance under Bupa Arabia. Focuses on outpatient clinical workflow.
2. **Faisal Al-Shammari (`MRN-PAT-002`):** Male, born 1975. Focuses on emergency room triage and inpatient hospital stay workflow.
3. **Yasmin Al-Saeed (`MRN-PAT-003`):** Female, born 1995. Secondary testing patient.

### Providers & Staff
- **Physicians:** `Dr. Khalid Mansour` (MD, Emergency Medicine), `Dr. Ahmad Hameed` (MD, Primary Care).
- **Nurses:** `Sarah Jordan` (RN, Critical Care).
- **Radiologist:** `Dr. Tareq Saleh` (MD, Diagnostics).
- **Pharmacist:** `Dr. Rania Badawi` (PharmD).
- **Lab Technician:** `Yousef Naser` (BSc, Medical Lab Science).
