# Mobile Architecture

This document defines the mobile application architecture, offline-first sync pipelines, local SQLCipher layouts, notification triggers, and security controls for CyberCom mobile products.

---

## 1. React Native Framework Strategy

CyberCom mobile applications (Patient Portal, Citizen Wallet, Clinician Mobile) are built using **React Native** (v0.74+):
*   **Language:** TypeScript (strict mode).
*   **Architecture:** **New Architecture (TurboModules & Fabric)** is enabled to support high-performance native component bindings and synchronous JS-to-native execution.

---

## 2. Offline-First Caching & Sync Pipeline

To support clinical ward rounds and disconnected civic identity checks, the app operates strictly offline-first:

```
 [User Action] ➔ [Validate local parameters]
                        │
                        ▼
            [Save to SQLCipher Local DB]
                        │
                        ▼
           [Enqueue to Outbox Queue Table] ➔ [Trigger Background Sync Worker]
                                                    │
                                            (Network Connected?)
                                             /             \
                                          (Yes)            (No)
                                           /                 \
                     [Stream payloads via REST/gRPC]    [Store & Retry later]
```

### 2.1 Storage Layer (SQLCipher)
*   **Encrypted Database:** Relational local caching is managed via **WatermelonDB** over **SQLCipher**.
*   **Key Security:** The database encryption key is generated at first launch, stored in the iOS Keychain / Android Keystore, and retrieved only when the user passes biometric checks (FaceID/TouchID).

### 2.2 Conflict Resolution Policies
When merging queued changes:
*   **Version Tracking:** Every entity payload includes a `last_updated_at` timestamp and a `version` field.
*   **Last-Write-Wins (LWW):** Standard for patient contacts or citizen addresses.
*   **Append-Only Log Consolidation:** Used for clinical notes and charting to prevent physicians from overwriting other clinical entries.
*   **Triage Queue:** Conflict anomalies (matching version codes with distinct attribute writes) are pushed to the central admin portal for human reconciliation.

---

## 3. Background Sync & Push Notifications

*   **Push Engine:** Firebase Cloud Messaging (FCM) for Android and Apple Push Notification service (APNs) for iOS.
*   **Background Sync Workers:** Built using React Native Background Fetch. The device wakes up periodically (e.g., every 15 minutes) to execute a lightweight sync script to upload queued outbox records and download active clinical rosters.

---

## 4. Mobility Use Cases

### 4.1 Clinical Mobility (`CyMed` Mobile)
*   **Ward Ingestion:** Doctors load active patient lists over Wi-Fi.
*   **Offline Rounds:** They chart vitals and write prescriptions offline in shielded wards.
*   **Conflict Checks:** Prescriptions are synchronized immediately when connection is restored. If a conflict occurs, the system logs a validation warning to the ward coordinator's console.

### 4.2 Government Wallet (`CyCitizen` Mobile)
*   **Offline Civic ID:** Citizens can render their digital ID card offline.
*   **Signed QR Tokens:** The application generates a dynamically updating QR code containing a JWT signed by the citizen's local device key. The verifying authority scans the QR code offline, validating the signature against CyIdentity’s public JWKS key cached on the verifier’s device.

---

## 5. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Mobile Architecture | Enterprise Architect |
