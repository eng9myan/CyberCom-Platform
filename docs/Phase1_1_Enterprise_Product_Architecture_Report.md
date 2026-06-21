# Phase 1.1 — Enterprise Product Architecture Report

| Field | Value |
|---|---|
| Program | **P1 — Enterprise Product Architecture** |
| Phase | **1.1 — Product Definitions & Boundaries** |
| Status | ✅ Complete |
| Date | 2026-06-21 |
| Owner | Chief Enterprise Architect |
| Repository | https://github.com/eng9myan/CyberCom-Platform |

---

## 1. Purpose

Define **what each CyberCom product is**, what it owns, what it does not, and how the nine products fit together as one platform. The deliverable is architecture and governance — **no production application code** is introduced.

This phase converts the Program 0 foundation (standards, security, platform engineering, foundational ADRs) into an explicit, normative product architecture that subsequent phases (domain modelling, reference architectures, MVP slicing) can build on without re-litigating boundaries.

---

## 2. Files Created

### Enterprise architecture (`docs/architecture/`, 4)
1. `enterprise_product_architecture.md` — principles, two-plane model, C4 container view, Product Relationship Map, Shared Services Map, anti-overlap rules, compliance footprint
2. `product_boundary_matrix.md` — per-product "in / out" lists; resolved boundary disputes; "don't build this inside your product" rules; boundary change process
3. `domain_ownership_matrix.md` — single owner per platform, healthcare, communications, commerce, government, citizen, and cross-cutting domain
4. `data_ownership_matrix.md` — SoR + replicas + class + residency + retention for every important dataset; cross-cutting rules; erasure propagation diagram

### Per-product architectures (`docs/platforms/`, 8)
For every product: Mission · Scope · Users · Core Modules · Shared Services Consumed · Owned Data · Consumed Data · APIs · Events · Integrations · Deployment Model · Security Requirements · Component Diagram (Mermaid).

1. `cyidentity_architecture.md` — Platform: IdP for humans + workloads
2. `cyintegrationhub_architecture.md` — Platform: integration backbone + event bus + healthcare/gov bridges
3. `cydata_architecture.md` — Platform: medallion lakehouse + dbt + Airflow + lineage + Feature Store + FHIR semantic layer
4. `cyai_architecture.md` — Platform: model gateway + registry + RAG + agents + evals + guardrails
5. `cymed_architecture.md` — Healthcare: hospital + clinical (PHI SoR)
6. `cycom_architecture.md` — Horizontal: messaging + voice + video + contact center
7. `cyshop_architecture.md` — Horizontal: commerce + payments (PCI SoR) + marketplace + storefronts
8. `cygov_architecture.md` — Government: services + e-procurement + permits + civic registers + fee assessment

### Phase report (1)
- `docs/Phase1_1_Enterprise_Product_Architecture_Report.md` (this file)

**Total new artifacts: 13 documents.**

CyCitizen (the citizen-facing front for CyGov) is treated as a vertical product in the enterprise architecture document, with its boundaries captured in the matrices and its scope inherited from CyGov; a dedicated product-architecture doc for CyCitizen lands in Phase 1.2 alongside the per-product domain models.

---

## 3. Architecture Decisions

### 3.1 Two-plane model ratified
- **Platform plane** = CyIdentity, CyIntegration Hub, CyData, CyAI + shared services (audit, secrets, policy, mesh, observability). **No business logic.**
- **Product plane** = CyMed, CyCom, CyShop, CyGov, CyCitizen. **Reuse the platform; never re-implement.**
- Encoded in [`enterprise_product_architecture.md`](architecture/enterprise_product_architecture.md) §4 and enforced via the boundary matrix.

### 3.2 Single ownership per domain
- Every domain has **exactly one owner**, with explicit consumers and a stated boundary rule ([`domain_ownership_matrix.md`](architecture/domain_ownership_matrix.md)).
- 17 platform domains, 14 healthcare, 10 communications, 9 commerce, 10 government, 4 citizen-facing, 5 cross-cutting.

