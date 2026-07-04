# ADR-0018: CyCom Product Repositioning

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Enterprise Architect, Chief Software Architect, Platform Architect, Compliance Architect, ERP Domain Architect |
| **Consulted** | Healthcare Domain Architect, Platform Engineering Lead |
| **Affects** | CyCom (rescoped); CyShop (boundary clarified); CyConnect (new — [ADR-0019](ADR-0019-cyconnect-communications-platform.md)); all matrices |
| **Tags** | architecture, product, erp, boundaries |
| **Related** | [ADR-0019](ADR-0019-cyconnect-communications-platform.md), [enterprise_product_architecture](../architecture/enterprise_product_architecture.md), [product_boundary_matrix](../architecture/product_boundary_matrix.md), [domain_ownership_matrix](../architecture/domain_ownership_matrix.md), [data_ownership_matrix](../architecture/data_ownership_matrix.md) |

---

## 1. Context

Phase 1.1 defined **CyCom** as CyberCom's **communications** product (messaging, voice, video, contact center, notifications). On Architecture Board review, two issues emerged:

1. **Naming conflict.** "CyCom" was being read by stakeholders as "CyberCom Commerce / Company / Core" — not "Communications". The name is wrong for a comms product.
2. **Missing back-office product.** CyberCom's healthcare, government, and SaaS customers consistently need an **integrated enterprise back-office** (Finance, HR, Procurement, Inventory, Manufacturing, CRM, …). Today that capability lives nowhere in the platform. Building it as nine separate point-products would fragment data and reproduce decades-old ERP silo problems. CyShop is consumer-facing commerce — not an ERP and not meant to be.

The Board decided to:

- **Rename communications away from "CyCom"** to **CyConnect** (decision in [ADR-0019](ADR-0019-cyconnect-communications-platform.md)).
- **Reposition CyCom** as CyberCom's **enterprise back-office / ERP product**.

## 2. Problem Statement

What is the new scope, boundary, and name semantics for **CyCom**, given that (a) communications moves to CyConnect and (b) the platform needs an integrated enterprise back-office?

## 3. Decision Drivers

- Avoid product-name confusion with stakeholders, customers, and engineers.
- Cover the back-office needs of CyberCom's three primary customer types (hospitals, governments, enterprises) with **one** consistent ERP — not nine point-products.
- Reuse the platform plane (CyIdentity, CyIntegration Hub, CyData, CyAI, CyConnect) — CyCom must not re-implement platform capabilities.
- Avoid overlap with **CyShop** (consumer commerce) and **CyGov** (e-procurement at country scale).
- Avoid overlap with **CyMed** clinical workflows; CyMed remains the system of record for clinical operations and produces charges that CyCom invoices.
- Keep migration cost bounded: CyCom is in foundation phase — no production code exists yet, so the rename + repositioning is paperwork, not migration.

## 4. Considered Options

