# CyberCom Platform — Website Public API Integration Guide

**App:** `products.website`  
**Base URL:** `https://api.cy-com.com/api/v1/public/`  
**OpenAPI Schema:** `https://api.cy-com.com/api/schema/`  
**Swagger UI:** `https://api.cy-com.com/api/docs/`

---

## Overview

The `products.website` Django application exposes a set of **unauthenticated, rate-limited REST APIs** that power `www.cy-com.com`. These APIs serve marketing content (products, industries, case studies, partners, documentation) and handle lead generation (demo requests, contact messages, partner applications, newsletter sign-ups).

All APIs are:
- **Public** — no authentication required
- **Rate limited** — per IP address using DRF throttling (Redis-backed)
- **Audit logged** — lightweight `WebsiteApiLog` + platform `AuditLog` for lead events
- **OpenAPI documented** — via drf-spectacular `@extend_schema`
- **CORS enabled** — through the platform's `corsheaders` configuration

---

## Endpoints Reference

### Health

```
GET /api/v1/public/health/
```

Returns the operational status of the website APIs. No rate limiting.

**Response:**
```json
{
  "status": "ok",
  "service": "cybercom-website-api",
  "version": "v1",
  "endpoints": ["..."]
}
```

---

### Products

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/public/products/` | List published products |
| GET | `/api/v1/public/products/{slug}/` | Product detail |

**Query Parameters (list):**
- `category` — filter by: `healthcare`, `erp`, `government`, `ai`, `identity`, `integration`, `data`, `communications`, `citizen`
- `is_featured=true` — homepage featured products
- `search` — full-text search on name/tagline
- `ordering` — `sort_order`, `name`
- `page`, `page_size`

**Example — Featured Healthcare Products:**
```
GET /api/v1/public/products/?category=healthcare&is_featured=true
```

**Rate limit:** 600 requests/hour per IP

---

### Industries

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/public/industries/` | List industries |
| GET | `/api/v1/public/industries/{slug}/` | Industry detail with relevant products |

**Query Parameters:**
- `is_featured=true`
- `search`

---

### Case Studies

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/public/case-studies/` | List case studies |
| GET | `/api/v1/public/case-studies/{slug}/` | Case study detail |

**Query Parameters:**
- `industry` — filter by industry slug
- `country` — filter by country name
- `is_featured=true`

---

### Partners

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/public/partners/` | Partner directory |
| POST | `/api/v1/public/partners/apply/` | Submit partner application |

**Partner Application Payload:**
```json
{
  "company_name": "AlSharq Consulting",
  "contact_name": "Khalid Al-Rashid",
  "email": "khalid@alsharq.sa",
  "phone": "+966 50 000 0000",
  "website": "https://alsharq.sa",
  "country": "Saudi Arabia",
  "partner_type": "implementation",
  "expertise_areas": ["CyMed", "CyGov"],
  "years_in_business": 8,
  "gdpr_consent": true
}
```

**Response:**
```json
{
  "id": "...",
  "reference_number": "PAR-123456",
  "status": "pending",
  "created_at": "2026-06-24T..."
}
```

**Rate limit:** 3 applications/hour per IP

---

### Documentation

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/public/documentation/` | List doc sections |
| GET | `/api/v1/public/documentation/{slug}/` | Section detail with items |
| GET | `/api/v1/public/documentation/search/?q=...` | Search documentation |

**Search Parameters:**
- `q` — search query (min 2 chars); searches title, summary, tags
- `product` — filter by product slug
- `content_type` — `guide`, `reference`, `tutorial`, `release_note`, `faq`, `changelog`

---

### Demo Request

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/public/demo-request/` | Submit demo request |
| GET | `/api/v1/public/demo-request/{ref}/status/` | Check request status |

**Demo Request Payload:**
```json
{
  "full_name": "Sara Al-Nour",
  "email": "sara@hospital.sa",
  "phone": "+966 50 123 4567",
  "job_title": "CIO",
  "company": "King Faisal Medical City",
  "company_size": "1001+",
  "country": "Saudi Arabia",
  "product_interests": ["CyMed Hospital", "CyMed Pharmacy"],
  "message": "We are evaluating CyMed for our 1,200-bed hospital.",
  "preferred_time": "Weekday mornings (GST)",
  "source": "homepage_hero",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "cymed-hospital-sa",
  "gdpr_consent": true,
  "marketing_consent": true
}
```

