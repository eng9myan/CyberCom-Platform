# CyMed Gap Matrix

This document outlines the clinical, integration, and operational capability gaps identified between **CyMed** and established legacy EHR competitors (Epic, Oracle Health, TrakCare), providing technical mitigation strategies.

## Gaps & Mitigations Matrix

| Category | Gap Identified | Legacy Benchmark | Risk Level | Mitigation Strategy | Target Release |
|---|---|---|---|---|---|
| **Specialty Workflows** | Lack of deep specialized oncology chemotherapy regimens and obstetrics/labor tracking. | Epic *Stork* (OB) & *Beacon* (Oncology). | Medium | Implement dynamic layout builders using JSON Schema templates to construct specialty worksheets. | Program 3 (Phase 3.2) |
| **Medical Device Ingress**| No native serial driver library for legacy bedside monitors and ventilators. | Cerner CareAware Device Connection. | High | Partner with external capsule technology vendors or deploy local IoT serial-to-IP hardware bridges. | Program 4 (Phase 4.1) |
| **PACS / Imaging** | Direct DICOM pixel storage is out-of-scope; study referencing only. | Integrated PACs archives in major systems. | Low | Configure external hospital PACS connection hooks via DICOMweb (QIDO/WADO) in `CyIntegrationHub`. | Program 4 (Phase 4.1) |
| **Blood Bank & CSSD** | Missing critical sterilization workflow logs and blood product tagging. | Fully native sub-modules in TrakCare and Epic. | Medium | Design a generic state-machine workflow module in the `CyMed` Bed & Ward service to track sterilized kits and blood inventory. | Program 3 (Phase 3.3) |
| **Revenue Cycle (RCM)** | Claims reconciliation and adjudications require external clearing houses. | Integrated enterprise RCM suites. | High | Build dedicated export pipelines conforming to local Middle East X12/EDI claims specifications via `CyIntegrationHub`. | Program 4 (Phase 4.2) |
| **Clinical Decision Support (CDS)**| Real-time CDS alerts rely on asynchronous `CyAI` execution. | Direct synchronous SQL triggering on database transaction. | Medium | Use cached local CDS tables in Redis for sub-50ms check speeds during order entries (CPOE). | Program 6 (Phase 6.1) |

---

## Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial CyMed Gap Matrix | Enterprise Architect |
