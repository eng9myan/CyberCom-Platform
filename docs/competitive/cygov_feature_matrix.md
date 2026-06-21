# CyGov Feature Matrix

This matrix compares the civic, regulatory, and public-sector permitting features of **CyGov** against leading global digital government models and platforms: **Singapore (Singpass / LifeSG)**, **Estonia (e-Estonia / X-Road)**, and standard public-sector ERP engines.

## Feature Comparison Matrix

| Domain / Feature | CyGov | Singapore | Estonia | Public-Sector ERP |
|---|---|---|---|---|
| **Citizen Services Portal** | Yes | Yes (LifeSG) | Yes | Yes (Basic) |
| **Business Licensing** | Yes (BPMN) | Yes (GoBusiness) | Yes | Yes |
| **Municipal Permits** | Yes (BPMN) | Yes | Yes | Yes |
| **Citizen Registry** | Yes (Citizen SoR) | Yes (MyInfo) | Yes (Pop Register)| Yes |
| **Public Inspections** | Basic | Yes | Yes | Yes |
| **Revenue / Utility Collect** | Yes (Sadad / bank)| Yes | Yes | Yes |
| **e-ID / Identity Wallet** | Yes (UAE PASS/Sanad)| Yes (Singpass) | Yes (eID) | External |
| **Mobile Citizen Wallet** | Yes (React Native) | Yes | Yes | No |
| **National Registry Sync** | Yes (mTLS APIs) | Yes | Yes | External |
| **Interoperability Standard** | Kafka / REST | APIs | Yes (X-Road) | HL7 / File transfer |
| **WORM Audit Trail** | Yes (ADR-0028) | Yes | Yes | Basic |
| **Sovereign Isolation** | Yes (Air-Gap profile)| Yes | Yes | Mod |
| **Workflow Engine** | BPMN (Camunda) | Custom | Yes | Yes |

---

## Key Legend
*   **Yes:** Natively supported in the core platform.
*   **Basic:** Standard form submissions, lacking automated field validations or offline verification.
*   **Mod:** Configured based on cloud parameters.
