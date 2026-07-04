# ADR-0018 / ADR-0019 — Architecture Board Correction Report

| Field | Value |
|---|---|
| Trigger | Architecture Board review of Phase 1.1 product roster |
| Status | ✅ Complete |
| Date | 2026-06-21 |
| Owner | Chief Enterprise Architect |
| Repository | https://github.com/eng9myan/CyberCom-Platform |
| ADRs | [ADR-0018](adr/ADR-0018-cycom-product-repositioning.md) · [ADR-0019](adr/ADR-0019-cyconnect-communications-platform.md) |

---

## 1. Purpose

Capture the Architecture Board's correction to the Phase 1.1 product roster:

- **CyCom** is repositioned as CyberCom's **enterprise back-office / ERP** (Finance · Accounting · HR · Payroll · Procurement · Inventory · Manufacturing · CRM · Projects · Assets · Quality · Documents · Approvals · Budgeting · Contracts).
- **CyConnect** is established as CyberCom's **omnichannel communications platform** (Messaging · Email · SMS · WhatsApp · Voice · Video · Contact Center · Notifications · Omnichannel Communications), inheriting the comms scope previously written under CyCom.

This is a documentation rename + repositioning. No production application code exists for the old definition — the cheapest possible moment to course-correct.

---

## 2. Files Created

### Architecture Decision Records (2)
- `docs/adr/ADR-0018-cycom-product-repositioning.md` — context, drivers, 15-module new CyCom scope, anti-overlap rules vs CyShop / CyGov / CyMed, separation-of-duties baseline, risks, follow-up actions (incl. ADR-0018a build approach).
- `docs/adr/ADR-0019-cyconnect-communications-platform.md` — name decision, 9-module scope (preserving Phase 1.1 comms intent), anti-overlap rules vs CyCom Approvals / CyMed / CyShop, branch + topic naming, compliance posture.

### Per-product architecture (1 new, 1 rewritten)
- `docs/platforms/cyconnect_architecture.md` — **new**. Mission, scope, users, modules, shared services, owned/consumed data, APIs, events (`cybercom.cyconnect.*`), integrations, deployment, security, Mermaid component diagram.
- `docs/platforms/cycom_architecture.md` — **rewritten** for the ERP scope. Same template; 15 modules; cross-module Mermaid diagram; events `cybercom.cycom.*` reassigned to ERP.

### Phase report (1)
- `docs/ADR_0018_0019_Report.md` (this file).

## 3. Files Updated

| File | Nature of update |
|---|---|
| `docs/architecture/enterprise_product_architecture.md` | Top-of-doc change-note; 10-product table; updated C4 container diagram; Two-Plane table; Shared Services table (added CyConnect + CyCom Approvals + CyCom Documents); Product Relationship Map; Domain Ownership one-liner; Data Ownership one-liner; Anti-Overlap rules (now 13, with explicit Procurement and Documents disambiguations); Compliance Footprint table (added CyConnect; redefined CyCom). |
| `docs/architecture/product_boundary_matrix.md` | Full rewrite. New §1.2 CyConnect, §1.3 CyCom (ERP) with 16 in/out rows including separation-of-duties hooks; §2 disputes expanded with 6 new ERP-specific rows; §3 Platform-vs-Product table includes CyConnect and CyCom (ERP); §4 "Don't Build This" extended with rules 11 + 12. |
| `docs/architecture/domain_ownership_matrix.md` | §3 retitled to **CyConnect** with 11 rows (added C11 — approval-notification delivery); new **§3b CyCom (ERP)** with 15 rows (E1–E15); §4 CyShop refined to consumer-only (S3/S4/S5/S6/S7); §5 CyGov refined (G3 procurement boundary; G6 fee-flow; G10 statutory payroll); §7 cross-cutting expanded with X3 contactability consent, X7 separation of duties. |
| `docs/architecture/data_ownership_matrix.md` | §3 retitled to **CyConnect** (SoR renamed throughout); new **§3b CyCom (ERP) Data** with 20 rows covering GL / sub-ledgers / HR / payroll / procurement / inventory / manufacturing / CRM / projects / assets / quality / documents / approvals / budgets / contracts; §4 CyShop refined to consumer-only with **CyCom Finance** as AR replica; §5 CyGov fee row now includes CyCom Finance AR posting; §9 Cross-Cutting Rules expanded from 10 to 13 (PCI ban in CyCom, GL SoR, CyConnect SoR, SoD); §10 erasure diagram includes both CyConnect and CyCom (ERP). |
| `docs/adr/README.md` | Index updated with ADR-0018 and ADR-0019. |

No content was deleted blindly — every CyCom-as-comms statement either became a CyConnect statement or moved into the new §3b ERP rows. All affected diagrams (C4 container view, Product Relationship Map, erasure flow) were updated in place.

---

## 4. Architecture Decisions

### 4.1 Naming
- **Rename communications to CyConnect.** Closes a real source of stakeholder confusion before any code is written.
- Drop the previous "CyCom = communications" definition with no dual-meaning period.

### 4.2 Repositioning
- **CyCom = enterprise back-office / ERP**, a single integrated product with 15 modules.
- The product is horizontal (used by hospital, government, and enterprise tenants); the platform plane (CyIdentity, CyIntegration Hub, CyData, CyAI, CyConnect) is fully reused.

