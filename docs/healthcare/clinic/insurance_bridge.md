# Insurance Bridge (Prior Auth & Eligibility)

## 1. Overview
The `insurance_bridge` connects clinic billing registries with insurance payers and national claims aggregators (e.g. NPHIES in Saudi Arabia, Malaffi in UAE). It supports real-time coverage verification and prior authorization processing.

## 2. Models
*   **`Payer`**: Insurance companies and third-party administrators (TPAs) (e.g. Bupa, MedNet).
*   **`InsurancePlan`**: Plan configurations mapping plan names, codes, and copay rates.
*   **`EligibilityCheck`**: Logs electronic eligibility check transactions.
*   **`AuthorizationRequest`**: Prior authorization claims sent to payers.
*   **`AuthorizationResponse`**: Stores response codes, approved service lists, and transaction tokens.

## 3. Prior Authorization Flow
1. **Eligibility Check**: Verification request sent to `/api/v1/clinic/insurance/eligibility/` returns `is_eligible` status and copay criteria.
2. **Prior Auth Request**: Outpatient procedures requiring authorization post to `/api/v1/clinic/insurance/auth-requests/`.
3. **Payer Response (Mock)**: The system routes the query to the payer clearinghouse simulator:
   * Simulates immediate approval or rejection.
   * Auto-generates an authorization token (e.g., `AUTH-928471`) and updates request status to `approved`.
