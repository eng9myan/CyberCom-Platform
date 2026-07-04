# Repository Architecture

This document defines the monorepo strategy, directory layout, shared libraries, versioning, branching models, and developer workflows for the CyberCom platform.

---

## 1. Monorepo Strategy

CyberCom utilizes a single unified repository (**Monorepo**) to host all application code, configuration templates, and deployment scripts.

### 1.1 Tooling
*   **PNPM Workspaces:** For all TypeScript, React, and OWL applications. It provides fast dependency caching and zero-copy node_modules linking.
*   **Go Workspaces:** For backend Go services, facilitating local development across microservices and shared Go utilities.
*   **Turborepo:** Orchestrates caching, build tasks, lints, and tests across all workspace folders, reducing build times in CI.

---

## 2. Directory Layout

The workspace is organized logically by component layer:

```
cybercom-platform/
├── apps/                         # Standalone Applications & Services
│   ├── cyidentity/               # Identity and Auth Engine
│   ├── cymed/                    # EHR & CPOE Service
│   ├── cycom/                    # ERP Finance & HR Core
│   └── cyshop/                   # Commerce & checkout backend
├── packages/                     # Shared Workspace Libraries
│   ├── design-tokens/            # Shared CSS variables & HSL colors
│   ├── ui-components/            # Radix/React design elements
│   ├── go-sdk/                   # Shared Go logger, middleware, Outbox helpers
│   └── python-sdk/               # Python ML wrapper utility
├── docs/                         # Platform Design, ADRs, & Workflows
└── infra/                        # Infrastructure as Code
    ├── terraform/                # VM & DB provision templates
    └── argocd/                   # GitOps environment manifests
```

---

## 3. Shared Libraries, Components, and Services

To prevent code duplication, common utility modules are centralized in `/packages/`:
*   **`go-sdk`:** Provides standard handlers for logging (zerolog structured format), dynamic Vault connection engines, OPA policy evaluators, and the Outbox persistence handler.
*   **`ui-components`:** Pure UI elements (buttons, inputs, modals) built using headless Radix primitives and styled with design tokens.
*   **`database-migration`:** Standard migration scripts executing Schema migrations sequentially.

---

## 4. Branching, Versioning, and Release Workflow

### 4.1 Trunk-Based Development
*   Developers commit code to short-lived feature branches (`feat/slug` or `fix/slug`) branched from `main`.
*   Direct commits to `main` are blocked. All code must pass review and automated CI pipelines before squash-merging to `main`.

### 4.2 Versioning & Release
*   **Versioning:** Services follow **Semantic Versioning (SemVer v2)**.
*   **Release Pipelines:** Merges to `main` trigger semantic-release tasks. The tool parses commits (following Conventional Commits standards), updates the changelog, increments package versions, and builds/pushes container images to the registry tagged with the new version.

---

## 5. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Repository Architecture | Enterprise Architect |
