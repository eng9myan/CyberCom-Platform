# CyberCom Tenant Compliance Guide

**Program:** 2.2 — Multi-Tenant Framework  
**Date:** 2026-06-22  
**Classification:** Internal — Compliance Sensitive  
**Frameworks:** HIPAA, GDPR, Saudi PDPL, UAE Data Protection, Jordan DP, ISO 27001, SOC 2, PCI DSS

---

## 1. Compliance Framework Support

CyberCom supports 8 compliance frameworks via `TenantComplianceProfile`:

| Framework | Regions | Key Requirements |
|---|---|---|
| HIPAA | US, global healthcare | PHI isolation, audit trail, access control, MFA |
| GDPR | EU/EEA, global EU data | Data residency, right to erasure, DPA, 72h breach notify |
| Saudi PDPL | SA | Data in-country, consent, NDMO registration |
| UAE Data Protection | AE | Data localization, controller obligations |
| Jordan DP | JO | NCC notification, data localization |
| ISO 27001 | All | ISMS, risk management, access control, incident response |
| SOC 2 Type II | All | Security, availability, confidentiality controls |
| PCI DSS | Tenants handling payments | Card data isolation, encryption, audit log |

---

## 2. Data Residency

### Residency Requirements per Framework

| Framework | Residency Requirement | Enforced By |
|---|---|---|
| HIPAA | PHI must not cross US border; CyberCom stores in-region | TenantConfiguration.data_residency_country |
| Saudi PDPL | Personal data must remain in Saudi Arabia | TenantRegion.country_code = "SA" |
| UAE DP | Personal data must remain in UAE | TenantRegion.country_code = "AE" |
| Jordan DP | Sensitive data must remain in Jordan | TenantRegion.country_code = "JO" |
| GDPR | Transfer outside EEA requires SCCs or adequacy | TenantConfiguration.cross_region_replication_allowed |

### Checking Residency Requirements

```python
from platform.tenant.services import TenantComplianceService

svc = TenantComplianceService()
if svc.requires_data_residency(tenant):
    # Enforce regional storage constraints
    assert tenant.configuration.data_residency_country in ("SA", "AE", "JO")
    assert not tenant.configuration.cross_region_replication_allowed
```

---

## 3. Data Retention

Default retention policies created at bootstrap:

| Category | Retention | Strategy | Basis |
|---|---|---|---|
| audit_logs | 7 years (2555 days) | Archive to cold storage | ISO 27001 |
| user_data | 1 year (365 days) | Anonymize | GDPR |
| medical_records | 10 years (3650 days) | Archive | HIPAA |
| session_data | 90 days | Hard delete | Internal |

### Legal Hold

Set `TenantRetentionPolicy.legal_hold = True` to prevent deletion during litigation:
```python
policy = TenantRetentionPolicy.objects.get(tenant=tenant, data_category="medical_records")
policy.legal_hold = True
policy.save()
```

---

## 4. HIPAA Controls

| Control | §164 Reference | CyberCom Implementation |
|---|---|---|
| Access Control | §164.312(a) | RBAC via CyIdentity + ABAC via OPA |
| Audit Controls | §164.312(b) | LoginAudit + platform_audit_logs (immutable) |
| Person Authentication | §164.312(d) | WebAuthn mandatory for workforce realm |
| Transmission Security | §164.312(e) | TLS 1.3 in transit; AES-256 at rest |
| PHI Isolation | §164.308(a)(3) | T-DB or T-Cluster tier; PostgreSQL RLS |
| Minimum Necessary | §164.514(d) | ABAC policies scope to minimum required data |

Healthcare sovereign tenants (`tenant_type=healthcare_sovereign`) must use `tier=cluster` or `tier=database`.

---

## 5. GDPR Controls

| Obligation | Article | CyberCom Implementation |
|---|---|---|
| Lawful basis | Art. 6 | Consent captured at registration; contract basis for B2B |
| Data subject rights | Art. 15-22 | Erasure via anonymize retention strategy; export via audit export |
| Breach notification | Art. 33 | 72h → SecurityIncident model (Program 2.4) |
| DPA (processor) | Art. 28 | Per-tenant DPA signed; stored in TenantComplianceProfile |
| Data minimization | Art. 5 | TenantRetentionPolicy enforces anonymization |
| Transfer mechanisms | Art. 46 | SCCs for cross-region; adequacy for AE/JO |

---

## 6. Saudi PDPL Controls

| Requirement | CyberCom Implementation |
|---|---|
| In-country storage | TenantRegion with country_code="SA" + primary=True |
| NDMO registration | TenantComplianceProfile.certificate_number stores NDMO ref |
| Consent management | Consent model in Program 2.4 (CyConsent) |
| Data Controller obligations | TenantProfile.legal_name + registration_number |
| Cross-border transfer prohibition | cross_region_replication_allowed=False for PDPL tenants |

---

## 7. Isolation Enforcement per Tier

### T-Shared (RLS)
- PostgreSQL Row-Level Security on all tenant tables
- `app.current_tenant_id` GUC set per request
- Isolation test: each test suite runs with a different tenant context

### T-DB (Database-per-Tenant)
- Separate PostgreSQL database per tenant
- `TenantEnvironment.database_name` drives connection routing
- Backups isolated per tenant (enables per-tenant point-in-time recovery)
- BYOK: `TenantConfiguration.byok_key_arn` → per-tenant KMS key

### T-Cluster (Sovereign)
- Separate Kubernetes namespace or cluster
- Separate Keycloak realm
- Separate network segment; no shared services
- Required for: government, healthcare_sovereign, on_premise tenant types

---

## 8. Compliance Audit Trail

All compliance-relevant events are written to `platform_audit_logs`:

- `tenant.compliance.added` — framework enrolled
- `tenant.activated` / `tenant.suspended` / `tenant.terminated`
- `tenant.feature.enabled` — feature changes audited
- `tenant.license.updated` — license grants audited
- `tenant.domain.verified` — domain management audited

Audit logs are immutable (no delete/update permitted at the model layer).

---

## 9. Compliance Hardening Checklist

- [ ] All healthcare_sovereign and government tenants use tier=cluster
- [ ] PDPL tenants have TenantRegion with country_code="SA" and is_primary=True
- [ ] UAE tenants have cross_region_replication_allowed=False
- [ ] HIPAA tenants have medical_records retention policy with legal_hold=False (can set True for litigation)
- [ ] GDPR tenants have user_data retention policy with deletion_strategy="anonymize"
- [ ] All active compliance profiles have valid expires_at in the future
- [ ] SIEM export enabled for HIPAA + SOC 2 tenants (TenantAuditConfiguration.siem_enabled)
- [ ] Audit export scheduled for cold storage (TenantAuditConfiguration.export_enabled)
- [ ] BYOK enabled for enterprise healthcare tenants