### 3.3 Single source of truth per dataset
- Every important dataset has **one SoR**, with replicas governed by data contracts via CyData ([`data_ownership_matrix.md`](architecture/data_ownership_matrix.md)).
- **PHI = CyMed.** **PCI = CyShop.** **Identity = CyIdentity.** **Civic registers = CyGov.** No exceptions.

### 3.4 Anti-overlap rules baked in
- Ten explicit "settle the obvious arguments now" rules in [`enterprise_product_architecture.md`](architecture/enterprise_product_architecture.md) §9 and [`product_boundary_matrix.md`](architecture/product_boundary_matrix.md) §4.
- Examples of the resolved disputes: patient reminders, fee payment, retail pharmacy, public-health reporting, marketplace storefronts for government, AI-suggested coding, audit storage, consent layering, vendor login, citizen profile rendering.

### 3.5 "Don't build this inside your product" list
- 10 capabilities (login, secrets, audit, SMS, SIP, payments, vendor LLMs, analytics warehouse, partner B2B portal, observability) are platform-only.
- Violations require an ADR.

### 3.6 Compliance footprint per product
- Each product's highest data class and primary regulations are listed in the enterprise architecture doc (§11), driving deployment-mode and per-product security requirements.

### 3.7 Diagrams
- Mermaid C4 container view of the platform.
- Mermaid Product Relationship Map.
- Mermaid Shared Services Map.
- Per-product Mermaid component diagrams in all eight product architecture docs.
- Mermaid erasure propagation flow across products.

---

## 4. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Boundary erosion — a team builds a "small" payments / audit / SMS thing inside their product | High | High | Boundary matrix + CODEOWNERS + ADR-required deviations; CI lint flags forbidden imports (e.g. payment SDKs outside CyShop) |
| R2 | CyIntegration Hub becomes a bottleneck for every partner integration | High | Medium | Connector library with self-service onboarding; per-partner sandboxes; SLA on integration build-out |
| R3 | CyIdentity as platform SPOF (raised again here) | Medium | Critical | Multi-region active/active per [ADR-0017](adr/ADR-0017-cyidentity-product-strategy.md); graceful-degradation libraries; chaos drills |
| R4 | PHI leaks from CyMed via CyAI prompts to non-BAA vendors | Medium | Critical | CyAI guardrails detect PHI; default routing to open-weights for PHI; per-feature data-flow ADR; audit on every inference |
| R5 | CyShop PCI scope creep (PAN appears outside the enclave) | Medium | Critical | Tokenization at gateway enforced; CI scan for PAN-shaped fields outside PCI namespace; quarterly QSA review |
| R6 | Civic-register changes get treated as ordinary updates (not append-only) | Medium | High | Database standards require append-history; CyGov module enforces "supersede record" pattern; audit asserted in CI |
| R7 | CyCom misuse for marketing spam under "clinical/government" cover | Medium | High | Compliance Engine non-bypassable; jurisdictional suppression hard gate; audit of every send with producing-product context |
| R8 | Data contract drift between products and CyData | High | Medium | Schema registry with compatibility checks; CI block on breaking changes; OpenLineage alerts |
| R9 | Per-jurisdiction CyGov complexity explodes | High | High | Connector packs per jurisdiction; capability matrix; deployment-mode addenda; centralized compliance engine |
| R10 | Two products own the same workflow because the matrix wasn't consulted | High | Medium | Matrix is normative; PR template asks for boundary-doc reference; Architecture Board sign-off on new domains |
| R11 | Erasure incomplete across the long replica chain | Medium | Critical | Erasure propagation runbook + control-plane orchestrator; quarterly audit; tombstone evidence required |
| R12 | Tenants on different deployment modes drift in security posture | Medium | High | Signed-bundle pipeline; supported-version matrix; per-mode conformance harness |
| R13 | "AI decides" creep — products let CyAI take the action rather than the suggestion | Medium | Critical | Clinical/legal decisions explicitly out-of-scope for CyAI; HITL required for high-risk tools; SaMD / EU AI Act risk classification per feature |
| R14 | Public-records publication leaks PII | Medium | Critical | CyGov redaction pipeline; review-before-publish; automated PII scanner before open-data export |
| R15 | CyCitizen reintroduces SoR for identity/civic data "for performance" | Medium | High | Boundary rule explicit; reviews flag any persistence beyond cache; ADR required for any storage decision |

