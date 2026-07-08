from django.db import models

from platform.common.models import BaseModel


class Asset(BaseModel):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("retired", "Retired"),
        ("maintenance", "Maintenance"),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=100)
    asset_type = models.CharField(max_length=50)  # e.g., medical_device, computer, vehicle
    purchase_date = models.DateField()
    purchase_cost = models.DecimalField(max_digits=18, decimal_places=2)
    salvage_value = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    useful_life_years = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    class Meta:
        db_table = "cycom_assets"

    def __str__(self):
        return f"{self.code} - {self.name}"


class AssetDepreciation(BaseModel):
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name="depreciations",
    )
    depreciation_date = models.DateField()
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    accumulated_depreciation = models.DecimalField(max_digits=18, decimal_places=2)
    book_value = models.DecimalField(max_digits=18, decimal_places=2)

    class Meta:
        db_table = "cycom_asset_depreciations"
        ordering = ["-depreciation_date"]


class BiomedicalEquipment(BaseModel):
    """
    Biomedical/clinical-engineering extension of Asset -- reuses the real,
    already-registered Asset model (asset_type="medical_device" is already
    a valid free-text value there) rather than duplicating it. This is the
    single source of truth for calibration_due status and equipment
    tracking (the dead, never-registered cycom.assets.fixed_assets
    duplicate that used to sit alongside this app has been removed --
    see the consolidation commit).
    """

    STATUS_CHOICES = [
        ("in_service", "In Service"),
        ("calibration_due", "Calibration Due"),
        ("under_repair", "Under Repair"),
        ("out_of_service", "Out of Service"),
        ("decommissioned", "Decommissioned"),
    ]

    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, related_name="biomedical_detail")
    manufacturer = models.CharField(max_length=200, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)  # e.g. "ICU", "OR-3", "Radiology"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="in_service")
    calibration_interval_days = models.PositiveIntegerField(default=365)
    last_calibration_date = models.DateField(null=True, blank=True)
    next_calibration_due = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "cycom_assets_biomedical_equipment"
        indexes = [
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "next_calibration_due"]),
        ]

    def __str__(self):
        return f"BiomedicalEquipment({self.asset.code})"

    @property
    def is_available_for_use(self) -> bool:
        """
        Real, queryable fact for whatever eventually gates OR/imaging
        booking against equipment availability (e.g. hospital.
        operating_room / imaging.scheduling checking this before
        confirming a slot) -- that scheduling-side integration is a
        separate, not-yet-built piece; this property is the foundation
        it would call.
        """
        return self.status == "in_service"


class EquipmentServiceRecord(BaseModel):
    SERVICE_TYPE_CHOICES = [
        ("calibration", "Calibration"),
        ("preventive_maintenance", "Preventive Maintenance"),
        ("repair", "Repair"),
        ("safety_inspection", "Safety Inspection"),
    ]

    equipment = models.ForeignKey(BiomedicalEquipment, on_delete=models.CASCADE, related_name="service_records")
    service_type = models.CharField(max_length=30, choices=SERVICE_TYPE_CHOICES)
    service_date = models.DateField()
    performed_by = models.CharField(max_length=200)  # technician name or vendor
    next_due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cycom_assets_equipment_service_records"
        ordering = ["-service_date"]

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new and self.service_type in ("calibration", "preventive_maintenance", "safety_inspection"):
            # Keep the equipment's own calibration-tracking fields in sync
            # with its real service history, rather than requiring a
            # separate manual update every time a service record is filed.
            self.equipment.last_calibration_date = self.service_date
            self.equipment.next_calibration_due = self.next_due_date
            if self.equipment.status == "calibration_due":
                self.equipment.status = "in_service"
            self.equipment.save(update_fields=["last_calibration_date", "next_calibration_due", "status", "updated_at"])
