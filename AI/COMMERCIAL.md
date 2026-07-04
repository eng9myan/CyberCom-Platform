# Commercial Strategy & Platform Control Plane

## Business Model

CyberCom sells enterprise software licenses to healthcare facilities, government agencies, and enterprises.

**Primary markets:**
- Hospitals (100–2,000+ beds)
- Multi-specialty clinics and clinic chains
- Commercial laboratories
- Imaging and radiology centers
- Pharmacy chains
- Government health ministries
- Enterprise organizations (ERP)

**Revenue streams:**
- Annual SaaS subscription (per module, per facility, per user, concurrent users)
- Implementation services
- Training (CyberCom Academy)
- Support and maintenance
- Marketplace (third-party integrations)
- White-label licensing for system integrators

---

## Central Commercial Control Plane (cybercom_cr app)

All platform-wide commercial workflows are managed by the `products/commercial_readiness` module (registered as Django app label `cybercom_cr`).

Key services and entities:
- **PricingPlan:** Defines plans per product code (e.g. monthly, annual, per user, per bed, flat rate).
- **Quotation & Proposal:** Tracks quote lifecycles (draft, sent, accepted, rejected) and proposal wins/losses.
- **License:** Model for active license enforcement supporting multiple scopes (`tenant`, `facility`, `user`, `product`, `enterprise`, `concurrent`).
- **Subscription:** Manages active subscription lifecycles linked to billing plans.
- **ProductEdition & FeatureFlag:** Configurable editions (`starter`, `professional`, `enterprise`, `network`, `government`) with flag overrides per tenant.
- **WhiteLabelConfig:** Stores tenant display names, colors, domains, favicon/logo URLs, and report headers.
- **ConcurrentLicenseSession:** Live tracking of checked-in concurrent users.
- **SupportTicket:** Ticket workflow (`open`, `in_progress`, `resolve`, `closed`) with assigned staff.
- **MarketplaceListing:** Catalog of installable packages (`module`, `extension`, `theme`, `connector`, `ai_package`, `clinical_template`, `report`, `dashboard`).
- **CommercialMetricsSnapshot:** Stores ARR, MRR, usage metrics, and churn data.

---

## Partner Ecosystem (cybercom_partners app)

Managed by the `products/partner_ecosystem` module.

Key services and entities:
- **Partner & PartnerApplication:** Manages partner status (`prospect`, `active`, `certified`, `suspended`).
- **PartnerCertification:** Technical and sales certifications of partner consultants.
- **LeadRegistration:** Deal registration to protect partner-driven sales pipelines.
- **MarketplaceExtension:** Optional packages built and published by partners.

---

## Feature Flag Gating

Feature flags control capability access per tenant per edition.

Rule: Every premium feature must check active features via `FeatureFlag` or `TenantFeatureFlagOverride`.
Never hardcode edition logic in product code — always route through the feature flag services.

---

## Deployment Profiles

Supported profiles:
- `cloud` — Managed SaaS on cloud
- `private_cloud` — Customer-hosted cloud
- `government_cloud` — Sovereign/air-gapped government
- `hybrid` — Mixed cloud/on-premise
- `air_gapped` — No internet connectivity

Each profile has corresponding Kubernetes overlays in `infrastructure/kubernetes/overlays/`.

---

## Commercial Readiness Checklist (for developers)

Before shipping any new feature:
- [ ] Feature flag gating implemented
- [ ] License entitlement check added
- [ ] Usage metering event emitted
- [ ] White-label compatibility verified
- [ ] Edition compatibility documented
- [ ] Demo environment updated
- [ ] API documentation complete
- [ ] Training content updated in Academy
