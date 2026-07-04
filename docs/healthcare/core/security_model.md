# Security Model & Break Glass Architecture

## 1. Overview
The CyMed Core Clinical Platform implements a zero-trust clinical security model. It secures patient data through strict Multi-Tenant Isolation, Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC), automated auditing, and a secure **Break Glass** mechanism for clinical emergencies.

## 2. Multi-Tenant Isolation (RLS)
*   **Row-Level Security (RLS)**: The database enforces tenant isolation using `tenant_id` columns present on all tables. 
*   **Thread-Local Scoping**: Every incoming API request passes through `TenantIsolationMiddleware`, extracting the tenant ID from Keycloak JWT claims and applying it as a session-level configuration to prevent query cross-talk.

## 3. RBAC & Clinical Roles
The platform defines eight core clinical and administrative security roles:
1.  **Physician**: Full read/write access to patient charts, prescriptions, and diagnosis records.
2.  **Nurse**: Read access to patient charts; write access to vitals, intake records, and care tasks.
3.  **Pharmacist**: Read/write access to orders and prescriptions; read access to patient clinical flags.
4.  **Radiologist**: Read/write access to imaging orders and radiographic reports.
5.  **Technician**: Read access to orders; write access to laboratory/diagnostic observations.
6.  **Care Coordinator**: Read/write access to CarePlans, scheduling, and registries.
7.  **Administrator**: Read/write access to facilities, organizations, and provider schedules.
8.  **Auditor**: Read-only access to audit logs and system configuration; no clinical modification.

## 4. Break Glass (Emergency Access Override)
In life-safety emergencies (e.g., patient unconscious in ER), clinicians can override standard access barriers using the Break Glass protocol.

```
       ┌──────────────────────┐
       │ Clinical Emergency  │
       └──────────┬───────────┘
                  │ (Triggers)
                  ▼
       ┌──────────────────────┐
       │   POST /breakglass   │
       │ (Log justification)  │
       └──────────┬───────────┘
                  │ (Atomic Action)
                  ▼
       ┌─────────────────────────────────────────────────────────────┐
       │ 1. Create BreakGlassAccess Record (platform.cyidentity)     │
       │ 2. Publish cymed.breakglass.used OutboxEvent                │
       │ 3. Return Temporary Auth Session (e.g., 15-minute expiry)   │
       └─────────────────────────────────────────────────────────────┘
```

### 4.1 Implementation Logic
1.  **Reason & Justification Capture**: The clinician submits a request containing the patient's ID, override type (clinical), and a descriptive justification.
2.  **Auto Audit Logging**: The system records the request, clinician ID, patient ID, and timestamp in the `BreakGlassAccess` audit table.
3.  **Security Alert Event**: A security alert event (`cymed.breakglass.used`) is immediately written to the transactional outbox (`cymed.security.events`) for notification dispatch to compliance officers.
4.  **Session Expiry**: The override session is valid only for a short window (defaults to 15 minutes), after which the temporary access token expires automatically.

## 5. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/clinical/breakglass/` | POST | Request emergency access override (publishes `cymed.breakglass.used`) |
