# Security Model

---

## Authentication & Authorization

All laboratory endpoints require `IsAuthenticated` (JWT bearer token from CyberCom Auth).

Role-based access (enforced by upstream API gateway and `LaboratoryModelViewSet`):
- `lab_admin` — full access
- `lab_technologist` — orders, specimens, worklists, results entry
- `lab_pathologist` — pathology, histopathology, result approval
- `lab_supervisor` — QC management, worklist management
- `physician` — order creation, result viewing (own patients only)

---

## Tenant Isolation

Every model inherits `BaseModel` with `tenant_id` UUID field. `LaboratoryModelViewSet.get_queryset()` always filters by `tenant_id`:

```python
def get_queryset(self):
    tenant_id = getattr(self.request, "tenant_id", None)
    if tenant_id:
        return self.queryset.filter(tenant_id=tenant_id)
    return self.queryset.none()  # Return nothing if no tenant context
```

No cross-tenant queries are possible through any ViewSet.

---

## Feature Gating

Every endpoint is gated by `required_feature` checked against `FeatureFlagService.is_enabled()`. A tenant without the correct edition cannot access endpoints even if authenticated.

```python
if not FeatureFlagService.is_enabled(feature_code, tenant_id=...):
    raise PermissionDenied(detail="Feature not enabled for your edition")
```

---

## Critical Value Notification

Critical results require:
1. `CriticalResult` created with `notification_status = pending`
2. Clinician notified (phone + system notification)
3. Read-back documented: `read_back_verified = True`
4. Status advanced to `completed`

Releasing a result with unacknowledged critical value is blocked at the API level.

---

## Secret Management

External system credentials (reference lab API keys, analyzer passwords) stored as **key names** only in the database. Actual secrets stored in platform secret manager and fetched at runtime. Never logged.

---

## Audit Trail

Immutable audit records:
- `SpecimenChainOfCustody` — every custody transfer
- `LabOrderStatusHistory` — every order status change
- `ResultCorrection` — every result amendment
- `AccessionAudit` — every accession action
- `ResultApproval` — every result signoff with digital signature + IP address

---

## Data Classification

| Field | Classification |
|-------|---------------|
| `patient_id` | PHI — pseudonymized UUID |
| `result_values` | PHI — clinical data |
| `digital_signature` | Security-sensitive |
| `api_key_reference` | Reference only (actual key in secret manager) |
| `ai_suggestions` | PHI adjacent — advisory only |

All PHI fields are excluded from analytics snapshots. Only aggregated, de-identified data goes to CyData.
