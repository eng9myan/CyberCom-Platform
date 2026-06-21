# ADR-0012: Environment Management Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Infrastructure Architect, DevOps Architect, Chief Security Architect, QA Architect |
| **Affects** | All deployments, all data handling, all access control |
| **Tags** | platform, devops, environments |
| **Related** | [environment_strategy](../platforms/environment_strategy.md), [ADR-0008](ADR-0008-saas-deployment-strategy.md), [ADR-0010](ADR-0010-gitops-deployment-strategy.md) |

---

## 1. Context

We need a small, well-defined set of environments with consistent topology, strict isolation, and digest-based promotion to keep releases predictable and compliant.

## 2. Problem Statement

Which environments do we operate, how are they isolated, and how is change promoted between them?

## 3. Decision Drivers

- Match topology of `prod` in `stage` to catch issues before prod.
- Prevent any cross-env data or credential bleed.
- Repeatable, auditable promotion.
- Reasonable cost.

## 4. Considered Options

1. **Five named envs: `dev` / `test` / `stage` / `prod` (+ `dr`); digest-pinned promotion via GitOps PRs; per-PR previews optional** (chosen).
2. Two envs only (`dev` + `prod`).
3. Per-team envs.

## 5. Decision

- Standard envs: **`local` (engineer), `ci` (ephemeral), optional `preview` (per PR), `dev`, `test`, `stage`, `prod`, `dr`.**
- **Topology mirroring:** `stage` mirrors `prod`; `dev`/`test` MAY simplify.
- **Same images, same charts; values differ.**
- **Promotion = GitOps PR** that moves an image digest forward through overlays; no per-env builds.
- **Data:** synthetic only in non-prod; PHI/PII forbidden outside `prod`/`dr`.
- **Isolation:** per-env VPC/subnets, identities, secrets, storage, KMS keys, cloud accounts; per-env Argo Projects and Vault mounts.
- **Approvals:** automatic `dev` → `test` on smoke green; manual `test` → `stage` (QA); release PR for `stage` → `prod`.
- **Access:** no standing write to `stage`/`prod`; JIT PAM.
- **Lifecycle:** preview TTL ≤ 72 h; idle `dev` namespaces cleaned.
- Detailed in [`environment_strategy`](../platforms/environment_strategy.md).

## 6. Rationale

- Four long-lived envs is the minimum that supports independent QA + safe release + DR.
- Digest-based promotion is the only way to know what's actually shipping.
- Strict synthetic-only rule keeps compliance scope contained.

## 7. Consequences

### 7.1 Positive
- Predictable releases; clean compliance posture; easier troubleshooting.

### 7.2 Trade-offs
- Mirroring `prod` in `stage` increases cost — accepted as the price of safety for T1/T2.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Synthetic data unrepresentative | High | Medium | Volume/distribution shape generators; de-identification pipeline (privacy sign-off) |
| 2 | `stage` cost growth | Medium | Medium | Scale-down off-hours; right-size after each release cycle |
| 3 | Per-PR previews leak data | Low | High | Synthetic-only; auto-destroy; namespace policy |

## 8. Compliance & Security Impact

- Per-env isolation supports HIPAA/GDPR scope reduction.
- No real data outside `prod`/`dr` simplifies SAR/erasure handling.

## 9. Alternatives Rejected

- **Two envs only** — too coarse for QA and pre-prod validation.
- **Per-team envs** — sprawl, cost, drift; defeats the purpose.

## 10. References

- [`environment_strategy`](../platforms/environment_strategy.md), [`gitops_strategy`](../platforms/gitops_strategy.md)

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Infrastructure Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