---

## 5. Recommendations

1. **Apply the matrices immediately** to the existing CODEOWNERS file and the PR template (`Boundary matrix consulted?` checkbox). Make boundary-violation reviews 2-architect-reviewers.
2. **Author per-product CODEOWNERS** stubs (`docs/platforms/*` and future `<product>/` repos) reflecting the ownership matrix as soon as product repos are created.
3. **Stand up a Boundary Lint** (custom checks) in CI: deny payment SDK imports outside CyShop; deny direct LLM-vendor SDKs outside CyAI; deny SMS/SIP SDKs outside CyCom; deny cross-product DB drivers.
4. **Author CyCitizen architecture doc** in Phase 1.2 (intentionally deferred while CyGov boundaries stabilize).
5. **Author per-product threat-model template + first threat models** for CyIdentity and CyMed in Phase 1.2 (highest blast radius).
6. **Author per-product `RECOVERY.md` template** in Phase 1.2; first instances for CyIdentity, CyMed, CyShop.
7. **Run the two pending PoCs (carried from Phase 0.4)** — OPA vs Cedar (→ ADR-0005a); Linkerd-only vs Linkerd+Istio fallback validated against CyMed's mesh needs (→ informs [ADR-0013](adr/ADR-0013-service-mesh-strategy.md)).
8. **Open ADR-0017a** (CyIdentity OSS base selection — Keycloak vs Zitadel) and time-box the 3-week PoC.
9. **Define service catalog entries** for each of the nine products in `infrastructure/catalog/services.yaml` (planned in Program 1 Sprint 2) — name, owner team, tier, product, data classes, on-call rotation, runbook URL.
10. **Schedule architecture-board reviews** for the first per-product domain models (Phase 1.2) — one per product.
11. **Author CyCitizen / CyGov interaction spec** so the citizen face cannot accidentally hold civic data.
12. **Author CyAI clinical-feature pathway** doc (SaMD + EU AI Act) before any CyMed feature uses CyAI in production.

---

## 6. Readiness for Phase 1.2

**Phase 1.2 — Domain Models & Reference Architectures** is unblocked. Inputs in place:

- ✅ Platform vs Product separation explicit and enforceable.
- ✅ Single-owner-per-domain matrix published; teams know the lines.
- ✅ Single-SoR-per-dataset matrix published; events and APIs have clear sources.
- ✅ Per-product scope, modules, APIs, events, integrations, deployment, security defined.
- ✅ Anti-overlap rules and dispute resolutions written down; PR template can reference them.
- ✅ Architecture diagrams (C4 + relationship + shared services + per-product components + erasure flow).
- ✅ Compliance posture per product mapped to the regulations driving it.

**Go criteria for closing Phase 1.1:**

- [x] All 8 product architecture docs published on `main`.
- [x] All 3 matrices published.
- [x] Enterprise architecture document published with all maps.
- [x] Cross-references between product docs, matrices, ADRs, and standards validated.
- [x] Phase report published.
- [ ] _(non-blocking, Phase 1.2 first sprint)_ CyCitizen architecture doc; per-product threat-model template; service-catalog entries; boundary-lint in CI.

---

## 7. Sign-off

| Role | Decision |
|---|---|
| Chief Enterprise Architect | ✅ Accept |
| Chief Software Architect | ✅ Accept |
| Chief Security Architect | ✅ Accept |
| Compliance Architect | ✅ Accept |
| Platform Architect | ✅ Accept |
| Healthcare Domain Architect | ✅ Accept |
| Technical Program Manager | ✅ Close Phase 1.1 — proceed to Phase 1.2 |
