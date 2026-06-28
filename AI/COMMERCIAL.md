# Commercial Strategy

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
- Annual SaaS subscription (per module, per facility, per user)
- Implementation services
- Training (CyberCom Academy)
- Support and maintenance
- Marketplace (third-party integrations)
- White-label licensing for system integrators

---

## Product Editions

| Edition | Target | Included |
|---------|--------|---------|
| Basic | Small clinics, single-site labs | Core modules only |
| Professional | Mid-size hospitals, multi-site clinics | All product modules |
| Enterprise | Large hospital groups, networks | All modules + analytics + BI + population health |
| Government | Public health organizations | Enterprise + CyGov + CyCitizen |

---

## Feature Flag Gating

Feature flags control capability access per tenant per edition.

Location: `products/cymed/commercial/feature_flags/`

Rule: Every premium feature must check `FeatureFlagService.is_enabled(feature_key, tenant_id)`.

Never hardcode edition logic in product code — always route through `FeatureFlagService`.

---

## Licensing

Location: `products/cymed/commercial/licensing/`

`LicenseService` validates:
- License key authenticity
- License expiry
- Module entitlements
- User seat limits
- Feature entitlements

All APIs validate license status via `LicenseMiddleware`.

---

## White Label

Location: `products/cymed/commercial/branding/`

`BrandingMiddleware` injects tenant brand per request:
- Logo URL
- Color scheme
- Product name
- Custom domain

No hardcoded "CyberCom" branding in product UI — always from brand tokens.

---

## Deployment Profiles

Location: `products/cymed/commercial/deployment_profiles/`

Supported profiles:
- `cloud` — Managed SaaS on cloud
- `private_cloud` — Customer-hosted cloud
- `government_cloud` — Sovereign/air-gapped government
- `hybrid` — Mixed cloud/on-premise
- `air_gapped` — No internet connectivity

Each profile has corresponding Kubernetes overlays in `infrastructure/kubernetes/overlays/`.

---

## Go-To-Market Channels

- **Direct sales:** Enterprise accounts (hospitals, health ministries)
- **System integrators:** Licensed resellers with white-label rights
- **Partner ecosystem:** `products/partner_ecosystem/` — certified implementation partners
- **Marketplace:** Third-party integration catalog

---

## Customer Success

- **Implementation:** `products/implementation/` — methodology, project templates, training materials
- **Academy:** `products/academy/` — self-service training, certifications
- **Demo:** `products/demo/` — live demo environment with synthetic data
- **Portal:** Customer portal on Cybercom-Website for license management and support

---

## Pricing Principles (Engineering implications)

- Usage metering (`products/cymed/commercial/usage_metering/`) tracks:
  - Active users per tenant
  - API calls per module per tenant
  - Storage consumption
  - Report generation count
  - AI query count

- Never expose pricing in backend code — pricing in CRM (CyCom) and external systems only.
- Meter usage; pricing is a business decision applied externally.

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
