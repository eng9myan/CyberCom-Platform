# CyIdentity Operations Guide

This guide details deployment setups, monitoring, background tasks, backup strategies, and troubleshooting workflows for the **CyIdentity Control Plane**.

---

## 1. System Requirements & Environment Variables

Ensure the following variables are configured in the platform environment:

*   `KEYCLOAK_ENABLED`: Set to `True` in production. (Set to `False` to run unit tests offline).
*   `CYIDENTITY_ISSUER`: Base URL of the Keycloak cluster (e.g. `https://identity.cybercom.io/realms/master`).
*   `CYIDENTITY_JWKS_URI`: JWKS certs location (e.g. `https://identity.cybercom.io/realms/master/protocol/openid-connect/certs`).
*   `KEYCLOAK_ADMIN`: Administrator username for Keycloak Admin API interactions.
*   `KEYCLOAK_ADMIN_PASSWORD`: Administrator password.
*   `JWT_PUBLIC_KEY`: RSA-256 public key used to verify signatures locally.

---

## 2. Background Task Scheduling (Celery)

CyIdentity relies on Celery workers to maintain directory hygiene. Ensure a celery beat scheduler is running.

### 2.1 Schedule Configurations
Add the following schedules to your Django-Celery settings:

1.  **Enforce Idle Timeout (`enforce_idle_timeout_task`)**
    *   **Interval:** Every 5 minutes (`*/5 * * * *`).
    *   **Purpose:** Queries sessions where `last_activity_at` exceeds the 30-minute threshold and transitions status to `idle_timeout`.
2.  **Expire Break-Glass Access (`expire_break_glass_task`)**
    *   **Interval:** Every 1 minute (`* * * * *`).
    *   **Purpose:** Sweeps all active emergency break-glass records that have passed their expiration timestamp (`expires_at`) and marks them `expired`.

### 2.2 Worker Command
Start the Celery worker with:
```bash
celery -A core worker -l info --beat
```

---

## 3. Monitoring & Metrics

### 3.1 Prometheus Scraping
Configure your Prometheus agent to scrape:
*   **Path:** `/api/v1/identity/metrics`
*   **Scrape Interval:** 15s

### 3.2 Key Alerting Rules
*   `CyIdentityLoginFailureRateHigh`: Triggered if `cybercom_identity_login_failure_total` increases by > 10% within 5 minutes. Represents potential brute force or directory issues.
*   `CyIdentityBreakGlassActivated`: Triggered when `cybercom_identity_break_glass_activated_total` increases. Serves as a high-severity operational notification.
*   `CyIdentityJWKSServeStale`: Triggered if `cybercom_identity_jwks_serve_stale_total` is > 0. Indicates Keycloak is down or unreachable, causing the cache fallback to serve stale signatures.

---

## 4. Backup & Restore Procedures

### 4.1 Database Backup
Perform a daily pg_dump of PostgreSQL databases. Pay special attention to the following platform schema tables:
*   `platform_identity_realms`
*   `platform_realm_configurations`
*   `platform_user_profiles`
*   `platform_break_glass_accesses`
*   `platform_login_audits`

### 4.2 Keycloak Realms Backup
Store Git-versioned JSON exports of all custom realms. Use the Keycloak admin export tool or trigger the export during cluster startup:
```bash
/opt/keycloak/bin/kc.sh export --dir /var/backup/keycloak/realms/
```

---

## 5. Troubleshooting Runbooks

### 5.1 Issue: ConnectError to Keycloak
*   **Symptoms:** Celery task failing with `httpx.ConnectError: [WinError 10061]` or connection refused.
*   **Fix:**
    1. Check Keycloak service health.
    2. Confirm network routing from backend containers to the Keycloak service endpoint.
    3. Verify `CYIDENTITY_ISSUER` port and protocol configurations match exactly.

### 5.2 Issue: Outbox Emit Failures
*   **Symptoms:** Warning log `outbox_emit_failed` in logs.
*   **Fix:**
    1. Confirm the `OutboxEvent` database table is not locked.
    2. Verify the database has not run out of capacity. Since the outbox pattern is transactional, failure to write to the outbox rolls back model creations.

### 5.3 Issue: User Lockouts
*   **Symptoms:** User gets account locked state, `UserProfile.locked_until` is populated.
*   **Fix:** 
    1. Access the Admin Portal, select the **Users** tab.
    2. Search for the username.
    3. Click **Unlock**. This clears the lock timestamp and resets the failure counter to 0.
