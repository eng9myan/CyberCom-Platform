# CyMed White Label Branding Framework

## Capabilities

- Custom logo (light/dark/icon variants)
- Custom color palette (primary, secondary, accent, background)
- Custom typography (heading font, body font)
- Custom domain with SSL
- Custom login screens
- Localized app name, tagline, support contacts
- Arabic (RTL) and English support mandatory

## Models

| Model | Description |
|-------|-------------|
| `Brand` | Top-level brand identity per customer |
| `BrandTheme` | Color and font overrides |
| `BrandAsset` | Logo, splash screen, email header URLs per language |
| `BrandDomain` | Custom domain mapping with SSL status |
| `BrandLocalization` | Language-specific strings (name, tagline, login copy) |

## Arabic (RTL) Support

`BrandLocalization.is_rtl = True` signals frontend to apply RTL layout. All branding strings support Arabic Unicode natively through Django's UTF-8 storage.

## Brand Resolution

```python
from products.cymed.commercial.branding.services import BrandingService

brand = BrandingService.get_brand_for_domain("clinic.hospital.sa")
config = BrandingService.get_full_brand_config(brand, language_code="ar")
```

Returns complete brand config:
```json
{
  "brand_code": "hospital_sa",
  "brand_name": "مستشفى الملك فهد",
  "theme": {"primary_color": "#005A9C", "heading_font": "Cairo", ...},
  "localization": {"app_name": "نظام المستشفى", "is_rtl": true, ...},
  "assets": {"logo_light": {"url": "...", "alt": "..."}}
}
```

## API Endpoints

```
GET  /api/v1/commercial/branding/brands/
POST /api/v1/commercial/branding/brands/
POST /api/v1/commercial/branding/themes/
POST /api/v1/commercial/branding/domains/
POST /api/v1/commercial/branding/localizations/
```
