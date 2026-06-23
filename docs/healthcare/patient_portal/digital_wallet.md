# CyMed Patient Portal — Digital Health Wallet

## Overview

The Health Wallet is the patient's unified credential store — a single place
to hold all health-related digital cards, passes, and vaccination records.
It competes with Apple Health Wallet, Saudi Seha App wallet, and UAE MOHAP
wallet features.

## Models

### HealthWallet
One wallet per patient account. Simple anchor record.
- `wallet_name` — patient-customizable label
- `card_count` — pre-computed count for dashboard display

### DigitalCard
Stores any card with visual display data:

| Card Type | Use Case |
|---|---|
| `patient_id` | Hospital patient ID barcode |
| `insurance` | Insurance card front/back image + policy number |
| `loyalty` | Pharmacy or clinic loyalty card |
| `membership` | Medical subscription membership |
| `government_health_id` | National health ID (Absher, MOHAP) |
| `vaccination_pass` | Green health pass / travel vaccination certificate |
| `other` | Any other health-related card |

Display fields:
- `background_color`, `text_color` — card visual theming
- `barcode_type` (qr/barcode/none), `barcode_value` — scannable value
- `card_image_url` — actual card scan image (via CyData)

### HealthPass
Verifiable health credentials:

| Pass Type | Use Case |
|---|---|
| `vaccination` | Vaccination completion certificate |
| `covid_test` | PCR / antigen test result certificate |
| `immunity` | Serology / antibody immunity pass |
| `health_declaration` | Fit-to-travel or fit-for-work declaration |
| `travel_health` | Combined travel health requirements |

- `qr_code_data` — encoded verification payload (digitally signed)
- `is_verified` — verified by issuing authority (MoH, accredited lab)

### VaccinationRecord
Complete immunization history linked to FHIR Immunization:

| Field | Source |
|---|---|
| `cvx_code` | CDC CVX code (standardized vaccine identifier) |
| `cymed_immunization_id` | CyMed Core immunization record |
| `fhir_immunization_id` | FHIR R4 Immunization resource ID |
| `lot_number` | Manufacturer lot for recall tracing |
| `dose_number / total_doses_required` | Dosing schedule tracking |
| `next_dose_date` | Reminder generation source |
| `certificate_url` | Official digital certificate via CyData |

## Mobile Display

Cards render in a swipeable card stack (wallet UI) on iOS/Android.
DigitalCard `display_order` controls stack position.
Pass QR codes open in a full-screen scanner-ready overlay.

## Government / National Health Integration

`DigitalCard.card_type=government_health_id` stores national health IDs:
- Saudi Arabia: Absher/MOH ID
- UAE: MOHAP ID
- Jordan: eHealth ID
- Egypt: Unified Health ID

`HealthPass.pass_type=vaccination` links to national vaccination registries
(via CyIntegrationHub) for cross-border verification.
