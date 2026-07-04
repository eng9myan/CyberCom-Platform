# CyMed Feature Flag Framework

## Design Principle

No feature access is hardcoded in application code. Every clinical capability is gated through `FeatureFlagService.is_enabled()`. This decouples edition logic from clinical logic entirely.

## Evaluation Order

```
1. Customer-level override (CustomerFeature)   ← highest priority
2. Tenant-level override (TenantFeature)
3. FeatureFlag.default_enabled                 ← lowest priority
```

## Flag Scopes

| Scope | Description |
|-------|-------------|
| `edition` | Standard feature tied to product edition |
| `country` | Country-specific regulatory feature |
| `customer` | Custom-enabled feature for specific customer |
| `beta` | Pre-GA feature for opt-in testing |
| `government` | Government-only feature |

## Usage in Application Code

```python
from products.cymed.commercial.feature_flags.services import FeatureFlagService

def my_clinical_view(request):
    if not FeatureFlagService.is_enabled(
        "clinic.advanced_scheduling",
        tenant_id=str(request.tenant_id),
    ):
        raise PermissionDenied("Feature not available in your edition.")
    # ... clinical logic
```

## ViewSet Integration

Set `required_feature` on any `ClinicModelViewSet` or `HospitalModelViewSet` subclass:

```python
class AppointmentViewSet(ClinicModelViewSet):
    required_feature = "clinic.appointments"
    queryset = ClinicAppointment.objects.all()
    serializer_class = ClinicAppointmentSerializer
```

The base class calls `_check_feature()` in `initial()` before every request.

## Caching

Feature checks are cached in Redis (5-minute TTL):

```
Key: cymed:feature:{scope}:{identifier}:{feature_code}
TTL: 300 seconds
```

Invalidate with:
```python
FeatureFlagService.invalidate_tenant_cache(tenant_id)
```

## Bulk Edition Provisioning

When a tenant is provisioned with an edition:

```python
from products.cymed.commercial.feature_flags.services import (
    FeatureFlagService, EDITION_FEATURE_MAP
)

features = EDITION_FEATURE_MAP["cymed_clinic:professional"]
FeatureFlagService.bulk_enable_edition_features(tenant_id, features)
```

## Seeded Flags

The data migration `commercial/feature_flags/migrations/0002_seed_flags.py` seeds 35 feature flags covering:
- Clinic Starter / Professional / Enterprise features
- Hospital Community / Enterprise / Medical City features
- Government deployment flags
- Beta AI flags

## API Endpoint

```
POST /api/v1/commercial/features/flags/check/
Body: {"feature_code": "clinic.advanced_scheduling"}
Response: {"enabled": false, "source": "default"}
```
