# Platform Engineering Baseline

> **Status:** Approved — Program 0, Phase 0.5
> **Owner:** Principal Platform Engineer
> **Implements:** [ADR-0011 Platform Engineering Strategy](../adr/ADR-0011-platform-engineering-strategy.md)

CyberCom runs an **Internal Developer Platform (IDP)** that gives product teams paved roads for building, shipping, and operating services without re-inventing infrastructure.

---

## 1. Mission

> Make the **right thing the easy thing** — every CyberCom service should be created, secured, deployed, observed, and operated through paved roads, not snowflakes.

---

## 2. Platform Pillars

| Pillar | Purpose | Owner |
|---|---|---|
| **Compute & Orchestration** | Kubernetes (managed + on-prem), Helm, Argo CD | Infra Architect |
| **CI/CD** | Reusable GitHub Actions, signed artifacts, GitOps | DevOps Architect |
| **Identity & Secrets** | CyIdentity, Vault + ESO, SPIFFE/SPIRE | Security Architect |
| **Data Platform** | PostgreSQL, Redis, Kafka, S3-compatible storage | Data Architect |
| **Observability** | OpenTelemetry, Prometheus, Grafana, Loki/Tempo, SIEM | DevOps + Security |
| **Developer Experience** | Templates, CLI, docs, golden paths | Platform Eng Lead |
| **Policy & Governance** | OPA/Cedar policies, Kyverno admission, branch protection | Security + Devx |

---

## 3. Paved Roads (golden paths)

Every team gets, by default:

1. **Service template** — `cybercom-service-template` (Python/Django, FastAPI for narrow APIs) and `cybercom-web-template` (Next.js) scaffolds with:
   - Repo skeleton matching [`coding_standards`](../standards/coding_standards.md)
   - Pre-wired CI calling the reusable workflow ([cicd_baseline](../implementation/cicd_baseline.md))
   - Dockerfile (multi-stage, distroless, non-root) and Helm chart
   - OTel instrumentation, health/ready/metrics endpoints
   - OpenAPI scaffold + spec checks
   - `RECOVERY.md`, `SECURITY.md`, `OWNERS.md`, `README.md`
2. **Branch protection + CODEOWNERS** applied automatically.
3. **Observability** dashboards, log streams, and default alerts auto-provisioned.
4. **Secrets** namespace in Vault auto-created with least-privilege ESO bindings.
5. **Argo CD Application** generated per environment.
6. **Status page + on-call rotation** registered.

Deviating from the paved road is allowed but requires an ADR.

---

## 4. Service Catalog & Ownership

- Every service is recorded in `infrastructure/catalog/services.yaml` (or via Backstage when adopted).
- Required fields: `name`, `owner_team`, `tier (1–4)`, `product`, `data_classes`, `oncall_rotation`, `slo_doc`, `recovery_doc`, `runbook`, `repo`.
- CI fails for services missing a catalog entry.

---

## 5. Tier Model (operational)

| Tier | Definition | Examples | Requirements |
|---|---|---|---|
| **T1 — Mission critical** | Outage causes business/clinical/safety impact | CyIdentity, audit, CyMed clinical, billing | Multi-region; 99.95% SLO; on-call 24×7; chaos quarterly |
| **T2 — Business critical** | Major degradation | ERP, CyData hot tier, CyCom | Multi-AZ; 99.9% SLO; on-call business hours + paged after-hours |
| **T3 — Standard** | Limited impact | Internal tools, marketing | Single-AZ acceptable; 99.5% SLO |
| **T4 — Best effort** | Sandboxes, ephemeral | Preview envs | No SLO |

Tier drives backups, monitoring, deployment topology, and review depth — see [`backup_recovery_strategy`](../security/backup_recovery_strategy.md), [`observability_strategy`](observability_strategy.md), [`environment_strategy`](environment_strategy.md).

---

## 6. Self-Service Interfaces

| Need | Self-service interface |
|---|---|
| New service | `cybercom new-service <name>` (cookiecutter / Backstage template) |
| New environment | PR to `infrastructure/environments/<env>/` |
| New secret | PR to Vault policy + ESO ExternalSecret |
| New feature flag | Flag provider console (audited) |
| New dashboard | Grafana folder per service (provisioned IaC) |
| New on-call rotation | PR to `docs/implementation/oncall/` + paging tool |
| New tenant | Control-plane API + IaC pipeline |
| Access escalation | PAM request (JIT) |

---

## 7. Platform SLOs (platform itself)

| SLO | Target |
|---|---|
| CI pipeline p95 duration (per-PR) | ≤ 15 min |
| Failed-CI-to-green MTTR | ≤ 30 min |
| Time to provision a new service | ≤ 1 day end-to-end |
| Time to provision a new tenant | ≤ 1 hour automated |
| Argo CD sync lag | ≤ 2 min |
| Vault availability | ≥ 99.95% |
| Mean time to detect cluster issue | ≤ 5 min |

The platform team operates against these SLOs and is paged on breach.

---

## 8. Inputs & Outputs

### Inputs the platform consumes
- Standards ([`docs/standards/`](../standards/)).
- Security strategies ([`docs/security/`](../security/)).
- ADRs ([`docs/adr/`](../adr/)).
- Governance ([`docs/governance/`](../governance/)).

### Outputs the platform produces
- Reusable CI workflows (see `infrastructure/github/workflows/`).
- Terraform modules (see `infrastructure/terraform/modules/`).
- Helm chart library (see `infrastructure/helm/`).
- Service & web templates.
- Observability stack & dashboards.
- Policy bundles (OPA / Kyverno).
- Documentation & onboarding (see [`developer_experience_strategy`](developer_experience_strategy.md)).

---

## 9. Roadmap (Phase 0.5 → Program 1)

| Step | Owner | When |
|---|---|---|
| Publish reusable CI workflow (`infrastructure/github/workflows/ci.yml`) | DevOps Architect | Program 1 Sprint 1 |
| Publish Terraform GitHub module (branch protection, CODEOWNERS, repos) | DevOps Architect | Program 1 Sprint 1 |
| Stand up Vault + ESO + cert-manager + Argo CD in `dev` | Platform Eng | Program 1 Sprint 1–2 |
| Publish `cybercom-service-template` and `cybercom-web-template` | Platform Eng | Program 1 Sprint 2 |
| OPA vs Cedar PoC → ADR-0005a | Security Architect | Program 1 Sprint 2 |
| Istio vs Linkerd PoC → sub-ADR | Platform Architect | Program 1 Sprint 2–3 |
| Backstage (or YAML catalog) for service inventory | Platform Eng | Program 1 Sprint 3 |
| Multi-region pattern documented + applied to CyIdentity prototype | Infra Architect | Program 1 Sprint 4 |