### 4.3 Boundary clarifications
- **Enterprise Procurement → CyCom** (the tenant buying for itself).
- **Public-sector e-Procurement → CyGov** (statutory tendering and public registers).
- **Payment capture → CyShop; AR posting → CyCom Finance.** The complete flow is now: producing product (CyMed / CyGov / CyConnect / CyCom CRM) → CyShop (PCI capture) → CyCom Finance (AR / GL posting).
- **ERP approval workflows → CyCom Approvals.** CyConnect MAY deliver the approval notification; the workflow lives in CyCom.
- **Enterprise documents → CyCom Documents.** Clinical documents stay in CyMed; civic case documents stay in CyGov.
- **Employee master → CyCom HR; workforce identity → CyIdentity.** Identity attributes (login / MFA / roles) and HR-record attributes (comp / leave / performance) cleanly split.

### 4.4 Compliance posture
- **PHI does not enter CyCom (ERP)** except as minimum-necessary fields in charge-capture pass-through.
- **PCI does not enter CyCom (ERP)**; capture stays in CyShop's PCI enclave; CyCom sees masked transaction references.
- **Separation of duties** is now a first-class platform control (X7 in the domain matrix; Cross-Cutting Rule #13 in the data matrix).
- CyConnect compliance posture preserved (TCPA / CASL / GDPR / ePrivacy / HIPAA-aware relays).

### 4.5 Topic naming reassignment
- `cybercom.cyconnect.*` → communications events (replaces previously-planned `cybercom.cycom.*` for comms).
- `cybercom.cycom.*` → ERP events (reassigned to the new CyCom scope).

### 4.6 Branching impact
- `cycom` branch reassigned to the new ERP scope.
- `cyconnect` permanent branch added (next governance-touching PR will update `git_strategy.md` §2.1).

---

## 5. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | "CyCom Procurement" vs "CyGov e-Procurement" confused at sales / delivery | High | Medium | Boundary matrix entry; sales playbook; per-product CODEOWNERS |
| R2 | CyShop vs CyCom dispute over B2B sales-order vs CRM | Medium | Medium | Decision recorded: CRM owns opportunity → sales order; CyShop owns transactional storefront orders; CyCom Finance recognizes both as AR |
| R3 | CyCom Documents grows into a clinical / civic document store | Medium | High | Boundary rule + planned lint: clinical docs forbidden in CyCom Documents; CI checks for medical / civic data classes |
| R4 | CyCom HR and CyIdentity workforce realm fight over employee data | Medium | Medium | Explicit attribute split (identity vs HR-record) in domain matrix E3 |
| R5 | CyConnect absorbs ERP approval workflows under "we already send the notification" | Medium | High | Boundary entry; ADR required for any workflow capability in CyConnect |
| R6 | External / archived docs continue referring to "CyCom = comms" | Medium | Low | One coordinated PR; this report enumerates every change; CI link-check will catch stragglers |
| R7 | "Enterprise ERP" becomes a build-from-scratch death march | High | High | Adopt OSS ERP base where it accelerates (Odoo / ERPNext / similar) — decision in ADR-0018a; module-by-module rollout |
| R8 | Branch / topic rename misses callers | Low | Low | This PR updates all four matrices, both per-product docs, and the ADR index; this report lists every file |
| R9 | Civic-register procurement work mistakenly routes to CyCom | Medium | Medium | Anti-overlap rule reinforced (CyGov G3); review-time prompts in PR template |
| R10 | Erasure-propagation runbooks not updated for CyConnect / CyCom new scopes | Medium | High | Listed as follow-up; Phase 1.2 erasure-procedure doc covers both new boundaries explicitly |

---

## 6. Recommendations

1. **Open ADR-0018a** (CyCom build approach — buy/extend OSS ERP vs build from scratch) and time-box a 3-week PoC.
2. **Update `docs/governance/git_strategy.md` §2.1** to list `cyconnect` as a permanent branch and reflect the `cycom` reassignment (small follow-up PR).
3. **Update CODEOWNERS** when product team rosters are formed: `cycom` → ERP Domain Architect; `cyconnect` → Platform Architect (Communications).
4. **Extend Boundary Lint** (planned in the Phase 1.1 recommendations):
   - Deny `cybercom.cycom.*` topic publishes outside CyCom (ERP); deny `cybercom.cyconnect.*` outside CyConnect.
   - Deny SMS / SIP / email-provider SDK imports outside CyConnect; deny LLM / payment SDKs outside CyAI / CyShop as before.
   - Deny GL / payroll / procurement-SDK imports outside CyCom (ERP).
   - Deny `pan|primary_account_number` field shapes outside CyShop's PCI namespace and in CyCom DB schemas.
5. **Phase 1.2 priorities update**:
   - Per-module CyCom architecture sub-docs (Finance, HR, Procurement first).
   - CyConnect threat model (was already planned).
   - Erasure-procedure doc must cover CyConnect-specific and CyCom-specific obligations.
6. **Communicate the change** to all stakeholders via a short release-notes entry in the next platform-docs release; update README "Products" section in the next docs PR if any external link references the old comms scope.
7. **Treat ADR-0018 + ADR-0019 as the canonical "naming truth"** — any future doc referring to CyCom for comms must be corrected on sight.

---

## 7. Sign-off

| Role | Decision |
|---|---|
| Chief Enterprise Architect | ✅ Accept |
| Chief Software Architect | ✅ Accept |
| Chief Security Architect | ✅ Accept |
| Compliance Architect | ✅ Accept |
| Platform Architect | ✅ Accept |
| ERP Domain Architect (designate) | ✅ Accept |
| Platform Architect (Communications) | ✅ Accept |
| Technical Program Manager | ✅ Apply Board correction — Phase 1.2 proceeds with the corrected product roster |
