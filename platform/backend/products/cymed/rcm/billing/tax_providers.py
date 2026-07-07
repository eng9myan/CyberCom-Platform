"""
Pluggable national e-invoicing provider registry.

Ships with ZATCA (Saudi) and JoFotara (Jordan) since those are the two the
platform has real customers for today. A customer operating in a country
with a different mandatory e-invoicing scheme (Egypt's ETA, UAE's upcoming
FTA e-invoicing, etc.) adds support by implementing TaxProviderAdapter for
their connector and registering it here or from their own app's AppConfig.ready()
-- no changes needed to hybrid_sync_worker.py, gateway.py, or the Invoice
model, all of which only ever talk to this registry, never to
ZatcaFatoorahService/JoFotaraISTDService directly.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Protocol


class TaxProviderAdapter(Protocol):
    code: str  # matches OfflineTaxQueueEntry.provider_code and TenantComplianceSettings.<code>_enabled

    def is_enabled(self, compliance_settings) -> bool: ...

    def status_field_names(self) -> "StatusFieldNames": ...

    def submit(self, invoice, compliance_settings, **context) -> dict[str, Any]: ...

    def apply_result(self, invoice, result: dict[str, Any]) -> list[str]:
        """
        Writes a submit() result onto the invoice's provider-specific fields
        and returns the list of field names changed (for update_fields=...).
        Does NOT call invoice.save() -- the caller controls when/whether to
        persist, so a caller processing many invoices can batch or wrap in
        a transaction as needed.
        """
        ...


@dataclass(frozen=True)
class StatusFieldNames:
    """Which Invoice fields this provider writes its result into."""

    status: str
    submitted_at: str
    error: str


def _zatca_submit(invoice, compliance_settings, *, previous_invoice=None, device_counter=1, **_):
    from .zatca import ZatcaFatoorahService

    return ZatcaFatoorahService(invoice, compliance_settings).submit(
        previous_invoice=previous_invoice, device_counter=device_counter,
    )


def _jofotara_submit(invoice, compliance_settings, **_):
    from .jofotara import JoFotaraISTDService

    return JoFotaraISTDService(invoice, compliance_settings).submit()


class _ZatcaAdapter:
    code = "zatca"

    def is_enabled(self, compliance_settings) -> bool:
        return bool(compliance_settings.zatca_enabled)

    def status_field_names(self) -> StatusFieldNames:
        return StatusFieldNames(status="zatca_status", submitted_at="zatca_submitted_at", error="zatca_error")

    def submit(self, invoice, compliance_settings, **context) -> dict[str, Any]:
        return _zatca_submit(invoice, compliance_settings, **context)

    def apply_result(self, invoice, result: dict[str, Any]) -> list[str]:
        from django.utils import timezone

        changed = ["zatca_status"]
        invoice.zatca_status = result["status"] if result["status"] != "offline" else "pending_clearance"
        if result["status"] == "submitted":
            invoice.zatca_cryptographic_stamp = result.get("cryptographic_stamp", "")
            invoice.zatca_qr_code = result.get("qr_code", "")
            invoice.zatca_previous_invoice_hash = result.get("previous_invoice_hash", "")
            invoice.zatca_invoice_counter_value = result.get("invoice_counter_value")
            invoice.zatca_submitted_at = timezone.now()
            invoice.zatca_error = ""
            changed += ["zatca_cryptographic_stamp", "zatca_qr_code", "zatca_previous_invoice_hash", "zatca_invoice_counter_value", "zatca_submitted_at", "zatca_error"]
        elif result["status"] in ("rejected", "offline"):
            invoice.zatca_error = result.get("error", result.get("reason", ""))
            changed.append("zatca_error")
        return changed


class _JoFotaraAdapter:
    code = "jofotara"

    def is_enabled(self, compliance_settings) -> bool:
        return bool(compliance_settings.jofotara_enabled)

    def status_field_names(self) -> StatusFieldNames:
        return StatusFieldNames(status="jofotara_status", submitted_at="jofotara_submitted_at", error="jofotara_error")

    def submit(self, invoice, compliance_settings, **context) -> dict[str, Any]:
        return _jofotara_submit(invoice, compliance_settings, **context)

    def apply_result(self, invoice, result: dict[str, Any]) -> list[str]:
        from django.utils import timezone

        changed = ["jofotara_status"]
        invoice.jofotara_status = result["status"] if result["status"] != "offline" else "pending_clearance"
        if result["status"] == "submitted":
            invoice.jofotara_invoice_uuid = result.get("jofotara_invoice_uuid", "")
            invoice.jofotara_qr_code = result.get("qr_code", "")
            invoice.jofotara_submitted_at = timezone.now()
            invoice.jofotara_error = ""
            changed += ["jofotara_invoice_uuid", "jofotara_qr_code", "jofotara_submitted_at", "jofotara_error"]
        elif result["status"] in ("rejected", "offline"):
            invoice.jofotara_error = result.get("error", result.get("reason", ""))
            changed.append("jofotara_error")
        return changed


_REGISTRY: dict[str, TaxProviderAdapter] = {}


def register_provider(adapter: TaxProviderAdapter) -> None:
    """Called at import time by this module (built-ins) or by a customer's
    own AppConfig.ready() for a country-specific connector they add."""
    _REGISTRY[adapter.code] = adapter


def get_provider(code: str) -> TaxProviderAdapter | None:
    return _REGISTRY.get(code)


def enabled_providers(compliance_settings) -> list[TaxProviderAdapter]:
    """All providers currently enabled for a tenant, in registration order."""
    return [p for p in _REGISTRY.values() if p.is_enabled(compliance_settings)]


register_provider(_ZatcaAdapter())
register_provider(_JoFotaraAdapter())
