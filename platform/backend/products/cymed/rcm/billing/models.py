from django.db import models

from platform.common.models import BaseModel


class PatientAccount(BaseModel):
    """
    Central billing account for a patient within a tenant.
    Tracks insurance assignments, balances, and account lifecycle.
    """

    ACCOUNT_STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("suspended", "Suspended"),
        ("closed", "Closed"),
    ]

    GUARANTOR_TYPE_CHOICES = [
        ("self", "Self"),
        ("parent", "Parent"),
        ("spouse", "Spouse"),
        ("employer", "Employer"),
        ("government", "Government"),
        ("other", "Other"),
    ]

    patient_id = models.UUIDField(db_index=True)
    account_number = models.CharField(max_length=50, unique=True)
    account_status = models.CharField(
        max_length=20,
        choices=ACCOUNT_STATUS_CHOICES,
        default="active",
    )
    guarantor_patient_id = models.UUIDField(null=True, blank=True)
    guarantor_type = models.CharField(
        max_length=20,
        choices=GUARANTOR_TYPE_CHOICES,
        default="self",
    )
    primary_insurance_member_id = models.UUIDField(null=True, blank=True)
    secondary_insurance_member_id = models.UUIDField(null=True, blank=True)
    tertiary_insurance_member_id = models.UUIDField(null=True, blank=True)
    credit_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    fhir_account_id = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        db_table = "cymed_rcm_bill_patient_accounts"
        unique_together = [["tenant_id", "patient_id"]]
        ordering = ["-created_at"]

    def __str__(self):
        return f"PatientAccount {self.account_number}"


class EncounterBilling(BaseModel):
    """
    Billing record tied to a single clinical encounter.
    Aggregates charges, expected insurance, and patient responsibility.
    """

    ENCOUNTER_TYPE_CHOICES = [
        ("outpatient", "Outpatient"),
        ("inpatient", "Inpatient"),
        ("emergency", "Emergency"),
        ("day_case", "Day Case"),
        ("telemedicine", "Telemedicine"),
        ("home_visit", "Home Visit"),
        ("lab", "Laboratory"),
        ("imaging", "Imaging"),
        ("pharmacy", "Pharmacy"),
    ]

    BILLING_STATUS_CHOICES = [
        ("open", "Open"),
        ("coded", "Coded"),
        ("reviewed", "Reviewed"),
        ("billed", "Billed"),
        ("paid", "Paid"),
        ("partial", "Partial"),
        ("denied", "Denied"),
        ("written_off", "Written Off"),
    ]

    patient_account = models.ForeignKey(
        PatientAccount,
        on_delete=models.PROTECT,
        related_name="encounter_billings",
    )
    encounter_id = models.UUIDField(db_index=True)
    encounter_type = models.CharField(max_length=30, choices=ENCOUNTER_TYPE_CHOICES)
    encounter_date = models.DateField()
    facility_id = models.UUIDField(db_index=True)
    attending_provider_id = models.UUIDField(db_index=True)
    department_id = models.UUIDField(null=True, blank=True)
    billing_status = models.CharField(
        max_length=20,
        choices=BILLING_STATUS_CHOICES,
        default="open",
    )
    total_charges = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    insurance_expected = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    patient_responsibility = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    icd11_primary_diagnosis = models.CharField(max_length=20, blank=True)
    icd11_secondary_diagnoses = models.JSONField(default=list)

    class Meta:
        db_table = "cymed_rcm_bill_encounter_billings"
        unique_together = [["tenant_id", "encounter_id"]]
        ordering = ["-encounter_date"]

    def __str__(self):
        return f"EncounterBilling {self.encounter_id} ({self.billing_status})"