**Response:**
```json
{
  "id": "...",
  "reference_number": "CYB-481923",
  "status": "pending",
  "created_at": "2026-06-24T..."
}
```

**Validations:**
- `email` — rejects disposable email providers (mailinator, guerrillamail, etc.)
- `product_interests` — at least one required
- `gdpr_consent` — must be `true`

**Rate limit:** 5 requests/hour per IP

---

### Contact

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/public/contact/` | Submit contact message |
| GET | `/api/v1/public/contact/{ticket}/status/` | Check ticket status |
| POST | `/api/v1/public/contact/newsletter/` | Newsletter sign-up |

**Contact Payload:**
```json
{
  "full_name": "Mohammed Al-Rashid",
  "email": "mohammed@company.com",
  "company": "SEHA",
  "subject": "Enterprise Pricing Inquiry",
  "message": "We are interested in evaluating CyMed for our hospital network.",
  "department": "sales",
  "gdpr_consent": true
}
```

**Departments:** `sales`, `support`, `partnerships`, `press`, `careers`, `general`

**Newsletter Payload:**
```json
{
  "email": "user@company.com",
  "source": "footer",
  "gdpr_consent": true
}
```

**Rate limits:**
- Contact: 10 messages/hour per IP
- Newsletter: 5 sign-ups/hour per IP

---

## Rate Limits

| Endpoint Group | Limit | Scope |
|----------------|-------|-------|
| All read endpoints | 600/hour | Per IP |
| Write endpoints (general) | 20/hour | Per IP |
| Demo requests | 5/hour | Per IP |
| Contact messages | 10/hour | Per IP |
| Partner applications | 3/hour | Per IP |
| Newsletter sign-ups | 5/hour | Per IP |

**Rate limit headers returned:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1719225600
Retry-After: 3600  (on 429)
```

**Override via environment variables:**
```env
THROTTLE_WEBSITE_READ=600/hour
THROTTLE_DEMO_REQUEST=5/hour
THROTTLE_CONTACT=10/hour
THROTTLE_PARTNER_APP=3/hour
THROTTLE_NEWSLETTER=5/hour
```

---

## Audit Logging

### WebsiteApiLog (Analytics)
Every request to a public endpoint writes a `WebsiteApiLog` row:
- `endpoint`, `method`, `status_code`
- `ip_address`, `user_agent`, `referrer`
- `response_time_ms`
- `was_throttled` — flag for rate-limited requests

### Platform AuditLog (Compliance)
Lead generation events (demo requests, contact messages, partner applications) additionally write a `platform.audit.AuditLog` row:
- `action: "create"`
- `resource_type: "demo_request" | "contact_message" | "partner_application"`
- `status: "success"`
- `ip_address`, `request_path`
- `details: { reference_number, company, ... }`

---

## CyIdentity Integration

Public endpoints do **not require** authentication. However, if a `Bearer` token is present in the `Authorization` header, it is optionally decoded by `CyIdentityAuthMiddleware` for context enrichment in audit logs.

For portal users who arrive at `cy-com.com` after authentication:
- Access token is passed as `Authorization: Bearer <token>` to authorized endpoints
- The middleware validates the token against `CYIDENTITY_JWKS_URI`
- Enriched user context flows through to the audit log

---

## Multi-Tenant Support

The public website APIs serve global marketing content that is **not tenant-scoped**. However, lead-gen records include optional tenant routing:

- `DemoRequest.tenant_slug` — optional field; populated when the form is submitted from a tenant-branded page
- Used by CyIntegrationHub to route the lead to the correct tenant's CyCom CRM instance

---

## OpenAPI / Swagger Documentation

The full OpenAPI schema is auto-generated by `drf-spectacular`:

| URL | Description |
|-----|-------------|
| `GET /api/schema/` | OpenAPI 3.0 YAML schema |
| `GET /api/docs/` | Swagger UI |
| `GET /api/redoc/` | ReDoc UI |

All website API endpoints are tagged with:
- `Public Products`
- `Public Industries`
- `Public Case Studies`
- `Public Partners`
- `Public Documentation`
- `Public Lead Generation`
- `Public Health`

---

## API Versioning

Current version: **v1** (prefix: `/api/v1/public/`)

Future versions will use `/api/v2/public/` without breaking existing clients. Version is also returned in:
- Health endpoint: `"version": "v1"`
- OpenAPI schema: `SPECTACULAR_SETTINGS["VERSION"]`

