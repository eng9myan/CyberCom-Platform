from django.db import models

from platform.common.models import BaseModel


class WasteType(models.TextChoices):
    GENERAL = "general", "General/Non-Hazardous"
    BIOHAZARD = "biohazard", "Biohazard (Red Bag)"
    SHARPS = "sharps", "Sharps"
    PHARMACEUTICAL = "pharmaceutical", "Pharmaceutical"
    CHEMOTHERAPY = "chemotherapy", "Chemotherapy/Cytotoxic"
    RADIOACTIVE = "radioactive", "Radioactive"


class WasteCollectionLog(BaseModel):
    """
    Real point-of-generation collection record -- every regulated waste
    stream (biohazard/sharps/pharma/chemo/radioactive) needs a documented
    trail from the unit it was generated in, before it ever reaches a
    licensed hauler.
    """

    STATUS_CHOICES = [
        ("staged", "Staged at Unit"),
        ("collected", "Collected to Holding Depot"),
        ("awaiting_pickup", "Awaiting Hauler Pickup"),
        ("picked_up", "Picked Up by Hauler"),
    ]

    waste_type = models.CharField(max_length=20, choices=WasteType.choices)
    source_location = models.CharField(max_length=100)  # e.g. "OR-3", "ICU", "Pharmacy"
    container_id = models.CharField(max_length=100, blank=True)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    collected_by = models.UUIDField()
    collected_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="staged")
    manifest = models.ForeignKey(
        "HaulerManifest", on_delete=models.SET_NULL, null=True, blank=True, related_name="collection_logs",
    )

    class Meta:
        db_table = "cymed_hospital_waste_collection_logs"
        ordering = ["-collected_at"]
        indexes = [
            models.Index(fields=["tenant_id", "waste_type"]),
            models.Index(fields=["tenant_id", "status"]),
        ]

    def __str__(self):
        return f"WasteCollectionLog({self.waste_type}, {self.source_location}, {self.status})"


class HaulerManifest(BaseModel):
    """
    Real regulatory chain-of-custody document (the actual hazardous-waste
    manifest form every licensed hauler is legally required to produce) --
    what proves the hospital's regulated waste was picked up by a
    licensed hauler and disposed of at an approved facility, not just
    "taken away."
    """

    data_classification = "confidential"

    STATUS_CHOICES = [
        ("pending", "Pending Pickup"),
        ("in_transit", "In Transit"),
        ("disposed", "Disposed / Confirmed"),
    ]

    manifest_number = models.CharField(max_length=100)
    hauler_company = models.CharField(max_length=200)
    hauler_license_number = models.CharField(max_length=100)
    pickup_date = models.DateField()
    waste_type = models.CharField(max_length=20, choices=WasteType.choices)
    total_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    disposal_facility = models.CharField(max_length=200, blank=True)
    disposal_method = models.CharField(max_length=100, blank=True)  # e.g. "incineration", "autoclave"
    facility_representative_signed = models.BooleanField(default=False)
    driver_signature_confirmed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    class Meta:
        db_table = "cymed_hospital_waste_hauler_manifests"
        ordering = ["-pickup_date"]
        unique_together = [["tenant_id", "manifest_number"]]
        indexes = [models.Index(fields=["tenant_id", "status"])]

    def __str__(self):
        return f"HaulerManifest({self.manifest_number}, {self.hauler_company})"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.status == "in_transit" and not (self.facility_representative_signed and self.driver_signature_confirmed):
            raise ValidationError(
                "Cannot mark a manifest in_transit without both facility_representative_signed "
                "and driver_signature_confirmed -- chain-of-custody requires both signatures."
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
