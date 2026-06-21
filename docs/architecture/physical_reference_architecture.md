# Physical Reference Architecture

## 1. Physical Infrastructure Overview

The Physical Reference Architecture details the hardware, virtualization, cluster layouts, and networking designs required to host the CyberCom Platform across SaaS, Private Cloud, and Sovereign On-Premise environments.

```mermaid
flowchart TD
    subgraph Public Internet / Partner WAN
        CLIENTS["Web/Mobile/B2B Clients"]
    end

    subgraph Edge Layer (DMZ - Cloudflare or F5 BIG-IP)
        WAF["WAF / DDOS Protection"]
        LB["Global Server Load Balancer (GSLB)"]
    end

    subgraph Virtual Private Cloud / Private Network Boundary
        subgraph Kubernetes Cluster (Prod-System)
            subgraph Public Node Pool
                INGRESS["Ingress Controller (Kong / Envoy)"]
            end

            subgraph Private Node Pool (Core Services)
                MED["CyMed Pods"]
                COM["CyCom Pods"]
                ID["CyIdentity Pods"]
                INT["CyIntegrationHub Pods"]
            end
        end

        subgraph Middleware & Streaming Cluster
            KAFKA_P1["Kafka Broker (Zone A)"]
            KAFKA_P2["Kafka Broker (Zone B)"]
            ZOOKEEPER["ZooKeeper/Raft Cluster"]
        end

        subgraph Secure Data & Vault Subnet (No Internet Route)
            PG_PRIMARY[("PostgreSQL Primary (Active)")]
            PG_REPLICA[("PostgreSQL Replica (Hot standby)")]
            KMS["Vault HSM / KMS Appliance"]
            REDIS[("Redis Cache Cluster (Active-Active)")]
        end
    end

    CLIENTS --> WAF
    WAF --> LB
    LB --> INGRESS
    INGRESS --> MED & COM & ID & INT
    MED & COM & ID & INT --> REDIS
    MED & COM & ID & INT --> PG_PRIMARY
    PG_PRIMARY -.->|Streaming Replication| PG_REPLICA
    MED & COM & ID & INT --> KAFKA_P1 & KAFKA_P2
    ID --> KMS
```

---

## 2. Networking and Segregation

CyberCom mandates physical and logical network isolation to comply with healthcare (HIPAA) and civic data requirements:

### 2.1 Demilitarized Zone (DMZ)
*   **Ingress Security:** Direct connections from the internet terminate at the Edge DMZ.
*   **WAF Integration:** All HTTP/HTTPS traffic must pass through a Web Application Firewall (WAF) validating SSL/TLS (minimum TLS 1.3) and running DDoS mitigations.
*   **IP Whitelisting:** External clinic API integrations (e.g., FHIR endpoints) are gated behind IP whitelists and mutual TLS (mTLS) at the Edge.

### 2.2 Internal Subnet Segmentation
*   **Public Node Pool Subnet:** Houses only ingress controllers. Public IP allocation is strictly limited to these edge gateway nodes.
*   **Private Node Pool Subnet:** Houses application workload Pods. No public IP routing exists.
*   **Secure Data Subnet:** Houses databases, Kafka brokers, and cryptographic key stores. Traffic into this subnet is restricted via Network Security Groups (NSGs) allowing incoming connections only from specific application node IPs on designated ports (e.g., 5432 for Postgres, 9092 for Kafka).

---

## 3. Compute and Cluster Topology

CyberCom is container-native, targeting Kubernetes (AKS, GKE, EKS, or Anthos/OpenShift for private deployments) as the reference orchestration platform:

### 3.1 Node Pool Organization
1.  **System Pool:** For core cluster utilities (e.g., CoreDNS, ingress controllers, monitoring agents).
2.  **Application Pool:** For stateless microservices (`CyMed`, `CyCom`, `CyShop`). Minimum node count is 3 (deployed across 3 availability zones).
3.  **Data Pool (Optional):** If running stateful middleware in-cluster. Recommended practice is to run Postgres and Kafka on managed cloud instances or dedicated bare-metal VMs outside the main application Kubernetes cluster.

### 3.2 Hardware Sizing Guidelines
*   **Stateless App Nodes:** 8 vCPU, 32GB RAM (Compute optimized).
*   **Database Nodes:** 32 vCPU, 128GB RAM (Memory optimized, NVMe local storage for transaction logs).
*   **Kafka Broker Nodes:** 16 vCPU, 64GB RAM (Storage optimized, dedicated IOPS-guaranteed volumes).

---

## 4. Key Management and HSM Physical Layout

Cryptographic operations for `CyIdentity` (token signing) and database engines (Transparent Data Encryption - TDE) are handled by a dedicated Hardware Security Module (HSM) or cloud KMS:
*   **SaaS deployments:** FIPS 140-3 Level 3 Cloud KMS (AWS KMS, GCP Cloud KMS, Azure Key Vault HSM).
*   **Sovereign/On-Premise deployments:** Physical HSM appliances (e.g., Thales Luna HSM) integrated via PKCS#11 inside the Vault containers.

---

## 5. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Physical Reference Architecture | Enterprise Architect |
