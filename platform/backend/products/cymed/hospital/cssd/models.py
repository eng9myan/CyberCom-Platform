from django.db import models

from platform.common.models import BaseModel


class SterilizationLoad(BaseModel):
    CYCLE_TYPE_CHOICES = [
        ("steam", "Steam Autoclave"),
        ("eto", "Ethylene Oxide"),
        ("plasma", "Hydrogen Peroxide Plasma"),
    ]
    STATUS_CHOICES = [
        ("loading", "Loading"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]
    BI_RESULT_CHOICES = [
        ("pending", "Pending"),
        ("pass", "Pass"),
        ("fail", "Fail"),
    ]

    load_number = models.CharField(max_length=50, unique=True)
    sterilizer_id = models.CharField(max_length=100)
    cycle_type = models.CharField(max_length=30, choices=CYCLE_TYPE_CHOICES)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="loading")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    biological_indicator_result = models.CharField(
        max_length=20, choices=BI_RESULT_CHOICES, default="pending"
    )
    operator_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_cssd_loads"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.load_number} ({self.status})"


class InstrumentSet(BaseModel):
    STATUS_CHOICES = [
        ("dirty", "Dirty / Awaiting Sterilization"),
        ("sterile", "Sterile"),
        ("issued", "Issued"),
        ("contaminated", "Contaminated"),
        ("expired", "Expired"),
    ]

    set_code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    load = models.ForeignKey(
        SterilizationLoad, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="instrument_sets",
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="dirty")
    expiry_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_cssd_instrument_sets"
        ordering = ["set_code"]

    def __str__(self):
        return f"{self.set_code} - {self.name} ({self.status})"


class InstrumentTracking(BaseModel):
    EVENT_TYPE_CHOICES = [
        ("issued", "Issued"),
        ("returned", "Returned"),
        ("contaminated", "Contaminated Reported"),
    ]

    instrument_set = models.ForeignKey(
        InstrumentSet, on_delete=models.CASCADE, related_name="tracking_events"
    )
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES)
    location = models.CharField(max_length=255, blank=True)
    logged_by = models.UUIDField(null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cymed_hospital_cssd_tracking"
        ordering = ["-logged_at"]

    def __str__(self):
        return f"{self.instrument_set.set_code} - {self.event_type}"
