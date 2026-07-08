from django.db import models

from platform.common.models import BaseModel
from products.cymed.hospital.inpatient.models import HospitalStay


class MortuaryCase(BaseModel):
    """
    Real chain-of-custody record from time of death to release -- this is
    the entire regulatory point of a hospital mortuary: every deceased
    patient must be traceable through refrigeration to a documented,
    verified release, never an undocumented handoff.
    """

    data_classification = "phi"

    STATUS_CHOICES = [
        ("in_refrigeration", "In Refrigeration"),
        ("autopsy_pending", "Autopsy Pending"),
        ("autopsy_complete", "Autopsy Complete"),
        ("released", "Released"),
    ]

    stay = models.OneToOneField(HospitalStay, on_delete=models.CASCADE, related_name="mortuary_case")
    time_of_death = models.DateTimeField()
    pronounced_by = models.UUIDField()
    cause_of_death_summary = models.TextField(blank=True)
    refrigeration_bay = models.CharField(max_length=50, blank=True)
    intake_at = models.DateTimeField(auto_now_add=True)
    intake_by = models.UUIDField()
    autopsy_required = models.BooleanField(default=False)
    medical_examiner_case = models.BooleanField(default=False)  # forensic/ME jurisdiction cases
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="in_refrigeration")

    class Meta:
        db_table = "cymed_hospital_mortuary_cases"
        ordering = ["-intake_at"]
        indexes = [models.Index(fields=["tenant_id", "status"])]

    def __str__(self):
        return f"MortuaryCase(stay={self.stay_id}, {self.status})"


class ReleaseRecord(BaseModel):
    """One release attempt/completion per case -- kept as its own table (not fields on MortuaryCase) so a failed/rejected release attempt isn't lost, matching real chain-of-custody audit expectations."""

    RELEASED_TO_CHOICES = [
        ("family", "Family Member"),
        ("funeral_home", "Funeral Home"),
        ("medical_examiner", "Medical Examiner"),
        ("organ_procurement", "Organ Procurement Organization"),
    ]

    case = models.ForeignKey(MortuaryCase, on_delete=models.CASCADE, related_name="release_records")
    released_to_type = models.CharField(max_length=20, choices=RELEASED_TO_CHOICES)
    released_to_name = models.CharField(max_length=200)
    released_to_relationship = models.CharField(max_length=100, blank=True)  # e.g. "spouse", "son" -- for family releases
    funeral_home_license_number = models.CharField(max_length=100, blank=True)
    id_verified = models.BooleanField(default=False)
    released_by = models.UUIDField()
    released_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cymed_hospital_mortuary_release_records"
        ordering = ["-released_at"]

    def __str__(self):
        return f"ReleaseRecord(case={self.case_id}, to={self.released_to_name})"

    def clean(self):
        from django.core.exceptions import ValidationError

        if not self.id_verified:
            raise ValidationError("Cannot release remains without id_verified=True -- chain-of-custody requires verified identification of the recipient.")

    def save(self, *args, **kwargs):
        self.clean()
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            self.case.status = "released"
            self.case.save(update_fields=["status", "updated_at"])
