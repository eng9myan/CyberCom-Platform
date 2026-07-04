# Security Model — CyMed Imaging Edition

## Tenant Isolation

All imaging models inherit `BaseModel` which includes `tenant_id` (UUID).
`ImagingModelViewSet.get_queryset()` enforces tenant scope on every read:

```python
def get_queryset(self):
    tenant_id = getattr(self.request, "tenant_id", None)
    if tenant_id:
        return self.queryset.filter(tenant_id=tenant_id)
    return self.queryset.none()
```

Cross-tenant data access is architecturally impossible through the standard
ViewSet path. Bulk analytics queries run in isolated tenant schemas.

## Feature Flag Authorization

Edition-gated features checked in `initial()` before any ViewSet method:

```python
def initial(self, request, *args, **kwargs):
    super().initial(request, *args, **kwargs)
    if self.required_feature:
        self._check_feature(request, self.required_feature)
```

`FeatureFlagService.is_enabled()` raises `PermissionDenied` (HTTP 403) when
feature not in tenant's active edition. No feature code exposure in response body.

## PHI / PII Handling

- `patient_id` stored as UUID (external reference to patient identity service)
- No name, DOB, or MRN stored in imaging tables — pulled from patient service at runtime
- DICOM metadata tags with PHI (patient name, DOB) are not persisted in `DICOMStudy`/`DICOMSeries`/`DICOMInstance` — only UID references
- `PACSNode.api_key_reference` stores secrets-manager path only; key never written to DB

## PACS Credential Security

```python
# Stored:
api_key_reference = "secrets/aws/pacs/sectra-main-prod"

# Runtime fetch (never cached in app memory > 1 request):
api_key = secrets_client.get_secret(node.api_key_reference)
```

PACS credentials rotated via secrets manager without code deployment.

## Radiation Dose — DRP Compliance

`RadiationDoseRecord.exceeds_drp` flagged when CTDI/DLP exceeds
Diagnostic Reference Point thresholds. Exceeding records:
- Logged to `cymed_img_dose_records`
- Trigger quality flag for physics review
- Included in mandatory regulatory reporting via `AccreditationRecord`

## Access Control Matrix

| Role | Orders | Reports | PACS | Analytics | Teleradiology |
|---|---|---|---|---|---|
| Ordering Clinician | Create/Read own | Read (final only) | — | — | — |
| Radiologist | Read | Full CRUD | Read | Read | Read/Write |
| Technologist | Read/Update (in-progress) | — | Read | — | — |
| Radiologist Admin | Read | Read | CRUD | Full | Full |
| Tenant Admin | Full | Full | Full | Full | Full |

Roles enforced by `permission_classes` on individual ViewSets.

## Audit Trail

- `ImagingOrderStatusHistory`: immutable, append-only order status log
- `ReportAmendment`: captures before/after for every finalized-report edit
- `QualityAudit`: peer review and audit trail
- `PACSQuery` / `PACSEvent`: complete PACS interaction log
- All `BaseModel` records carry `created_at` / `updated_at` (UTC)

## Transport Security

- All DICOMweb endpoints require TLS (`PACSNode.tls_enabled`)
- Internal service-to-service calls use mTLS
- DICOM traditional C-FIND/C-MOVE allowed only on private network segments
  (AE title whitelist configured at PACS level)
