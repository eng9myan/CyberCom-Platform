"""Backfill: re-save existing Observation rows so value_string, now an
encrypted-at-rest field, actually gets encrypted."""

from django.db import migrations


def encrypt_existing_rows(apps, schema_editor):
    Observation = apps.get_model("cymed_clinical", "Observation")
    for row in Observation.objects.exclude(value_string="").exclude(value_string=None):
        row.save(update_fields=["value_string"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("cymed_clinical", "0002_alter_observation_value_string"),
    ]

    operations = [
        migrations.RunPython(encrypt_existing_rows, noop_reverse),
    ]