1. **Rename comms to CyConnect; reposition CyCom as the enterprise ERP back-office** (chosen).
2. Keep CyCom as comms; introduce a separate "CyERP" product. (Rejected — leaves the naming confusion in place.)
3. Spread ERP capabilities across many small products (CyFinance, CyHR, CyProcure, …). (Rejected — guarantees silo data and integration overhead.)
4. Bolt ERP capabilities into CyShop. (Rejected — overloads a consumer-commerce product with B2B/enterprise operations it isn't designed for.)

## 5. Decision

CyCom is repositioned as **CyberCom's enterprise back-office / ERP product**.

### 5.1 Renamed scope: CyCom = Enterprise Back-Office

CyCom owns the following bounded contexts (one product, multiple modules):

| Module | One-line scope |
|---|---|
| **Finance** | General Ledger, sub-ledgers, multi-entity / multi-currency, period close, FX revaluation |
| **Accounting** | Chart of accounts, journal entries, allocations, intercompany, tax accounting |
| **HR** | Employee master, organization, positions, leave, performance, benefits |
| **Payroll** | Pay calc, deductions, garnishments, statutory filings, payslips |
| **Procurement** | Internal enterprise procurement: supplier master, RFx, POs, GRNs, three-way match, supplier payments |
| **Inventory** | Items, lots, serials, warehouses, stock moves, valuation, cycle counts |
| **Manufacturing** | BoMs, routings, work orders, MRP, shop-floor execution, costing |
| **CRM** | Accounts, contacts, opportunities, pipeline, activities, sales orders |
| **Projects** | Projects, tasks, timesheets, expenses, project accounting, billing |
| **Assets** | Fixed assets, depreciation, maintenance schedules, disposals |
| **Quality** | Quality plans, inspections, non-conformance, CAPA, supplier quality |
| **Documents** | Enterprise document management (versioned, signed, retained per record policy) |
| **Approvals** | Workflow engine for approvals (POs, expenses, journals, contracts) |
| **Budgeting** | Budgets, forecasts, variance, encumbrance, period locking |
| **Contracts** | Customer + supplier contracts, terms, renewals, obligations, e-signature |

### 5.2 Out of scope for CyCom (delegated)

- **Identity / SSO / MFA** → CyIdentity.
- **Notifications / messaging / voice / video / contact center** → **CyConnect**.
- **Consumer-facing commerce (catalog, cart, checkout, storefronts, marketplace, payment capture)** → CyShop.
- **Government-scale e-procurement (national tendering, vendor registers, public-sector contract awards)** → CyGov.
- **Clinical workflows / EHR / CPOE / eMAR / lab / imaging** → CyMed.
- **Cross-product analytics / executive BI** → CyData.
- **Model serving / AI inference** → CyAI.
- **External partner APIs / B2B ingress / EDI** → CyIntegration Hub.

### 5.3 Critical boundaries (anti-overlap)

| Capability | Owner | Why |
|---|---|---|
| **Enterprise procurement** (the enterprise buys for itself) | **CyCom Procurement** | Internal back-office function |
| **Public-sector e-procurement** (the government runs tenders for its citizens / public works) | **CyGov e-Procurement** | Statutory / public-sector workflow |
| **Consumer commerce** (catalog → cart → checkout → payment capture) | **CyShop** | Storefront, OMS, PCI |
| **Enterprise customer invoicing & AR** (selling to businesses; project billing) | **CyCom Finance/CRM** | B2B billing is back-office |
| **B2C order payment** | **CyShop** (capture) → **CyCom Finance** (recognize) | CyShop holds PCI; CyCom posts revenue |
| **Hospital patient bill payment** | **CyShop** (capture) → **CyCom Finance** (post AR) | CyMed produces charge; CyShop captures; CyCom recognizes |
| **Workforce identity** (login, MFA, sessions) | **CyIdentity** | Identity is platform |
| **Employee master data** (compensation, leave, performance, benefits) | **CyCom HR** | Back-office record |
| **Documents** (enterprise records: invoices, POs, contracts, employee files, quality records) | **CyCom Documents** | Generic enterprise DMS |
| **Clinical documents** (notes, results, images) | **CyMed** | Clinical record |
| **Civic / case documents** | **CyGov** | Civic record |
| **Notifications** (every send across the platform) | **CyConnect** | Comms platform |
| **Approval workflows for ERP** (PO/expense/journal/contract approvals) | **CyCom Approvals** | Back-office workflow |
| **Approval workflows for citizen cases** | **CyGov Case Management** | Civic workflow |
| **Approval workflows for clinical orders** | **CyMed CPOE** | Clinical workflow |

### 5.4 Shared services consumed (recap)

CyCom consumes the platform exactly like every other product: **CyIdentity** (authN), **CyIntegration Hub** (events + partner APIs), **CyData** (analytics), **CyAI** (assist), **CyConnect** (notifications), plus platform audit / observability / secrets / policy / mesh.

### 5.5 Migration impact

- No production application code exists for the old "CyCom = communications" definition; this is a documentation rename + repositioning.
- The `cycom` branch defined in [`git_strategy`](../governance/git_strategy.md) §2.1 is **reassigned** to the new ERP scope. The communications work that would have gone there goes to a new `cyconnect` branch (per [ADR-0019](ADR-0019-cyconnect-communications-platform.md) §5.6).
- Event topic prefix `cybercom.cycom.*` is **reassigned** to ERP events (see CyCom architecture doc §9). Communications events use `cybercom.cyconnect.*`.
- All Phase 1.1 documents are updated in the same PR that lands this ADR — enterprise architecture, three matrices, CyCom architecture, plus a new CyConnect architecture. No "dual meaning" period.

## 6. Rationale

- **Rename closes a real source of stakeholder confusion** before any product code is written — the cheapest moment to do it.
- **An integrated ERP back-office** is the right shape for CyberCom's target markets (hospitals, governments, mid/large enterprises). One ERP with shared identity, audit, data, and comms beats nine point-products on data consistency, compliance, and ops cost.
- **Clear separation from CyShop and CyGov** prevents the failure mode where consumer commerce, public procurement, and enterprise back-office all mash together.
- **Phase 1.1 was the right time to course-correct.** Architecture, not code, is being moved.

## 7. Consequences

### 7.1 Positive
- Unambiguous product names; stakeholders stop asking "what does CyCom do?"
- One ERP serves hospitals (with CyMed), governments (with CyGov), and enterprises directly.
- Cross-cutting flows (CyMed charge → CyShop capture → CyCom AR posting; CyGov fee → CyShop capture → CyCom AR posting) have a single, clear path.
- Documents, Approvals, Contracts, Budgeting are centralized — every product reuses them instead of building bespoke workflows.

### 7.2 Trade-offs
- An ERP is a large product surface. Scope discipline matters or it absorbs work that belongs elsewhere.
- Must be careful that **CyCom Documents** does not become a general-purpose CMS that displaces CyMed clinical records or CyGov case documents.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | "CyCom Procurement" and "CyGov e-Procurement" confused at sales/delivery | High | Medium | Boundary matrix entry; sales playbook; per-product CODEOWNERS |
| 2 | CyShop and CyCom dispute over B2B sales-order vs CRM | Medium | Medium | Decision: CRM owns opportunity → sales order; CyShop owns transactional storefront orders; CyCom recognizes both as AR |
| 3 | CyCom Documents grows into a clinical / civic document store | Medium | High | Boundary rule + lint: clinical docs forbidden in CyCom Documents; CI checks for medical/civic data classes |
| 4 | CyCom HR and CyIdentity workforce realm fight over employee data | Medium | Medium | CyIdentity owns identity attributes (login, roles, MFA); CyCom HR owns HR-record attributes (comp, leave, performance); explicit attribute split |
| 5 | Branch / repo rename misses some Phase-0 references | Low | Low | This ADR + the report list every affected file; CI links-check will catch leftovers |
| 6 | "Enterprise ERP" becomes a build-from-scratch death march | High | High | Adopt OSS ERP base where it accelerates (Odoo / ERPNext / similar) — to be decided in a follow-up ADR-0018a; module-by-module rollout |

### 7.4 Follow-up actions
- [ ] **ADR-0018a:** CyCom build approach — buy/extend an OSS ERP base vs build from scratch — Chief Software Architect + ERP Domain Architect, Program 1 Sprint 1–2.
- [ ] Update CyCom architecture doc to reflect the new scope (this PR).
- [ ] Update CODEOWNERS to assign the (new) CyCom domain owner role.
- [ ] Rename branch `cycom` to refer to the new ERP scope; create `cyconnect` per [ADR-0019](ADR-0019-cyconnect-communications-platform.md).
- [ ] Add boundary lint that flags ERP-shaped imports in CyShop / CyMed / CyGov repos and comms-shaped imports in CyCom.
- [ ] Author per-module CyCom architecture sub-docs in Phase 1.2 (Finance, HR, Procurement first).

## 8. Compliance & Security Impact

- CyCom inherits the platform compliance posture (HIPAA-aware via CyMed integration, GDPR, SOX-style separation-of-duties for Finance/Procurement, statutory payroll filings).
- **PHI does not enter CyCom** except in charge-capture pass-through fields (already minimum-necessary).
- **PCI does not enter CyCom**; payment capture remains in CyShop's PCI enclave; CyCom only sees masked transaction references for AR posting.
- Separation-of-duties controls (e.g. PO creator ≠ approver ≠ GRN ≠ payment-releaser) are first-class CyCom requirements; mapped to policy-engine policies.
- Audit footprint: every financial posting, approval decision, master-data change goes to the platform audit sink with full actor/resource/purpose context.

## 9. Alternatives Rejected

- **Keep CyCom = communications.** Leaves a naming problem with stakeholders and provides no answer for the missing back-office.
- **Separate CyFinance / CyHR / CyProcure / … products.** Fragments the data model; recreates the silo problem ERP was invented to solve.
- **Bolt ERP into CyShop.** CyShop is consumer commerce; ERP is enterprise back-office. Different users, different workflows, different compliance posture, different tier discipline.

## 10. References

- [ADR-0019 CyConnect Communications Platform](ADR-0019-cyconnect-communications-platform.md)
- [`enterprise_product_architecture`](../architecture/enterprise_product_architecture.md), [`product_boundary_matrix`](../architecture/product_boundary_matrix.md), [`domain_ownership_matrix`](../architecture/domain_ownership_matrix.md), [`data_ownership_matrix`](../architecture/data_ownership_matrix.md)
- Phase 1.1 report

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Enterprise Architect | Proposed (Board review) |
| 2026-06-21 | Architecture Board | Accepted |
