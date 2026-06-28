# Demo Guide — CyberCom Enterprise Healthcare Platform

**Date:** 2026-06-28  
**Repository:** CyberCom-Platform  

---

## 1. Overview

This guide serves as a manual for running, presenting, and resetting the CyberCom Enterprise Demo environment. It details the setup, endpoints, and components that represent the interconnected clinical and ERP operations.

---

## 2. Infrastructure & Environment Setup

The demo environment is deployed as part of the CyberCom unified SaaS deployment framework:
- **Tenant Context:** Seeding automatically provisions under the `cybercom-care` tenant.
- **Portals & subdomains:** All demonstration portals route via localized subdomains (`hospital.cy-com.com`, `clinic.cy-com.com`, `lab.cy-com.com`, `imaging.cy-com.com`, `pharmacy.cy-com.com`).
- **Database Seeding:** Execute the database seeder to reset/refresh the demo network:
  ```bash
  python manage.py populate_demo
  ```

---

## 3. Supported Demo Portals

The following 9 portals are fully functional and populated with real-time transactional data:
1. **Hospital EMR Portal:** Manages Emergency Room triages, patient admissions, and bed allocations.
2. **Outpatient Clinic Portal:** Schedules appointments, templates consults, and triggers lab/imaging requests.
3. **Laboratory Information System (LIS):** Manages specimen accessioning, worklist flows, and result entry.
4. **Radiology/Imaging Center Portal (RIS):** Processes body-part specific DICOM protocols and radiology reports.
5. **Pharmacy System:** Tracks generic/brand medications, checks drug interactions, and logs dispensations.
6. **Patient Portal:** Handles patient onboarding, medical records retrieval, billing, and co-payments.
7. **Provider Portal:** Schedules medical staff, delegates shifts, and approves rounding tasks.
8. **Customer/Admin Portal:** Provides tenant-level white-labeling, licensing controls, and billing analytics.
9. **Partner Portal:** Facilitates partner onboarding and registration.
