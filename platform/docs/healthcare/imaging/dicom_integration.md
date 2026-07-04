# DICOM Integration Guide

## Protocol Support

CyMed supports two DICOM integration paths:

### 1. Traditional DICOM (C-FIND / C-MOVE / C-GET)
For legacy scanners and PACS nodes that do not support REST.

| Service | CyMed Role |
|---|---|
| C-FIND | Query worklist from modality |
| C-MOVE | Trigger study retrieval from PACS |
| C-GET | Inline study pull for viewer integration |
| C-STORE | Receive study notifications (not pixel data) |

### 2. DICOMweb REST (IHE MHD / IHE RAD)
For modern PACS and cloud imaging archives.

| Endpoint | Standard | CyMed Use |
|---|---|---|
| QIDO-RS | DICOMweb | Query study/series/instance metadata |
| WADO-RS | DICOMweb | Retrieve study/frame metadata, generate viewer URLs |
| STOW-RS | DICOMweb | Receive study notification from PACS on acquisition |

All URLs stored per-`PACSNode`. TLS enforced for all DICOMweb endpoints in
production (`tls_enabled=True`). API credentials stored by key name in secrets
manager; never stored as plaintext (`api_key_reference` field).

## DICOM Registry (img_dicom)

CyMed stores metadata only — no pixel data:

```
DICOMStudy
 └── DICOMSeries (1..*)
      └── DICOMInstance (1..*)
           └── wado_url (pointer to pixel data in PACS)
```

### DICOMStudy
- `study_instance_uid`: globally unique (DICOM UID standard)
- `accession_number`: links back to `ImagingOrderItem`
- `modality`: highest-level modality (CT, MRI, etc.)
- `archive_status`: online | nearline | offline
- `storage_size_mb`: reported by PACS at time of indexing

### DICOMSeries
- `series_instance_uid`: unique per series
- `slice_thickness`, `spacing_between_slices`: CT/MRI geometry
- `acquisition_time`, `acquisition_date`

### DICOMInstance
- `sop_instance_uid`: globally unique SOP instance
- `sop_class_uid`: identifies DICOM storage class (CT Image Storage, MR Image, etc.)
- `wado_url`: direct viewer link into PACS

## Study Archive Tiering

| Tier | Storage | Use Case |
|---|---|---|
| hot | NVMe SSD | Last 90 days, active cases |
| warm | Object storage | 90 days – 3 years |
| cold | Tape / glacier | 3+ years, legal retention |

Tier managed by `StudyArchive.archive_tier`. Compression tracked; JPEG2000
lossless is default for diagnostic-quality archiving.

## IHE Profiles Supported

- **IHE RAD-17**: Retrieve Information for Display
- **IHE RAD-69**: Retrieve Images (WADO)
- **IHE RAD-71**: Retrieve Rendered Images
- **IHE SWF** (Scheduled Workflow): Order → Schedule → Acquire → Report
- **IHE XDS-I.b**: Cross-Enterprise Document Sharing for Imaging (national tier)
