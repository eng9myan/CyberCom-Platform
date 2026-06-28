# Development Standards

## Python / Django

### Models

```python
from platform.common.models import BaseModel

class MyModel(BaseModel):
    # tenant_id, id (UUID), created_at, updated_at, created_by, updated_by, is_deleted inherited
    name = models.CharField(max_length=255)
    
    class Meta:
        db_table = "product_mymodel"
        indexes = [models.Index(fields=["tenant_id", "name"])]
```

- Always inherit from `BaseModel`
- Always include `tenant_id` index
- Use `TextChoices` for enum fields
- Soft delete via `is_deleted` — never hard delete clinical data
- Table names: `<product>_<entity>` (snake_case)
- No `CharField(null=True)` — use `blank=True` and empty string default

### Serializers

```python
from platform.api.serializers import BaseSerializer

class MyModelSerializer(BaseSerializer):
    class Meta:
        model = MyModel
        fields = ["id", "name", "tenant_id", "created_at", "updated_at"]
        read_only_fields = ["id", "tenant_id", "created_at", "updated_at"]
```

### Views

```python
from platform.api.views import TenantViewSet

class MyModelViewSet(TenantViewSet):
    serializer_class = MyModelSerializer
    queryset = MyModel.objects.filter(is_deleted=False)
    # tenant filtering applied automatically by TenantViewSet
```

### Services

```python
class MyService:
    @classmethod
    def create(cls, data: dict, tenant_id: uuid.UUID, user_id: uuid.UUID) -> MyModel:
        instance = MyModel.objects.create(tenant_id=tenant_id, created_by=user_id, **data)
        EventService.publish("mymodel.created", {"id": str(instance.id)}, tenant_id=tenant_id)
        AuditService.log("create", "MyModel", instance.id, tenant_id=tenant_id, user_id=user_id)
        return instance
```

### URLs

```python
# In product urls.py
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("mymodels", MyModelViewSet, basename="mymodel")
urlpatterns = router.urls
```

---

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Python modules | snake_case | `drug_interactions` |
| Python classes | PascalCase | `DrugInteractionService` |
| Python functions/methods | snake_case | `check_prescription` |
| Python constants | UPPER_SNAKE | `MAX_ALERT_COUNT` |
| Django models | PascalCase | `InteractionRule` |
| DB tables | snake_case with prefix | `pharmacy_interaction_rule` |
| API endpoints | kebab-case | `/api/v1/pharmacy/drug-interactions/` |
| Event types | dot.notation | `cymed.pharmacy.interaction.detected` |

---

## Security Standards

### Authentication
- All endpoints require Bearer JWT (unless explicitly public)
- JWT validated against CyIdentity JWKS URI
- No API keys for user-facing endpoints
- Service-to-service: OAuth2 client credentials flow

### Authorization
- RBAC: role-based using CyIdentity Role model
- ABAC: attribute-based for fine-grained clinical access
- Never hard-code permissions — use `CyberComPermission` class
- Break Glass: `BreakGlassService.request_access()` — always audited

### Data Security
- PHI/PII fields must be marked with `data_classification = DataClassification.RESTRICTED`
- Encryption at rest: database-level (PostgreSQL TDE in production)
- Encryption in transit: TLS 1.3 minimum
- Never log PHI — use anonymized identifiers in logs

### Input Validation
- Always validate at API boundary via serializers
- Never trust tenant_id from request body — take from middleware context
- Sanitize all user inputs before storage

---

## API Response Standards

### Success
```json
{
  "id": "uuid",
  "data": {},
  "meta": {"page": 1, "count": 25, "total": 150}
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "field_errors": {"field": ["error message"]},
    "trace_id": "otel-trace-id"
  }
}
```

---

## Testing Standards

### Test Structure

```python
# tests/test_services.py
import pytest
from django.test import TestCase

@pytest.mark.django_db
class TestMyService(TestCase):
    def setUp(self):
        self.tenant_id = uuid.uuid4()
        self.user_id = uuid.uuid4()

    def test_create_creates_record(self):
        result = MyService.create({"name": "Test"}, self.tenant_id, self.user_id)
        assert result.tenant_id == self.tenant_id
        assert result.name == "Test"
```

### Coverage Requirements
- Services: 90%+
- Models: 85%+
- Views/APIs: 80%+
- Run: `pytest --cov=. --cov-report=xml`

### Test Database
- Use `settings_test.py` (SQLite for unit tests, PostgreSQL for integration)
- Never mock the database for integration tests
- Seed fixtures via `conftest.py`

---

## Performance Standards

- API response time: p95 < 200ms
- Database queries per request: < 10 (use `select_related`, `prefetch_related`)
- No N+1 queries — use Django Debug Toolbar in development
- Pagination required on all list endpoints (default 25, max 100)
- Heavy operations in Celery tasks, never in request cycle
- Redis cache for frequently-read reference data (terminology, feature flags)

---

## Documentation Standards

- Docstrings: one-line for simple methods, multi-line for services
- Model docstrings: describe clinical/business purpose, not code mechanics
- No inline comments explaining what code does — only why (non-obvious constraints)
- OpenAPI descriptions: required on all ViewSets
- Update `ARCHITECTURE.md` when adding new platform service
- Create phase report when completing a major feature set

---

## Migrations

- One migration per logical change
- Never edit applied migrations — create new ones
- Include `RunSQL` for RLS policies
- Test migrations on a copy of production data before applying
- Migration files: auto-generated names are acceptable
- All migrations must be reversible (include `reverse_sql` for `RunSQL`)
