# CyberCom Audit Framework Developer Guide

**Program:** 2.3 — Audit & Compliance Framework
**Date:** 2026-06-22
**ADRs:** ADR-0028, ADR-0005, ADR-0002

---

## 1. Architecture

CyberCom implements a centralized, immutable, hash-chained audit sink per ADR-0028.

```
[Bounded Context Transaction]
         |
         v
   [AuditService.record()]
         |
         v (atomic)
   [AuditChain: select_for_update]
   [AuditEvent: compute_hash, save]
   [AuditChain: advance sequence + last_hash]
   [AuditEntry: compliance_tags, risk_score]
```

Hash formula (ADR-0028 S5.1):
```
event.entry_hash = SHA-256(id || timestamp || action || resource_type || resource_id || actor_user_id || tenant_id || previous_hash)
```

Every event is linked to its predecessor. Breaking any event breaks the chain — detected by `AuditChainVerifier`.

---

## 2. Domain Models

| Model | Table | Purpose |
|---|---|---|
| AuditLog | platform_audit_logs | Backward-compat base log (immutable) |
| AuditEvent | platform_audit_events | Rich canonical event (ADR-0028 S5.2) |
| AuditChain | platform_audit_chains | Chain tip tracker per tenant |
| AuditCategory | platform_audit_categories | Category metadata + retention defaults |
| AuditEntry | platform_audit_entries | Chain position + compliance tags + risk score |
| AuditRetentionPolicy | platform_audit_retention_policies | Retention schedule by category/classification |
| AuditArchive | platform_audit_archives | WORM archive records |
| AuditSignature | platform_audit_signatures | KMS/HSM digital signatures per chain block |
| AuditExport | platform_audit_exports | Export job tracking |
| LegalHold | platform_legal_holds | Litigation preservation |
| ComplianceProfile | platform_compliance_profiles | Framework configuration |
| ComplianceRule | platform_compliance_rules | Individual testable controls |
| ComplianceViolation | platform_compliance_violations | Detected rule violations |
| ComplianceAssessment | platform_compliance_assessments | Periodic assessment results |
| ComplianceReport | platform_compliance_reports | Generated compliance reports |
| EvidenceRecord | platform_evidence_records | Individual evidence items |
| EvidencePackage | platform_evidence_packages | Bundled evidence for legal/audit |

---

## 3. Writing Audit Events

```python
from platform.audit.services import AuditService
from platform.audit.models import AuditAction, AuditCategoryCode, DataClassification

svc = AuditService()

# Standard event
svc.record(
    action="patient.chart.read",
    action_verb=AuditAction.READ,
    resource_type="patient_record",
    resource_id="PAT-0012",
    tenant_id=tenant.id,
    tenant_slug=tenant.slug,
    actor_user_id=request.user.id,
    actor_username=request.user.username,
    actor_role_claims=request.auth_claims.get("realm_access", {}).get("roles", []),
    actor_ip=request.META.get("REMOTE_ADDR"),
    actor_session_id=request.session_id,
    category=AuditCategoryCode.CLINICAL,
    data_classification=DataClassification.PHI,
    purpose_of_use="routine_care",    # mandatory for clinical
    status="success",
)

# Break glass event
svc.record(
    action="break_glass.activated",
    action_verb=AuditAction.BREAK_GLASS,
    resource_type="patient_record",
    resource_id="PAT-9999",
    category=AuditCategoryCode.CLINICAL,
    data_classification=DataClassification.PHI,
    purpose_of_use="emergency_treatment",
    # is_high_risk and risk_score are auto-computed
)
```

---

## 4. Audit Categories

| Category | Code | PHI? | Purpose of Use Required? |
|---|---|---|---|
| Authentication | authentication | No | No |
| Authorization | authorization | No | No |
| Clinical | clinical | Yes | Yes (HIPAA S164.312(b)) |
| Financial | financial | No | No |
| Government | government | No | No |
| Administrative | administrative | No | No |
| System | system | No | No |
| Configuration | configuration | No | No |
| Security | security | No | No |
| AI / ML | ai | No | No |
| ERP / Business | erp | No | No |
| Identity | identity | No | No |

