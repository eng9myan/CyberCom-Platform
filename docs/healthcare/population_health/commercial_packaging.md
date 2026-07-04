# Commercial Packaging — CyMed Population Health

## Edition Overview

| Edition | Target Customer | Key Differentiators |
|---|---|---|
| Population Health | Hospitals, health systems, group practices | Registry management, care gaps, risk stratification, quality measures, cohort analytics |
| Public Health | Regional health authorities, public health departments | + Disease surveillance, outbreak management, epidemiology, national reporting |
| National Health Platform | National health ministries, HIS networks | + National provider/facility registries, national programs, digital health (Health ID, vaccination certificates) |
| Government Digital Health Platform | Governments, national digital health agencies | + Ministry dashboards, cross-agency integration, citizen health services, WHO/IHR reporting |

## Module-to-Edition Matrix

| Module | Population Health | Public Health | National Health Platform | Gov Digital Health |
|---|:---:|:---:|:---:|:---:|
| registries | ✓ | ✓ | ✓ | ✓ |
| care_gaps | ✓ | ✓ | ✓ | ✓ |
| risk_management | ✓ | ✓ | ✓ | ✓ |
| cohorts | ✓ | ✓ | ✓ | ✓ |
| quality | ✓ | ✓ | ✓ | ✓ |
| analytics | ✓ | ✓ | ✓ | ✓ |
| surveillance | — | ✓ | ✓ | ✓ |
| epidemiology | — | ✓ | ✓ | ✓ |
| reporting | — | ✓ | ✓ | ✓ |
| public_health | — | — | ✓ | ✓ |
| national_programs | — | — | ✓ | ✓ |
| digital_health | — | — | ✓ | ✓ |
| ministry_dashboards | — | — | — | ✓ |
| cross_agency_integration | — | — | — | ✓ |
| citizen_health_services | — | — | — | ✓ |

## Feature Flag Gating

All edition-restricted features are gated by `FeatureFlagService` (P3.C0 Commercial Foundation):

```python
from platform.features.flags import FeatureFlagService

if FeatureFlagService.is_enabled(tenant_id=tenant_id, flag="cymed_ph_surveillance"):
    # Load surveillance viewsets
```

## Competitive Positioning

| Competitor | Platform | CyMed Advantage |
|---|---|---|
| Health Catalyst | Ignite Analytics | Native FHIR + ICD-11 + national programs; CyGov integration; digital health credentials |
| Arcadia | Population Health | Government digital health platform tier; National Health ID; WHO/IHR-compliant reporting |
| Innovaccer | Data Activation Platform | Full vertical stack (clinical + population + government); multi-tenant from day one |
| Epic | Healthy Planet | Open platform, not locked to Epic clinical; compatible with any clinical HIS |
| Oracle Health | Population Health | Modern cloud-native architecture; citizen-facing health passes and wallet |
| Philips Wellcentive | Quality Analytics | Full national program management + outbreak surveillance in one platform |

## Deployment Model

- Multi-tenant SaaS: Each health system or ministry operates as an isolated tenant
- Government on-premises: National Health Platform and Government editions support private cloud/on-premises deployment
- Data residency: All patient data remains within tenant-designated region (CyData compliance)
- CyGov bridge: Optional module for government-to-government data exchange
