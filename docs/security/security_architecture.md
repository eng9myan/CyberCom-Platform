# Security Architecture

> **Status:** Approved — Program 0, Phase 0.4
> **Owner:** Chief Security Architect
> **Applies to:** All CyberCom products, services, and environments.

---

## 1. Goals

1. **Zero Trust** — no implicit trust based on network location; every request is authenticated, authorized, and encrypted.
2. **Defense in depth** — independent layered controls so any single failure does not cause compromise.
3. **Least privilege** — every identity has the minimum permissions for its function and time.
4. **Auditability** — every privileged action and every access to regulated data is recorded and tamper-evident.
5. **Compliance-aligned** — HIPAA-oriented, GDPR-ready, ISO 27001 / SOC 2 / NIST 800-53 / NIST CSF mappable.

---

## 2. Threat Model (Baseline)

We adopt **STRIDE** at design time and **MITRE ATT&CK** during operations.

| STRIDE | Examples relevant to CyberCom |
|---|---|
| **S**poofing | Token theft, IdP impersonation, phishing |
| **T**ampering | Modified events, MITM, supply-chain code injection |
| **R**epudiation | Missing audit trail for clinical actions / financial postings |
| **I**nformation disclosure | PHI/PII leak via logs, misconfigured RLS, screenshots, AI prompts |
| **D**enial of service | API floods, expensive queries, dependency outages |
| **E**levation of privilege | Privilege creep, sandbox escape, container break-out |

Each product publishes its own threat model in `docs/security/threat-models/<product>.md` (to be authored as products bootstrap).

---

## 3. Trust Zones

```
┌──────────────────────────────────────────────────────────────────┐
│                          Internet                                │
│         users · partners · attackers · public clients            │
└──────────────────────────────┬───────────────────────────────────┘
                               │ TLS 1.3 + WAF + DDoS
┌──────────────────────────────▼───────────────────────────────────┐
│                       Edge Zone                                  │
│      CDN · WAF · API Gateway · CyIdentity OIDC                   │
└──────────────────────────────┬───────────────────────────────────┘
                               │ mTLS + signed JWT
┌──────────────────────────────▼───────────────────────────────────┐
│                     Application Zone                             │
│   Product services (CyMed, CyShop, …) · CyIntegration Hub        │
│   Service mesh: mTLS, identity-aware authz, retries, circuit-    │
│   breakers, sidecar telemetry                                    │
└──────────────────────────────┬───────────────────────────────────┘
                               │ TLS + IAM-scoped credentials
┌──────────────────────────────▼───────────────────────────────────┐
│                       Data Zone                                  │
│   PostgreSQL (RLS) · Redis · Object Storage · Kafka · Vault      │
│   Encryption at rest (KMS) · Restricted network · Audit logging  │
└──────────────────────────────────────────────────────────────────┘
```

- **No flat networks.** Each zone has its own subnets, security groups, and NetworkPolicies.
- **Default deny** at every boundary.

---

## 4. Zero-Trust Principles (applied)

| Principle | CyberCom implementation |
|---|---|
| Verify explicitly | Every request authenticated via CyIdentity (OIDC) + AuthZ via policy engine. |
| Use least privilege | Short-lived (≤15 min) tokens, scoped, audience-bound; JIT elevation for ops. |
| Assume breach | Microsegmentation; service mesh mTLS; anomaly detection; tamper-evident logs. |
| Continuous verification | Token replay protection; device posture (workforce); risk-based step-up MFA. |
| Encrypt everywhere | TLS 1.3 in transit, KMS-managed keys at rest; field-level for highest classes. |
| Inspect and log | Centralized audit log; SIEM correlation; UEBA. |

---

## 5. Identity & Access

See [`identity_access_strategy.md`](identity_access_strategy.md). Key requirements:

- All human authentication via **CyIdentity** (OIDC), with **MFA mandatory** (TOTP / WebAuthn preferred).
- All service-to-service auth via **mTLS** or **short-lived signed JWT**, audience-scoped.
- Authorization decisions through a **policy engine** (OPA/Cedar — see ADR-0005). No inline `if user.role == ...` in handlers.
- **Hybrid RBAC + ABAC**: roles for coarse grouping, attributes (tenant, location, data class, time, purpose) for fine-grained checks.
- **Just-in-time access** for privileged operations with approval workflow + auto-expiry.
- **Multi-tenant isolation** enforced at three layers: app (request scope), DB (PostgreSQL RLS), and infra (per-tenant keys, namespaces where applicable).

---

## 6. Data Protection

See [`encryption_strategy.md`](encryption_strategy.md) and [`backup_recovery_strategy.md`](backup_recovery_strategy.md).

- **In transit:** TLS 1.3 everywhere; HSTS; mTLS inside the mesh.
- **At rest:** AES-256 via cloud KMS; customer-managed keys (CMK) for regulated tenants.
- **Field-level encryption** for highest-class data (national IDs, MRN, payment instruments) using envelope encryption.
- **Tokenization** for PCI scope; vault-stored mapping.
- **Backups:** encrypted, immutable (object-lock), tested via quarterly restore drills.
- **Data classification** drives storage, masking, retention and access rules (see `database_standards.md` §13).

