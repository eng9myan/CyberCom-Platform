# CyberCom Evidence Management Guide

**Program:** 2.3 — Audit & Compliance Framework
**Date:** 2026-06-22
**Audience:** Compliance Officers, Legal, Security

---

## 1. Evidence Types

| Type | Code | Examples |
|---|---|---|
| Audit Log | audit_log | Exported audit event set |
| Screenshot | screenshot | UI state capture |
| Document | document | Policy, DPA, attestation form |
| Data Export | export | Patient data, financial records |
| Attestation | attestation | Signed compliance declaration |
| System Config | system_config | Security settings export |

---

## 2. Collecting Evidence

```python
from platform.audit.services import EvidenceService

svc = EvidenceService()

# From audit log export
rec = svc.collect(
    tenant_id=tenant.id,
    title="Break Glass events Q2-2026",
    evidence_type="audit_log",
    collected_by=current_user.id,
    source_system="platform_audit",
    reference_id="CASE-2026-001",
    content={
        "event_count": 12,
        "period": "2026-04-01/2026-06-30",
        "filter": {"category": "clinical", "action_verb": "break_glass"},
    },
)

# From system configuration snapshot
config_rec = svc.collect(
    tenant_id=tenant.id,
    title="MFA policy configuration snapshot",
    evidence_type="system_config",
    collected_by=current_user.id,
    content={"mfa_required": True, "policy_version": "2.1"},
)
```

---

## 3. Chain of Custody

Each `EvidenceRecord` has a `chain_of_custody` JSONField that can be extended:

```python
rec.chain_of_custody.append({
    "action": "collected",
    "by": "analyst@x.com",
    "at": "2026-06-22T10:00:00Z",
    "note": "Exported from audit sink",
})
rec.save(update_fields=["chain_of_custody", "updated_at"])
```

---

## 4. Locking Records

Locked records cannot be modified (application-layer enforcement).

```python
rec.lock()
# rec.is_locked == True
# rec.locked_at == timezone.now()
```

Records are auto-locked when included in a sealed `EvidencePackage`.

---

## 5. Creating and Sealing Evidence Packages

```python
from platform.audit.services import EvidenceService

svc = EvidenceService()

# Collect multiple evidence records
rec1 = svc.collect(tenant_id=tenant.id, title="Audit logs", evidence_type="audit_log")
rec2 = svc.collect(tenant_id=tenant.id, title="Config snapshot", evidence_type="system_config")
rec3 = svc.collect(tenant_id=tenant.id, title="HIPAA attestation", evidence_type="attestation")

# Create package
pkg = svc.create_package(
    tenant_id=tenant.id,
    name="HIPAA Annual Audit Package 2026",
    purpose="compliance_certification",
    created_by=current_user.id,
    record_ids=[rec1.id, rec2.id, rec3.id],
    case_reference="HIPAA-CERT-2026",
)

# Seal (hash all records, lock all records)
svc.seal_package(pkg, sealed_by=current_user.id)

print(f"Package hash: {pkg.package_hash}")
# SHA-256 of sorted record IDs — tamper-evident
```

---

## 6. Package Purposes

| Purpose | Code | Use Case |
|---|---|---|
| Legal Proceeding | legal_proceeding | Litigation, discovery |
| Regulatory Audit | regulatory_audit | External audit (NDMO, JCI, etc.) |
| Internal Investigation | internal_investigation | Security incident, HR |
| Compliance Certification | compliance_certification | HIPAA, SOC 2, ISO 27001 certification |

---

## 7. Evidence API

```bash
# Collect a record
POST /api/v1/audit/evidence/records/
{
  "tenant_id": "uuid",
  "title": "Access log export",
  "evidence_type": "audit_log",
  "collected_by": "analyst@x.com"
}

# Lock a record
POST /api/v1/audit/evidence/records/{id}/lock/

# Create package
POST /api/v1/audit/evidence/packages/
{
  "name": "Legal Bundle",
  "purpose": "legal_proceeding",
  "created_by": "legal@x.com",
  "records": ["uuid1", "uuid2"]
}

# Seal package
POST /api/v1/audit/evidence/packages/{id}/seal/
{"sealed_by": "legal@x.com"}

# List packages
GET /api/v1/audit/evidence/packages/
```

---

## 8. Integrity Verification

Package integrity:
```python
import hashlib

expected_hash = hashlib.sha256(
    str(sorted([str(r.id) for r in pkg.records.all()])).encode()
).hexdigest()

assert pkg.package_hash == expected_hash, "Package tampered!"
```

Individual record file integrity (if `file_hash_sha256` set):
```python
import hashlib
with open(rec.file_path, "rb") as f:
    actual = hashlib.sha256(f.read()).hexdigest()
assert actual == rec.file_hash_sha256
```
