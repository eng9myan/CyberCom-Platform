# CyMed Hospital Commercial Packaging

## Edition Mapping (Program 3.2 Retrofit)

### CyMed Community Hospital

**Target**: District hospitals, 50–100 beds

**Limits**: 200 users, 50 providers, 100 beds, 1 facility

**Included Modules**:
- `hospital.adt`
- `hospital.bed_management`
- `hospital.emergency`
- `hospital.inpatient`
- `hospital.nursing`
- `hospital.discharge`

**Feature Flags Enabled**:
- `hospital.adt`
- `hospital.bed_management`
- `hospital.emergency`
- `hospital.inpatient`
- `hospital.nursing`
- `hospital.discharge`

---

### CyMed Enterprise Hospital

**Target**: Regional hospitals, 100–500 beds

**Limits**: Unlimited users/providers, 500 beds, 5 facilities

**Adds to Community**:
- `hospital.icu`
- `hospital.operating_room`
- `hospital.anesthesia`
- `hospital.maternity`
- `hospital.transfer_center`
- `hospital.capacity_management`

**Feature Flags Added**:
- `hospital.icu`
- `hospital.operating_room`
- `hospital.anesthesia`
- `hospital.maternity`
- `hospital.transfer_center`
- `hospital.capacity_management`

---

### CyMed Medical City

**Target**: Medical cities, 500+ beds, multiple hospitals, academic centers

**Limits**: Unlimited everything

**Adds to Enterprise**:
- `hospital.clinical_command_center`

**Feature Flags Added**:
- `hospital.clinical_command_center`
- `hospital.multi_hospital`
- `hospital.academic_center`
- `hospital.regional_network`

## Licensing Basis

Hospital licensing is **bed-based**:

| Edition | Pricing |
|---------|---------|
| Community | Per-bed × licensed beds |
| Enterprise | Per-bed × licensed beds (volume discount) |
| Medical City | Custom enterprise agreement |

`License.max_beds` enforces the bed ceiling. `UsageMeteringService` monitors `occupied_beds` against `licensed_beds` and raises alerts at 80% and 100% thresholds.

## Retrofit Implementation

`HospitalModelViewSet` now supports `required_feature`:

```python
class ICUViewSet(HospitalModelViewSet):
    required_feature = "hospital.icu"
```

Returns HTTP 403 for Community Hospital edition attempting to access ICU endpoints.

## Deployment Support

All hospital editions support:
- SaaS (Community, Enterprise)
- Private Cloud (all editions)
- Government Cloud (all editions)
- Air-Gapped (all editions)
- White Label (all editions)
