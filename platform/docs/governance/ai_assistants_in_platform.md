# AI Assistants in the CyberCom Platform

> **Status:** Approved — Program 0, Phase 0.5
> **Owner:** Technical Program Manager + Chief Security Architect
> **Extends:** [`repository_operating_model`](repository_operating_model.md) §3

CyberCom embraces AI-assisted engineering **as a productivity multiplier under explicit governance**. This document is the concrete operating manual for the three assistants currently in use: **Claude Code**, **Antigravity**, and **ChatGPT**.

The underlying rule remains:

> **AI generates. Humans approve. CI verifies.**

---

## 1. Common Rules (all assistants)

| Rule | Detail |
|---|---|
| **Human accountable** | Every PR has a human author and a human approver, even if AI-drafted. |
| **No protected-branch pushes** | AI may only land changes via PR; CODEOWNERS + branch protection apply. |
| **No production data** | Never paste PHI, PII, customer data, secrets, tokens, or production logs into AI prompts. |
| **No secret generation** | AI must not generate or guess credentials; values come from Vault / secret manager. |
| **Disclosure** | Substantive AI-generated content disclosed via `Co-authored-by` trailer. |
| **Same standards** | All standards in [`docs/standards/`](../standards/) apply equally to AI-authored code. |
| **Same quality gates** | All gates in [`quality_gates`](../standards/quality_gates.md) (G0–G5) apply equally. |
| **Two-reviewer rule** | Crypto, IaC, migrations, and security-sensitive changes need two humans regardless of source. |
| **Licensing** | License scanner enforces dependency licenses; AI suggestions must respect them. |
| **Audit** | AI activity logged via repository events; misuse routes to Security + TPM. |

---

## 2. Claude Code (Anthropic CLI / IDE)

**Primary role:** Day-to-day pair-programming assistant for individual contributors — writes code, tests, docs, IaC; runs local shell/git.

| Aspect | Policy |
|---|---|
| Identity on commits | Commits authored as the contributor; `Co-authored-by: Claude <noreply@anthropic.com>` when AI contributed substantively. |
| Permission scope | Contributor's working tree only. PRs only — no direct pushes to any protected branch. |
| Allowed branches | Transient: `feat/*`, `fix/*`, `docs/*`, `chore/*`, `hotfix/*`. |
| Forbidden | `main`, `develop`, `architecture`, `release/*`, any protected branch; modifying `SECURITY.md`, `CODEOWNERS`, or branch-protection IaC without explicit human approval. |
| Prompt hygiene | No PHI/PII; no production data; no secrets. Use placeholders. |
| Tooling | May invoke `git`, `gh`, `pre-commit`, formatters, linters, test runners, build tools. |
| Network | Allowed to fetch package docs and read public registries; never exfiltrate repo contents to third parties beyond the official Anthropic endpoint. |
| Review obligation | Standard CODEOWNERS + tier-based approval matrix per [`repository_operating_model`](repository_operating_model.md) §4.2. |

**Good use cases:**
- Scaffolding services from templates.
- Writing tests and increasing coverage for an existing module.
- Refactors limited to a contributor's task.
- Drafting ADRs and runbooks.

**Bad use cases:**
- Bulk repo-wide refactors (use Antigravity).
- Reviewing PRs (use ChatGPT review, or another human).
- Modifying protected configs.

---

## 3. Antigravity (workspace agent)

**Primary role:** Sandboxed, multi-file refactor and audit agent for larger tasks — repo-wide changes, scaffolding, IaC generation, long-running agent runs.