---

## 5. Data Classification

| Level | Code | Examples |
|---|---|---|
| Public | public | Help docs, press releases |
| Internal | internal | Internal memos, system logs |
| Confidential | confidential | Business strategy, contracts |
| Restricted | restricted | Credentials, encryption keys |
| PHI | phi | Patient charts, diagnoses |
| PII | pii | Names, addresses, national IDs |
| Financial | financial | Payment data, bank accounts |
| Government Sensitive | government_sensitive | Citizen records, permit data |

Risk score is elevated for PHI, Restricted, Government Sensitive, and Break Glass actions.

---

## 6. Hash Chain Verification

```python
from platform.audit.services import AuditChainVerifier

verifier = AuditChainVerifier()

# Verify one tenant chain
result = verifier.verify("tenant:3fa85f64-5717-4562-b3fc-2c963f66afa6")
# {"valid": True, "chain_key": "...", "checked": 1420, "errors": []}

# Verify all chains
results = verifier.verify_all()
# [{"valid": True, ...}, {"valid": False, "errors": [{"sequence": 442, "event_id": "..."}]}, ...]
```

Chain verification runs automatically via `audit.verify_chains` Celery task (daily).

---

## 7. Audit Search

```python
from platform.audit.services import AuditSearchService

svc = AuditSearchService()
events = svc.search(
    tenant_id="uuid",
    category="clinical",
    date_from=datetime(2026, 6, 1, tzinfo=timezone.utc),
    date_to=datetime(2026, 6, 30, tzinfo=timezone.utc),
    is_high_risk=True,
    limit=100,
)
```

Via API: `POST /api/v1/audit/events/search/`

---

## 8. Healthcare-Specific Audit Actions

| Clinical Event | Action String | Purpose of Use |
|---|---|---|
| Chart access | `patient.chart.read` | routine_care / emergency |
| Break glass | `break_glass.activated` | emergency_treatment |
| Medication order | `medication.order.created` | treatment |
| Lab result viewed | `lab.result.read` | treatment |
| FHIR resource read | `fhir.{resource}.read` | routine_care |
| Clinical decision support | `cds.recommendation.viewed` | treatment |
| Order created | `order.{type}.created` | treatment |

---

## 9. ERP-Specific Audit Actions

| ERP Event | Action String |
|---|---|
| Financial posting | `financial.posting.created` |
| Payroll run | `payroll.run.approved` |
| Procurement order | `procurement.order.approved` |
| Inventory adjustment | `inventory.adjustment.created` |
| Budget approval | `budget.approval.granted` |

---

## 10. Government-Specific Audit Actions

| Gov Event | Action String |
|---|---|
| Citizen record access | `citizen.record.read` |
| Permit issued | `permit.issued` |
| License granted | `license.granted` |
| Registry update | `registry.entry.updated` |
| Inspection recorded | `inspection.report.created` |
| Revenue collected | `revenue.collection.recorded` |

---

## 11. AI / ML Audit Actions

| AI Event | Action String |
|---|---|
| Prompt submitted | `ai.prompt.submitted` |
| Inference completed | `ai.inference.completed` |
| Model selected | `ai.model.selected` |
| RAG retrieval | `ai.rag.retrieval` |
| Guardrail triggered | `ai.guardrail.triggered` |
| AI decision recorded | `ai.decision.recorded` |

---

## 12. Testing

```bash
export DJANGO_SETTINGS_MODULE=core.test_settings
export DJANGO_SECRET_KEY=test-secret-key

# Audit suite only
pytest platform/audit/tests/test_audit.py -v --no-cov
# 104 passed in 1.15s

# Full combined suite
pytest platform/cyidentity/tests/ platform/tenant/tests/ platform/audit/tests/ --no-cov -q
# 279 passed in 8.32s
```
