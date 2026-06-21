# Kubernetes Strategy

> **Status:** Approved — Program 0, Phase 0.5
> **Owner:** Infrastructure Architect

Kubernetes is CyberCom's runtime everywhere — managed cloud (EKS / AKS / GKE), private cloud, and sovereign on-prem (RKE2 / Talos / kubeadm).

---

## 1. Principles

1. **One workload model, many clusters.** Same Helm charts and policies regardless of host.
2. **Stateless apps; stateful as a service.** Stateful workloads via managed services or vetted operators.
3. **Multi-tenancy by namespace, mesh, and policy.** Not by trust.
4. **Defaults are secure.** Non-root, read-only root FS, distroless, capabilities dropped.
5. **Reconciled, not imperatively managed.** Argo CD owns desired state.

---

## 2. Cluster Topology

| Env | Clusters |
|---|---|
| `dev` | 1 cluster per region (single AZ permitted) |
| `test` | 1 cluster per region |
| `stage` | Mirrors prod (multi-AZ, multi-region for T1) |
| `prod` | Multi-AZ; multi-region active/active for T1; per-tenant clusters for T-Cluster tier |
| `dr` | Warm/active replica per [ADR-0008](../adr/ADR-0008-saas-deployment-strategy.md) |

Cluster lifecycle owned by Terraform; addons + workloads owned by Argo CD.

---

## 3. Namespacing

- **Per product** at the top: `prod-cymed`, `prod-cyidentity`, …
- **Per service** as sub-namespaces: `prod-cymed-patient`, `prod-cymed-billing`.
- **Per tenant** namespaces for T-Cluster / T-DB regulated tenants.
- `LimitRange` + `ResourceQuota` mandatory per namespace.
- `NetworkPolicy`: **default deny**; explicit allow per dependency.
- Labels mandatory: `cybercom/product`, `cybercom/service`, `cybercom/env`, `cybercom/tier`, `cybercom/owner`.

---

## 4. Workload Standards

Every Deployment / StatefulSet:

- `runAsNonRoot: true`; `runAsUser: 10001`; `readOnlyRootFilesystem: true`.
- `allowPrivilegeEscalation: false`; capabilities dropped (`ALL`).
- `seccompProfile: RuntimeDefault`.
- `livenessProbe` (slow), `readinessProbe` (fast), `startupProbe` (where needed).
- Resource `requests` and `limits` set (no burstable-only).
- `PodDisruptionBudget`, `HorizontalPodAutoscaler`, `NetworkPolicy` per service.
- `topologySpreadConstraints` across zones for T1/T2.
- `priorityClassName` set per tier.
- Restart policy + graceful shutdown ≤ 30 s; SIGTERM handled.

A reusable Helm chart (`infrastructure/helm/cybercom-service/`) encodes these defaults.

---

## 5. Networking

- **Ingress:** Gateway API (preferred) via NGINX / Contour / cloud LB; mTLS termination at the edge.
- **Service mesh:** Istio or Linkerd (PoC pending sub-ADR) — mTLS in-mesh, identity-aware authz, retries, circuit breakers, observability.
- **DNS:** cluster + external-DNS; per-env zones.
- **Egress:** per-namespace egress gateways with allowlists.
- **NetworkPolicy:** default-deny per namespace; explicit allow per dependency.

---

## 6. Addons (per cluster)

| Addon | Purpose |
|---|---|
| Argo CD | GitOps controller |
| Argo Rollouts | Progressive delivery |
| External Secrets Operator | Vault → K8s Secret materialization |
| cert-manager | Cert lifecycle |
| Kyverno (or OPA Gatekeeper) | Admission policy + signature verification |
| Metrics Server, KEDA, HPA / VPA | Autoscaling |
| Cluster Autoscaler / Karpenter | Node autoscaling |
| OpenTelemetry Operator + Collector | Telemetry pipeline |
| Prometheus / Loki / Tempo (or vendor) | Observability sinks |
| Falco | Runtime security |
| Velero | Cluster backup |
| Reloader | Reload pods on config/secret change |
| External DNS | DNS automation |
| Descheduler | Re-balance pods |

Addon versions + values live under `infrastructure/kubernetes/addons/` and `infrastructure/gitops/platform/`.

---

## 7. Stateful Workloads

- **Default:** managed cloud services (RDS/Aurora, Cloud SQL, Azure DB, ElastiCache, MSK).
- **On-prem alternative:** CloudNativePG (Postgres), Strimzi (Kafka), Redis Enterprise / Bitnami HA chart.
- Operators audited; CRDs versioned and pinned.
- Backups follow [`backup_recovery_strategy`](../security/backup_recovery_strategy.md).

---

## 8. Image Policy

- Images from internal registry only.
- Multi-arch (amd64 + arm64) where beneficial.
- Signed (cosign keyless via OIDC); admission verifies signature + SBOM.
- Image scanning (Trivy) at build and at registry re-scan.

---

## 9. RBAC

- Cluster RBAC scoped per team/namespace.
- ServiceAccounts per workload; `automountServiceAccountToken: false` unless required.
- Human access via SSO + JIT to view; mutations only via GitOps.
- Audit logging on the API server enabled; events forwarded to SIEM.

---

## 10. Upgrades & Maintenance

- Cluster minor upgrades quarterly; security patches as needed.
- Pre-upgrade conformance + e2e in `stage`.
- Node pools rolled progressively with PDB respect.
- CRD upgrades tested and gated.

---

## 11. Multi-Tenancy Layers

| Mode | Mechanism |
|---|---|
| Shared cluster, shared namespace | Default for SaaS — tenant context in app + DB (RLS) |
| Shared cluster, per-tenant namespace | T-DB tier; per-tenant secrets/quotas/policies |
| Per-tenant cluster | T-Cluster / sovereign — full isolation |

Mesh-level tenant authz available where required.

---

## 12. Forbidden

- Running as root, privileged, hostNetwork (except documented system addons).
- `latest` tags; unsigned images.
- Cluster-admin bindings outside of GitOps controllers / break-glass.
- `kubectl exec` in prod outside of audited PAM sessions.
- `emptyDir` for any data that must survive a pod restart.
- Bypassing autoscaling with manual pod counts (except documented capacity events).