---

## 7. Secrets

See [`secrets_management_strategy.md`](secrets_management_strategy.md).

- Single source of truth: **HashiCorp Vault** (or cloud secret manager — per ADR), accessed via the **External Secrets Operator** in Kubernetes.
- Workload identity (OIDC for cloud, SPIFFE/SPIRE in mesh) — no static cloud credentials in CI or in pods.
- Secret rotation automated; max age 90 days for app secrets, 30 days for crypto keys (where possible).
- **Forbidden** to write secrets to env files, code, logs, AI prompts, or screenshots.

---

## 8. Network Security

- WAF at the edge with managed rules (OWASP CRS) + custom rules per product.
- DDoS protection (cloud-native + rate limiting at the gateway).
- **Service mesh** (Istio/Linkerd — per ADR) for mTLS, identity-aware authz, and observability.
- Per-namespace `NetworkPolicy`: **default deny**, explicit allow.
- Egress controlled via per-namespace egress gateways with allowlists.

---

## 9. Application Security

- Secure SDLC enforced by [`quality_gates.md`](../standards/quality_gates.md): SAST (CodeQL), SCA (Trivy / pip-audit / npm audit), secret scanning (Gitleaks), license scan, IaC scan (Checkov), container scan (Trivy).
- DAST (OWASP ZAP) nightly + before release; pen-test per release train for Tier-1 products.
- Strict CSP, HSTS, CSRF tokens, secure cookies (HttpOnly/Secure/SameSite).
- Input validation + output encoding at every boundary; parameterized queries only.
- SSRF protections (egress allowlist, metadata-service blocking).
- Supply chain: pinned digests, signed images (Sigstore/cosign), SBOM (CycloneDX/SPDX), SLSA Level 3 target.

---

## 10. Audit Logging

See [`audit_logging_strategy.md`](audit_logging_strategy.md). Every privileged or regulated action emits a structured **audit event** to the immutable audit log with: `actor`, `action`, `resource`, `tenant_id`, `purpose`, `result`, `correlation_id`, `timestamp`, `source_ip`, `device_id`.

---

## 11. Detection & Response

See [`incident_response_plan.md`](incident_response_plan.md). Stack:

- **SIEM** ingests logs, audit events, mesh telemetry.
- **EDR/CWP** on nodes; container runtime security (Falco target).
- **Anomaly detection** on auth, data access, egress.
- On-call rotation with documented runbooks; tabletop exercises quarterly.

---

## 12. Compliance Architecture

CyberCom is **HIPAA-oriented** and **GDPR-ready**.

| Control family | HIPAA | GDPR | CyberCom mechanism |
|---|---|---|---|
| Access control | §164.312(a) | Art. 32 | CyIdentity + OPA/Cedar; per-tenant isolation |
| Audit controls | §164.312(b) | Art. 30 | Immutable audit log; tamper-evident hashing |
| Integrity | §164.312(c) | Art. 32 | Checksums, digital signatures, mTLS |
| Authentication | §164.312(d) | Art. 32 | MFA mandatory; OIDC; passwordless option |
| Transmission security | §164.312(e) | Art. 32 | TLS 1.3 + mTLS |
| Breach notification | §164.400 | Art. 33–34 | Incident response plan with 72-h notification path |
| Data minimization | n/a | Art. 5 | Field-level access; purpose binding; retention policies |
| Data subject rights | n/a | Art. 12–22 | Right-to-access / -erasure flows in CyIdentity & data plane |
| Data residency | n/a | Art. 44 | Region-pinned deployments; CMK per region |
| Risk assessment | §164.308(a)(1) | Art. 35 (DPIA) | Threat models per product; DPIA template |

Healthcare additions (CyMed):
- All PHI access logged with `purpose_of_use`.
- Break-the-glass (emergency access) explicit, time-boxed, audited, post-reviewed.
- De-identification (HIPAA Safe Harbor / Expert Determination) for analytics surfaces.

---

## 13. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| Chief Security Architect | Owns architecture & policy; chairs security review |
| DevSecOps Architect | Owns CI/CD security gates, runtime hardening, secrets |
| Compliance Architect | HIPAA/GDPR mapping, DPIAs, BAAs, audits |
| Domain Architects | Per-product threat models, data classification |
| Engineering | Implement controls; report risks |
| Security Operations (future) | Monitoring, triage, IR, threat hunting |

---

## 14. Continuous Improvement

- Security architecture reviewed each release train.
- Threat models updated when a new data class, integration, or trust boundary is introduced.
- Pen-test & DAST findings tracked to closure; recurring findings escalated to ADR.
- KRI/KPI dashboard: MTTD, MTTR, % services on mesh, % secrets rotated on time, audit-log coverage, patch SLA.
