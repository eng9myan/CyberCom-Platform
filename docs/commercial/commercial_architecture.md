# CyMed Commercial Architecture

## Overview

CyMed Commercial Foundation (Program 3.C0) transforms CyMed from a healthcare application into a commercially sellable healthcare platform. The commercial layer wraps all clinical products with licensing, edition management, feature gating, subscription billing, white labeling, and deployment flexibility — without modifying application code.

## Architecture Principles

1. **Zero application-code modification**: Feature access is always resolved through `FeatureFlagService`. Clinical code never contains hardcoded edition checks.
2. **Single commercial foundation**: All future products (Laboratory, Imaging, Pharmacy, Portals, Population Health) inherit the same commercial infrastructure automatically.
3. **Deployment-agnostic**: The same platform runs as SaaS, Private Cloud, Government Cloud, Hybrid, or Air-Gapped using `DeploymentProfile` records.
4. **Multi-tenant by design**: Commercial entities are tenant-scoped via `BaseModel.tenant_id`. Platform-level catalog entries use a sentinel platform tenant UUID.

## Layer Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    API Layer (REST/OpenAPI)                   │
│          /api/v1/commercial/{app}/                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                  Commercial Foundation                        │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │Licensing │  │ Editions │  │ Feature  │  │Subscriptions│  │
│  │ Engine   │  │ Mgmt     │  │  Flags   │  │  Platform   │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ White    │  │Deployment│  │ Product  │  │   Usage     │  │
│  │ Label    │  │ Profiles │  │ Catalog  │  │  Metering   │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│                                                               │
│  ┌──────────┐  ┌──────────┐                                  │
│  │Customer  │  │ Partner  │                                  │
│  │  Mgmt    │  │  Mgmt    │                                  │
│  └──────────┘  └──────────┘                                  │
└──────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│              CyMed Clinical Products                          │
│  CyMed Clinic │ CyMed Hospital │ Lab │ Imaging │ Pharmacy    │
│  Portals │ Population Health                                  │
└──────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│              Platform Foundation (Program 2.x)               │
│  CyIdentity │ Tenant │ Audit │ Events │ Integration │ AI     │
└──────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

| Module | Path | Responsibility |
|--------|------|----------------|
| `licensing` | `commercial/licensing/` | License lifecycle: create, activate, renew, revoke, offline packages |
| `editions` | `commercial/editions/` | Edition catalog, feature entitlements, resource limits, module maps |
| `feature_flags` | `commercial/feature_flags/` | Feature flag evaluation engine with caching |
| `subscriptions` | `commercial/subscriptions/` | Billing plans, subscription lifecycle, invoicing |
| `branding` | `commercial/branding/` | White-label themes, assets, domains, localizations |
| `deployment_profiles` | `commercial/deployment_profiles/` | SaaS/Private/Gov/Hybrid/Air-Gapped profiles |
| `product_catalog` | `commercial/product_catalog/` | Product versioning, license mappings, feature matrix |
| `usage_metering` | `commercial/usage_metering/` | Daily usage snapshots, over-limit alerts |
| `customer_management` | `commercial/customer_management/` | Customer CRM, contracts, deployments, success plans |
| `partner_management` | `commercial/partner_management/` | Reseller/SI/distributor agreements |

## Data Model Relationships

```
Customer ──────── CustomerContract
    │              CustomerDeployment
    │              CustomerSuccessPlan
    │
License ──────── LicenseKey ── LicenseActivation
    │              LicenseFeature
    │              LicenseAudit
    │              LicenseUsage
    │              OfflineActivationPackage
    │
ProductCatalogEntry ── ProductEdition ── EditionFeature
                                         EditionLimit
                                         EditionModule
FeatureFlag ── TenantFeature
               CustomerFeature
               FeatureDependency

Brand ── BrandTheme
         BrandAsset
         BrandDomain
         BrandLocalization

Subscription ── SubscriptionPlan
                SubscriptionUsage
                SubscriptionInvoice
                SubscriptionContract

Partner ── ResellerAgreement
           DistributorAgreement
```
