# CyGov Gap Matrix

This document outlines the regulatory, operational, and integration gaps identified between **CyGov** and leading digital government platforms (Estonia, Singapore), detailing technical mitigations.

## Gaps & Mitigations Matrix

| Category | Gap Identified | Global Benchmark | Risk Level | Mitigation Strategy | Target Release |
|---|---|---|---|---|---|
| **Data Exchange Bus** | Lacks an encrypted, peer-to-peer, sovereign data-exchange highway between public agencies. | Estonia X-Road (Security server architecture). | High | Deploy dedicated security server nodes in `CyIntegrationHub` with Mutual TLS (mTLS) and digital signatures for cross-agency calls. | Program 4 (Phase 4.3) |
| **Inspection Field App** | Missing a dedicated, offline-first app for municipal building and health inspectors. | Singapore LifeSG / Agency portals. | Medium | Build an offline-first inspection utility module inside the `CyCitizen` mobile React Native codebase. | Program 5 (Phase 5.2) |
| **National Smart Contracts**| No native support for blockchain-backed land deed verification or title changes. | Estonia Blockchain (KSI). | Low | Implement SHA-256 digital document signatures and append-only database logs in PostgreSQL. Defer actual distributed ledger engines. | Program 3 (Phase 3.3) |
| **Revenue Clearance** | Direct connection to legacy central state treasuries requires custom adapters. | Singpass / PayNow integrations. | Medium | Map state payments using local Middle East integrations (e.g. Sadad, eFAWATEERcom) via the `CyIntegrationHub` gateway. | Program 4 (Phase 4.2) |

---

## Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial CyGov Gap Matrix | Enterprise Architect |
