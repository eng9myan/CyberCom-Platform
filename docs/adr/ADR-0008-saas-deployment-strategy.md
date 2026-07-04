# ADR-0008: SaaS Deployment Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | DevOps Architect, Platform Architect, Chief Security Architect, Compliance Architect |
| **Affects** | All product deployments |
| **Tags** | platform, devops, deployment, infrastructure |
| **Related** | [ADR-0001](ADR-0001-platform-technology-stack.md), [ADR-0002](ADR-0002-multi-tenancy-strategy.md), [backup_recovery_strategy](../security/backup_recovery_strategy.md) |

---

## 1. Context

CyberCom is delivered as **SaaS by default**, with optional **private cloud** and **on-prem / sovereign** deployments for regulated tenants (healthcare, government). The deployment model must support all three without forking the platform.

## 2. Problem Statement

How is CyberCom packaged, deployed, scaled, and operated across cloud SaaS, dedicated tenant deployments, and on-prem/sovereign installs?

## 3. Decision Drivers

- Single artifact set across deployment modes.
- Multi-region, multi-cloud portability.
- Strict isolation when required (per [ADR-0002](ADR-0002-multi-tenancy-strategy.md)).
- Compliance: HIPAA, GDPR, MOH, national clouds.
- Operability with a small platform team.

## 4. Considered Options

1. **Kubernetes everywhere + Helm + GitOps; per-deployment-mode topology** (chosen).
2. PaaS-first (e.g. AWS App Runner / Cloud Run) for SaaS, K8s only for on-prem.
3. VM-based deployments via Terraform / Ansible.

## 5. Decision

### 5.1 Topology

| Mode | Topology |
|---|---|
| **Public SaaS (default)** | Multi-tenant clusters per region; shared schema + RLS by default; multi-AZ; multi-region active/active for Tier-1 services. |
| **Dedicated SaaS** | Per-tenant namespace or per-tenant cluster (T-DB or T-Cluster per [ADR-0002](ADR-0002-multi-tenancy-strategy.md)); managed by CyberCom. |
| **Private cloud (BYOC)** | Customer-owned cloud account; CyberCom-managed clusters; mTLS bridge to control plane. |
| **On-prem / Sovereign** | Customer infra; air-gapped option; same Helm charts and images; updates via signed artifact bundles. |

### 5.2 Platform building blocks

- **Containers:** Docker images, multi-stage, non-root, distroless/slim; signed (Sigstore/cosign); SBOM attached.
- **Orchestration:** Kubernetes (managed: EKS / AKS / GKE; self-managed for on-prem via kubeadm/RKE2/Talos).
- **Packaging:** Helm charts per service; umbrella chart per product.
- **IaC:** Terraform for cloud + cluster bootstrap; Crossplane considered per follow-up ADR.
- **GitOps:** Argo CD (or Flux) reconciling clusters from Git; promotion via environment branches/paths.
- **Service mesh:** Istio or Linkerd (per follow-up ADR) — mTLS, identity-aware authz.
- **Ingress:** managed cloud LB + WAF + CDN at the edge; cluster ingress via Gateway API.
- **DB:** Managed PostgreSQL where available (RDS/Aurora, Cloud SQL, Azure DB); self-managed (Patroni/CloudNativePG) for on-prem.
- **Object storage:** S3-compatible everywhere (MinIO on-prem).
- **Secrets:** Vault + External Secrets Operator.
- **Observability:** Prometheus + Grafana + Loki/Tempo (or vendor: Datadog/NewRelic for cloud).
- **Backup/DR:** per [`backup_recovery_strategy`](../security/backup_recovery_strategy.md); Velero for K8s manifests where applicable.

### 5.3 Environments

`local` → `ci` (ephemeral) → `dev` → `staging` → `prod`. Per-product preview environments for PRs allowed where cost permits.

### 5.4 Release & rollout

- Progressive delivery: **canary → staged → full** with automatic rollback on SLO breach (Argo Rollouts or Flagger).
- Feature flags via a centralized provider; flags are not for branching code, but for de-risking rollout.
- Database migrations applied with safe-migration patterns (additive → backfill → enforce → cleanup).
- Tier-1 services support **multi-region failover**; tested in DR drills.

### 5.5 Tenant lifecycle

- **Onboarding:** automated via IaC + control-plane API: realm in CyIdentity, namespace/DB provisioned (or RLS row), DNS, observability, billing.
- **Move between tiers:** documented migration runbooks (T-Shared → T-DB → T-Cluster).
- **Offboarding:** export, suspend, 30-day grace, secure deletion with attestation; audit retained per regulation.

### 5.6 Compliance modes

- **HIPAA / BAA:** dedicated or private-cloud profile; CMK; tenant-level audit export.
- **GDPR residency:** region-pinned cluster + storage + KMS; cross-region transfer disabled.
- **Sovereign:** on-prem or national-cloud profile; air-gap option; signed offline update bundles.

## 6. Rationale

- K8s + Helm + GitOps is the only architecture that scales from multi-tenant SaaS to sovereign on-prem without forking the platform.
- Managed cloud services are used where they speed delivery; on-prem profiles substitute equivalents.
- GitOps gives auditable, reproducible deployments and clean disaster recovery.

## 7. Consequences

### 7.1 Positive
- One platform, many deployment modes — engineering effort focused.
- Strong story for regulated tenants without compromising SaaS velocity.

### 7.2 Trade-offs
- K8s operational cost is real; mitigate with managed services where available and a strong platform team.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | On-prem version drift | High | Medium | Signed bundles; supported-version matrix; remote diagnostics where permitted |
| 2 | Cloud provider lock-in via managed services | Medium | Medium | Abstract via Helm values; on-prem alternatives required for every managed service |
| 3 | Cost overrun on multi-region for Tier-1 | Medium | Medium | Active/passive option; cost dashboards; quarterly review |
| 4 | Sovereign deployments lag SaaS in security fixes | Medium | High | Signed-bundle pipeline; SLA for patch propagation; remote attestation where possible |

## 8. Compliance & Security Impact

- Enables HIPAA, GDPR, and sovereign compliance modes.
- Aligns with [`security_architecture`](../security/security_architecture.md), [`backup_recovery_strategy`](../security/backup_recovery_strategy.md), [`incident_response_plan`](../security/incident_response_plan.md).

## 9. Alternatives Rejected

- **PaaS-first** — fastest for pure SaaS, but no path to on-prem/sovereign without rewrite.
- **VM-based** — workable but loses GitOps, autoscaling, and microsegmentation ergonomics.

## 10. References

- [`backup_recovery_strategy`](../security/backup_recovery_strategy.md), [`security_architecture`](../security/security_architecture.md)
- CNCF reference architectures; Argo CD; Gateway API; Sigstore

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | DevOps Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
