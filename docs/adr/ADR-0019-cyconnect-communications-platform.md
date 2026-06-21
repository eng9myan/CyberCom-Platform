# ADR-0019: CyConnect Communications Platform

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Enterprise Architect, Platform Architect (Communications), Chief Security Architect, Compliance Architect |
| **Consulted** | Healthcare Domain Architect, ERP Domain Architect, Platform Engineering Lead |
| **Affects** | Communications product (renamed from CyCom to CyConnect); CyCom (rescoped — [ADR-0018](ADR-0018-cycom-product-repositioning.md)); all matrices |
| **Tags** | architecture, product, communications, naming |
| **Related** | [ADR-0018](ADR-0018-cycom-product-repositioning.md), `cycom_architecture.md` (rewritten), `cyconnect_architecture.md` (new) |

---

## 1. Context

[ADR-0018](ADR-0018-cycom-product-repositioning.md) repositions **CyCom** as the enterprise ERP back-office. The communications product previously called CyCom — messaging, voice, video, contact center, notifications — must therefore receive a new name and an updated product definition that is unambiguous, durable across markets, and reflects its actual role: the **omnichannel communications platform** every other CyberCom product relies on to talk to humans.

## 2. Problem Statement

What is the **name, scope, and product definition** of CyberCom's communications platform after the CyCom repositioning?

## 3. Decision Drivers

- A name that clearly signals "connecting people across channels" — to internal stakeholders, customers, and partners.
- No collision with the new CyCom (ERP) or any other product in the catalog.
- Same Phase-1.1 scope is fundamentally correct; this ADR preserves the architectural intent while updating the name and tightening boundaries.
- Reuse the platform plane (CyIdentity, CyIntegration Hub, CyData, CyAI) — CyConnect is a **horizontal product** consumed by every other product that needs to communicate.
- Strict separation from CyCom (Approvals workflow ≠ messaging delivery), CyMed (clinical content ≠ delivery), CyShop (order events ≠ receipts).

## 4. Considered Options

1. **CyConnect** — chosen.
2. CyComm / CyComms — too close to CyCom; same confusion the rename is meant to fix.
3. CyTalk / CyReach / CyMessage — each is narrower than the product's true scope (which is omnichannel + voice + video + contact center).

## 5. Decision

The communications product is named **CyConnect** and replaces the previous "CyCom = communications" definition in every document and matrix.

### 5.1 Scope

CyConnect is CyberCom's **omnichannel communications platform**. It owns the following bounded contexts:

| Module | One-line scope |
|---|---|
| **Messaging** | In-app chat, secure clinician/agent chat, internal collaboration threads |
| **Email** | Transactional + bulk email (templates, deliverability, suppression) |
| **SMS** | One-way + two-way SMS / MMS / RCS via carrier and aggregator partners |
| **WhatsApp** | WhatsApp Business / similar over-the-top channels per partner agreement |
| **Voice** | SIP trunking, IVR, click-to-call, recording (consent-aware), TTS/STT |
| **Video** | Real-time video calls, telehealth sessions, webinars (media server abstraction) |
| **Contact Center** | Queues, skills routing, agent desktop, supervisor tools, omnichannel handoff |
| **Notifications** | Push (FCM/APNs), in-app banners, jurisdiction-aware delivery rules |
| **Omnichannel Communications** | Conversation graph across channels per recipient; threading and continuity |

### 5.2 Out of scope (delegated)

- **Identity / sign-in** → CyIdentity (agents, clinicians, citizens, customers all sign in there).
- **Authoring of clinical / financial / civic / commerce content** → the producing product (CyMed / CyCom / CyGov / CyShop). CyConnect carries; it does not author.
- **Payments for premium SMS / international voice** → CyShop captures; CyCom recognizes AR.
- **ERP approval workflows** → **CyCom Approvals**. CyConnect MAY deliver an approval notification, but the workflow lives in CyCom.
- **Cross-product engagement analytics** → CyData.
- **LLM-powered agent assist (the model)** → CyAI. CyConnect embeds; CyAI infers.
- **External partner / carrier API management at platform scale** → CyIntegration Hub (e.g. carrier connector lifecycle, schema registry); CyConnect operates the runtime channel adapters.

### 5.3 Critical boundaries (anti-overlap)

| Capability | Owner | Why |
|---|---|---|
| **Send an SMS / email / push** to a recipient | **CyConnect** | One delivery surface for the whole platform |
| **Decide *what* to say** in that message | **Producing product** | Content authority stays with the domain |
| **Run an approval workflow** (PO, expense, journal, contract) | **CyCom Approvals** | Back-office workflow engine |
| **Notify the approver** that an approval is pending | **CyConnect** | Delivery, not workflow |
| **Recipient consent (channel preferences, opt-in/out, quiet hours)** | **CyConnect** | Single source of contactability |
| **Identity-level consent** (privacy, processing) | **CyIdentity** | Identity layer |
| **Clinical consent for tele-medicine recording** | **CyMed** records consent, **CyConnect** records that the recording occurred under that consent | Two layers, owned separately |
| **Conversation thread storage** | **CyConnect** | One archive |
| **Long-term BI on engagement** | **CyData** | Analytics is platform |

### 5.4 Shared services consumed (recap)

CyConnect consumes the platform exactly like every other product: **CyIdentity** (authN), **CyIntegration Hub** (carrier connectors, partner ingress, webhooks), **CyData** (engagement analytics), **CyAI** (agent assist models), **CyShop** (premium-traffic billing), plus platform audit / observability / secrets / policy / mesh.

