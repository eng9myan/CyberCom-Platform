# Clinic Edition Architecture

## 1. Overview
The CyMed Clinic Edition (Program 3.1) builds directly on top of the CyMed Core Clinical Platform (Program 3.0). It provides a commercially ready, highly reusable suite of modules tailored for outpatient clinics, clinic networks, medical centers, polyclinics, day surgery centers, specialty clinics, and telemedicine providers.

The Clinic Edition consists of 11 modular sub-apps registered under `backend/products/cymed/clinic/`:
*   `reception`: Handles patient arrivals, check-in, and ticket generation.
*   `appointments`: Advanced scheduling rules, double-booking prevention, and waitlist management.
*   `queues`: Waiting room tracking, live queue boards, and provider queues.
*   `triage`: Vital signs logging, BMI, and MEWS calculations.
*   `consultations`: SOAP notes, clinical procedure logging, and terminology-checked diagnoses.
*   `specialties`: Dynamic clinic specialty profiles (e.g. Cardiology, OB/GYN, Pediatrics).
*   `clinical_forms`: Dynamic forms builder, section configurations, fields, and submissions.
*   `telemedicine`: WebRTC-based virtual visits, sessions, and digital consent tracking.
*   `referrals`: Outgoing/incoming referrals and external center directory mappings.
*   `insurance_bridge`: Insurance eligibility verification and prior authorizations.
*   `billing_bridge`: Service price lists, charge code mappings, and CyCom ERP ledger posting.

```
       ┌─────────────────────────────────────────────────────────────┐
       │             CyMed Clinic Edition Application Layer          │
       │  (reception, appointments, triage, queues, billing, etc.)  │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ (Extends & Inherits)
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │             CyMed Core Clinical Platform (3.0)               │
       │    (Patients, Encounters, Providers, Clinical, Careplans)   │
       └─────────────────────────────────────────────────────────────┘
```

## 2. Shared Base Controller
All Clinic ViewSets inherit from `ClinicModelViewSet`, which provides:
1. **Tenant Filtering**: Automatically filters all queries using the `X-Tenant-ID` header injected from the API gateway.
2. **Tenant ID Propagation**: Automatically injects the request's `tenant_id` into all model creation commands during serializer execution.
3. **Authentication Enforcement**: Enforces `IsAuthenticated` access rules by default.

## 3. Localization & Regional Readiness
The package is designed with localization capabilities supporting multiple jurisdictions:
*   **USA**: HIPAA-compliant logs, HL7 FHIR mapping, prior authorization flows.
*   **Jordan**: InvoiceQ integration hooks, national billing codes.
*   **Saudi Arabia**: PDPL-compliant data residency, NPHIES-compatible prior authorization structures.
*   **UAE**: Malaffi/Nabidh registry integrations, Malaffi-compatible insurance bridges.
