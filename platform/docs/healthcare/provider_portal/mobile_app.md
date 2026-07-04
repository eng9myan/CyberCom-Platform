# CyMed Provider Portal — Mobile Application (Epic Haiku/Canto Competitor)

## Overview

CyMed Provider Mobile is the physician/nurse mobile workspace competing with:
- Epic Haiku (physician mobile)
- Epic Canto (physician tablet)
- Cerner PowerChart Touch
- Oracle Health mobile apps

The backend is the same Django provider_portal API. Mobile-specific features are in
the `mobile` app: `ProviderMobileDevice`, `MobileSession`, `MobilePreferences`,
`MobilePushNotification`.

## Supported Platforms

| Platform | Min Version | Architecture |
|---|---|---|
| iOS | 16.0+ | Swift / SwiftUI |
| Android | 10.0 (API 29)+ | Kotlin / Jetpack Compose |
| iPad | iPadOS 16+ | SwiftUI (split-view optimized) |

## Quick Access Features (Mobile)

| Feature | Mobile Screen |
|---|---|
| Patient lists | Swipeable census by unit |
| Tasks | Badge count + priority list |
| Results | Critical result banner |
| Messaging | Secure inbox with unread count |
| Telemedicine | Join session button on scheduled visits |
| Schedules | Today's shift overview |
| Approvals | Pending approvals with 1-tap approve/reject |

## Push Notification Types

`MobilePushNotification.notification_type`:
- `critical_result` — highest priority, bypasses quiet hours
- `task_assigned` — new task assigned to provider
- `task_overdue` — task past due_at
- `message_received` — new clinical message
- `approval_required` — approval awaiting action
- `round_starting` — scheduled round beginning
- `credential_expiry` — credential expiring ≤ 30 days
- `schedule_change` — shift modification
- `patient_deterioration` — RRT/NEWS score alert
- `system_alert` — platform-level system notifications

## Biometric Authentication

`MobilePreferences.biometric_login=True`:
- iOS: Face ID / Touch ID via LocalAuthentication framework
- Android: BiometricPrompt (fingerprint / face)
- After biometric success: short-lived JWT fetched from CyIdentity
- `MobileSession.biometric_verified=True` logged for audit

## Offline Capabilities

`MobilePreferences.offline_patient_ids` — cached patient ID list:
- Patient demographics cached for offline access
- Last known vital signs cached
- Pending tasks available offline
- Network sync on reconnect

## Device Trust Model

1. First registration: `ProviderMobileDevice` created (`is_trusted=False`)
2. MFA verification on device: `is_trusted=True`
3. Push token registered in `push_token` field
4. Trusted devices skip MFA on biometric login

## Notification Routing

```
Clinical event (lab result, task, message)
        ↓
Kafka event published (Event Framework P2.5)
        ↓
Notification worker consumes → creates MobilePushNotification
        ↓
Query ProviderMobileDevice where is_active=True and provider_id matches
        ↓
CyIntegrationHub (P2.6) → APNs (iOS) / FCM (Android)
```
