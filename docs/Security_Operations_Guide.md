# Security Operations Guide

This guide details security operations, incident alert parameters, and regulatory compliance mapping for Security Operators.

---

## 1. Compliance Controls Mapping

CyIdentity, CyIntegration Hub, CyData, and CyAI comply with global and national regulatory baselines:

| Regulatory Code | Compliance Area | Control Mapping in CyberCom |
| :--- | :--- | :--- |
| **SOC2 CC6.1** | Logical Access Control | keycloak role-mappings + `IsPlatformAdmin` DRF view permissions. |
| **HIPAA §164.312** | Encryption & Integrity | AES-256 at-rest, TLS 1.3 in-transit, and Event payload signing. |
| **GDPR Art. 32** | Security of Processing | Tenant isolation middleware and database RLS. |
| **PDPL Art. 15** | Data Residency | Citizen profile storage region checks (`data_residency_region = "me-central-1"`). |
| **NCA ECC-2** | Cybersecurity Governance | Decoupled policy evaluations via OPA and Vault secret isolation. |
| **JCI MOI.2** | Clinical Record Integrity | Clinical records legal hold models and immutable write-once audit logs. |

---

## 2. Security Alerts & Runbooks

Operators must monitor the platform SIEM (Grafana Loki / Prometheus) for the following indicators:

### 2.1 Unauthorized Login Spikes (`CyIdentityLoginFailureRateHigh`)
*   **Trigger:** If login failures spike by > 10% in 5 minutes.
*   **Runbook:** Check IP addresses for brute force signatures. User profiles will automatically lock for 15 minutes if failure count reaches 5.

### 2.2 Break-Glass Activation Alert (`CyIdentityBreakGlassActivated`)
*   **Trigger:** Triggered when emergency override status becomes active.
*   **Runbook:** Contact the requesting user. Verify a corresponding disaster or clinical emergency has occurred. If no emergency is active, revoke access immediately through the admin portal.

### 2.3 Vault Access Denial (`VaultConnectionUnreachable`)
*   **Trigger:** Triggered if services fail to connect to the Vault server.
*   **Runbook:** Check Kubernetes secrets operator status and verify pod vault role bindings.
