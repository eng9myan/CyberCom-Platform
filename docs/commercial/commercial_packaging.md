# CyMed Commercial Packaging Strategy

## Packaging Principles

1. **Edition-based packaging**: Customers buy editions, not features.
2. **Additive editions**: Higher editions include all lower-edition features.
3. **License-enforced limits**: All resource limits (users, beds, facilities) enforced at license level.
4. **No code modifications**: Switching editions or deployment models requires only data changes.

## Go-To-Market Models

### SaaS (Cloud)
- Monthly/annual subscription
- Self-service onboarding for Clinic Starter
- Managed onboarding for Hospital editions
- Automatic updates via `stable` channel

### On-Premises / Private Cloud
- Annual license agreement
- Packaged Docker/Kubernetes deployment via Helm chart
- Updates via `lts` channel on customer schedule

### Government Cloud
- Government procurement contract
- National cloud deployment
- Manual updates, FIPS compliance
- Offline license validation

### Air-Gapped
- Perpetual or annual license
- Physical media delivery
- Signed offline activation packages
- No telemetry

## Pricing Model

### Clinic
| Edition | Pricing Model |
|---------|--------------|
| Starter | Fixed seat (≤10 users) |
| Professional | Fixed + per-user above 10 |
| Enterprise | Custom negotiated |

### Hospital
| Edition | Pricing Model |
|---------|--------------|
| Community Hospital | Per-bed (50–100 beds) |
| Enterprise Hospital | Per-bed (100–500 beds) |
| Medical City | Custom (500+ beds, multi-facility) |

## Add-On Modules (Future)

Future products (Lab, Imaging, Pharmacy, Portals, Population Health) are sold as add-ons to existing hospital/clinic licenses or standalone, using the same commercial foundation.