---

## Error Responses

All errors return a consistent JSON structure:

```json
{
  "errors": {
    "field_name": ["Error message."],
    "non_field_errors": ["..."]
  }
}
```

**HTTP status codes:**
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created (lead captured) |
| 400 | Validation error |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Website SDK Integration

The TypeScript SDK in `Cybercom-Website/src/lib/api/` calls these endpoints directly:

```typescript
// Products
GET  /api/v1/public/products/             → productsApi.list()
GET  /api/v1/public/products/{slug}/      → productsApi.get(slug)
GET  /api/v1/public/products/?is_featured=true → productsApi.featured()

// Industries
GET  /api/v1/public/industries/           → industriesApi.list()
GET  /api/v1/public/industries/{slug}/    → industriesApi.get(slug)

// Demo
POST /api/v1/public/demo-request/         → demoApi.submit(request)

// Contact
POST /api/v1/public/contact/             → contactApi.send(message)
POST /api/v1/public/contact/newsletter/  → contactApi.subscribeNewsletter(email)

// Partners
GET  /api/v1/public/partners/            → partnersApi.list()
POST /api/v1/public/partners/apply/      → partnersApi.submitApplication(data)

// Documentation
GET  /api/v1/public/documentation/          → docsApi.listSections()
GET  /api/v1/public/documentation/search/  → docsApi.search(query)
GET  /api/v1/public/documentation/{slug}/  → docsApi.getSection(slug)
```

---

## Django Admin

The following content types are manageable via Django admin at `/admin/`:

| Model | Admin Class | Notes |
|-------|-------------|-------|
| `ProductListing` | `ProductListingAdmin` | Rich fieldsets, prepopulated slug |
| `Industry` | `IndustryAdmin` | M2M product selector |
| `CaseStudy` | `CaseStudyAdmin` | M2M product selector |
| `DemoRequest` | `DemoRequestAdmin` | Read-only metadata fields; status editable |
| `ContactMessage` | `ContactMessageAdmin` | Read-only metadata; status editable |
| `PartnerListing` | `PartnerListingAdmin` | Partner directory management |
| `PartnerApplication` | `PartnerApplicationAdmin` | Review queue |
| `DocumentationSection` | `DocumentationSectionAdmin` | Inline doc items |
| `NewsletterSubscription` | `NewsletterSubscriptionAdmin` | Status management |
| `WebsiteApiLog` | `WebsiteApiLogAdmin` | Read-only; no add/change/delete |

---

## Running Tests

```bash
cd backend
python manage.py test products.website.tests --settings=core.settings_test
```

**Test coverage:**
- 35 test cases across 8 test classes
- Products: list, filter, search, detail, unpublished hidden
- Industries: list, featured filter, detail
- Case studies: list, filter, detail
- Partners: list, filter, application submit, GDPR validation
- Documentation: sections, detail with items, search, search validation
- Demo requests: valid submit, GDPR, product interests, disposable email, status endpoint, DB persistence
- Contact: valid submit, message length, status endpoint, DB persistence
- Newsletter: subscribe, duplicate, GDPR validation
- Models: auto reference numbers, immutable log

---

## Data Models Summary

| Table | Description |
|-------|-------------|
| `website_product_listings` | Marketing product catalog |
| `website_industries` | Industry verticals |
| `website_case_studies` | Customer success stories |
| `website_demo_requests` | Demo request leads |
| `website_contact_messages` | Contact enquiries |
| `website_partner_listings` | Public partner directory |
| `website_partner_applications` | Partner program applications |
| `website_doc_sections` | Documentation sections |
| `website_doc_items` | Individual doc pages |
| `website_newsletter_subscriptions` | Newsletter sign-ups |
| `website_api_logs` | Analytics log (immutable) |

---

## Deployment Checklist

1. Run migration: `python manage.py migrate website`
2. Configure throttle env vars
3. Seed initial content (product listings, industries) via Django admin
4. Add `CORS_ALLOWED_ORIGINS` to include `https://www.cy-com.com`
5. Configure nginx to forward `X-Forwarded-For` for accurate IP throttling
6. Set `THROTTLE_*` env vars for production limits
7. Enable Redis: required for rate limiting (`CACHES["default"]` with Redis backend)
8. Verify Swagger UI at `/api/docs/` shows all `Public*` tag groups
