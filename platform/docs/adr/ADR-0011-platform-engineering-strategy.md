# ADR-0011: Platform Engineering Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Principal Platform Engineer, Platform Engineering Lead, Chief Software Architect |
| **Affects** | All product teams |
| **Tags** | platform, devx, idp |
| **Related** | [platform_engineering_baseline](../platforms/platform_engineering_baseline.md), [developer_experience_strategy](../platforms/developer_experience_strategy.md) |

---

## 1. Context

Nine products, multiple teams, multi-region delivery, and strict compliance demands. Without an Internal Developer Platform, each team will reinvent CI, observability, secrets, and policy.

## 2. Problem Statement

How do we organize CyberCom platform capabilities so product teams move fast without compromising security, quality, or compliance?

## 3. Decision Drivers

- Reduce cognitive load on product engineers.
- Bake security/compliance/observability into defaults.
- One mental model across products.
- Operability with a small platform team.

## 4. Considered Options

1. **Internal Developer Platform (IDP) with paved roads + self-service** (chosen).
2. Per-team DIY.
3. Vendor PaaS (e.g. Heroku-style) for everything.

## 5. Decision

CyberCom runs an IDP with:

- **Paved roads** for service, web, mobile, and module creation via a `cybercom` CLI + templates.
- **Service catalog** in code (`infrastructure/catalog/`); Backstage adoption deferred but planned.
- **Reusable CI workflows** in `infrastructure/github/workflows/` consumed by every repo.
- **Helm chart library** and **Terraform module library**.
- **Observability stack** as a managed platform offering.
- **Secrets + identity** as managed platform offerings (Vault + CyIdentity).
- **Policy bundles** (OPA / Kyverno) shipped centrally.
- **Tiered operability** (T1–T4) drives backups, monitoring, on-call, and deployment topology.
- **Platform SLOs**: pipeline duration, time-to-provision, control-plane availability.
- Detailed scope in [`platform_engineering_baseline`](../platforms/platform_engineering_baseline.md).

## 6. Rationale

- IDPs are the proven model at scale for multi-product orgs.
- Paved roads + ADR-for-exceptions keeps consistency while leaving freedom where it matters.
- Centralizing platform concerns once is cheaper than re-implementing them per product.

## 7. Consequences

### 7.1 Positive
- Faster onboarding; consistent quality; lower long-term cost.
- Compliance evidence is uniform and easier to produce.

### 7.2 Trade-offs
- Platform team must be staffed and resourced.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Platform team becomes a bottleneck | High | Medium | Self-service first; platform owns templates, not tickets |
| 2 | Paved roads diverge from product needs | Medium | Medium | Quarterly product survey; ADRs surface gaps |
| 3 | Over-engineering of internal tools | Medium | Medium | Tie every platform feature to a DORA/DevX metric |

## 8. Compliance & Security Impact

- Defaults bake in HIPAA/GDPR controls; deviations require ADR.

## 9. Alternatives Rejected

- **Per-team DIY** — duplicates work, weakens compliance, fragments tooling.
- **Vendor PaaS only** — incompatible with sovereign on-prem and tenant-isolation tiers.

## 10. References

- Team Topologies (Skelton & Pais)
- CNCF Platform Engineering whitepaper

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Principal Platform Engineer | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
