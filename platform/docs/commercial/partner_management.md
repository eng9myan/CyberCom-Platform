# CyMed Partner Management

## Partner Types

| Type | Commission | Description |
|------|-----------|-------------|
| Reseller | 15–25% | Sell CyMed licenses directly to end customers |
| System Integrator | 10–15% | Implement and integrate CyMed |
| Distributor | 20–30% | Regional distribution with sub-reseller rights |
| Government Partner | Custom | Government bid support and procurement |

## Partner Levels

| Level | Benefits |
|-------|---------|
| Silver | Standard partner portal access |
| Gold | Priority support, MDF funds |
| Platinum | Dedicated partner manager, co-sell |

## Partner Lifecycle

```
prospect → onboarding → active → inactive → terminated
```

## Reseller Agreement

Key terms tracked:
- Territory (country codes)
- Authorized products
- Discount rate (%)
- Payment terms (days)
- Minimum annual commitment
- White label rights
- NDA status

## Distributor Agreement

Key terms tracked:
- Exclusive territory
- Sub-reseller rights
- Localization rights
- Government bid rights
- Annual volume commitment

## API Endpoints

```
GET  /api/v1/commercial/partners/partners/
POST /api/v1/commercial/partners/partners/
POST /api/v1/commercial/partners/reselleragreements/
POST /api/v1/commercial/partners/distributoragreements/
```
