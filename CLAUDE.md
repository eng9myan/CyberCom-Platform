# CyberCom Platform — Claude Code Primary Guide

## Start Here

Before making any change:

1. Read `AI/CLAUDE.md` for architecture rules.
2. Read `AI/ARCHITECTURE.md` for structural boundaries.
3. Read `AI/PRODUCTS.md` for product ownership.
4. Read `AI/STANDARDS.md` for coding standards.
5. Inspect the repository. Treat existing code as source of truth.

---

## Mission

CyberCom is a production-ready, commercially deployable enterprise software platform.
Every change must advance that mission without introducing duplicate functionality.

---

## Products

| Product | Domain |
|---------|--------|
| CyMed | Healthcare Platform (Clinic, Hospital, Laboratory, Imaging, Pharmacy, Patient Portal, Provider Portal, Revenue Cycle, Population Health) |
| CyCom | Enterprise ERP (Finance, Accounting, Procurement, Inventory, HR, Payroll, CRM, Assets, BI) |
| CyGov | Government Platform |
| CyIdentity | Identity & Access Management |
| CyIntegrationHub | Integration Platform (FHIR, HL7, DICOM) |
| CyAI | Artificial Intelligence Platform |
| CyData | Analytics & Data Platform |
| CyConnect | Communications Platform |
| CyCitizen | Citizen Services Platform |

---

## Non-Negotiable Rules

1. **Inspect before writing.** Search for existing services, models, and APIs first.
2. **Never duplicate.** One implementation per responsibility. Find it and reuse it.
3. **Modular architecture.** Every product owns a bounded domain. Never cross boundaries.
4. **Production-ready only.** No placeholders, no TODOs, no stub implementations.
5. **Tenant isolation always.** Every model, query, and API must filter by tenant.
6. **Audit everything.** Every business action emits an audit record.
7. **CyIdentity for all auth.** Never create local authentication.
8. **CyCom for ERP.** Healthcare products consume CyCom. Never duplicate ERP.
9. **CyAI is advisory.** AI assists humans. Humans make final clinical decisions.
10. **CyIntegrationHub for integrations.** Never build direct external integrations inside products.

---

## Repository Layout

```
backend/
  core/           Django settings, URLs, ASGI, Celery
  platform/       Shared services (cyidentity, audit, tenant, events, cyai, cydata, cyintegrationhub, terminology, notifications, api)
  products/
    cymed/        Healthcare products
    cycom/        ERP modules
    cycitizen/    Citizen services
    cygov/        Government platform
    cyshop/       Commerce
    demo/         Demo environment
    implementation/ Implementation tools
    academy/      Training platform
    partner_ecosystem/ Partner tools
    commercial_readiness/ Commercial tools
    website/      Public website CMS APIs
  shared/         Cross-product utilities
frontend/         Next.js frontend
infrastructure/   Docker, Kubernetes, Helm, Terraform, CI/CD
tests/            Integration and E2E tests
AI/               Architecture knowledge base (read this first)
```

---

## Before Finishing Any Task

Validate:
- Architecture compliance (no boundary violations)
- Security (tenant isolation, authentication, authorization)
- Tests pass
- No duplicate functionality introduced
- Documentation updated if functionality changed
- Conventional Commits format for any commit
