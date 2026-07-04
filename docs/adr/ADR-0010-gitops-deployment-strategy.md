# ADR-0010: GitOps Deployment Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | DevOps Architect, Platform Architect, Chief Security Architect |
| **Affects** | All deployments to all environments |
| **Tags** | platform, deployment, gitops |
| **Related** | [gitops_strategy](../platforms/gitops_strategy.md), [ADR-0008](ADR-0008-saas-deployment-strategy.md) |

---

## 1. Context

We need a deployment model that is auditable, reversible, drift-resistant, and uniform across SaaS, private cloud, and sovereign on-prem.

## 2. Problem Statement

How are CyberCom workloads deployed to clusters, and how is the cluster state kept consistent with the declared truth?

## 3. Decision Drivers

- Single deployment model across all environments and deployment modes.
- Pull-based reconciliation to minimize blast radius of CI compromise.
- Compatibility with progressive delivery and SLO-based auto-rollback.
- Compliance: every change attributable to a signed commit.

## 4. Considered Options

1. **GitOps via Argo CD + Argo Rollouts (Flux as alternate); two-repo pattern** (chosen).
2. CI/CD push-based deployments (`kubectl apply` from Actions).
3. Vendor pipelines (e.g. AWS CodePipeline, Azure DevOps Pipelines).

## 5. Decision

- **Argo CD** is the GitOps controller for every cluster; Flux acceptable in environments where Argo isn't viable.
- **Argo Rollouts** (or Flagger) for canary / blue-green with SLO-based analysis.
- **Two-repo pattern:** app repos build/sign artifacts; **GitOps repo** declares desired state per environment via overlays/folders (not branches).
- **Digest-pinned** images; image bumps are PRs.
- **Admission control** (Kyverno/Connaisseur) verifies signatures + SBOM presence + baseline policies.
- **Sync waves** enforce CRD → operator → addon → app ordering.
- **Rollback** = revert the GitOps PR.
- Full detail in [`gitops_strategy`](../platforms/gitops_strategy.md).

## 6. Rationale

- Pull-based reconciliation minimizes the privilege CI needs (no kubeconfig in CI).
- Drift is automatically detected and corrected.
- All changes are signed git commits — strong audit trail.
- Same model works on-prem (air-gapped) with private GitOps mirror.

## 7. Consequences

### 7.1 Positive
- Reproducible, auditable, reversible deployments.
- Strong supply-chain story (signatures verified at admission).

### 7.2 Trade-offs
- Two repos to manage; operators must understand Argo CD.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Argo CD outage blocks deploys | Low | High | HA Argo per cluster; break-glass `kubectl` runbook (audited) |
| 2 | GitOps repo becomes a bottleneck | Medium | Medium | Per-product folders + CODEOWNERS; automated image-bump PRs |
| 3 | Admission policy misconfig blocks valid deploys | Medium | Medium | Staged enablement; alarm on denial spikes |

## 8. Compliance & Security Impact

- Every prod change traceable to a signed commit and a reviewer.
- Signature + SBOM verification at admission supports supply-chain controls (SLSA, EO 14028 alignment).

## 9. Alternatives Rejected

- **Push-based CI deploy** — requires CI to hold cluster credentials; weaker drift control; weaker audit.
- **Vendor pipelines** — incompatible with sovereign on-prem and multi-cloud.

## 10. References

- Argo CD; Argo Rollouts; Flux; OpenGitOps principles

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | DevOps Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
