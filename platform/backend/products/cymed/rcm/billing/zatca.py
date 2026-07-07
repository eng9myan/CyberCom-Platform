"""
ZatcaFatoorahService -- ZATCA (Saudi Arabia) Phase 2 e-invoicing connector.

Scope, deliberately: this builds a real, structurally-correct UBL 2.1 XML
invoice, real C14N canonicalization (stdlib xml.etree.ElementTree.canonicalize,
no new dependency), a real SHA-256 hash, a real ECDSA signature over that
hash, and a real Previous Invoice Hash (PIH) chain -- all independently
verifiable without a live ZATCA account. What it does NOT do: the multi-step
ZATCA *onboarding* handshake (CSR generation -> compliance CSID exchange ->
sample-invoice compliance checks -> production CSID exchange via OTP). That
handshake is a separate, larger integration project; this connector assumes
a Production CSID has already been obtained through that process and stored
in TenantComplianceSettings.zatca_production_csid (a PEM-encoded EC private
key). Until that field is actually populated for a tenant, submit_invoice()
always returns "not_submitted" honestly -- it never fabricates a signature,
QR code, or ZATCA acceptance. This mirrors the exact discipline already used
in jofotara.py.
"""
from __future__ import annotations

import base64
import hashlib
import struct
import uuid
from datetime import datetime, timezone as dt_timezone
from typing import Any
from xml.etree import ElementTree as ET

import httpx
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, utils as asym_utils

UBL_NS = {
    "": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    "ext": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
}
ZATCA_REPORTING_URL = "https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/reporting/single"
ZATCA_CLEARANCE_URL = "https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/clearance/single"
ZERO_HASH_B64 = base64.b64encode(b"\x00").decode("ascii")  # ZATCA-defined PIH seed for a device's first invoice
STANDARD_ZATCA_TAX_PERCENT = 15  # matches vat.py::STANDARD_VAT_RATE (0.15) -- category "S" always


def _qn(prefix: str, tag: str) -> str:
    return f"{{{UBL_NS[prefix]}}}{tag}" if prefix else f"{{{UBL_NS['']}}}{tag}"


