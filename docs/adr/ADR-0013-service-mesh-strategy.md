# ADR-0013: Service Mesh Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Platform Architect, Chief Security Architect, DevOps Architect, Principal Platform Engineer |
| **Consulted** | Domain Architects |
| **Affects** | All Kubernetes workloads across all clusters |
| **Tags** | platform, networking, security, observability |
| **Related** | [ADR-0008](ADR-0008-saas-deployment-strategy.md), [ADR-0010](ADR-0010-gitops-deployment-strategy.md), [kubernetes_strategy](../platforms/kubernetes_strategy.md), [security_architecture](../security/security_architecture.md) |

---

## 1. Context

CyberCom runs many services across multiple clusters and deployment modes (SaaS, private cloud, sovereign on-prem). Zero-trust requires **mTLS everywhere**, identity-aware authorization between services, consistent retries/timeouts/circuit-breakers, and uniform telemetry. Without a mesh, each service team re-implements these primitives — inconsistently.

## 2. Problem Statement

What service-mesh do CyberCom clusters run, and which capabilities do we actually use?

## 3. Decision Drivers

- mTLS between every pair of in-cluster services with **zero application code**.
- **SPIFFE/SPIRE-compatible** workload identity (per [`identity_access_strategy`](../security/identity_access_strategy.md)).
- Identity-aware AuthZ (mesh-level) that complements the app-layer policy engine ([ADR-0005](ADR-0005-identity-access-management-strategy.md)).
- Built-in retries, timeouts, circuit breakers, traffic shifting (canary).
- OTel-native telemetry export.
- Operational cost — must be runnable by a small platform team.
- Portability across managed K8s + sovereign on-prem (including air-gapped).

## 4. Considered Options

1. **Linkerd 2.x** (CNCF graduated; sidecar) — chosen as **primary**.
2. **Istio (ambient mode)** — kept as **fallback / alternate** for clusters that need richer L7 policy or multi-cluster federation Linkerd does not yet cover.
3. **Cilium Service Mesh** (eBPF, sidecar-less) — kept as a future evaluation track.
4. **No mesh** — implement mTLS + retries in app frameworks.

## 5. Decision

- **Primary mesh: Linkerd 2.x.** Default in every CyberCom cluster.
- **Alternate mesh: Istio (ambient mode).** Permitted per cluster where Linkerd's feature gap is concrete — documented in a cluster ADR (e.g. complex multi-cluster federation, advanced L7 policy, gRPC-Web translation).
- **Forbidden:** running both meshes in the same cluster; rolling out a mesh without an Argo CD addon entry; per-team mesh choices.
- **Capabilities we actively use from day one:**
  - **mTLS** between all in-mesh pods (automatic, SPIFFE-style identities).
  - **Authorization policies** at the mesh layer (allowlist by SPIFFE ID + namespace) — coarse layer; fine-grained authZ stays in the app via OPA/Cedar (per ADR-0005).
  - **Retries, timeouts, request hedging** declared per route in service profiles / `HTTPRoute` (Gateway API).
  - **Traffic splitting** for canary / blue-green, driven by Argo Rollouts (per [ADR-0010](ADR-0010-gitops-deployment-strategy.md)).
  - **OTel telemetry** export from mesh sidecars / proxies to the platform collector.
- **Capabilities deferred (use sparingly, ADR per use case):**
  - Mesh-managed egress with WASM filters.
  - Multi-cluster federation across regions (revisit when CyIdentity goes multi-region active/active).
  - L7 policy beyond identity allowlists.
- **Gateway:** **Gateway API** (`Gateway`, `HTTPRoute`, `GRPCRoute`) as the standard north-south interface; mesh handles east-west.
- **Identity:** mesh-issued SVIDs serve as workload identity; CI/CD and Vault auth continue to use OIDC where mesh isn't present (e.g. CI runners).
- **Observability:** the mesh **adds** standard RED metrics + traces to those produced by the app's own OTel instrumentation. **It does not replace** application instrumentation.
- **Audit:** mesh policy decisions logged; high-severity denials forwarded to SIEM per [`audit_logging_strategy`](../security/audit_logging_strategy.md).

