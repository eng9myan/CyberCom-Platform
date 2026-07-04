# CyMed Licensing Engine

## License Types

| Type | Use Case |
|------|----------|
| `trial` | Free evaluation, time-limited |
| `subscription` | Monthly/annual SaaS billing |
| `annual` | Annual on-premises or private cloud |
| `multi_year` | Multi-year enterprise agreements |
| `enterprise` | Custom enterprise volume licensing |
| `government` | Government procurement contracts |
| `perpetual` | One-time purchase, no expiry |

## Delivery Modes

| Mode | Description |
|------|-------------|
| `online` | Standard cloud-connected activation |
| `offline` | No internet, manual key entry |
| `air_gapped` | Signed offline package for isolated networks |
| `government` | Government-validated offline package |

## License Lifecycle

```
CREATE → ACTIVE → [GRACE_PERIOD] → EXPIRED
                                 → REVOKED (manual)
         ACTIVE → RENEWED → ACTIVE
```

### Grace Period

When `valid_until` is exceeded but within `grace_period_days`, the license status transitions to `grace`. Access is still granted. After the grace period expires, the license is invalid.

## Offline / Air-Gapped Activation

For air-gapped deployments:

1. Admin generates an `OfflineActivationPackage` using `LicensingService.create_offline_package()`.
2. Package contains a Base64-encoded, HMAC-SHA256-signed JSON payload including all license limits.
3. Package is delivered to the air-gapped facility on physical media.
4. System validates the signature using `LICENSE_SIGNING_SECRET` environment variable.
5. Package `expires_at` prevents indefinite offline activation.

## Compliance Validation

`LicensingService.check_compliance()` returns:

```json
{
  "license_number": "CYM-CLNIC-STAR-ABC123",
  "is_valid": true,
  "status": "active",
  "valid_until": "2027-06-23",
  "days_remaining": 365,
  "in_grace_period": false
}
```

## API Endpoints

| Method | Path | Action |
|--------|------|--------|
| `POST` | `/api/v1/commercial/licensing/licenses/{id}/activate/` | Activate license with key |
| `POST` | `/api/v1/commercial/licensing/licenses/validate/` | Validate license for a product |
| `POST` | `/api/v1/commercial/licensing/licenses/{id}/revoke/` | Revoke license |
| `GET` | `/api/v1/commercial/licensing/licenses/{id}/` | Get license details |
| `GET` | `/api/v1/commercial/licensing/audit/` | Get license audit log |
| `POST` | `/api/v1/commercial/licensing/offline-packages/` | Generate offline package |

## Audit Events

All lifecycle changes emit:
- `cymed.license.activated`
- `cymed.license.renewed`
- `cymed.license.revoked`
- `cymed.license.expired`

Events are published to `cymed.commercial.events` Kafka topic via the platform Outbox pattern.
