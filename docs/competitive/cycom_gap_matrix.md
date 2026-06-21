# CyCom Gap Matrix

This document outlines the business, integration, and functional gaps identified between **CyCom** and established enterprise ERP platforms (SAP, Odoo, Oracle), detailing technical mitigations.

## Gaps & Mitigations Matrix

| Category | Gap Identified | Legacy Benchmark | Risk Level | Mitigation Strategy | Target Release |
|---|---|---|---|---|---|
| **Manufacturing (MRP II)** | Lack of Bill of Materials (BOM) routes and assembly-line scheduling tools. | SAP Production Planning; Odoo Manufacturing. | Low | Focus strictly on service procurement and pharmacy inventories first; defer heavy discrete manufacturing modules. | Program 6 (Phase 6.2) |
| **Sales & CRM** | No lead tracking, pipelines, or customer marketing automation modules. | Dynamics 365 Sales; Odoo CRM. | Medium | Use standard B2B customer tables in `CyShop` for billing profiles; build external CRM webhook connectors in `CyIntegrationHub`. | Program 4 (Phase 4.2) |
| **Advanced Treasury** | Missing foreign exchange hedging and automated inter-company debt settlements. | Oracle Treasury Cloud. | Low | Standardize on multi-currency journal entries; perform complex currency conversions during analytical passes in `CyData`. | Program 3 (Phase 3.3) |
| **Multi-Country Consolidation**| Lack of localized legal templates for corporate structures outside the Middle East (GCC). | SAP Global Trade Services. | Medium | Leverage local accountants to upload custom tax tables; implement regional tax templates dynamically via the `/packages/` config. | Program 3 (Phase 3.2) |
| **Workflow Customization** | Modifying approvals routing requires editing JSON config arrays. | PowerAutomate / OWL visual drag-drop. | Medium | Integrate a lightweight Camunda BPMN workflow container in `CyCom` for visual process designs. | Program 3 (Phase 3.3) |

---

## Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial CyCom Gap Matrix | Enterprise Architect |
