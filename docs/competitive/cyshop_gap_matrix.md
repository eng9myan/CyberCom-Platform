# CyShop Gap Matrix

This document outlines the operational, functional, and integration gaps identified between **CyShop** and established e-commerce platforms (Shopify, Oracle Retail), providing technical mitigations.

## Gaps & Mitigations Matrix

| Category | Gap Identified | Legacy Benchmark | Risk Level | Mitigation Strategy | Target Release |
|---|---|---|---|---|---|
| **App Ecosystem** | Lacks a public developer app store for one-click third-party widget installs. | Shopify App Store. | High | Expose standard OpenAPI webhooks and frontend micro-frontend container slots for custom integrations. | Program 4 (Phase 4.2) |
| **Loyalty Engine** | Missing complex cross-retail points campaigns (e.g. spend points at hospital clinic, redeem at pharmacy). | Oracle Loyalty Cloud. | Low | Extend `CyShop` billing to track global tenant loyalty accounts via relational tables. | Program 4 (Phase 4.3) |
| **Multi-Vendor Marketplace**| Inability to host independent sellers on a unified checkout basket. | Shopify Marketplaces / Mirakl. | Medium | Build vendor-routing splits in the `CyShop` Fulfillment Service to divide payments dynamically. | Program 4 (Phase 4.3) |
| **Automated Returns** | Retailing returns require manual support console entries. | Lightspeed Retail. | Low | Develop a self-service customer returns portal utilizing standard shipping APIs. | Program 4 (Phase 4.2) |

---

## Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial CyShop Gap Matrix | Enterprise Architect |