class ZatcaFatoorahService:
    """One instance per submission attempt; stateless beyond the invoice/settings passed in."""

    def __init__(self, invoice, compliance_settings):
        self.invoice = invoice
        self.settings = compliance_settings  # TenantComplianceSettings instance

    # -- Task 1a: UBL 2.1 XML generation ------------------------------------
    def build_ubl_invoice(self, *, invoice_type_subtype: str = "0200000") -> str:
        """
        Builds ZATCA's UBL 2.1 invoice profile. invoice_type_subtype follows
        ZATCA's 7-digit indicator (default 0200000 = Simplified Tax Invoice /
        B2C; use 0100000 for Standard/B2B clearance-path invoices).
        """
        invoice = self.invoice
        ET.register_namespace("", UBL_NS[""])
        ET.register_namespace("cac", UBL_NS["cac"])
        ET.register_namespace("cbc", UBL_NS["cbc"])

        root = ET.Element(_qn("", "Invoice"))
        ET.SubElement(root, _qn("cbc", "ProfileID")).text = "reporting:1.0"
        ET.SubElement(root, _qn("cbc", "ID")).text = invoice.invoice_number
        ET.SubElement(root, _qn("cbc", "UUID")).text = str(invoice.zatca_invoice_uuid or uuid.uuid4())
        ET.SubElement(root, _qn("cbc", "IssueDate")).text = invoice.invoice_date.isoformat()
        ET.SubElement(root, _qn("cbc", "IssueTime")).text = datetime.now(dt_timezone.utc).strftime("%H:%M:%S")
        ET.SubElement(root, _qn("cbc", "InvoiceTypeCode"), {"name": invoice_type_subtype}).text = "388"
        ET.SubElement(root, _qn("cbc", "DocumentCurrencyCode")).text = invoice.currency
        ET.SubElement(root, _qn("cbc", "TaxCurrencyCode")).text = invoice.currency

        # PIH -- required as an AdditionalDocumentReference per ZATCA spec.
        pih_ref = ET.SubElement(root, _qn("cac", "AdditionalDocumentReference"))
        ET.SubElement(pih_ref, _qn("cbc", "ID")).text = "PIH"
        pih_attachment = ET.SubElement(pih_ref, _qn("cac", "Attachment"))
        ET.SubElement(
            pih_attachment, _qn("cbc", "EmbeddedDocumentBinaryObject"), {"mimeCode": "text/plain"}
        ).text = invoice.zatca_previous_invoice_hash or ZERO_HASH_B64

        supplier_party = ET.SubElement(root, _qn("cac", "AccountingSupplierParty"))
        supplier = ET.SubElement(supplier_party, _qn("cac", "Party"))
        supplier_tax_scheme = ET.SubElement(supplier, _qn("cac", "PartyTaxScheme"))
        ET.SubElement(supplier_tax_scheme, _qn("cbc", "CompanyID")).text = getattr(
            self.settings, "zatca_vat_registration_number", ""
        )

        customer_party = ET.SubElement(root, _qn("cac", "AccountingCustomerParty"))
        customer = ET.SubElement(customer_party, _qn("cac", "Party"))
        party_id = ET.SubElement(customer, _qn("cac", "PartyIdentification"))
        ET.SubElement(party_id, _qn("cbc", "ID"), {"schemeID": "TIN"}).text = str(invoice.patient_account.patient_id)

        # Real ZATCA tax category: "S" (standard-rated), the only category
        # this connector ever emits -- there is no ZATCA category for "the
        # government covers this" (that's a separate patient-payable
        # subsidy allocation on the Invoice model, not a tax-code change;
        # see vat.py). Previously this element was entirely absent -- a real
        # ZATCA-conformance gap independent of the subsidy question.
        tax_total = ET.SubElement(root, _qn("cac", "TaxTotal"))
        ET.SubElement(tax_total, _qn("cbc", "TaxAmount"), {"currencyID": invoice.currency}).text = str(invoice.amount_tax)
        tax_subtotal = ET.SubElement(tax_total, _qn("cac", "TaxSubtotal"))
        ET.SubElement(tax_subtotal, _qn("cbc", "TaxableAmount"), {"currencyID": invoice.currency}).text = str(invoice.amount_subtotal)
        ET.SubElement(tax_subtotal, _qn("cbc", "TaxAmount"), {"currencyID": invoice.currency}).text = str(invoice.amount_tax)
        tax_category = ET.SubElement(tax_subtotal, _qn("cac", "TaxCategory"))
        ET.SubElement(tax_category, _qn("cbc", "ID"), {"schemeID": "UN/ECE 5305", "schemeAgencyID": "6"}).text = "S"
        ET.SubElement(tax_category, _qn("cbc", "Percent")).text = str(STANDARD_ZATCA_TAX_PERCENT)
        tax_scheme = ET.SubElement(tax_category, _qn("cac", "TaxScheme"))
        ET.SubElement(tax_scheme, _qn("cbc", "ID"), {"schemeID": "UN/ECE 5153", "schemeAgencyID": "6"}).text = "VAT"

        monetary_total = ET.SubElement(root, _qn("cac", "LegalMonetaryTotal"))
        ET.SubElement(monetary_total, _qn("cbc", "TaxExclusiveAmount"), {"currencyID": invoice.currency}).text = str(invoice.amount_subtotal)
        ET.SubElement(monetary_total, _qn("cbc", "TaxInclusiveAmount"), {"currencyID": invoice.currency}).text = str(invoice.amount_total)
        ET.SubElement(monetary_total, _qn("cbc", "PayableAmount"), {"currencyID": invoice.currency}).text = str(invoice.amount_total)

        for line in invoice.lines.all().order_by("line_number"):
            invoice_line = ET.SubElement(root, _qn("cac", "InvoiceLine"))
            ET.SubElement(invoice_line, _qn("cbc", "ID")).text = str(line.line_number)
            ET.SubElement(invoice_line, _qn("cbc", "InvoicedQuantity"), {"unitCode": "EA"}).text = str(line.quantity)
            ET.SubElement(invoice_line, _qn("cbc", "LineExtensionAmount"), {"currencyID": invoice.currency}).text = str(line.line_total)

            line_tax_total = ET.SubElement(invoice_line, _qn("cac", "TaxTotal"))
            ET.SubElement(line_tax_total, _qn("cbc", "TaxAmount"), {"currencyID": invoice.currency}).text = str(line.tax_amount)

            item = ET.SubElement(invoice_line, _qn("cac", "Item"))
            ET.SubElement(item, _qn("cbc", "Name")).text = line.service_description
            # Real UBL location for a line's tax category is under
            # Item/ClassifiedTaxCategory, not InvoiceLine/TaxTotal directly.
            # Same "S" standard category every line -- line.tax_rate is
            # always STANDARD_VAT_RATE now (see vat.py), no per-line
            # citizen zero-rate ever reaches this XML.
            classified_tax_category = ET.SubElement(item, _qn("cac", "ClassifiedTaxCategory"))
            ET.SubElement(classified_tax_category, _qn("cbc", "ID"), {"schemeID": "UN/ECE 5305", "schemeAgencyID": "6"}).text = "S"
            ET.SubElement(classified_tax_category, _qn("cbc", "Percent")).text = str((line.tax_rate * 100).normalize())
            line_tax_scheme = ET.SubElement(classified_tax_category, _qn("cac", "TaxScheme"))
            ET.SubElement(line_tax_scheme, _qn("cbc", "ID"), {"schemeID": "UN/ECE 5153", "schemeAgencyID": "6"}).text = "VAT"

            price = ET.SubElement(invoice_line, _qn("cac", "Price"))
            ET.SubElement(price, _qn("cbc", "PriceAmount"), {"currencyID": invoice.currency}).text = str(line.unit_price)

        return ET.tostring(root, encoding="unicode")

    # -- Task 1b: C14N canonicalization --------------------------------------
    @staticmethod
    def canonicalize(xml_str: str) -> bytes:
        """Exclusive XML Canonicalization (C14N) -- stdlib, no new dependency."""
        return ET.canonicalize(xml_str, strip_text=True).encode("utf-8")

    # -- Task 1c: SHA-256 hash -------------------------------------------------
    @staticmethod
    def hash_invoice(canonical_xml: bytes) -> tuple[str, str]:
        """Returns (hex_digest, base64_digest) -- ZATCA's PIH/hash fields use base64."""
        digest = hashlib.sha256(canonical_xml).digest()
        return digest.hex(), base64.b64encode(digest).decode("ascii")

    # -- Task 1d: ECDSA signature over the invoice hash --------------------
    def sign_hash(self, digest: bytes) -> bytes | None:
        """
        Signs `digest` with the tenant's stored Production CSID (expected to
        be a PEM-encoded EC private key). Returns None -- not an exception --
        if no valid key is configured, so callers can treat "can't sign" as
        an ordinary not-yet-onboarded state rather than a crash.
        """
        pem = (self.settings.zatca_production_csid or "").encode("utf-8")
        if not pem.strip():
            return None
        try:
            private_key = serialization.load_pem_private_key(pem, password=None)
        except ValueError:
            return None
        if not isinstance(private_key, ec.EllipticCurvePrivateKey):
            return None
        return private_key.sign(digest, ec.ECDSA(asym_utils.Prehashed(hashes.SHA256())))

    def verify_signature(self, digest: bytes, signature: bytes, public_key: ec.EllipticCurvePublicKey) -> bool:
        try:
            public_key.verify(signature, digest, ec.ECDSA(asym_utils.Prehashed(hashes.SHA256())))
            return True
        except InvalidSignature:
            return False

    # -- QR code (ZATCA TLV, base64) ----------------------------------------
    @staticmethod
    def _tlv(tag: int, value: bytes) -> bytes:
        return struct.pack("BB", tag, len(value)) + value

    def build_qr_code(self, *, seller_name: str, vat_number: str, cryptographic_stamp: bytes, invoice_hash: bytes) -> str:
        invoice = self.invoice
        timestamp = f"{invoice.invoice_date.isoformat()}T{datetime.now(dt_timezone.utc).strftime('%H:%M:%S')}Z"
        tlv = (
            self._tlv(1, seller_name.encode("utf-8"))
            + self._tlv(2, vat_number.encode("utf-8"))
            + self._tlv(3, timestamp.encode("utf-8"))
            + self._tlv(4, str(invoice.amount_total).encode("utf-8"))
            + self._tlv(5, str(invoice.amount_tax).encode("utf-8"))
            + self._tlv(6, invoice_hash)
            + self._tlv(7, cryptographic_stamp)
        )
        return base64.b64encode(tlv).decode("ascii")

    # -- Task 1e: PIH chain ---------------------------------------------------
    @staticmethod
    def previous_hash_for(previous_invoice) -> str:
        """The PIH to embed in THIS invoice -- the hash of the PRECEDING one."""
        if previous_invoice is None:
            return ZERO_HASH_B64
        return previous_invoice.zatca_cryptographic_stamp or ZERO_HASH_B64

    # -- Orchestration --------------------------------------------------------
    def submit(self, *, previous_invoice, device_counter: int, standard: bool = False) -> dict[str, Any]:
        """
        Builds, canonicalizes, hashes, and (if a real Production CSID is
        configured) signs and submits the invoice. Returns a result dict with
        status one of not_submitted/submitted/rejected -- never fabricates
        "accepted" (ZATCA's own async clearance/reporting response decides
        that; this only reports whether OUR submission attempt succeeded).
        """
        if not self.settings.zatca_enabled:
            return {"status": "not_submitted", "reason": "ZATCA compliance is not enabled for this tenant."}

        ubl_xml = self.build_ubl_invoice(invoice_type_subtype="0100000" if standard else "0200000")
        canonical = self.canonicalize(ubl_xml)
        hash_hex, hash_b64 = self.hash_invoice(canonical)
        digest = hashlib.sha256(canonical).digest()

        signature = self.sign_hash(digest)
        if signature is None:
            return {
                "status": "not_submitted",
                "reason": "No valid ZATCA Production CSID configured for this tenant yet -- "
                          "complete onboarding and store it in Regional Compliance & Tax settings.",
                "ubl_xml": ubl_xml,
                "invoice_hash": hash_hex,
            }

        cryptographic_stamp_b64 = base64.b64encode(signature).decode("ascii")
        qr_code = self.build_qr_code(
            seller_name=self.invoice.patient_account.account_number,
            vat_number="",
            cryptographic_stamp=signature,
            invoice_hash=digest,
        )
        previous_hash = self.previous_hash_for(previous_invoice)

        result = {
            "status": "not_submitted",
            "ubl_xml": ubl_xml,
            "invoice_hash": hash_hex,
            "cryptographic_stamp": cryptographic_stamp_b64,
            "qr_code": qr_code,
            "previous_invoice_hash": previous_hash,
            "invoice_counter_value": device_counter,
        }

        url = ZATCA_CLEARANCE_URL if standard else ZATCA_REPORTING_URL
        headers = {
            "Content-Type": "application/json",
            "Accept-Version": "V2",
        }
        body = {
            "invoiceHash": hash_b64,
            "uuid": str(self.invoice.zatca_invoice_uuid or uuid.uuid4()),
            "invoice": base64.b64encode(canonical).decode("ascii"),
        }

        try:
            response = httpx.post(url, json=body, headers=headers, timeout=20)
            response.raise_for_status()
            result["status"] = "submitted"
            result["http_status"] = response.status_code
        except httpx.TransportError as exc:
            # No route to ZATCA's gateway at all (DNS failure, connection
            # refused, timeout) -- this is "the hospital is offline", a
            # retryable condition, distinct from the authority rejecting a
            # well-formed request. hybrid_sync_worker.py queues on this
            # status specifically; it must never queue on a genuine
            # rejection below.
            result["status"] = "offline"
            result["error"] = str(exc)
        except httpx.HTTPStatusError as exc:
            # ZATCA received the request and rejected it (bad invoice data,
            # invalid CSID, etc.) -- not retryable by blind resubmission,
            # needs human review.
            result["status"] = "rejected"
            result["error"] = str(exc)
        except Exception as exc:
            result["status"] = "rejected"
            result["error"] = str(exc)

        return result
