# Release Architecture

This document defines the deployment release strategies, traffic routing rules, feature flag configurations, and automated rollback triggers for the CyberCom platform.

---

## 1. Zero-Downtime Deployment Strategies

To update application pods without dropping transactions, CyberCom mandates two release strategies based on service criticality:

```mermaid
graph LR
    subgraph Blue-Green (Core Apps / Databases)
        Active["Active Environment (Blue)<br/>100% Traffic"]
        Standby["Standby Environment (Green)<br/>0% Traffic"]
        Router["Argo Rollouts Router"]
    end

    subgraph Canary (Stateless Edge Services)
        Canary_Active["Canary Pods<br/>10% Traffic"]
        Stable_Active["Stable Pods<br/>90% Traffic"]
    end

    Router --> Active
    Router -.->|Deploy & Test| Standby
```

### 1.1 Blue-Green Deployment
*   **Target:** Core relational databases, stateful integration queues, and foundational IAM systems (`CyIdentity`).
*   **Execution:** Argo Rollouts provisions a complete new version environment (Green) alongside the running environment (Blue). Automated smoke tests validate the Green pods. Once green verification succeeds, the ingress router shifts 100% of traffic to Green, leaving Blue active for 1 hour for immediate rollback.

### 1.2 Canary Releases
*   **Target:** Stateless edge APIs, portal BFFs, and mobile-supporting gateways.
*   **Execution:** Argo Rollouts gradually shifts traffic to the new version:
    1.  Phase 1: Route 10% traffic to Canary pods. Hold for 15 minutes.
    2.  Phase 2: Route 50% traffic. Hold for 15 minutes.
    3.  Phase 3: Route 100% traffic. Terminate old replicas.

---

## 2. Feature Flag Management (Unleash)

To decouple code deployments from feature releases:
*   **Technology:** **Unleash** (self-hosted in-cluster or SaaS).
*   **Code Standard:** Feature logic is wrapped in conditional flags:
    ```go
    if unleash.IsEnabled("new-clinical-calculator", context) {
        return executeNewCalculator()
    }
    return executeLegacyCalculator()
    ```
*   **Flag Expiry:** Feature flags must be removed from the code within 30 days after a feature achieves 100% release target to prevent technical debt.

---

## 3. Automated Rollback Triggers

During Canary or Blue-Green cycles, the Prometheus Metric Template monitors health metrics. A rollback is triggered automatically if:
1.  **Error Rate spikes:** HTTP 5xx errors or gRPC non-zero statuses exceed 1% of total requests over a 2-minute window.
2.  **Latency degrades:** p99 response times spike above 1.5 seconds.
3.  **Pod crashes:** The K8s deployment logs restart loops or OOMKilled events.
4.  **Rollback execution:** Argo Rollouts immediately reverts traffic routing to the previous stable release, notifying dev teams.

---

## 4. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Release Architecture | Enterprise Architect |
