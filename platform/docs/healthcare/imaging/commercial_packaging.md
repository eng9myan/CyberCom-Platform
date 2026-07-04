# CyMed Imaging Edition — Commercial Packaging

## Edition Overview

| Edition | Code | Target Customers |
|---|---|---|
| CyMed Imaging Basic | `cymed_imaging:basic` | Small clinics, outpatient imaging centres |
| CyMed Imaging Enterprise | `cymed_imaging:enterprise` | Hospital radiology departments |
| CyMed Imaging Teleradiology | `cymed_imaging:teleradiology` | Teleradiology companies, multi-site networks |
| CyMed National Imaging Network | `cymed_imaging:national` | Government health authorities, national programs |

## Feature Matrix

| Feature | Basic | Enterprise | Teleradiology | National |
|---|:---:|:---:|:---:|:---:|
| Imaging Orders & Order Items | ✓ | ✓ | ✓ | ✓ |
| Scheduling & Appointments | ✓ | ✓ | ✓ | ✓ |
| Radiology Reporting | ✓ | ✓ | ✓ | ✓ |
| Results & Communications | ✓ | ✓ | ✓ | ✓ |
| PACS Gateway (DICOMweb) | — | ✓ | ✓ | ✓ |
| DICOM Registry | — | ✓ | ✓ | ✓ |
| Modality Worklist (MWL) | — | ✓ | ✓ | ✓ |
| Quality & Dose Tracking | — | ✓ | ✓ | ✓ |
| Analytics Dashboards | — | ✓ | ✓ | ✓ |
| Teleradiology Queues | — | — | ✓ | ✓ |
| Second Opinions | — | — | ✓ | ✓ |
| Multi-site Routing | — | — | ✓ | ✓ |
| Reading Network | — | — | ✓ | ✓ |
| National Registry | — | — | — | ✓ |
| Government Integration | — | — | — | ✓ |
| Population Analytics | — | — | — | ✓ |
| Public Health Reporting | — | — | — | ✓ |

## Feature Flag Codes

```python
IMAGING_BASIC_FEATURES = [
    "imaging.orders", "imaging.scheduling",
    "imaging.reporting", "imaging.results",
]

IMAGING_ENTERPRISE_FEATURES = IMAGING_BASIC_FEATURES + [
    "imaging.pacs", "imaging.dicom", "imaging.worklist",
    "imaging.quality", "imaging.analytics",
]

IMAGING_TELERADIOLOGY_FEATURES = IMAGING_ENTERPRISE_FEATURES + [
    "imaging.teleradiology", "imaging.second_opinion",
    "imaging.multi_site", "imaging.reading_network",
]

IMAGING_NATIONAL_FEATURES = IMAGING_TELERADIOLOGY_FEATURES + [
    "imaging.national_registry", "imaging.government",
    "imaging.population_analytics", "imaging.public_health_reporting",
]
```

## Edition Modules (EDITION_MODULES)

Each edition entry in the seed catalog maps to a list of module keys used by the
licensing engine to gate API surface. Stored in:

```
backend/products/cymed/commercial/editions/migrations/0002_seed_catalog.py
```

## Upgrade Path

Editions are additive. A tenant upgrading from Basic → Enterprise gains all
Enterprise features immediately upon license update — no data migration required.
All imaging data remains accessible.

## CyAI in Commercial Editions

CyAI advisory features are available in all editions:
- Report summarization (advisory, non-finalizing)
- Critical finding detection
- Worklist AI priority scoring

CyAI requires separate CyAI subscription. Imaging Edition activates the
integration hooks; CyAI feature flags gated independently.

## CyCom ERP Integration

All editions publish events to CyCom:
- `ImagingRevenueEvent` (charge_created, charge_updated, charge_cancelled)
- Consumable usage events (contrast agents, disposables)
- Equipment maintenance events via `ImagingQualityMetric`

ERP owns all billing logic. RIS publishes events only — no pricing or invoice
logic in imaging applications.
