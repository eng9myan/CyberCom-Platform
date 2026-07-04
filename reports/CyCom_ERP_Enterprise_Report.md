# CyCom ERP — Enterprise Report (Phase 0: Architecture + Gap Analysis)

**Status:** IN PROGRESS — architecture decided, gap identified, wiring/build work not started.
**Decision (2026-07-04, revised same day):** Product 7 (CyCom ERP) is a **custom build**, extending the Django app already scaffolded at `CyberCom-Platform/backend/products/cycom/` (finance gl/ap/ar/budgeting/cost_accounting/treasury, procurement, hr, payroll, inventory, assets incl. fleet/biomedical/maintenance, crm, bi, retail/pos). **No Odoo runtime ships in production.** `eng9myan/CyCom` (Odoo 19 Community, renamed "Cycom 19" in-repo, + 75 Anabtawi addons + Next.js 16 wizard UI) is used **only as a feature/UX reference** — mine its wizard UI design and module behavior as a spec, do not deploy its Odoo container. This keeps the platform's original "no Odoo in production" rule intact for all products, including CyCom ERP.

## What exists in the reference repo (`eng9myan/CyCom`, branch develop) — for spec-mining only

| Layer | State |
|---|---|
| Backend | Odoo 19 Community, Dockerized (`cycom:19` image), Postgres 16 |
| Custom addons | 75 modules in `cycom-platform/addons/cycom_modules/` — almost entirely HR/Payroll/Attendance/POS/Stock customizations for a specific retail/HR client (Anabtawi Group). No manufacturing, CRM, project, quality, or accounting-specific custom modules. |
| Theme addon | `cycom_theme` — rebrands Odoo login/page titles to "Cycom" |
| Frontend | Next.js 16 + React 19, 26 module routes under `cycom-erp/app/` |
| Wired to real backend | **2 of 26 pages**: login, HR Employees. Everything else renders hardcoded `INITIAL_*` mock arrays. |
| Setup wizards | 10 doctrine wizards shipped (Company, COA, Payroll, Warehouse, POS, Sales, Procurement, Manufacturing, HR Structure, Permissions) under `cycom-erp/app/setup/*` |
| Archived | `cycom-backend.archive/` — abandoned FastAPI attempt, not used, safe to delete |

## Gap: reference repo vs vanilla Odoo 19 (used to scope what `products/cycom/` must build)

Of the 26 Next.js module pages in the reference repo, mapped to Odoo edition:

**Odoo Community-equivalent (16)** — `products/cycom/` should build native Django models/APIs covering the same ground: accounting, attendance, crm, discuss, expenses, fleet, hr, inventory, maintenance, pos, project, purchase, recruitment, sales, portal, dashboard. Several already scaffolded (finance, hr, inventory, crm, procurement, assets incl. fleet/maintenance, retail/pos) — need feature-completing against this list, not building from zero.

**Odoo Enterprise-only in the reference repo (10)** — no free Odoo equivalent exists, so these need a fully custom `products/cycom/` module each, using the named OCA project only as a design reference (not a dependency) where one exists:

| Module | What Odoo Enterprise offers (reference only) | Build approach |
|---|---|---|
| Payroll | Full localization payroll engine | Extend existing `payroll/` app; Anabtawi's custom modules (overtime, payslip xlsx, base_payroll_account) are a good behavior spec to port |
| Helpdesk | Ticket/SLA management | New `products/cycom/helpdesk/`; OCA `helpdesk_mgmt` as design reference |
| Documents | Central document management | New module or route through CyIntegrationHub document store |
| Knowledge | Internal wiki | New module; OCA `document_page` as reference |
| Marketing Automation | Drip campaigns | New module in `crm/` or standalone |
| Planning | Resource/shift scheduling | New module |
| PLM | Product lifecycle/engineering change | New module; OCA `product_lifecycle` as reference |
| Quality | Quality control/checks | New module; OCA `quality_control` as reference |
| Sign | E-signatures | Route through CyIntegrationHub, 3rd-party e-sign API |
| Subscriptions | Recurring billing | New module, likely bridges to `finance/ar/` |

## Licensing

No Odoo code ships — LGPL obligations from Odoo core / Anabtawi modules do not apply. Reference-only use of a competitor's open-source product for feature scoping carries no licensing obligation. Next.js wizard UI design (`cycom-erp/`) can be reimplemented cleanly against the custom Django backend without carrying over Odoo's JSON-RPC bridge code.

## Recommendation

Build all 26 modules natively in `products/cycom/`, using the reference repo purely as a checklist of what a modern ERP needs to cover (mirrors the "no Odoo in production" rule already enforced everywhere else on the platform). This avoids all LGPL/Enterprise entanglement and keeps CyCom ERP fully self-owned — consistent with the "AI-powered, easier than Odoo" positioning.

## Verdict

**NOT READY** — architecture finalized (custom, no Odoo runtime), gap/spec analysis done against the reference repo. Build work in `products/cycom/` (16 Community-equivalent modules to complete + 10 net-new modules) not started. This is Phase 7 of 7 in the phased build order; Hospital (Phase 1) starts first per mission order unless redirected.
