# CyMed Subscription Management

## Billing Cycles

| Cycle | Duration | Use Case |
|-------|----------|----------|
| `monthly` | 1 month | SaaS self-service |
| `quarterly` | 3 months | SME contracts |
| `annual` | 12 months | Standard contracts |
| `multi_year` | 36 months | Enterprise 3-year deals |
| `enterprise` | Custom | Government / large enterprise |

## Subscription States

```
trial → active → past_due → cancelled
              ↘ expired
              ↘ suspended
```

## Service Operations

```python
from products.cymed.commercial.subscriptions.services import SubscriptionService

# Create
sub = SubscriptionService.create_subscription(
    plan=plan, customer_id=customer.id, tenant_id=tenant_id,
    contracted_users=50, contracted_beds=100,
)

# Renew
SubscriptionService.renew_subscription(sub)

# Invoice
invoice = SubscriptionService.generate_invoice(sub)
```

## Pricing Formula

```
Invoice = base_price + (per_user_price × contracted_users) + (per_bed_price × contracted_beds) + overage
```

## Enterprise Agreements

`SubscriptionContract` captures multi-year agreements:
- `contract_years`: 1–10
- `total_contract_value`: Total ACV
- `sla_tier`: standard / gold / platinum
- `dedicated_csm`: Customer Success Manager assignment

## API Endpoints

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/v1/commercial/subscriptions/subscriptions/` | List subscriptions |
| `POST` | `/api/v1/commercial/subscriptions/plans/` | Create subscription plan |
| `GET` | `/api/v1/commercial/subscriptions/invoices/` | List invoices |