## 6. Rationale

- **Linkerd** is simple to operate, has the smallest resource footprint, ships secure defaults, and is CNCF-graduated. It covers the **90% of mesh value (mTLS, identity, retries, telemetry)** with the lowest ops cost — the right primary for a small platform team.
- **Istio (ambient)** is genuinely better at complex L7 policy and multi-cluster federation; carving it out as a documented fallback avoids forcing the rest of the platform onto a heavier mesh just to serve a few clusters.
- **Cilium** is promising (sidecar-less, eBPF) but its mesh feature parity for our needs is still evolving — track, don't bet.
- **Going meshless** would force every team to reimplement mTLS, identity, retries, and circuit-breaking — directly violates the paved-road principle in [ADR-0011](ADR-0011-platform-engineering-strategy.md).

## 7. Consequences

### 7.1 Positive
- Zero-trust mTLS across services with no app changes.
- Uniform retries/timeouts/circuit-breakers reduce cascading failures.
- Canary rollouts integrate cleanly with Argo Rollouts.
- Mesh telemetry complements app OTel for a complete picture.

### 7.2 Trade-offs
- Sidecar memory and CPU overhead (Linkerd's is small but non-zero).
- Operating two meshes in the platform (Linkerd primary + Istio fallback) raises operational surface in those clusters that need both modes — mitigated by strict ADR gating.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Linkerd hits a feature wall (e.g. cross-cluster federation at scale) | Medium | High | Documented Istio fallback path; quarterly re-evaluation |
| 2 | Mesh upgrade breaks workloads | Medium | High | Canary upgrade in `dev` → `stage` → `prod`; conformance tests in CI |
| 3 | Sidecar overhead becomes material at scale | Medium | Medium | Per-pod metrics + budgets; consider Cilium / Linkerd sidecar-less when GA |
| 4 | Mesh AuthZ duplicated with OPA/Cedar causes inconsistency | Medium | Medium | Clear layering: mesh = identity allowlist; app = fine-grained policy. Documented in standards |
| 5 | Sovereign / air-gapped clusters lag in mesh patches | Medium | High | Signed bundle pipeline; supported-version matrix |
| 6 | Mesh telemetry contributes to cardinality explosion | Medium | Medium | Cardinality budgets (per [`observability_strategy`](../platforms/observability_strategy.md) §9); metric allow-lists |

### 7.4 Follow-up actions
- [ ] Add Linkerd to `infrastructure/kubernetes/addons/` and `infrastructure/gitops/platform/` — Platform Eng, Program 1 Sprint 1.
- [ ] Author per-cluster mesh capability matrix in `docs/platforms/mesh-capabilities.md` — Platform Architect, Program 1 Sprint 2.
- [ ] Define mesh authorization conventions (SPIFFE ID naming) — Security Architect, Program 1 Sprint 2.
- [ ] Re-evaluate Cilium Service Mesh annually.

## 8. Compliance & Security Impact

- **Strong control** for HIPAA §164.312(e) (transmission security) and GDPR Art. 32 (encryption in transit) — mTLS without app effort.
- Mesh AuthZ provides defense-in-depth on top of app-level checks.
- Mesh-level audit + telemetry feed SIEM detections for lateral movement.

## 9. Alternatives Rejected

- **Istio as primary** — capable, but heavier ops footprint than Linkerd and not needed for our default workload pattern. Reserved as the documented fallback.
- **Cilium as primary today** — too early for the breadth of mesh features we need; revisit annually.
- **No mesh** — pushes mTLS + identity into every service framework; inconsistent and incompatible with zero-trust at scale.

## 10. References

- Linkerd 2.x documentation; Istio ambient mesh; Cilium Service Mesh; SPIFFE/SPIRE
- [`kubernetes_strategy`](../platforms/kubernetes_strategy.md), [`identity_access_strategy`](../security/identity_access_strategy.md), [`observability_strategy`](../platforms/observability_strategy.md)

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Platform Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
