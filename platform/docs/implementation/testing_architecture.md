# Testing Architecture

This document defines the testing pyramid, automated test suites, security validations, and test data generation strategy for the CyberCom platform.

---

## 1. The Testing Pyramid

CyberCom enforces a multi-tier testing strategy to maintain high code quality and prevent regressions:

```
      / \
     /   \     E2E Testing (Playwright / Cypress) - 5%
    /     \
   /-------\
  /         \   Contract & Integration (Pact / Testcontainers) - 25%
 /-----------\
/             \  Unit Testing (Go testing / Jest / PyTest) - 70%
+-------------+
```

---

## 2. Test Execution Tiers

### 2.1 Unit Testing
*   **Technologies:** Standard Go testing packages (Go), Jest/Vitest (TypeScript), PyTest (Python).
*   **Coverage Target:** Minimum **80% line coverage** enforced by build gates in CI pipelines.
*   **Isolation:** External network calls, databases, and message brokers must be mocked.

### 2.2 Integration Testing & Testcontainers
*   **Strategy:** Integration tests spin up real databases and Kafka instances inside Docker containers utilizing **Testcontainers** during test suite setups.
*   **Execution:** Test SQL query plans, Outbox transaction writes, and Schema migrations.

### 2.3 Contract Testing (Pact)
*   **Framework:** **Pact**.
*   **Verification:** Resolves API contract compatibility between frontend consumers and backend providers before merging PRs. Saves contract JSON files to a Pact Broker.

### 2.4 End-to-End (E2E) Testing
*   **Technology:** **Playwright**.
*   **Scope:** Verifies entire multi-tenant onboarding paths, clinical scheduling logins, and commerce checkout carts against staging mirror environments.

---

## 3. Domain-Specific Test Suites

### 3.1 Clinical Workflows (`CyMed`)
*   **Simulated Feeds:** Integration tests mock incoming HL7 ADT message segments via MLLP TCP ports and assert patient profile generation.
*   **Safety Triggers:** Assert that injecting conflicting drug orders into CPOE returns a high-priority warning card from the CDS Hooks simulator.

### 3.2 ERP Workflows (`CyCom`)
*   **Validation:** Simulates invoice matching workflows, asserting that unbalanced General Ledger postings fail to commit.
*   **ZATCA E-Invoicing:** Test clearance pipelines against a ZATCA mock clearance portal, verifying XML signature generation and cryptographic hash chaining.

---

## 4. Test Data Strategy

*   **No Production Data:** Running tests using raw production databases or clinical tables is strictly forbidden.
*   **Seed Generators:** Built-in seed scripts generate realistic, anonymized data (e.g., generating mock patients with structured problems, mock suppliers with tax IDs) to populate development and QA databases.

---

## 5. Security & Performance Testing

*   **SAST & DAST:** Static Application Security Testing (SonarQube/Trivy container scanning) runs in PR checks. Dynamic analysis (OWASP ZAP) runs nightly on Staging.
*   **Load Testing:** **k6** scripts simulate high concurrent loads (e.g., 5,000 requests/second on the API Gateway) to monitor latency percentiles and database thread saturation.

---

## 6. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Testing Architecture | Enterprise Architect |
