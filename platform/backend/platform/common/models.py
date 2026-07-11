"""
Base model classes for all CyberCom platform models.
Implements ADR-0002 (multi-tenancy via RLS) and ADR-0028 (audit trail).
"""

import uuid

from django.db import models
from django.utils import timezone


class UUIDPrimaryKeyMixin(models.Model):
    """All platform entities use UUID primary keys."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimestampMixin(models.Model):
    """Automatic created_at / updated_at tracking."""

    created_at = models.DateTimeField(default=timezone.now, editable=False, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        abstract = True


class TenantScopedMixin(models.Model):
    """
    Adds tenant_id to every row. PostgreSQL RLS enforces row-level isolation
    using the `app.current_tenant_id` GUC set by TenantIsolationMiddleware.
    ADR-0002 T-Shared tier.
    """

    tenant_id = models.UUIDField(db_index=True, editable=False)

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    """Soft-delete support: records are flagged deleted, not physically removed."""

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True, editable=False)

    def soft_delete(self) -> None:
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    class Meta:
        abstract = True


class BaseModel(UUIDPrimaryKeyMixin, TimestampMixin, TenantScopedMixin):
    """
    Standard base model for all tenant-scoped CyberCom entities.
    Inherits: UUID pk, timestamps, tenant isolation.
    """

    # STANDARDS.md: "PHI/PII fields must be marked with data_classification =
    # DataClassification.RESTRICTED." This is a plain class attribute (not a
    # model field -- no migration, no per-row storage) so every model can be
    # introspected for its sensitivity level by audit/access-control/export
    # tooling. Subclasses holding PHI must override to "phi"; see
    # platform.audit.models.DataClassification for the full value set.
    data_classification: str = "internal"

    class Meta:
        abstract = True


class MigrationRecord(UUIDPrimaryKeyMixin, TimestampMixin, TenantScopedMixin):
    """
    One row per record created by a customer-data-migration script run
    (scripts/import_patients.py, scripts/import_inventory.py, etc.) --
    lets validate_migration.py confirm exactly what a batch created and
    rollback_migration.py undo exactly that batch, nothing else. Without
    this, "rollback batch X" has no way to know which rows belong to X
    versus data that existed before the import or was entered by hand
    afterward.
    """

    batch_id = models.UUIDField(db_index=True)
    entity_type = models.CharField(
        max_length=100, help_text='e.g. "patient", "stock_item", "stock_batch".'
    )
    model_label = models.CharField(
        max_length=200, help_text='Django app_label.ModelName, e.g. "cymed_patients.Patient".'
    )
    object_id = models.UUIDField()
    source_row_identifier = models.CharField(
        max_length=255, blank=True, help_text="Natural key from the source CSV row (MRN, SKU, etc.)."
    )
    imported_by_script = models.CharField(max_length=255)
    rolled_back_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "platform_common_migration_records"
        indexes = [
            models.Index(fields=["tenant_id", "batch_id"]),
            models.Index(fields=["tenant_id", "model_label", "object_id"]),
        ]

    def __str__(self):
        return f"MigrationRecord(batch={self.batch_id}, {self.model_label}={self.object_id})"


class PlatformModel(UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Base model for platform-level (non-tenant-scoped) entities like
    tenant registry, identity config, system settings.
    """

    class Meta:
        abstract = True
