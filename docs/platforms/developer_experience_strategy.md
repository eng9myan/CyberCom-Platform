# Developer Experience (DevX) Strategy

> **Status:** Approved — Program 0, Phase 0.5
> **Owner:** Platform Engineering Lead

A great DevX shortens the path from idea to production while keeping security and quality non-negotiable.

---

## 1. Principles

1. **Paved roads, not walled gardens.** Easy default; alternative path requires an ADR.
2. **Local-first dev loop.** A new engineer is productive on day one with a single command.
3. **One bar of quality.** Same gates locally and in CI; no "it passes locally" surprises.
4. **Docs as a feature.** Onboarding is itself a paved road — measured and improved.
5. **Toil ≤ 30%.** Platform engineers cap unplanned ops below 30% of their time.

---

## 2. Standard Developer Toolchain

| Concern | Tool |
|---|---|
| OS | macOS, Linux, Windows (WSL 2) |
| Editor | VS Code (recommended) / JetBrains / Neovim |
| Shell | bash / zsh / pwsh |
| Containers | Docker Desktop / Podman / Rancher Desktop / colima |
| Python | `pyenv` + Poetry, Python 3.12 |
| Node | `fnm` / `nvm`, Node 20 LTS, pnpm |
| Kubernetes (local) | k3d / kind / minikube |
| K8s CLI | `kubectl`, `helm`, `kubectx`, `k9s` |
| Cloud CLIs | `aws`, `az`, `gcloud` (per role) |
| Auth | `gh` (GitHub), SSO via CyIdentity |
| Secrets (local) | Vault dev server; `.env.example` for placeholders |
| Git hooks | `pre-commit` |
| IaC | `terraform`, `terragrunt` (where used) |
| Pre-flight | `cybercom doctor` (custom CLI) |

A repo-root `.tool-versions` (asdf-compatible) pins versions.

---

## 3. Day-One Onboarding (target ≤ 4 hours)

1. **Accounts**
   - CyIdentity SSO account (provisioned via HRIS → SCIM).
   - GitHub org membership + team assignment.
   - Cloud accounts (read-only by default; JIT for elevated).
2. **Hardware**
   - Workstation with FDE, MDM-managed, hardware security key issued.
3. **Setup script**
   - `curl -fsSL https://internal.cybercom/devx/setup | bash`
   - Installs/upgrades toolchain, registers SSH/GPG keys with GitHub.
4. **First repo**
   - `gh repo clone eng9myan/CyberCom-Platform`
   - `pre-commit install`
   - `cybercom doctor` — verifies env, prints next steps.
5. **First contribution**
   - Pick a "good-first-issue" labeled task.
   - Open a PR following the template; merge after CI + review.

Onboarding doc lives at [`docs/implementation/developer_onboarding.md`](../implementation/developer_onboarding.md).

---

## 4. Inner Loop (local dev)

- **Edit → format → test in < 5 s** for unit tests of typical change.
- `make dev` (or `task dev`) spins up service + dependencies via docker-compose for local; Tilt/Skaffold for K8s loop.
- Hot-reload by default; production-like image rebuild also one command.
- Pre-commit catches lint, format, secret-scan, commit-message issues.

---

## 5. Outer Loop (PR → prod)

- Open PR → 26-job CI ([cicd_baseline](../implementation/cicd_baseline.md)) → review → squash-merge → image+SBOM published → Argo CD reconciles → progressive rollout → SLO-based auto-rollback.
- PR cycle-time target: **≤ 24 hours open-to-merge** (median).
- Lead time (commit → prod): **≤ 1 day for `dev`, ≤ 1 week for `prod`**.

---

## 6. Documentation Layers

| Layer | Where | Audience |
|---|---|---|
| Cross-platform conventions | [`docs/`](../) | All engineers |
| Service-specific | `<service>/README.md`, runbooks | That service's team + on-call |
| API reference | OpenAPI per service | Consumers, partners |
| Internal "how do I…?" | `docs/implementation/howtos/` (to be authored) | Engineers across teams |
| Decisions | [`docs/adr/`](../adr/) | All engineers, architects |

Doc quality is enforced in CI (markdownlint, link-check, spell-check).

---

## 7. Templates & Generators

- **`cybercom-service-template`** (Python/Django backend service).
- **`cybercom-web-template`** (Next.js app).
- **`cybercom-mobile-template`** (React Native, Expo).
- **`cybercom-helm-chart-template`**.
- **`cybercom-terraform-module-template`**.

Generated from a single CLI:

```
cybercom new <kind> <name> --team <team> --tier <1..4> --product <product>
```

The CLI:
- Creates the GitHub repo with branch protection, CODEOWNERS, labels.
- Wires CI, Helm chart, Argo CD Application, observability dashboards.
- Registers the service in the service catalog.

---

## 8. AI-Assisted Development

The DevX integrates AI assistants under the policies in [`repository_operating_model`](../governance/repository_operating_model.md) §3 and [`ai_assistants_in_platform`](../governance/ai_assistants_in_platform.md).

- **Claude Code** is the default IDE-/CLI-side assistant: scaffolds code, writes tests, edits docs/IaC. Works on transient branches; PRs only; CODEOWNERS apply.
- **Antigravity** runs multi-file refactors and repo-wide audits in sandboxed workspaces; PRs only; cannot modify protected configs.
- **ChatGPT** is used for **review-only** second opinions; suggestions pasted by the human reviewer.

A short DevX rule: **AI generates, humans approve, CI verifies.**

---

## 9. Metrics

| Metric | Target |
|---|---|
| Time to first PR for a new engineer | ≤ 2 days |
| PR cycle time (median) | ≤ 24 h |
| Local test loop (unit) | < 5 s |
| CI duration p95 | ≤ 15 min |
| Onboarding NPS | ≥ +30 |
| Internal docs satisfaction | ≥ 4 / 5 |
| DORA: deploys/week per team | trending up |
| DORA: change failure rate | ≤ 15% |
| DORA: MTTR | ≤ 1 h (T1), ≤ 4 h (T2) |

Reviewed monthly; results feed the platform roadmap.

---

## 10. Anti-Patterns We Reject

- "Works on my machine" — toolchain is pinned; CI is canonical.
- Snowflake clusters or environments.
- "Quick" scripts in personal repos used in prod.
- Long, ceremonial onboarding documents nobody reads — replace with the CLI.
- DevX changes shipped without a metric to validate them.