| Aspect | Policy |
|---|---|
| Identity on commits | Commits authored by the operator; `Co-authored-by: Antigravity <noreply@antigravity.local>` for substantive AI work. |
| Permission scope | Sandboxed workspace; PRs only. |
| Allowed branches | Transient and feature branches scoped to a domain; never directly to protected branches. |
| Forbidden | Modifying `SECURITY.md`, `CODEOWNERS`, `branch_protection_strategy.md`, Terraform under `infrastructure/terraform/github/`, any `release/*` branch, or admission policies — without explicit human approval. |
| Required artifacts | PR body MUST include a **change summary**: files touched, rationale, scope rationale, risks. |
| Audit | Each run produces a transcript stored with the PR for reviewer context. |
| Review obligation | CODEOWNERS + at least **one human architect** for cross-domain changes. |
| Network | Sandboxed; same prompt-hygiene rules as Claude Code. |

**Good use cases:**
- Repo-wide rename / typed-error rollout / dependency migration.
- Generating Terraform modules or Helm charts from a spec.
- Bulk doc edits (e.g. ADR re-numbering).
- Auditing repository hygiene (dead code, stale TODOs).

**Bad use cases:**
- Editing CODEOWNERS / branch protection / release branches.
- Open-ended exploration that produces enormous PRs (split first).

---

## 4. ChatGPT (review-only)

**Primary role:** Second-opinion reviewer on PRs (architecture, security, clarity), doc/ADR critique.

| Aspect | Policy |
|---|---|
| Permission scope | **Read-only**. Never commits, merges, or modifies branch settings. |
| Workflow | A human reviewer pastes a diff / file / question; pastes back the suggestion **after vetting**, attributed `via ChatGPT review`. |
| Prompt hygiene | Same as the others — no PHI/PII, no production data, no secrets. Anonymize tenant identifiers before sharing. |
| Accountability | The human reviewer **owns** any ChatGPT-sourced suggestion they apply; if they don't understand it, they don't apply it. |
| Use cases | Threat-model sanity checks, ADR critique, alternative designs, naming/clarity feedback. |

**Good use cases:**
- "Is this ADR missing a force I haven't considered?"
- "Sanity-check this token-validation snippet for common pitfalls."
- "Suggest a clearer name for this concept."

**Bad use cases:**
- Pasting large customer/production data for "analysis".
- Approving PRs without a human reviewer who agrees with the rationale.
- Using as the **only** reviewer on a tier-sensitive change.

---

## 5. AI in CI

- AI assistants do **not** run as GitHub Actions in the protected pipeline.
- The CI pipeline itself is deterministic and signed; no AI-generated step is executed unattended.
- Optional: a `pr-explainer` job MAY post an AI-generated change summary as a non-blocking PR comment, with explicit "not a review" framing.

---

## 6. Incidents Involving AI

If AI activity leaks data, generates insecure code that ships, or otherwise causes harm:

1. Treat as a security incident per [`incident_response_plan`](../security/incident_response_plan.md).
2. Apply the relevant playbook (e.g. **AI-assistant misuse / data exfiltration via prompts**).
3. Determine scope: which prompts, what data, which models, what artifacts.
4. Rotate any potentially exposed secrets immediately.
5. Add a post-mortem item updating this policy if a control gap is found.

---

## 7. Allowed / Disallowed Endpoints

Maintained centrally by Platform + Security:

- **Allowed:** the official Anthropic, Antigravity, and OpenAI endpoints in approved regions.
- **Disallowed:** all other LLM endpoints unless added by ADR.
- Enterprise SSO / SAML for AI vendor access where supported.
- DPA / BAA signed with each vendor before regulated-data adjacent use.

---

## 8. Metrics

- AI co-authorship ratio per PR / per team.
- AI-attributed defects (escapes) per release.
- Reviewer rejection rate of AI-suggested patches.
- Prompt-hygiene incidents per quarter (target: 0).
- DevX NPS specifically for AI tooling.

Reviewed quarterly by TPM + Security Architect.

---

## 9. Lifecycle of This Policy

- Reviewed each release train and after any AI-related incident.
- Changes via PR with `governance` label; approved by TPM + Security Architect.
- Significant model/vendor changes require an ADR.
