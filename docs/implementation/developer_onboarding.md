# Developer Onboarding

> **Status:** Approved — Program 0, Phase 0.5
> **Owner:** Platform Engineering Lead
> **Target:** A new engineer productive (first PR merged) in **≤ 2 working days**.

This is the canonical onboarding doc. If something here is wrong, open a PR — onboarding bugs are the highest-priority docs bugs.

---

## 1. Day 0 — Before you arrive

Provisioned automatically by HRIS → SCIM → CyIdentity → downstream systems:

- CyIdentity SSO account.
- GitHub org membership + team assignment.
- Cloud read-only access (JIT for write).
- Hardware: workstation (FDE enforced), MDM-enrolled, hardware security key.

You will receive: welcome email, security-key activation link, calendar invite to platform onboarding session.

---

## 2. Day 1 — Setup

### 2.1 Sign in
1. Activate hardware key with CyIdentity. **MFA is mandatory.**
2. Sign in to GitHub via SSO; add SSH and GPG keys (instructions emailed).
3. Enable signed commits (`git config --global commit.gpgsign true`).

### 2.2 Toolchain
Run the platform setup script (verifies host, installs/upgrades versions pinned in `.tool-versions`):

```
curl -fsSL https://internal.cybercom/devx/setup | bash
```

Installs / upgrades: `git`, `gh`, `docker`, `kubectl`, `helm`, `pnpm`, Node 20 LTS via `fnm`, Python 3.12 via `pyenv`, Poetry, `pre-commit`, `terraform`, `tflint`, `vault` CLI, `cosign`, `trivy`, the `cybercom` CLI.

### 2.3 Clone & verify

```
gh repo clone eng9myan/CyberCom-Platform
cd CyberCom-Platform
pre-commit install
cybercom doctor       # verifies your environment
```

`cybercom doctor` prints a checklist of what's working and what's missing, with one-line fixes.

### 2.4 Read these (in this order, ~90 minutes)
1. [`README.md`](../../README.md)
2. [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
3. [`docs/governance/repository_operating_model.md`](../governance/repository_operating_model.md)
4. [`docs/governance/git_strategy.md`](../governance/git_strategy.md)
5. [`docs/standards/coding_standards.md`](../standards/coding_standards.md)
6. The language standard you'll touch first ([`python_standards`](../standards/python_standards.md) or [`frontend_standards`](../standards/frontend_standards.md))
7. [`docs/standards/quality_gates.md`](../standards/quality_gates.md)
8. The product README you'll work on.

### 2.5 Optional but recommended
- Skim the most recent 5 ADRs in [`docs/adr/`](../adr/).
- Read [`docs/security/security_architecture.md`](../security/security_architecture.md).
- Read [`docs/governance/ai_assistants_in_platform.md`](../governance/ai_assistants_in_platform.md) before using any AI assistant.

---

## 3. Day 2 — First PR

1. Pick a `good-first-issue` from your team's backlog.
2. Create a branch: `git switch -c feat/<scope>-<short-desc>` (see [`git_strategy`](../governance/git_strategy.md) §2.2).
3. Make the change.
4. Run gates locally: `pre-commit run --all-files` and the service's `make test`.
5. Open a PR using the template — link the issue.
6. Address review comments.
7. Squash-merge once CI is green and you have the required approvals.

You did it. 🎉

---

## 4. Common First-Day Snags

| Symptom | Fix |
|---|---|
| `git push` rejected — "signed commit required" | `git config --global commit.gpgsign true`; ensure GPG key uploaded to GitHub. |
| Pre-commit fails on Conventional Commits | Use `feat:`, `fix:`, `docs:`, etc. — see [`git_strategy`](../governance/git_strategy.md) §3. |
| CI fails on coverage gate | New code must meet its layer threshold — see [`quality_gates`](../standards/quality_gates.md) §8. |
| `cybercom doctor` says "Docker not running" | Start Docker Desktop / Podman / colima; re-run. |
| `kubectl` can't reach cluster | Get a fresh kubeconfig via SSO: `cybercom kube login dev`. |
| Vault dev server token | `cybercom vault dev` — never use prod Vault from a laptop. |

---

## 5. Where to Get Help

| Need | Channel |
|---|---|
| DevX / setup | `#devx-support` |
| Platform incidents | `#platform-incidents` (auto-paged) |
| Security questions | `#security-help` (private), or `security@cybercom.example` for vulnerabilities |
| Architecture questions | `#architecture` and ADR PRs |
| Your team's domain | Your team's channel + your tech lead |

Office hours: platform team holds weekly office hours; calendar link in `#devx-support` topic.

---

## 6. Working with AI Assistants

Before using **Claude Code**, **Antigravity**, or **ChatGPT** in this repository, read [`docs/governance/ai_assistants_in_platform.md`](../governance/ai_assistants_in_platform.md).

TL;DR:
- AI may **author** on transient branches via PRs (Claude Code, Antigravity).
- AI may **review** only when a human reviewer mediates and owns the suggestion (ChatGPT).
- **No PHI, PII, production data, or secrets** in prompts. Ever.
- Disclose substantive AI contribution via `Co-authored-by:` trailer.

---

## 7. 30/60/90 Goals (suggested, adjust with your manager)

| Day | Goal |
|---|---|
| 30 | Comfortably ship small PRs in your team's services; participated in an on-call shadow. |
| 60 | Owned a moderate feature end-to-end; reviewed peers' PRs; updated at least one doc. |
| 90 | Drove an ADR or platform improvement; on-call primary in a low-tier rotation; contributed to a runbook. |

---

## 8. Feedback

Onboarding is itself a product. Open a PR or an issue tagged `onboarding-feedback` after week 1 and week 4 — what was great, what wasted your time. The platform team reads every one.
