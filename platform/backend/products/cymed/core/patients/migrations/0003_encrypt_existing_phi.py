"""
Backfill: re-save existing PatientAddress/PatientContact/PatientEmergencyContact/
PatientRelationship rows so their PHI fields, now encrypted-at-rest fields,
actually get encrypted. Without this, rows written before migration 0002
stay as plaintext until the next unrelated save touches them.
"""

from django.db import migrations


def encrypt_existing_rows(apps, schema_editor):
    PatientAddress = apps.get_model("cymed_patients", "PatientAddress")
    PatientContact = apps.get_model("cymed_patients", "PatientContact")
    PatientEmergencyContact = apps.get_model("cymed_patients", "PatientEmergencyContact")
    PatientRelationship = apps.get_model("cymed_patients", "PatientRelationship")

    for row in PatientAddress.objects.all():
        row.save(update_fields=["line1", "line2", "city", "postal_code"])
    for row in PatientContact.objects.all():
        row.save(update_fields=["telecom_value"])
    for row in PatientEmergencyContact.objects.all():
        row.save(update_fields=["name", "phone", "email"])
    for row in PatientRelationship.objects.all():
        row.save(update_fields=["related_person_name", "telecom", "address"])


def noop_reverse(apps, schema_editor):
    # Not reversible -- decrypting back to plaintext on rollback would defeat
    # the point of this migration. Leave data encrypted if rolled back.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("cymed_patients", "0002_alter_patientaddress_city_alter_patientaddress_line1_and_more"),
    ]

    operations = [
        migrations.RunPython(encrypt_existing_rows, noop_reverse),
    ]
