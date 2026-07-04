# CyShop Feature Matrix

This matrix compares the e-commerce, Point of Sale (POS), and transaction features of **CyShop** against major global commerce platforms: **Shopify**, **Lightspeed**, **Oracle Retail**, **Microsoft Dynamics Commerce**, and **Odoo Retail**.

## Feature Comparison Matrix

| Domain / Feature | CyShop | Shopify | Lightspeed | Oracle Retail | Dynamics Commerce | Odoo Retail |
|---|---|---|---|---|---|---|
| **E-Commerce Storefront** | Yes (React) | Yes (Liquid) | Yes | Yes | Yes | Yes (Website) |
| **Point of Sale (POS)** | Yes (Web) | Yes (Shopify POS)| Yes (POS) | Yes | Yes | Yes (OWL) |
| **Loyalty & Rewards** | Basic | Yes (Apps) | Yes | Yes | Yes | Yes |
| **B2B Marketplace** | Basic | Yes (Shopify B2B)| No | Yes | Yes | Basic |
| **Subscriptions Engine** | Native (SaaS) | Apps | No | Mod | Yes | Yes |
| **Customer Engagement** | SMS/Email | Apps | Yes | Yes | Yes | Yes |
| **Omnichannel Inventory** | Yes (Kafka sync) | Yes | Yes | Yes | Yes | Yes |
| **Franchise Multi-Owner** | Yes | Plus | Yes | Yes | Yes | Yes |
| **Mobile POS (mPOS)** | React Native | Yes | Yes | Yes | Yes | No |
| **Promotions & Coupons** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Gift Cards** | Yes | Yes | Yes | Yes | Yes | Yes |
| **PCI-DSS Compliance** | Tokenized | Native | Native | Native | Native | Mapped |

---

## Key Legend
*   **Yes:** Fully supported natively.
*   **Basic:** Standard functions (e.g., points logging, lacking complex reward tiers or automated gift rules).
*   **Mod:** Supported but requires configuration.
*   **Apps:** Relies heavily on third-party app stores.
