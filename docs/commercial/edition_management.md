# CyMed Edition Management

## Product Editions

### CyMed Clinic

| Edition | Beds | Users | Clinics | Key Features |
|---------|------|-------|---------|--------------|
| Starter | — | 10 | 1 | Appointments, Reception, Queue, Consultation, Telemedicine |
| Professional | — | 50 | 3 | + Specialty Templates, Advanced Scheduling, Referrals, Insurance Verification |
| Enterprise | — | Unlimited | Unlimited | + Multi-Clinic, Enterprise Reporting, Advanced Analytics, Multi-Organization |

### CyMed Hospital

| Edition | Beds | Facilities | Key Features |
|---------|------|------------|--------------|
| Community Hospital | 50–100 | 1 | ADT, Bed Management, Emergency, Inpatient, Nursing, Discharge |
| Enterprise Hospital | 100–500 | 5 | + ICU, OR, Anesthesia, Maternity, Transfer Center, Capacity Management |
| Medical City | 500+ | Unlimited | + Clinical Command Center, Multi-Hospital, Academic Center, Regional Network |

### CyMed Laboratory

| Edition | Description |
|---------|-------------|
| Basic | Single lab, limited test panels |
| Advanced | Multiple labs, advanced panels |
| Reference Lab | Network-level, external submissions |

### CyMed Imaging

| Edition | Description |
|---------|-------------|
| Basic | Single modality center |
| Enterprise | Multi-modality, teleradiology |

### CyMed Pharmacy

| Edition | Description |
|---------|-------------|
| Retail | Single pharmacy |
| Chain | Multi-branch pharmacy chain |
| Hospital Pharmacy | Integrated hospital dispensing |

### CyMed Portals (Patient / Provider)

| Edition | Description |
|---------|-------------|
| Standard | Core patient/provider access |
| Enterprise | Advanced integrations |
| Government | MOH/NHIF integration |

### CyMed Population Health

| Edition | Description |
|---------|-------------|
| Standard | Registry and analytics |
| Enterprise | Advanced population management |
| Government | National health program support |

## Edition Resolution

Editions are resolved at license activation time:

```python
edition = EditionService.get_edition("cymed_clinic", "starter")
features = EditionService.get_edition_features(edition)
modules = EditionService.get_edition_modules(edition)
limits = EditionService.get_edition_limits(edition)
```

## Seeded Data

The data migration `commercial/editions/migrations/0002_seed_catalog.py` seeds:
- 8 products
- 22 editions
- Edition module mappings for Clinic and Hospital products

All future products inherit this structure by adding to the catalog migration.