### 5.5 Naming, branding, and visible artifacts

- Product name: **CyConnect** in all customer-facing materials, READMEs, and architecture docs.
- Repo / branch: `cyconnect` (new; see §5.6).
- Event topic prefix: `cybercom.cyconnect.*` (replaces the previously-planned `cybercom.cycom.*` for comms events).
- Service catalog entry under `infrastructure/catalog/services.yaml` as `cyconnect`.
- All historical references to "CyCom = communications" updated in the same PR that lands this ADR — no dual-meaning period.

### 5.6 Branching impact

The permanent branch model in [`git_strategy`](../governance/git_strategy.md) §2.1 is updated accordingly:

- **`cycom`** branch — reassigned to the new CyCom (ERP) per [ADR-0018](ADR-0018-cycom-product-repositioning.md).
- **`cyconnect`** branch — added as the permanent domain branch for CyConnect.

`git_strategy.md` will be updated by the next governance-touching PR; this ADR is the source decision.

### 5.7 Compliance posture

CyConnect carries the same compliance posture previously written for the comms product (TCPA / CASL / GDPR / ePrivacy / HIPAA-aware when relaying clinical content). The non-bypassable Compliance Engine remains a first-class CyConnect requirement.

## 6. Rationale

- **CyConnect** is a clear, durable name that reads correctly to stakeholders in healthcare, government, and enterprise markets.
- Preserving the Phase-1.1 scope (everything we already designed for the comms product) avoids re-work — the rename is a paperwork operation since no production code exists yet.
- Calling out CyCom-vs-CyConnect boundaries up-front prevents the predictable "but CyConnect should run approvals because it sends the approval notification" mistake.

## 7. Consequences

### 7.1 Positive
- Product names are unambiguous: CyCom = ERP, CyConnect = comms, CyShop = consumer commerce, CyGov = digital government.
- Every product has exactly one place to go for delivery (CyConnect) and one place for back-office workflows (CyCom Approvals).
- Branding and marketing line up with the product's actual job.

### 7.2 Trade-offs
- A short window of dual references in older artifacts / external links if any (mitigated — this PR is the cut-over).
- CyConnect must remain disciplined about "delivery, not workflow"; the temptation to absorb approval/case workflows is real.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | External docs / references continue to say "CyCom = communications" | Medium | Low | One coordinated PR; doc link-check in CI; this ADR explicit |
| 2 | CyConnect absorbs ERP approval workflows under "we already send the notification" | Medium | High | Boundary entry in [`product_boundary_matrix`](../architecture/product_boundary_matrix.md); ADR required for any workflow capability in CyConnect |
| 3 | Branch / topic rename misses callers | Low | Medium | This PR updates all four matrices, both per-product docs, and the ADR index; integration tests will catch stragglers |
| 4 | Marketing prefers a different name post-hoc | Low | Medium | Naming locked at ADR-acceptance; future change would need a new superseding ADR |

### 7.4 Follow-up actions
- [ ] Rewrite `docs/platforms/cycom_architecture.md` to reflect the new ERP scope (this PR).
- [ ] Create `docs/platforms/cyconnect_architecture.md` (this PR).
- [ ] Update `docs/governance/git_strategy.md` §2.1 to list `cyconnect` as a permanent branch and re-describe `cycom` (separate small PR following this one).
- [ ] Update `CODEOWNERS` to assign the CyConnect domain owner role.
- [ ] Add `cyconnect` to the Boundary Lint allow/deny sets (per Phase 1.1 recommendation): allow comms SDKs in CyConnect; deny them elsewhere.
- [ ] Service-catalog entry for `cyconnect` (Phase 1.2 Sprint 2).

## 8. Compliance & Security Impact

- Inherits the previously-accepted comms compliance posture: TCPA, CASL, GDPR, ePrivacy, HIPAA-aware relays, jurisdictional suppression as a hard gate, recording consent enforcement, HMAC-signed webhook ingress/egress, content classification per recipient relationship (clinical / financial / civic / commerce / general).
- Phishing-link suppression and HMAC link tokenization remain mandatory for clinical and government messages.
- Tier-1 service; multi-AZ default; multi-region per [ADR-0008](ADR-0008-saas-deployment-strategy.md); sovereign on-prem profile uses locally licensed carriers / SIP per addendum.

## 9. Alternatives Rejected

- **CyComm / CyComms** — too close to CyCom; the confusion the rename is meant to fix would persist.
- **CyTalk, CyReach, CyMessage** — each evocative of part of the product, none of the whole. Comms platform spans messaging, voice, video, and contact center.
- **No rename; keep "CyCom = comms"** — leaves the back-office gap unaddressed and the naming confusion in place.

## 10. References

- [ADR-0018 CyCom Product Repositioning](ADR-0018-cycom-product-repositioning.md)
- [`enterprise_product_architecture`](../architecture/enterprise_product_architecture.md), [`product_boundary_matrix`](../architecture/product_boundary_matrix.md), [`domain_ownership_matrix`](../architecture/domain_ownership_matrix.md), [`data_ownership_matrix`](../architecture/data_ownership_matrix.md)
- Phase 1.1 report

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Enterprise Architect | Proposed (Board review) |
| 2026-06-21 | Architecture Board | Accepted |
