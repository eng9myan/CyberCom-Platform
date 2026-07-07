"""
Per-tenant regional e-invoicing compliance configuration.

JoFotara (Jordan/ISTD) credentials currently live in process-level env vars
(products/cymed/rcm/billing/jofotara.py reads JOFOTARA_CLIENT_ID/SECRET/
INCOME_SOURCE_SEQUENCE) -- fine for a single-tenant pilot, not for a
multi-tenant deployment where different hospitals need different ISTD
registrations. This model makes that configuration per-tenant and adds the
matching ZATCA (Saudi) side, which has no configuration surface at all today.
"""

from django.db import models

from platform.common.models import BaseModel
from platform.common.security.encryption import EncryptedCharField, EncryptedTextField


class TenantComplianceSettings(BaseModel):
    data_classification = "restricted"  # credentials, not PHI, but still sensitive

    # ── Jordan JoFotara (ISTD) ──────────────────────────────────────────
    jofotara_enabled = models.BooleanField(default=False)
    jofotara_tax_registration_number = models.CharField(max_length=50, blank=True)
    jofotara_activity_code = models.CharField(max_length=50, blank=True)
    jofotara_client_secret = EncryptedCharField(max_length=255, blank=True)

    # ── KSA ZATCA Phase 2 ────────────────────────────────────────────────
    zatca_enabled = models.BooleanField(default=False)
    zatca_csid = EncryptedTextField(blank=True)
    zatca_production_csid = EncryptedTextField(blank=True)
    # OTP is single-use, issued by the ZATCA portal for the CSID onboarding
    # step only -- stored encrypted like the others, but callers should clear
    # it (PATCH back to "") once onboarding succeeds so it doesn't linger.
    zatca_onboarding_otp = EncryptedCharField(max_length=20, blank=True)

    # ── KSA NPHIES (National Platform for Health Information Exchange
    # Services) ── real providers connect to NPHIES' Health Service Bus
    # (HSB) via OAuth2 client-credentials + the facility's CCHI-issued
    # provider license, exchanging FHIR Bundles at HSB's $process-message
    # endpoint. No payer-specific config is needed -- HSB is the single
    # gateway for all payers.
    nphies_enabled = models.BooleanField(default=False)
    nphies_provider_license = models.CharField(
        max_length=50, blank=True, help_text="Facility's CCHI/NPHIES-issued provider license number."
    )
    nphies_client_id = models.CharField(max_length=100, blank=True)
    nphies_client_secret = EncryptedCharField(max_length=255, blank=True)

    class Meta:
        db_table = "cymed_commercial_tenant_compliance_settings"
        unique_together = [("tenant_id",)]
        verbose_name_plural = "tenant compliance settings"

    def __str__(self):
        return f"Compliance settings for tenant {self.tenant_id}"
