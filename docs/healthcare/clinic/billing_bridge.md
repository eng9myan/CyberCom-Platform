# Billing Bridge (CyCom ERP Integration)

## 1. Overview
The `billing_bridge` handles financial billing workflows, connecting clinical items (consultations, labs, medications) with corporate accounting systems.

## 2. Models
*   **`ChargeCode`**: Standard billing codes (CPT, national codes) categorized by type.
*   **`PriceList`**: Clinic rate tables mapping codes to specific currencies.
*   **`ClinicService`**: Concrete services combining a charge code, price list, and base price.
*   **`ChargeItem`**: Unbilled or billed items posted to a patient encounter.

## 3. Transactional Outbox & CyCom ERP Ledger Posting
To guarantee transactional reliability:
1. Posting a `ChargeItem` triggers a ledger record creation in `billing_bridge`.
2. The serializer calls a ledger service mapping:
   * Sets `posted_to_erp = True`
   * Generates a transaction reference: `ERP-TX-<random_digits>`
3. Simultaneous event published to outbox: `cymed.clinic.billing.posted`.
4. `CyIntegrationHub` polls outbox events to sync clinical invoices with the corporate `CyCom ERP` finance module.
