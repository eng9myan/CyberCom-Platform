# Organization Registry Architecture

## 1. Overview
The Organization Registry (`organizations` app) defines the institutional framework of the health system. It tracks legal entities, healthcare facilities networks, laboratories, clinics, and pharmacies, enabling hierarchical management of multi-facility health systems.

## 2. Domain Models
*   **`Organization`**: The parent institution profile containing legal name, slug, classification type, and active status.
*   **`OrganizationType`**: Standardized tags for the type of healthcare entity (e.g., hospital network vs. independent laboratory).
*   **`OrganizationAddress`**: Corporate or clinical addresses.
*   **`OrganizationContact`**: Central contact details (phone, email, administrative contact name).
*   **`OrganizationRelationship`**: Defines parent-subsidiary hierarchies (e.g., a regional health system owning multiple community clinics).
*   **`OrganizationAccreditation`**: Audits and certifications issued by governing bodies (e.g., Joint Commission, local ministries of health).

## 3. Organization Types
Organizations are classified into the following types:
*   **Health Network**: Regional or national parent corporations managing multiple hospitals.
*   **Hospital**: Tertiary care centers containing inpatient, outpatient, and emergency wards.
*   **Clinic**: Outpatient care centers, general practitioner practices, or specialist clinics.
*   **Laboratory**: Facilities specialized in analyzing biological specimens.
*   **Imaging Center**: Radiographic facilities providing X-ray, MRI, CT, and ultrasound services.
*   **Pharmacy**: Dispensing retail or clinical pharmacies.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/organizations/` | GET | List organizations (supports hierarchical filtering) |
| `/api/v1/organizations/` | POST | Create a new organization profile |
| `/api/v1/organizations/{id}/` | PUT/PATCH | Update organization profile |

## 5. FHIR Mapping
*   `Organization` ──> **FHIR Organization**
*   `OrganizationRelationship` ──> **FHIR Organization.partOf**
