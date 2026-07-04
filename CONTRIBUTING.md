# Contributing to CyberCom Platform

Thank you for your interest in CyberCom. This document describes how to contribute to the platform foundation.

## Ground Rules

1. **Foundation phase.** This repository is in the *initialization* stage. Do not add application code, business logic, ERP modules, websites, or mobile apps until the corresponding ADR has been approved.
2. **Documentation first.** Every structural or architectural change must be accompanied by an ADR in `docs/decisions/`.
3. **Security first.** Never commit secrets, credentials, PII, PHI, or production data. Use environment variables and a secret manager.
4. **Conventional Commits.** Use the [Conventional Commits](https://www.conventionalcommits.org/) format: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `build:`.

## Workflow

1. **Fork or branch.** Create a branch from `main` using the pattern `type/short-description` (e.g. `docs/adr-0001-identity`).
2. **Make changes.** Keep PRs small and focused.
3. **Open a PR** using the [pull request template](.github/pull_request_template.md).
4. **Code review.** At least one code owner (see [`CODEOWNERS`](CODEOWNERS)) must approve.
5. **CI must pass** before merge.

## Branch Protection

- `main` is protected. All changes via PR.
- Squash-merge is the default strategy.
- Linear history is enforced.

## Documentation

- All documentation lives under `docs/`.
- Use Markdown. Diagrams: prefer [Mermaid](https://mermaid.js.org/) embedded in Markdown, or PlantUML stored alongside the doc.
- New architectural decisions → new ADR in `docs/decisions/` numbered sequentially (`ADR-0001-title.md`).

## Issue Reporting

- Bugs → use the **Bug Report** template.
- Features → use the **Feature Request** template.
- Security vulnerabilities → **do not open a public issue.** Follow [`SECURITY.md`](SECURITY.md).

## Code of Conduct

All contributors are expected to behave professionally and respectfully. Harassment, discrimination, or abusive behavior will not be tolerated.

## Questions

Open a GitHub Discussion or contact the maintainers listed in [`CODEOWNERS`](CODEOWNERS).
