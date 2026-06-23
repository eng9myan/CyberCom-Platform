# CyMed Patient Portal — Provider Directory

## Overview

The provider directory exposes the complete CyMed healthcare network to patients.
Five provider types are supported with dedicated listing models.

## Provider Types

| Type | Model | Source System |
|---|---|---|
| Hospital | `HospitalListing` | CyMed Hospital (P3.2) |
| Clinic | `ClinicListing` | CyMed Clinic (P3.1) |
| Laboratory | `LaboratoryListing` | CyMed Laboratory (P3.3) |
| Imaging Center | `ImagingCenterListing` | CyMed Imaging (P3.4) |
| Pharmacy | `PharmacyListing` | CyMed Pharmacy (P3.5) |

Each listing holds a `{type}_id` UUID pointing to the authoritative record in
the source system. The portal directory stores display data only — clinical and
operational data stays in the source system.

## Clinic Specialties

`ClinicSpecialty` catalog covers:

```
Cardiology          Dermatology         Orthopedics
Pediatrics          Neurology           ENT
Ophthalmology       Internal Medicine   Family Medicine
Psychiatry          Gynecology          Urology
Endocrinology       Oncology            Pulmonology
Gastroenterology    Rheumatology        Nephrology
Hematology          Infectious Disease
```

Each specialty has: `code`, `name`, `name_ar`, `snomed_code`, `display_order`, `icon_url`.
`ClinicListing.specialties` (JSONField) stores the specialty code list for multi-specialty clinics.
`ClinicListing.primary_specialty` is the indexed searchable field.

## Hospital Directory Display

`HospitalListing` exposes:
- Profile: name, name_ar, logo, cover image, description, accreditations
- Location: address, city, country, latitude, longitude
- Contact: phone, email, website, emergency_number
- Capacity: bed_count
- Services: `services` JSONField, `departments` JSONField
- Hours: `operating_hours` JSONField
- Ratings: `rating_average`, `review_count`
- Flags: `accepts_insurance`, `accepts_walk_in`, `is_featured`, `is_published`

## Laboratory Directory Display

`LaboratoryListing` exposes:
- Profile: name, logo, accreditations (CAP, ISO 15189, national)
- Services: `test_panels` JSONField (e.g., haematology, microbiology, biochemistry)
- Turnaround: `turnaround_times` JSONField (e.g., `{"stat": 2, "routine": 24}` hours)
- Branches: `branches` JSONField
- Flags: `home_collection`

## Imaging Center Directory Display

`ImagingCenterListing` exposes:
- Modalities: MRI, CT, X-Ray, Ultrasound, PET, Mammography, Fluoroscopy
- `radiologists` JSONField (names)
- `locations` JSONField (multiple sites)

## Pharmacy Directory Display

`PharmacyListing` exposes:
- Services: drive-through, delivery, compounding, vaccination
- `branches` JSONField
- Flags: `is_24_hours`, `home_delivery`

## Patient Reviews

`ProviderReview` is cross-type (hospital, clinic, lab, imaging, pharmacy):
- `rating` 1–5 stars
- `is_verified_visit` — verified via appointment/visit record
- `is_published = False` by default — requires moderation before display
- `reviewer_account_id` links to the reviewing PatientPortalAccount

## Search & Discovery

All listing ViewSets support:
- `SearchFilter` — searches name, city, specialty
- `OrderingFilter` — order by rating_average, review_count
- Filter by `is_published=True`, `is_featured`, `city`, `country`
- `primary_specialty` indexed for clinic specialty search
