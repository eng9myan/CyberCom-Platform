# CyberCom Retention & Archival Guide

**Program:** 2.3 — Audit & Compliance Framework
**Date:** 2026-06-22
**ADRs:** ADR-0028 S6 (Tiered Retention)

---

## 1. Retention Tiers

Per ADR-0028, audit data moves through three storage tiers:

| Tier | Storage | Duration | Access Pattern |
|---|---|---|---|
| Hot | Primary DB (PostgreSQL/SQLite) | 0–90 days | Fast search, incident response |
| Warm | Object storage (S3/Blob) | 90 days – 1 year | Compliance reporting, billing |
| Cold | WORM storage (Glacier/Vault) | 1 year – 7–21 years | Legal, regulatory, litigation |

Exact durations are configurable per `AuditRetentionPolicy`.

---

## 2. Default Retention Policies

Seeded by `RetentionService.seed_default_policies()`:

| Category | Classification | Hot (d) | Warm (d) | Cold (yr) | Basis |
|---|---|---|---|---|---|
| clinical | phi | 90 | 365 | 10 | HIPAA |
| authentication | internal | 90 | 365 | 7 | ISO 27001 |
| financial | financial | 90 | 365 | 7 | SOC 2 |
| government | government_sensitive | 90 | 365 | 10 | NCA ECC |
| security | confidential | 90 | 365 | 7 | ISO 27001 |
| ai | internal | 90 | 180 | 3 | ISO 27001 |

---

## 3. Using RetentionService

```python
from platform.audit.services import RetentionService
from platform.audit.models import AuditCategoryCode, DataClassification

svc = RetentionService()

# Seed defaults for a new tenant
svc.seed_default_policies(tenant_id=tenant.id)

# Get policy for specific category/classification
policy = svc.get_policy(
    category=AuditCategoryCode.CLINICAL,
    classification=DataClassification.PHI,
    tenant_id=tenant.id,
)
print(f"Cold tier: {policy.cold_retention_years} years")
```

---

## 4. Archival Process

Celery task `audit.archive_expired` runs daily:
1. Identifies events older than `hot_retention_days` per category
2. Creates `AuditArchive` record (pending)
3. Background worker uploads event bundle to cold storage
4. Updates archive record status to `archived` + `checksum_sha256`
5. Verification worker reads archive back, checks checksum, marks `verified`

```bash
# Manually trigger archive sweep
celery -A cybercom call audit.archive_expired
```

---

## 5. Retention API

```bash
# List policies
GET /api/v1/audit/retention-policies/

# Create policy
POST /api/v1/audit/retention-policies/
{
  "tenant_id": "uuid",
  "category": "clinical",
  "data_classification": "phi",
  "hot_retention_days": 90,
  "warm_retention_days": 365,
  "cold_retention_years": 10,
  "compliance_basis": "hipaa"
}

# List archives
GET /api/v1/audit/archives/
```

---

## 6. Legal Hold Override

Legal holds override all retention policies. Records covered by an active legal hold are NOT archived or purged until the hold is released.

```python
from platform.audit.services import LegalHoldService

svc = LegalHoldService()

# Check if a resource type is held
if svc.is_resource_held(tenant_id, "patient_record"):
    # Skip deletion/archival
    pass
```

See `Legal_Hold_Guide.md` for full legal hold management.

---

## 7. Compliance-Specific Minimums

| Framework | Category | Minimum Cold Retention |
|---|---|---|
| HIPAA S164.530(j) | clinical | 6 years |
| Saudi PDPL | personal_data | 5 years (post-collection) |
| UAE DP | personal_data | Per controller determination |
| Jordan DP | personal_data | Per controller determination |
| ISO 27001 A.12.4 | security | 1 year minimum |
| SOC 2 CC7 | security | 1 year minimum |
| NCA ECC | government | 10 years |

CyberCom defaults exceed all minimums.
