from django.db import models

from platform.common.models import BaseModel
from products.cymed.hospital.adt.models import Admission


class NursingShift(BaseModel):
    name = models.CharField(max_length=100)  # Day shift, Night shift
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        db_table = "cymed_hospital_nursing_shifts"


class NursingAssignment(BaseModel):
    nurse_id = models.UUIDField()
    ward_id = models.UUIDField()
    shift = models.ForeignKey(NursingShift, on_delete=models.CASCADE)
    assigned_date = models.DateField()

    class Meta:
        db_table = "cymed_hospital_nursing_assignments"


class NursingAssessment(BaseModel):
    """
    Structured nursing assessment: Morse Fall Scale (validated fall-risk tool),
    Braden Scale (validated pressure-injury-risk tool), and a 0-10 pain score,
    alongside free-text narrative. Scores/risk levels are derived from the
    component fields on save() -- never entered directly -- so they can't
    drift out of sync with the standard scoring tools they represent.
    """

    data_classification = "phi"

    # --- Morse Fall Scale components (Morse, 1989) ---
    history_of_falling = models.BooleanField(default=False)  # 0 or 25 pts
    secondary_diagnosis = models.BooleanField(default=False)  # 0 or 15 pts
    AMBULATORY_AID_CHOICES = [
        ("none_bedrest_assist", "None / Bed Rest / Nurse Assist"),  # 0 pts
        ("crutches_cane_walker", "Crutches / Cane / Walker"),  # 15 pts
        ("furniture", "Furniture"),  # 30 pts
    ]
    ambulatory_aid = models.CharField(
        max_length=30, choices=AMBULATORY_AID_CHOICES, default="none_bedrest_assist"
    )
    iv_therapy = models.BooleanField(default=False)  # 0 or 20 pts
    GAIT_CHOICES = [
        ("normal_bedrest_wheelchair", "Normal / Bed Rest / Wheelchair"),  # 0 pts
        ("weak", "Weak"),  # 10 pts
        ("impaired", "Impaired"),  # 20 pts
    ]
    gait = models.CharField(max_length=30, choices=GAIT_CHOICES, default="normal_bedrest_wheelchair")
    MENTAL_STATUS_CHOICES = [
        ("oriented_to_own_ability", "Oriented to Own Ability"),  # 0 pts
        ("forgets_limitations", "Forgets Limitations"),  # 15 pts
    ]
    mental_status = models.CharField(
        max_length=30, choices=MENTAL_STATUS_CHOICES, default="oriented_to_own_ability"
    )
    morse_fall_score = models.PositiveSmallIntegerField(default=0)
    fall_risk_level = models.CharField(max_length=20, blank=True)

    # --- Braden Scale components (Bergstrom & Braden) -- each 1 (worst) to 4 (best) ---
    braden_sensory_perception = models.PositiveSmallIntegerField(default=4)
    braden_moisture = models.PositiveSmallIntegerField(default=4)
    braden_activity = models.PositiveSmallIntegerField(default=4)
    braden_mobility = models.PositiveSmallIntegerField(default=4)
    braden_nutrition = models.PositiveSmallIntegerField(default=4)
    braden_friction_shear = models.PositiveSmallIntegerField(default=3)  # this subscale maxes at 3
    braden_score = models.PositiveSmallIntegerField(default=0)
    pressure_injury_risk_level = models.CharField(max_length=20, blank=True)

    # --- Pain (0-10 Numeric Rating Scale) ---
    pain_score = models.PositiveSmallIntegerField(null=True, blank=True)

    admission = models.ForeignKey(Admission, on_delete=models.CASCADE)
    assessed_by = models.UUIDField()
    assessed_at = models.DateTimeField(auto_now_add=True)
    nursing_summary = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_nursing_assessments"

    def _compute_morse_fall_score(self) -> int:
        score = 0
        score += 25 if self.history_of_falling else 0
        score += 15 if self.secondary_diagnosis else 0
        score += {"none_bedrest_assist": 0, "crutches_cane_walker": 15, "furniture": 30}[
            self.ambulatory_aid
        ]
        score += 20 if self.iv_therapy else 0
        score += {"normal_bedrest_wheelchair": 0, "weak": 10, "impaired": 20}[self.gait]
        score += {"oriented_to_own_ability": 0, "forgets_limitations": 15}[self.mental_status]
        return score

    @staticmethod
    def _morse_risk_level(score: int) -> str:
        if score >= 45:
            return "high"
        if score >= 25:
            return "moderate"
        return "low"

    def _compute_braden_score(self) -> int:
        return (
            self.braden_sensory_perception
            + self.braden_moisture
            + self.braden_activity
            + self.braden_mobility
            + self.braden_nutrition
            + self.braden_friction_shear
        )

    @staticmethod
    def _braden_risk_level(score: int) -> str:
        if score <= 9:
            return "severe"
        if score <= 12:
            return "high"
        if score <= 14:
            return "moderate"
        if score <= 18:
            return "mild"
        return "no_risk"

    def save(self, *args, **kwargs):
        self.morse_fall_score = self._compute_morse_fall_score()
        self.fall_risk_level = self._morse_risk_level(self.morse_fall_score)
        self.braden_score = self._compute_braden_score()
        self.pressure_injury_risk_level = self._braden_risk_level(self.braden_score)
        super().save(*args, **kwargs)


class NursingCarePlan(BaseModel):
    data_classification = "phi"

    admission = models.ForeignKey(Admission, on_delete=models.CASCADE)
    goals = models.TextField()
    activities = models.TextField()

    class Meta:
        db_table = "cymed_hospital_nursing_careplans"


class NursingTask(BaseModel):
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE)
    task_name = models.CharField(max_length=255)
    scheduled_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=50,
        choices=[("pending", "Pending"), ("completed", "Completed"), ("skipped", "Skipped")],
        default="pending",
    )

    class Meta:
        db_table = "cymed_hospital_nursing_tasks"


class NursingHandover(BaseModel):
    data_classification = "phi"

    admission = models.ForeignKey(Admission, on_delete=models.CASCADE)
    outgoing_nurse_id = models.UUIDField()
    incoming_nurse_id = models.UUIDField()
    handover_time = models.DateTimeField(auto_now_add=True)
    situation_background = models.TextField()  # SBAR format
    assessment_recommendation = models.TextField()

    class Meta:
        db_table = "cymed_hospital_nursing_handovers"
