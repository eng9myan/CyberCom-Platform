from django.db import models

from platform.common.models import BaseModel
from products.cymed.hospital.inpatient.models import HospitalStay


class DietOrder(BaseModel):
    """
    Physician-prescribed inpatient diet -- FK to HospitalStay (unlike
    RehabReferral's loose patient_id) because dietary/tray service is
    specifically an inpatient-stay concern tied to a bed location; retail
    cafeteria sales to staff/visitors are a separate POS matter, not
    modeled here.
    """

    data_classification = "phi"

    DIET_TYPE_CHOICES = [
        ("regular", "Regular"),
        ("diabetic", "Diabetic"),
        ("renal", "Renal"),
        ("cardiac", "Cardiac (Low Sodium/Fat)"),
        ("pureed", "Pureed"),
        ("npo", "NPO (Nothing by Mouth)"),
        ("clear_liquid", "Clear Liquid"),
        ("full_liquid", "Full Liquid"),
        ("low_sodium", "Low Sodium"),
        ("gluten_free", "Gluten Free"),
    ]

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE, related_name="diet_orders")
    diet_type = models.CharField(max_length=20, choices=DIET_TYPE_CHOICES)
    allergies = models.TextField(blank=True)
    ordered_by = models.UUIDField()
    ordered_at = models.DateTimeField(auto_now_add=True)
    discontinued_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cymed_hospital_dietary_diet_orders"
        ordering = ["-ordered_at"]
        indexes = [models.Index(fields=["tenant_id", "discontinued_at"])]

    def __str__(self):
        return f"DietOrder({self.diet_type}, stay={self.stay_id})"

    @property
    def is_active(self) -> bool:
        return self.discontinued_at is None


class NutritionScreening(BaseModel):
    """
    Real malnutrition-risk screening (MUST/NRS-2002-style methodology --
    the standard tool most hospital dietary/nutrition programs use).
    """

    data_classification = "phi"

    RISK_LEVEL_CHOICES = [
        ("low", "Low Risk"),
        ("moderate", "Moderate Risk"),
        ("high", "High Risk"),
    ]

    stay = models.ForeignKey(HospitalStay, on_delete=models.CASCADE, related_name="nutrition_screenings")
    screening_date = models.DateField(auto_now_add=True)
    malnutrition_risk_score = models.PositiveSmallIntegerField(help_text="MUST-style composite score")
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES)
    screened_by = models.UUIDField()
    referred_to_dietitian = models.BooleanField(default=False)

    class Meta:
        db_table = "cymed_hospital_dietary_nutrition_screenings"
        ordering = ["-screening_date"]
        indexes = [models.Index(fields=["tenant_id", "risk_level"])]

    def __str__(self):
        return f"NutritionScreening({self.risk_level}, stay={self.stay_id})"


class MealTrayTicket(BaseModel):
    """
    Kitchen tray-assembly-line ticket for a single meal service -- what
    actually drives the tray build/delivery workflow described in the
    physical dietary/kitchen department.
    """

    MEAL_TYPE_CHOICES = [
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("dinner", "Dinner"),
        ("snack", "Snack"),
    ]
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("prepared", "Prepared"),
        ("delivered", "Delivered"),
        ("refused", "Refused by Patient"),
    ]

    diet_order = models.ForeignKey(DietOrder, on_delete=models.CASCADE, related_name="tray_tickets")
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    scheduled_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    delivered_at = models.DateTimeField(null=True, blank=True)
    substitutions_notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_dietary_tray_tickets"
        ordering = ["scheduled_date"]
        indexes = [models.Index(fields=["tenant_id", "status"])]

    def __str__(self):
        return f"MealTrayTicket({self.meal_type}, {self.scheduled_date}, {self.status})"
