# CyMed Patient Portal — Mobile Application

## Overview

CyMed Patient Mobile App (iOS + Android) extends the portal to native mobile experience.
The backend is the same `patient_portal` Django API. Mobile-specific capabilities
are handled through `PatientDevice` registration and `PushSubscription` management.

## Supported Platforms

| Platform | Min Version | Architecture |
|---|---|---|
| iOS | 16.0+ | Swift / SwiftUI |
| Android | 10.0 (API 29)+ | Kotlin / Jetpack Compose |
| React Native | Cross-platform option | React Native + Expo |

## Device Registration

On first launch, the app registers via `PatientDevice`:
```
POST /api/portal/accounts/devices/
{
  "device_name": "iPhone 15 Pro",
  "device_type": "ios",
  "device_token": "<APNs token>",
  "device_fingerprint": "<hardware fingerprint>",
  "platform_version": "17.4",
  "app_version": "3.6.0"
}
```

## Biometric Login

1. Patient enables biometric: `PatientSecuritySettings.biometric_enabled = True`
2. Device is trusted: `PatientDevice.is_trusted = True`
3. Subsequent logins: biometric verifies identity → app requests short-lived JWT
4. iOS: Face ID / Touch ID via LocalAuthentication framework
5. Android: BiometricPrompt API

## Push Notifications

`PushSubscription` stores push token per device:
- iOS: APNs token
- Android: FCM token
- Web: Web Push subscription object

Notification delivery:
1. Event triggers in backend (e.g., lab result ready)
2. `PatientNotification` created
3. `PushSubscription` queried for active device tokens
4. Push sent via CyIntegrationHub → APNs/FCM

Push payload maps to `PatientNotification.notification_type`:
```json
{
  "type": "lab_result_ready",
  "title": "Your CBC results are ready",
  "body": "Tap to view your results from Alpha Diagnostics.",
  "action_url": "/portal/lab-results/{id}",
  "priority": "normal"
}
```

## Offline Capabilities

Documents cached on device for offline access:
- `PatientDocument` PDFs — cached after first download
- `VaccinationRecord` / `HealthPass` — cached for offline wallet display
- `DigitalCard` — always cached (essential for offline use at clinics/airports)

Offline data cleared based on `PatientSecuritySettings.session_timeout_minutes`.

## Digital Wallet (Native)

On iOS: HealthKit integration for vaccination records.
On Android: Google Health Connect integration.

`DigitalCard` renders as:
- Pass Kit (iOS) — `.pkpass` format
- Google Wallet Pass (Android) — JWT-based Google Pay pass

QR code display for `HealthPass.qr_code_data` works fully offline.

## Quiet Hours

`NotificationPreference.quiet_hours_enabled`:
- `quiet_hours_start` / `quiet_hours_end` (TimeField)
- Push notifications suppressed during quiet hours
- Critical notifications (`priority=critical`) bypass quiet hours

## App Version Management

`PatientDevice.app_version` tracked to:
- Force upgrade enforcement for security patches
- Feature flag rollout by app version
- Compatibility matrix for API version negotiation
