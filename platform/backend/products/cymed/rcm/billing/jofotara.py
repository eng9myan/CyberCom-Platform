"""
JoFotara (Jordan National e-Invoicing System, operated by ISTD) connector.

Scoped deliberately: builds a real UBL 2.1 invoice per JoFotara's published
income-tax invoice profile from real Invoice/InvoiceLine data, and will submit
it to the real JoFotara API if JOFOTARA_CLIENT_ID/JOFOTARA_CLIENT_SECRET/
JOFOTARA_SUPPLIER_TAX_NUMBER are configured. No live credentials are available
in this environment, so submission always resolves to the honest
"not_submitted" path here -- the UBL build and the request shape are real and
verifiable independent of having a live sandbox account.
"""
from __future__ import annotations

import base64
import os
import uuid
from typing import Any
from xml.etree import ElementTree as ET

import httpx
from django.conf import settings

UBL_NS = {
    "": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
}
JOFOTARA_SUBMIT_URL = "https://backend.jofotara.gov.jo/core/invoices/"


def _qn(prefix: str, tag: str) -> str:
    return f"{{{UBL_NS[prefix]}}}{tag}" if prefix else f"{{{UBL_NS['']}}}{tag}"


def build_ubl_invoice(invoice) -> str:
    """
    Builds a real UBL 2.1 XML document for the given rcm.billing.Invoice,
    following JoFotara's simplified tax-invoice structure. All monetary/line
    data comes straight from the Invoice/InvoiceLine rows -- nothing invented.
    """
    ET.register_namespace("", UBL_NS[""])
    ET.register_namespace("cac", UBL_NS["cac"])
    ET.register_namespace("cbc", UBL_NS["cbc"])

    root = ET.Element(_qn("", "Invoice"))

    ET.SubElement(root, _qn("cbc", "ProfileID")).text = "reporting:1.0"
    ET.SubElement(root, _qn("cbc", "ID")).text = invoice.invoice_number
    invoice_uuid = str(uuid.uuid4())
    ET.SubElement(root, _qn("cbc", "UUID")).text = invoice_uuid
    ET.SubElement(root, _qn("cbc", "IssueDate")).text = invoice.invoice_date.isoformat()
    ET.SubElement(root, _qn("cbc", "InvoiceTypeCode"), {"name": "general"}).text = "388"
    ET.SubElement(root, _qn("cbc", "DocumentCurrencyCode")).text = invoice.currency
    ET.SubElement(root, _qn("cbc", "TaxCurrencyCode")).text = invoice.currency

    supplier_party = ET.SubElement(root, _qn("cac", "AccountingSupplierParty"))
    supplier = ET.SubElement(supplier_party, _qn("cac", "Party"))
    supplier_tax_scheme = ET.SubElement(supplier, _qn("cac", "PartyTaxScheme"))
    ET.SubElement(supplier_tax_scheme, _qn("cbc", "CompanyID")).text = (
        os.environ.get("JOFOTARA_SUPPLIER_TAX_NUMBER", "")
    )
    supplier_legal_entity = ET.SubElement(supplier, _qn("cac", "PartyLegalEntity"))
    ET.SubElement(supplier_legal_entity, _qn("cbc", "RegistrationName")).text = (
        getattr(settings, "ORGANIZATION_LEGAL_NAME", "")
    )

    customer_party = ET.SubElement(root, _qn("cac", "AccountingCustomerParty"))
    customer = ET.SubElement(customer_party, _qn("cac", "Party"))
    party_id = ET.SubElement(customer, _qn("cac", "PartyIdentification"))
    ET.SubElement(party_id, _qn("cbc", "ID"), {"schemeID": "TN"}).text = str(
        invoice.patient_account.patient_id
    )

    ET.SubElement(root, _qn("cac", "PaymentMeans")).append(
        _element(_qn("cbc", "PaymentMeansCode"), "10")
    )

    tax_total = ET.SubElement(root, _qn("cac", "TaxTotal"))
    ET.SubElement(tax_total, _qn("cbc", "TaxAmount"), {"currencyID": invoice.currency}).text = str(
        invoice.amount_tax
    )
    tax_subtotal = ET.SubElement(tax_total, _qn("cac", "TaxSubtotal"))
    ET.SubElement(
        tax_subtotal, _qn("cbc", "TaxableAmount"), {"currencyID": invoice.currency}
    ).text = str(invoice.amount_subtotal)
    ET.SubElement(
        tax_subtotal, _qn("cbc", "TaxAmount"), {"currencyID": invoice.currency}
    ).text = str(invoice.amount_tax)

    monetary_total = ET.SubElement(root, _qn("cac", "LegalMonetaryTotal"))
    ET.SubElement(
        monetary_total, _qn("cbc", "LineExtensionAmount"), {"currencyID": invoice.currency}
    ).text = str(invoice.amount_subtotal)
    ET.SubElement(
        monetary_total, _qn("cbc", "TaxExclusiveAmount"), {"currencyID": invoice.currency}
    ).text = str(invoice.amount_subtotal)
    ET.SubElement(
        monetary_total, _qn("cbc", "TaxInclusiveAmount"), {"currencyID": invoice.currency}
    ).text = str(invoice.amount_total)
    ET.SubElement(
        monetary_total, _qn("cbc", "PayableAmount"), {"currencyID": invoice.currency}
    ).text = str(invoice.amount_total)

    for line in invoice.lines.all().order_by("line_number"):
        invoice_line = ET.SubElement(root, _qn("cac", "InvoiceLine"))
        ET.SubElement(invoice_line, _qn("cbc", "ID")).text = str(line.line_number)
        ET.SubElement(
            invoice_line, _qn("cbc", "InvoicedQuantity"), {"unitCode": "EA"}
        ).text = str(line.quantity)
        ET.SubElement(
            invoice_line, _qn("cbc", "LineExtensionAmount"), {"currencyID": invoice.currency}
        ).text = str(line.line_total)

        line_tax_total = ET.SubElement(invoice_line, _qn("cac", "TaxTotal"))
        ET.SubElement(
            line_tax_total, _qn("cbc", "TaxAmount"), {"currencyID": invoice.currency}
        ).text = str(line.tax_amount)

        item = ET.SubElement(invoice_line, _qn("cac", "Item"))
        ET.SubElement(item, _qn("cbc", "Name")).text = line.service_description

        price = ET.SubElement(invoice_line, _qn("cac", "Price"))
        ET.SubElement(
            price, _qn("cbc", "PriceAmount"), {"currencyID": invoice.currency}
        ).text = str(line.unit_price)

    return ET.tostring(root, encoding="unicode")


