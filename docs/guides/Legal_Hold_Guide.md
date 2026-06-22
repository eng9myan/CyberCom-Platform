# CyberCom Legal Hold Guide

**Program:** 2.3 — Audit & Compliance Framework
**Date:** 2026-06-22
**Audience:** Legal, Compliance Officers, Platform Admins

---

## 1. Overview

Legal holds preserve records from deletion, archival, or modification during litigation or regulatory investigation. A legal hold overrides all retention policies for the covered resources.

Only `platform_admin` or `legal_hold_admin` roles can create/release holds.

---

## 2. Creating a Legal Hold

### Via API

```bash
curl -X POST https://api.cybercom.io/api/v1/audit/legal-holds/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "<tenant-uuid>",
    "name": "Case 2026-KFSH-001",
    "description": "Preserve all patient records for litigation case",
    "case_reference": "LEGAL-2026-001",
    "resource_types": ["patient_record", "clinical_note", "lab_result"],
    "resource_ids": [],
    "custodians": ["dr.khalid@kfsh.sa", "legal@kfsh.sa"],
    "created_by": "legal@cybercom.io"
  }'
```

### Via Python

```python
from platform.audit.services import LegalHoldService
from datetime import datetime, timezone

svc = LegalHoldService()
hold = svc.create(
    tenant_id=tenant.id,
    name="Case 2026-KFSH-001",
    description="Preserve all patient records for litigation",
    created_by=request.user.id,
    case_reference="LEGAL-2026-001",
    resource_types=["patient_record", "clinical_note"],
    custodians=["dr.khalid@kfsh.sa"],
    expires_at=datetime(2027, 6, 22, tzinfo=timezone.utc),  # optional
)
```

A `legal_hold.created` audit event is automatically written.

---

## 3. Checking if a Resource is Held

```python
from platform.audit.services import LegalHoldService

svc = LegalHoldService()

# Check by resource type (holds any record of this type)
if svc.is_resource_held(tenant_id, "patient_record"):
    raise PermissionError("Resource under legal hold — deletion prohibited")

# Check specific resource ID
if svc.is_resource_held(tenant_id, "patient_record", resource_id="PAT-0012"):
    raise PermissionError("Specific record under legal hold")
```

---

## 4. Releasing a Legal Hold

Legal hold release requires `platform_admin` role. A release reason must be documented.

```bash
curl -X POST https://api.cybercom.io/api/v1/audit/legal-holds/{id}/release/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"released_by": "judge@court.jo", "reason": "Case resolved — consent order signed"}'
```

```python
svc.release(hold, released_by="judge@court.jo", reason="Case resolved")
```

A `legal_hold.released` audit event is written. Normal retention policies resume for the covered resources.

---

## 5. Legal Hold Expiry

Holds can be set with an `expires_at` datetime. Celery task `audit.expire_legal_holds` (daily) automatically sets expired holds to `LegalHoldStatus.EXPIRED`.

Expired holds no longer block archival or deletion.

---

## 6. Evidence Packaging

Link evidence records to a legal hold for chain of custody:

```python
from platform.audit.services import EvidenceService

svc = EvidenceService()

# Collect individual evidence items
rec1 = svc.collect(
    tenant_id=tenant.id,
    title="Patient chart audit log Jan-Jun 2026",
    evidence_type="audit_log",
    collected_by="legal@kfsh.sa",
    source_system="platform_audit",
    reference_id="CASE-2026-001",
)

# Create package linked to hold
pkg = svc.create_package(
    tenant_id=tenant.id,
    name="KFSH Legal Bundle 2026-001",
    purpose="legal_proceeding",
    created_by="legal@kfsh.sa",
    record_ids=[rec1.id],
    legal_hold_id=hold.id,
    case_reference="LEGAL-2026-001",
)

# Seal (locks all records, computes package hash)
svc.seal_package(pkg, sealed_by="legal@kfsh.sa")
```

Once sealed, all included `EvidenceRecord` objects are locked (immutable). Package hash is SHA-256 of all record IDs.

---

## 7. Legal Hold Status Flow

```
ACTIVE -> RELEASED (manual)
ACTIVE -> EXPIRED  (automatic, if expires_at set)
```

---

## 8. Compliance Notes

- HIPAA: Legal holds must preserve PHI for duration of litigation regardless of standard 6-year retention.
- GDPR Art. 17(3)(e): Right to erasure does not apply when data is required for legal proceedings.
- Saudi PDPL: Data must be retained while legal dispute is ongoing.
- NCA ECC: Government records under investigation cannot be archived or purged.
