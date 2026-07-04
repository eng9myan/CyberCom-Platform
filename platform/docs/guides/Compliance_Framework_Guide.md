# CyberCom Compliance Framework Guide

**Program:** 2.3 — Audit & Compliance Framework
**Date:** 2026-06-22
**Frameworks:** HIPAA, GDPR, PDPL, UAE DP, Jordan DP, SOC 2, ISO 27001, NCA ECC, JCI/TJC, PCI DSS

---

## 1. Framework Support Matrix

| Framework | Region | Mandatory For | Passing Score | Rules Seeded |
|---|---|---|---|---|
| HIPAA S164 | US, Global healthcare | healthcare_sovereign tenants | 80% | 7 |
| GDPR | EU/EEA | EU-data tenants | 80% | 6 |
| Saudi PDPL | SA | Saudi tenants | 80% | Manual |
| UAE Data Protection | AE | UAE tenants | 80% | Manual |
| Jordan DP | JO | Jordan tenants | 80% | Manual |
| SOC 2 Type II | All | Platform-wide | 80% | 5 |
| ISO 27001 | All | Platform-wide | 80% | 5 |
| NCA ECC | SA | Saudi tenants | 80% | 5 |
| JCI/TJC | Healthcare | Healthcare tenants | 80% | Manual |
| PCI DSS | All | Payment-processing tenants | 80% | Manual |

---

## 2. Creating Compliance Profiles

```python
from platform.audit.services import ComplianceProfileService
from platform.audit.models import ComplianceFrameworkCode

svc = ComplianceProfileService()

# Create HIPAA profile with seeded rules
profile = svc.create_profile(
    framework=ComplianceFrameworkCode.HIPAA,
    tenant_id=tenant.id,
    seed_rules=True,
)

# Idempotent get-or-create
profile = svc.get_or_create(ComplianceFrameworkCode.GDPR, tenant_id=tenant.id)
```

---

## 3. HIPAA Controls

| Rule ID | Control | Severity | Category |
|---|---|---|---|
| HIPAA-AC-1 | Unique User Identification | Critical | authentication |
| HIPAA-AC-2 | Emergency Access (Break Glass) | Critical | clinical |
| HIPAA-AU-1 | Audit Controls — Activity Logs | Critical | security |
| HIPAA-AU-2 | Audit Review and Reporting | High | security |
| HIPAA-TM-1 | Transmission Security — TLS | Critical | security |
| HIPAA-PHI-1 | PHI Isolation via RLS or T-DB | Critical | clinical |
| HIPAA-MFA-1 | MFA for Workforce Members | High | authentication |

Compliance tags `hipaa` auto-applied to all events with `category=clinical` or `data_classification=phi`.

---

## 4. GDPR Controls

| Rule ID | Control | Severity |
|---|---|---|
| GDPR-LB-1 | Lawful Basis Documented | Critical |
| GDPR-DSR-1 | Data Subject Rights Mechanism | High |
| GDPR-DM-1 | Data Minimization Controls | Medium |
| GDPR-BR-1 | Breach Notification < 72h | Critical |
| GDPR-DR-1 | Data Residency Enforced | High |
| GDPR-RT-1 | Retention Policy Active | High |

Compliance tags `gdpr`, `pdpl` auto-applied to events with `data_classification=pii` or `phi`.

---

## 5. NCA ECC Controls

| Rule ID | Control | Severity |
|---|---|---|
| NCA-1-1 | Asset Management | High |
| NCA-2-1 | Access Control — Privileged Accounts | Critical |
| NCA-3-1 | Security Event Logging | Critical |
| NCA-4-1 | Data Classification | High |
| NCA-5-1 | Incident Response Plan | High |

NCA ECC is mandatory for Saudi government tenants.

---

## 6. Running Compliance Assessments

```python
from platform.audit.services import ComplianceAssessmentService

svc = ComplianceAssessmentService()

# Run assessment (checks open violations against rules)
assessment = svc.assess(
    profile=profile,
    tenant_id=tenant.id,
    assessed_by="compliance-officer@kfsh.sa",
)
print(f"Score: {assessment.score}%, Result: {assessment.result}")
print(f"Critical violations: {assessment.critical_violations}")

# Generate period report
report = svc.generate_report(
    framework="hipaa",
    tenant_id=tenant.id,
    period_days=90,
    generated_by="system",
)
```

Via Celery (runs automatically): `audit.run_compliance_assessments` — daily.

---

## 7. Recording and Remediating Violations

```python
from platform.audit.services import ViolationService

svc = ViolationService()

# Record a violation
violation = svc.record(
    rule=rule,
    tenant_id=tenant.id,
    description="2 workforce accounts without MFA enrolled",
    resource_type="user_account",
    evidence={"user_ids": ["u1", "u2"]},
)

# Remediate
svc.remediate(violation, by="ops@kfsh.sa", notes="MFA enrolled for both accounts")

# Accept risk (with justification)
svc.accept_risk(violation, by="ciso@kfsh.sa", reason="Exception approved for service accounts")
```

---

## 8. Compliance Scoring

Assessment scoring algorithm:

```
score = (passed_rules / total_rules) * 100

result = FAILED   if any critical violation open
result = PASSED   if score >= profile.passing_score (default 80)
result = PARTIAL  if score < passing_score and no critical violations
```

Assessment runs per profile, per tenant. Automated via Celery Beat daily.

---

## 9. Compliance API

```bash
# List profiles
GET /api/v1/audit/compliance/profiles/

# Run assessment
POST /api/v1/audit/compliance/profiles/{id}/assess/

# Generate report
POST /api/v1/audit/compliance/profiles/{id}/generate_report/

# List violations
GET /api/v1/audit/compliance/violations/?status=open

# Remediate violation
POST /api/v1/audit/compliance/violations/{id}/remediate/
{"remediated_by": "ops@x.com", "notes": "Fixed"}

# Accept risk
POST /api/v1/audit/compliance/violations/{id}/accept_risk/
{"accepted_by": "ciso@x.com", "reason": "Accepted"}
```
