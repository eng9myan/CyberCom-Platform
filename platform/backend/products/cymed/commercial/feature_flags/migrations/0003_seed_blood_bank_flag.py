"""
Data migration: registers the hospital.blood_bank feature flag.

Blood banking was previously enforced by zero hospital submodules (no other
hospital viewset actually sets required_feature despite being listed in
HOSPITAL_ENTERPRISE_FEATURES -- that catalog is descriptive, not wired to
runtime checks anywhere else). Seeded here as default_enabled=True so this
newly-added gate doesn't retroactively lock out tenants that were never
provisioned with an explicit TenantFeature override for it.
"""

import uuid

from django.db import migrations

PLATFORM_TENANT = uuid.UUID("00000000-0000-0000-0000-000000000001")


def seed_flag(apps, schema_editor):
    FeatureFlag = apps.get_model("commercial_feature_flags", "FeatureFlag")
    FeatureFlag.objects.get_or_create(
        code="hospital.blood_bank",
        defaults={
            "id": uuid.uuid4(),
            "tenant_id": PLATFORM_TENANT,
            "name": "Blood Bank",
            "scope": "edition",
            "module_code": "hospital.blood_bank",
            "default_enabled": True,
        },
    )


def unseed_flag(apps, schema_editor):
    FeatureFlag = apps.get_model("commercial_feature_flags", "FeatureFlag")
    FeatureFlag.objects.filter(code="hospital.blood_bank").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("commercial_feature_flags", "0002_seed_flags"),
    ]

    operations = [
        migrations.RunPython(seed_flag, unseed_flag),
    ]
