from django.db import models

from platform.common.models import BaseModel


class CleaningTask(BaseModel):
    TASK_TYPE_CHOICES = [
        ("routine", "Routine Cleaning"),
        ("terminal", "Terminal Cleaning"),
        ("deep_clean", "Deep Clean"),
        ("spill_response", "Spill Response"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("verified", "Verified"),
    ]

    location = models.CharField(max_length=255)
    task_type = models.CharField(max_length=30, choices=TASK_TYPE_CHOICES, default="routine")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    assigned_to = models.UUIDField(null=True, blank=True)
    scheduled_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.UUIDField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_housekeeping_tasks"
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.location} - {self.task_type} ({self.status})"


class HygieneAudit(BaseModel):
    location = models.CharField(max_length=255)
    audit_date = models.DateField()
    score = models.PositiveSmallIntegerField(help_text="0-100 hygiene compliance score")
    auditor_id = models.UUIDField()
    findings = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_hospital_housekeeping_audits"
        ordering = ["-audit_date"]

    def __str__(self):
        return f"{self.location} - {self.audit_date} ({self.score}%)"