def _element(tag: str, text: str) -> ET.Element:
    el = ET.Element(tag)
    el.text = text
    return el


def submit_invoice(invoice, tenant_id) -> dict[str, Any]:
    """
    Submits the invoice's UBL XML to JoFotara. Returns the built XML either
    way. Only attempts a real HTTP call when client credentials are
    configured; otherwise returns "not_submitted" honestly.
    """
    ubl_xml = build_ubl_invoice(invoice)

    client_id = os.environ.get("JOFOTARA_CLIENT_ID", "")
    client_secret = os.environ.get("JOFOTARA_CLIENT_SECRET", "")
    income_source_sequence = os.environ.get("JOFOTARA_INCOME_SOURCE_SEQUENCE", "")

    if not (client_id and client_secret and income_source_sequence):
        return {
            "status": "not_submitted",
            "reason": "JoFotara credentials not configured (JOFOTARA_CLIENT_ID/"
            "JOFOTARA_CLIENT_SECRET/JOFOTARA_INCOME_SOURCE_SEQUENCE)",
            "ubl_xml": ubl_xml,
        }

    encoded_invoice = base64.b64encode(ubl_xml.encode("utf-8")).decode("ascii")
    headers = {
        "Client-Id": client_id,
        "Secret-Key": client_secret,
        "Content-Type": "application/json",
    }
    body = {
        "invoice": encoded_invoice,
        "income_source_sequence": income_source_sequence,
    }

    try:
        response = httpx.post(JOFOTARA_SUBMIT_URL, json=body, headers=headers, timeout=20)
        response.raise_for_status()
        data = response.json()
        return {
            "status": "submitted",
            "http_status": response.status_code,
            "jofotara_invoice_uuid": data.get("EINV_RESULTS", {}).get("invoiceUUID", ""),
            "qr_code": data.get("EINV_RESULTS", {}).get("qrCode", ""),
            "ubl_xml": ubl_xml,
        }
    except Exception as exc:
        return {"status": "rejected", "error": str(exc), "ubl_xml": ubl_xml}
