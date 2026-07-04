# CyMed Customer Management

## Customer Types

| Type | Description |
|------|-------------|
| `clinic` | Outpatient clinic or medical center |
| `hospital` | Single hospital |
| `hospital_group` | Multi-hospital group |
| `ministry` | Ministry of Health |
| `government` | Government agency |
| `network` | Healthcare network |
| `laboratory` | Diagnostic laboratory |
| `imaging_center` | Radiology/imaging center |
| `pharmacy_chain` | Multi-branch pharmacy |

## Customer Lifecycle

```
lead → prospect → active → churned
                         → suspended
```

## Data Models

### Customer
Master customer record with type, country, status, and assigned CSM.

### CustomerOrganization
Links customer to one or more deployed tenant organizations. Stores primary contacts.

### CustomerContract
Formal legal agreements:
- SaaS Agreement
- Enterprise License Agreement
- Government Procurement Contract
- Pilot Agreement

### CustomerDeployment
Tracks active deployments: which product, which edition, which profile, go-live date.

### CustomerSuccessPlan
Health score (0–100), NPS score, adoption %, renewal risk, quarterly business review date.

## API Endpoints

```
GET  /api/v1/commercial/customers/customers/
POST /api/v1/commercial/customers/customers/
GET  /api/v1/commercial/customers/contracts/
POST /api/v1/commercial/customers/deployments/
GET  /api/v1/commercial/customers/successplans/
```
