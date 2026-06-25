# CyberCom Platform — White-Label Capability Report

**Generated:** 2026-06-25  
**Scope:** Branding, theming, domain, localization, and OEM capabilities  
**Status:** Production-Ready

---

## 1. White-Label Overview

CyberCom Platform provides full white-label capability — every customer-facing touchpoint can be fully rebranded without code changes. This enables:

- **OEM partnerships:** Resellers can rebrand the entire platform under their own name
- **Enterprise branding:** Large hospitals can deploy with their own identity
- **Government branding:** MOH deployments appear as national health platforms
- **Partner apps:** ISV partners can embed CyberCom modules under their own brand

---

## 2. Branding Data Model

```
Brand
├── code (unique — e.g., "ksu_health", "moh_jordan", "acme_hospital")
├── display_name ("King Saud University Health")
├── legal_name, support_email, support_phone
├── is_active
│
├── BrandTheme (1:1 or 1:Many per language)
│   ├── primary_color, secondary_color, accent_color
│   ├── background_color, surface_color, text_color, text_secondary_color
│   ├── font_family_primary, font_family_secondary
│   ├── border_radius_px (for component rounding)
│   ├── custom_css (overrides for any remaining defaults)
│   └── is_dark_mode (boolean)
│
├── BrandAsset (logo, favicon, splash, email_header, print_header)
│   ├── asset_type, file_url, alt_text
│   ├── width_px, height_px
│   └── device_type (desktop/tablet/mobile/print)
│
├── BrandDomain (many per brand)
│   ├── domain (e.g., "health.ksu.edu.sa")
│   ├── is_primary
│   └── ssl_certificate_arn
│
└── BrandLocalization (per language_code)
    ├── app_name ("نظام الصحة الجامعي")
    ├── tagline, login_welcome_message
    ├── footer_text, privacy_policy_url, terms_url
    └── support_url
```

---

## 3. Runtime Brand Resolution (BrandingMiddleware)

```python
class BrandingMiddleware:
    def __call__(self, request):
        # Priority 1: X-Brand-Code header (API clients / mobile apps)
        brand_code = request.headers.get("X-Brand-Code")
        if brand_code:
            cache_key = f"brand:code:{brand_code}"
        else:
            # Priority 2: Domain lookup
            host = request.get_host().split(":")[0]
            cache_key = f"brand:domain:{host}"
            brand_domain = BrandDomain.objects.select_related("brand").filter(
                domain=host, brand__is_active=True
            ).first()
            if brand_domain:
                brand_code = brand_domain.brand.code

        brand = cache.get(cache_key)
        if not brand and brand_code:
            brand = Brand.objects.prefetch_related(
                "themes", "assets", "localizations", "domains"
            ).filter(code=brand_code, is_active=True).first()
            if brand:
                cache.set(cache_key, brand, 300)  # 5-minute TTL

        request.brand = brand
        return self.get_response(request)
```

---

## 4. API Response Branding

Every API response that serves frontend metadata includes brand context:

```json
{
  "meta": {
    "brand": {
      "code": "ksu_health",
      "display_name": "King Saud University Health",
      "theme": {
        "primary_color": "#006400",
        "secondary_color": "#C8A951",
        "font_family_primary": "IBM Plex Sans Arabic"
      },
      "app_name": "نظام الصحة الجامعي",
      "logo_url": "https://cdn.ksu.edu.sa/cybercom/logo.svg"
    }
  },
  "data": { ... }
}
```

---

## 5. White-Label Scope

| Touchpoint | White-Label Support | Method |
|-----------|--------------------|----|
| Web application | Full | BrandTheme CSS variables |
| Mobile app (iOS/Android) | Full | API-driven theme JSON |
| Email notifications | Full | BrandAsset (email_header), BrandLocalization |
| SMS notifications | Full | BrandLocalization (sender name) |
| PDF reports | Full | BrandAsset (print_header), color scheme |
| Patient Portal | Full | Per-brand URL + theme |
| Provider Portal | Full | Per-brand URL + theme |
| API Swagger docs | Full | drf-spectacular custom branding |
| Login page | Full | BrandLocalization (welcome message) |
| Error pages | Full | BrandLocalization copy |
| OpenAPI schema title | Full | Dynamic per brand |

---

## 6. Multi-Language & RTL Support

- Languages supported: English (en), Arabic (ar), French (fr), Turkish (tr)
- Arabic is RTL — frontend detects `lang_code` from BrandLocalization and applies `dir="rtl"`
- Font selection: Arabic brands default to "IBM Plex Sans Arabic" / "Noto Sans Arabic"
- Numeric locale: Arabic brands use Eastern Arabic numerals where appropriate
- Date format: ISO 8601 in API, localized display in BrandLocalization templates

---

## 7. OEM/Partner White-Label Workflow

1. Partner signs OEM agreement
2. `Brand` record created in `commercial.branding`
3. Partner provides assets (logos, colors, fonts) → stored in `BrandAsset`
4. `BrandDomain` record added with SSL certificate
5. `TenantFeature` grants partner's tenants access to their brand
6. `BrandingMiddleware` auto-resolves on all requests to partner domain
7. All customer-facing APIs return partner brand context

Time to activate a new white-label: < 30 minutes (configuration only, no code deployment).

---

## 8. White-Label Limitations (by design)

- Backend API responses are CyberCom-branded (JSON schema, error messages) — customizable via BrandLocalization but not full suppression
- Database table names and internal event types are non-brandable (infrastructure concern, not user-facing)
- OpenAPI schema includes "CyberCom" in description — overridable via `SPECTACULAR_SETTINGS` per deployment

---

*Report generated by CyberCom Platform v1.0 Commercialization Wave*
