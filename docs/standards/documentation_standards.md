# Documentation Standards

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** Documentation Architect

Documentation is a first-class deliverable. Undocumented features are considered incomplete.

---

## 1. Document Taxonomy

Adopt the [Diátaxis](https://diataxis.fr/) framework. Every doc is one of:

| Type | Purpose | Voice |
|---|---|---|
| **Tutorial** | Learn-by-doing | Teacher to student |
| **How-to** | Achieve a goal | Step-by-step, terse |
| **Reference** | Lookup facts | Neutral, exhaustive |
| **Explanation** | Understand concepts | Discussion |

Plus CyberCom-specific:
- **ADR** — decision record (`docs/adr/`)
- **Runbook** — operational procedure (`docs/implementation/`)
- **Spec** — API/data spec (OpenAPI, JSON Schema)

---

## 2. Repository Map

| Location | Content |
|---|---|
| Repo root `README.md` | Platform overview |
| `docs/` | Governed long-form docs (see folder index READMEs) |
| `<service>/README.md` | How to build, run, test this service |
| `<service>/openapi/` | Generated API spec |
| `<service>/CHANGELOG.md` | Per-service changelog (if independently versioned) |
| `docs/adr/` | Architecture Decision Records |
| `docs/implementation/runbooks/` | On-call runbooks |

---

## 3. File & Folder Conventions

- File names: `kebab-case.md`.
- One H1 per file (the title); content starts at H2.
- Front-matter optional; use only when consumed by a generator.
- Diagrams: prefer **Mermaid** (renders on GitHub); PlantUML allowed alongside as `.puml`.
- Images in `assets/` next to the doc; use descriptive names.

---

## 4. Markdown Style

- 100-char soft wrap.
- Sentence-case headings (`## Naming conventions`, not `## Naming Conventions`).
- Bullet lists `-` (not `*`).
- Fenced code blocks with language hint (` ```python `).
- Tables for structured comparisons.
- Links: descriptive text (not "click here"); relative paths within the repo.

---

## 5. Required Sections per Document Type

### Service README
1. Purpose & scope
2. Status & owners
3. Quick start (run, test, debug locally)
4. Configuration (env vars table)
5. APIs exposed (link to OpenAPI)
6. Dependencies (services, infra)
7. Observability (dashboards, alerts, logs)
8. Runbooks (links)
9. Contributing notes

### ADR
See [`docs/adr/ADR-0000-template.md`](../adr/ADR-0000-template.md).

### Runbook
1. Trigger / alert
2. Severity & SLOs impacted
3. Diagnosis steps (commands, queries)
4. Mitigation steps
5. Rollback
6. Post-incident actions
7. Related dashboards / alerts

### API Reference
- Generated from OpenAPI 3.1.
- Each operation: summary, description, params, request/response schemas, examples, error codes, perf tier.

---

## 6. Diagrams

- **Mermaid** for sequence, flow, class, ER, state, gantt, journey.
- One concept per diagram. If it needs a legend longer than the diagram, split it.
- Consistent direction (LR top-level, TD for hierarchy).
- Use C4-style for architecture: Context → Container → Component → Code, one diagram per level.

---

## 7. Writing Style

- **Active voice.** "The service validates the token" beats "the token is validated".
- **Present tense.** "Returns 200" beats "will return 200".
- **Direct.** Cut hedges ("perhaps", "might want to").
- **Audience-aware.** State the assumed reader at the top if non-obvious.
- **No PHI/PII** in any document, ever — including examples.
- **No secrets**, even fake-looking ones (use `<REDACTED>` placeholders).

---

## 8. Terminology

- Define terms once in the **glossary** (`docs/domain-models/` per bounded context).
- Use ubiquitous-language terms exactly as defined. Synonyms forbidden once a term is canonical.
- Product names: `CyIdentity`, `CyCitizen`, `CyIntegration Hub`, `CyData`, `CyAI`, `CyMed`, `CyCom`, `CyShop`, `CyGov` — exact casing.

---

## 9. Versioning & Status

- Every governed doc has a status header: `Draft | Approved | Deprecated | Superseded by …`.
- Major changes to approved docs require a PR with the same approval matrix as code in that area.
- ADRs are **immutable** once accepted — supersede, don't edit.

---

## 10. Quality Checks (CI-enforceable)

- **Markdown lint** (`markdownlint-cli2`).
- **Link checker** (`lychee`) — broken links fail CI.
- **Spell check** (`cspell`) with project dictionary.
- **Mermaid validation** — invalid diagrams fail CI.
- **ADR presence check** — architecture-tagged PRs must touch `docs/adr/` or include `no-adr: true` justification in the PR body.

---

## 11. Changelog

- Repo root `CHANGELOG.md` generated from Conventional Commits via release tooling.
- Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
- Per-service changelogs allowed for independently versioned products.

---

## 12. Forbidden

- Documents without owners.
- "TBD" sections in approved docs — file an issue and link it instead.
- Screenshots of code (paste the code).
- Real data in examples.
- Mixing how-to and reference in one document.
