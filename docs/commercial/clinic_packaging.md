# CyMed Clinic Commercial Packaging

## Edition Mapping (Program 3.1 Retrofit)

### CyMed Clinic Starter

**Target**: Solo practitioners, small clinics (1–5 providers)

**Limits**: 10 users, 5 providers, 1 facility, 1 clinic

**Included Modules**:
- `clinic.appointments`
- `clinic.reception`
- `clinic.queues`
- `clinic.consultations`
- `clinic.telemedicine`

**Feature Flags Enabled**:
- `clinic.appointments`
- `clinic.reception`
- `clinic.queue`
- `clinic.consultation`
- `clinic.telemedicine`

---

### CyMed Clinic Professional

**Target**: Specialty clinics, multi-provider practices

**Limits**: 50 users, 20 providers, 3 facilities, 3 clinics

**Adds to Starter**:
- `clinic.specialties`
- `clinic.referrals`
- `clinic.insurance_bridge`

**Feature Flags Added**:
- `clinic.specialty_templates`
- `clinic.advanced_scheduling`
- `clinic.referral_management`
- `clinic.insurance_verification`

---

### CyMed Clinic Enterprise

**Target**: Large clinic networks, multi-organization groups

**Limits**: Unlimited

**Adds to Professional**:
- `clinic.billing_bridge`
- `clinic.clinical_forms`
- `clinic.triage`

**Feature Flags Added**:
- `clinic.multi_clinic`
- `clinic.enterprise_reporting`
- `clinic.advanced_workforce`
- `clinic.advanced_analytics`
- `clinic.multi_organization`

## Retrofit Implementation

The clinic base `ClinicModelViewSet` now supports `required_feature` declaration:

```python
class SpecialtyViewSet(ClinicModelViewSet):
    required_feature = "clinic.specialty_templates"
```

Feature check runs in `initial()` via `FeatureFlagService.is_enabled()`. Returns HTTP 403 if feature not enabled for tenant's edition.

## Deployment Support

All clinic editions support:
- SaaS
- Private Cloud
- Government Cloud (Enterprise only)
- Air-Gapped (Enterprise only)
- White Label (Professional and Enterprise)
