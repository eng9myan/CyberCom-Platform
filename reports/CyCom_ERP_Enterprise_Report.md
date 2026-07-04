# CyCom ERP — Enterprise Report (Phase 0: Architecture + Gap Analysis)

**Status:** IN PROGRESS — architecture decided, gap identified, wiring/build work not started.
**Decision (2026-07-04):** Product 7 (CyCom ERP) is built on `eng9myan/CyCom` — Odoo 19 Community ("Cycom 19" in-repo) + 75 Anabtawi custom addons + Next.js 16 wizard UI. This supersedes CyberCom-Platform's own "no Odoo" doctrine for this one product; the custom Django `backend/products/cycom/` in CyberCom-Platform is not the Product 7 foundation (may still be reused for CyMed↔CyCom bridges elsewhere — needs reconciliation later).

## What exists today (`eng9myan/CyCom`, branch develop)

| Layer | State |
|---|---|
| Backend | Odoo 19 Community, Dockerized (`cycom:19` image), Postgres 16 |
| Custom addons | 75 modules in `cycom-platform/addons/cycom_modules/` — almost entirely HR/Payroll/Attendance/POS/Stock customizations for a specific retail/HR client (Anabtawi Group). No manufacturing, CRM, project, quality, or accounting-specific custom modules. |
| Theme addon | `cycom_theme` — rebrands Odoo login/page titles to "Cycom" |
| Frontend | Next.js 16 + React 19, 26 module routes under `cycom-erp/app/` |
| Wired to real backend | **2 of 26 pages**: login, HR Employees. Everything else renders hardcoded `INITIAL_*` mock arrays. |
| Setup wizards | 10 doctrine wizards shipped (Company, COA, Payroll, Warehouse, POS, Sales, Procurement, Manufacturing, HR Structure, Permissions) under `cycom-erp/app/setup/*` |
| Archived | `cycom-backend.archive/` — abandoned FastAPI attempt, not used, safe to delete |

## Gap vs vanilla Odoo 19 (Community vs Enterprise split)

Of the 26 Next.js module pages, mapped to Odoo edition:

**Community-covered (16)** — real Odoo model exists, just needs wiring: accounting, attendance, crm, discuss, expenses, fleet, hr, inventory, maintenance, pos, project, purchase, recruitment, sales, portal, dashboard.

**Enterprise-only in stock Odoo (10)** — no Community model, needs a paid Enterprise app, an OCA (Odoo Community Association) free module, or a custom build:

| Module | Odoo Enterprise app | Free alternative |
|---|---|---|
| Payroll | Payroll (full localization) | Already partially covered — Anabtawi custom modules (`base_payroll_account`, `cycom_payroll_overtime`, `payroll_extra_hours_adjustment`, `cycom_payslip_xlsx`) implement a custom payroll layer instead of Enterprise Payroll. Needs completing, not licensing. |
| Helpdesk | Helpdesk | OCA `helpdesk_mgmt` (free) |
| Documents | Documents | No good free equivalent — build custom on `mail`/attachments, or route through CyIntegrationHub document store |
| Knowledge | Knowledge | OCA `document_page` (wiki-style, weaker UX) |
| Marketing (automation) | Marketing Automation | Community "Email Marketing" covers basic campaigns only; automation flows need custom build |
| Planning | Planning | No strong OCA equivalent — likely custom build |
| PLM | PLM | OCA `product_lifecycle` (partial) |
| Quality | Quality | OCA `quality_control` (manufacturing repo, partial) |
| Sign | Sign | No free equivalent — 3rd-party e-sign via CyIntegrationHub (e.g. DocuSign adapter) |
| Subscriptions | Subscriptions | No strong OCA equivalent — likely custom build |

## Licensing

- Odoo Community core: LGPLv3 — must ship source for anything derived from Odoo core.
- 75 Anabtawi modules: LGPL-3 per manifest — same obligation.
- Next.js frontend (`cycom-erp/`): private, license unconfirmed — needs a decision before commercial sale.
- No Enterprise license currently held. Selling "CyCom ERP" as Enterprise-parity requires either buying Enterprise, or building the 10 gap modules independently (safer long-term, avoids per-seat Enterprise cost).

## Not yet verified (needs live environment)

- Whether `cycom:19` Docker image actually boots clean in this environment (not attempted this session — static repo analysis only).
- Whether all 75 Anabtawi modules install without dependency errors (pivot doc flags `hr_attendance_geofence_config` license-string mismatch as a known issue).
- `hs_zk_attendance` needs `pip install pyzk` if real ZK biometric hardware is used — skipped so far.

## Recommendation

Fill Enterprise gaps with custom modules / OCA substitutes rather than buying Odoo Enterprise — keeps CyCom ERP fully self-owned, avoids per-seat licensing, matches the "AI-powered, easier than Odoo" positioning instead of reselling Odoo Enterprise under a new name.

## Verdict

**NOT READY** — architecture + gap analysis done. Build work (wire 24 remaining pages, close 10 Enterprise gaps, verify live boot) not started. This is Phase 7 of 7 in the phased build order; Hospital (Phase 1) starts first per mission order unless redirected.
