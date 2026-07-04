# CyMed Imaging Edition — Architecture Overview

## System Context

CyMed Imaging Edition is a cloud-native Radiology Information System (RIS) and
workflow platform. It does **not** store DICOM pixel data; all imaging storage
resides in the facility's PACS. CyMed manages orders, scheduling, worklists,
reporting metadata, and analytics.

### Competitive Positioning

| Competitor | CyMed Advantage |
|---|---|
| GE Centricity RIS | Cloud-native multi-tenant, FHIR R4 native |
| Philips IntelliSpace | Open PACS integration, no vendor lock-in |
| Carestream RIS | CyAI advisory, automated worklist prioritization |
| Fuji Synapse | Open API, event-driven architecture |
| Agfa Enterprise Imaging | National network tier, population analytics |
| Sectra RIS | Flexible teleradiology, night-hawk support |
| Epic Radiant | Standalone or Epic-integrated via FHIR |
| Cerner Radiology | Real-time CyData streaming analytics |

## Application Layer (10 Django Apps)

```
products/cymed/imaging/
├── orders/              # img_orders    — ImagingOrder, ImagingOrderItem
├── scheduling/          # img_scheduling — Appointments, Rooms, Schedules
├── modality_worklist/   # img_worklist  — Modality, WorklistEntry, StudyQueue
├── radiology_reporting/ # img_reporting — Report lifecycle, Findings, Critical
├── results/             # img_results   — ImagingResult, Measurements, Comms
├── pacs_gateway/        # img_pacs      — PACSNode, StudyRoute, DICOMweb
├── dicom_registry/      # img_dicom     — DICOMStudy/Series/Instance metadata
├── teleradiology/       # img_teleradiology — ReadingQueue, Cases, Assignments
├── quality/             # img_quality   — Audits, Dose Records, Accreditation
└── analytics/           # img_analytics — Pre-aggregated dashboards, RVU
```

## Data Flow

```
Ordering Clinician
    → ImagingOrder (img_orders)
    → ImagingOrderItem (one per procedure)
    → WorklistEntry → Modality scanner
    → DICOMStudy metadata arrives from PACS
    → RadiologyReport created (draft)
    → CyAI advisory (non-blocking, advisory only)
    → Radiologist finalizes report
    → ImagingResult created
    → ResultCommunication to ordering clinician
    → OutboxEvent → CyData streaming → analytics
```

## Integration Boundaries

| System | Integration Pattern |
|---|---|
| External PACS | DICOMweb REST (WADO-RS, QIDO-RS, STOW-RS) + DICOM C-FIND/C-MOVE |
| FHIR Server | ServiceRequest, DiagnosticReport, ImagingStudy (push on finalize) |
| CyAI | Advisory REST API, non-blocking, async; AI cannot finalize reports |
| CyData | OutboxEvent → Kafka → streaming pipeline |
| CyCom ERP | Events only: charge created, consumable used, equipment maintenance |
| HL7 v2 | ORM/ORR messages for legacy modality worklist (MWL) |

## Key Design Constraints

- All pixel data lives in external PACS. CyMed stores metadata pointers only.
- AI results are advisory. Radiologist approval mandatory before finalization.
- No ERP business logic in RIS. Financial events published; ERP owns billing.
- Terminology delegated to TerminologyService (SNOMED, LOINC, ICD-11).
- All cross-app references use app label FK strings (e.g., `"img_orders.ImagingOrder"`).
