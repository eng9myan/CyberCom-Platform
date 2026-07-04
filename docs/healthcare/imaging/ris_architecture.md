# CyMed RIS Architecture

## Order Lifecycle

```
pending → scheduled → in_progress → completed → cancelled
       ↘                           ↗
        → on_hold → scheduled
```

Status transitions recorded in `ImagingOrderStatusHistory` (immutable audit).

## Key Models

### ImagingOrder (`cymed_img_orders`)
- One order per patient encounter
- `order_type`: inpatient | outpatient | emergency | pre-op | screening
- `priority`: routine | urgent | stat | critical
- `fhir_service_request_id`: set after FHIR push
- `hl7_placer_order_number`: HL7 v2 interop field

### ImagingOrderItem (`cymed_img_order_items`)
- One item per procedure/body part within an order
- Carries `accession_number` (unique per study)
- `dicom_study_instance_uid`: populated when PACS confirms study receipt
- OneToOne to `DICOMStudy` (when study exists)
- OneToOne to `RadiologyReport`
- OneToOne to `ImagingResult`
- OneToOne to `ImagingAppointment`

### ImagingProtocol / ImagingProcedure
- Protocols: scanner-level parameters (kVp, mAs, phase counts)
- Procedures: orderable items with SNOMED + LOINC codes, estimated duration,
  contrast requirement, radiation category

## Scheduling Layer

- `ImagingRoom`: physical scanner room with modality_type
- `ImagingAppointment`: OneToOne to `ImagingOrderItem`; tracks actual vs scheduled duration
- `ModalitySchedule`: capacity planning by date + modality
- `RadiologistSchedule`: on-call tracking, subspecialty coverage

## HL7 v2 MWL (Modality Worklist)

CyMed exposes a C-FIND-compatible worklist for legacy DICOM scanners that do not
support DICOMweb. The `WorklistEntry` maps to a Scheduled Procedure Step (SPS)
in DICOM terminology.

Field mapping:

| DICOM Tag | CyMed Field |
|---|---|
| (0008,0050) AccessionNumber | `ImagingOrderItem.accession_number` |
| (0010,0020) PatientID | `ImagingOrder.patient_id` |
| (0032,1070) RequestedContrastAgent | `ImagingProcedure.contrast_required` |
| (0040,0007) ScheduledProcedureDescription | `ImagingProcedure.name` |
| (0040,0009) ScheduledProcedureStepID | `WorklistEntry.id` |

## Feature Gating

All ViewSets inherit `ImagingModelViewSet` which checks `required_feature` via
`FeatureFlagService` before any CRUD operation. Feature codes map to edition tiers
in `IMAGING_BASIC_FEATURES` through `IMAGING_NATIONAL_FEATURES`.