class Invoice(BaseModel):
    """
    Financial invoice issued to a patient, insurance company, or corporate entity.
    """

    INVOICE_TYPE_CHOICES = [
        ("patient", "Patient"),
        ("insurance", "Insurance"),
        ("corporate", "Corporate"),
        ("government", "Government"),
    ]

    BILLING_PARTY_TYPE_CHOICES = [
        ("insurance", "Insurance"),
        ("corporate", "Corporate"),
        ("government", "Government"),
        ("self_pay", "Self Pay"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("issued", "Issued"),
        ("sent", "Sent"),
        ("partial", "Partial"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
        ("cancelled", "Cancelled"),
        ("written_off", "Written Off"),
    ]

    patient_account = models.ForeignKey(
        PatientAccount,
        on_delete=models.PROTECT,
        related_name="invoices",
    )
    encounter_billing = models.ForeignKey(
        EncounterBilling,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_type = models.CharField(max_length=20, choices=INVOICE_TYPE_CHOICES)
    invoice_date = models.DateField()
    due_date = models.DateField()
    billing_party_id = models.UUIDField(null=True, blank=True)
    billing_party_type = models.CharField(
        max_length=20,
        blank=True,
        choices=BILLING_PARTY_TYPE_CHOICES,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    amount_subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_tax = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    # Sum of lines' government_subsidy_amount -- amount_total/amount_tax
    # stay the real, full legal totals (what ZATCA/JoFotara see and what
    # this invoice's UBL reports); this is a separate patient-payable
    # reduction, not a change to the invoice's tax liability.
    amount_government_subsidy = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_outstanding = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="SAR")
    notes = models.TextField(blank=True)
    fhir_invoice_id = models.CharField(max_length=200, blank=True, null=True)

    # Provenance for invoices created by the external ingestion gateway
    # (see gateway.py) -- blank for invoices created normally through the
    # billing UI. Lets staff reviewing a "draft" invoice see at a glance
    # that it came from an external/legacy system rather than being typed
    # in directly.
    external_source_system = models.CharField(max_length=100, blank=True)
    external_reference = models.CharField(max_length=200, blank=True)

    JOFOTARA_STATUS_CHOICES = [
        ("not_submitted", "Not Submitted"),
        ("pending_clearance", "Pending Government Clearance"),
        ("submitted", "Submitted"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]
    jofotara_status = models.CharField(
        max_length=20, choices=JOFOTARA_STATUS_CHOICES, default="not_submitted"
    )
    jofotara_invoice_uuid = models.CharField(max_length=100, blank=True)
    jofotara_qr_code = models.TextField(blank=True)
    jofotara_submitted_at = models.DateTimeField(null=True, blank=True)
    jofotara_error = models.TextField(blank=True)

    # ZATCA Phase 2 (KSA) -- mirrors the jofotara_* fields above; a tenant's
    # country_code determines which of the two schemes actually applies, so
    # both live on the same Invoice rather than being modeled as separate
    # subclasses. See products/cymed/rcm/billing/zatca.py for the connector.
    ZATCA_STATUS_CHOICES = [
        ("not_submitted", "Not Submitted"),
        ("pending_clearance", "Pending Government Clearance"),
        ("submitted", "Submitted"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]
    zatca_status = models.CharField(max_length=20, choices=ZATCA_STATUS_CHOICES, default="not_submitted")
    zatca_invoice_uuid = models.UUIDField(null=True, blank=True)
    zatca_invoice_counter_value = models.PositiveIntegerField(null=True, blank=True)
    zatca_previous_invoice_hash = models.CharField(max_length=128, blank=True)
    zatca_cryptographic_stamp = models.TextField(blank=True)
    zatca_qr_code = models.TextField(blank=True)
    zatca_submitted_at = models.DateTimeField(null=True, blank=True)
    zatca_cleared_at = models.DateTimeField(null=True, blank=True)
    zatca_reported_at = models.DateTimeField(null=True, blank=True)
    zatca_error = models.TextField(blank=True)

    class Meta:
        db_table = "cymed_rcm_bill_invoices"
        ordering = ["-invoice_date"]

    def __str__(self):
        return f"Invoice {self.invoice_number} ({self.status})"


class OfflineTaxQueueEntry(BaseModel):
    """
    Hybrid Edge offline tax queue (Phase 7). When the hospital server's
    internet connection is down, a tax-provider submission attempt fails at
    the TRANSPORT level (no route to the provider's API at all) rather than
    being rejected by the provider itself -- that distinction matters:
    a transport failure is retryable once connectivity returns; a genuine
    business rejection (bad invoice data, expired credentials) is not, and
    queuing it for blind retry would just repeat the same failure forever.

    Local POS/clinical transactions keep saving to the local database the
    whole time -- this queue only holds the tax-submission SIDE of an
    invoice that's otherwise already fully recorded.
    """

    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("retrying", "Retrying"),
        ("submitted", "Submitted"),
        ("failed_permanent", "Failed (Requires Review)"),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="offline_tax_queue_entries")
    provider_code = models.CharField(max_length=20)  # matches tax_providers.py registry keys, e.g. "zatca", "jofotara"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
    queued_at = models.DateTimeField(auto_now_add=True)
    last_attempted_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cymed_rcm_bill_offline_tax_queue"
        ordering = ["queued_at"]
        indexes = [models.Index(fields=["tenant_id", "status"])]

    def __str__(self):
        return f"OfflineTaxQueueEntry({self.invoice.invoice_number}, {self.provider_code}, {self.status})"


class ServiceClassification(models.TextChoices):
    """
    Drives per-line VAT resolution (see vat.py). Every line is taxed at the
    real ZATCA standard rate (15%, category "S") regardless of nationality
    or classification -- ZATCA's UBL schema has no "government pays this"
    tax category, so citizenship never changes the RATE reported to ZATCA.
    "medical_necessity" instead determines whether a qualifying citizen's
    tax is covered by a government subsidy allocation (see
    InvoiceLine.government_subsidy_amount) -- a patient-payable adjustment
    that sits alongside the invoice, not inside its tax representation.
    """

    MEDICAL_NECESSITY = "medical_necessity", "Medical Necessity"
    ELECTIVE = "elective", "Elective"
    RETAIL = "retail", "Retail"


class InvoiceLine(BaseModel):
    """
    Individual line item on an invoice representing a service or charge.
    """

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="lines",
    )
    line_number = models.PositiveSmallIntegerField(default=1)
    service_date = models.DateField()
    service_code = models.CharField(max_length=50)
    service_description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # VAT (Phase: Medical Compliance). Previously only tax_amount existed
    # with nothing anywhere computing it -- every caller just supplied a
    # number directly (confirmed: gateway.py was the only real writer, and
    # it trusted whatever an EXTERNAL system's payload claimed the tax was).
    # tax_rate now stores the resolved RATE itself (auditable -- matches the
    # tax_rate-field convention already used in cycom.finance.ar/ap and
    # procurement.purchase_orders, unlike the flat-constant pattern in
    # pharmacy/pos), and service_classification is the real input the rate
    # resolver needs. See vat.py::resolve_vat_rate / apply_vat_to_line.
    service_classification = models.CharField(
        max_length=20, choices=ServiceClassification.choices, default=ServiceClassification.MEDICAL_NECESSITY,
    )
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Portion of tax_amount the government covers for a qualifying citizen's
    # medical-necessity line -- reduces what the PATIENT owes without
    # changing tax_amount/tax_rate, which stay the real, full legal VAT
    # liability reported to ZATCA. See vat.py::resolve_government_subsidy.
    government_subsidy_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    charge_id = models.UUIDField(null=True, blank=True)
    icd11_diagnosis_code = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = "cymed_rcm_bill_invoice_lines"
        ordering = ["line_number"]

    def __str__(self):
        return f"InvoiceLine {self.line_number} on Invoice {self.invoice_id}"


class BillingAdjustment(BaseModel):
    """
    Financial adjustment applied to an invoice (contractual, write-off, discount, etc.).
    """

    ADJUSTMENT_TYPE_CHOICES = [
        ("contractual", "Contractual"),
        ("write_off", "Write Off"),
        ("discount", "Discount"),
        ("refund", "Refund"),
        ("correction", "Correction"),
        ("insurance_writeoff", "Insurance Write-Off"),
        ("bad_debt", "Bad Debt"),
        ("courtesy", "Courtesy"),
    ]

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="adjustments",
    )
    adjustment_type = models.CharField(max_length=30, choices=ADJUSTMENT_TYPE_CHOICES)
    adjustment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    adjustment_date = models.DateField(auto_now_add=True)
    reason = models.TextField(blank=True)
    approved_by_user_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "cymed_rcm_bill_adjustments"
        ordering = ["-adjustment_date"]

    def __str__(self):
        return f"BillingAdjustment {self.adjustment_type} on Invoice {self.invoice_id}"


class Refund(BaseModel):
    """
    Refund issued against a paid invoice.
    """

    REFUND_METHOD_CHOICES = [
        ("cash", "Cash"),
        ("card", "Card"),
        ("bank_transfer", "Bank Transfer"),
        ("cheque", "Cheque"),
        ("credit_note", "Credit Note"),
        ("insurance_reversal", "Insurance Reversal"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("processed", "Processed"),
        ("rejected", "Rejected"),
    ]

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name="refunds",
    )
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    refund_method = models.CharField(max_length=20, choices=REFUND_METHOD_CHOICES)
    refund_date = models.DateField()
    reason = models.TextField(blank=True)
    processed_by_user_id = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    class Meta:
        db_table = "cymed_rcm_bill_refunds"
        ordering = ["-refund_date"]

    def __str__(self):
        return f"Refund {self.refund_amount} on Invoice {self.invoice_id} ({self.status})"
