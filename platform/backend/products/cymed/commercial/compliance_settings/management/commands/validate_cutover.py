"""
validate_cutover -- production cutover readiness audit.

Structure/style follows the one existing precedent in this codebase for
custom management commands (products/demo/management/commands/populate_demo.py):
phased self.stdout.write(self.style.X(...)) sections, read-only.

Real scope, honestly stated up front: this process (platform/backend) and
CyCom (products/cycom/*) share ONE Postgres database (core/settings.py's
DATABASES has a single "default" alias) -- so CyMed clinical data and CyCom
inventory/tax-config data CAN both be queried here via the normal ORM.
CyShop is a SEPARATE Django project (cyshop/backend, its own manage.py,
settings, and database connection) physically living elsewhere in this
monorepo but not reachable from this process at all -- this command does
NOT and CANNOT validate CyShop from here. If a cutover needs CyShop data
verified, run an equivalent command inside cyshop/backend against its own
database. This command validates CyMed + CyCom only, and says so loudly.

Exit code: 1 if any HARD issue is found (broken referential integrity,
FEFO-required fields somehow null, tenant compliance settings missing
credentials for an enabled provider). Warnings (pending transmissions,
already-expired batches) do not fail the exit code -- they're surfaced for
staff review, not blockers.
"""
from __future__ import annotations

import uuid

from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    help = "Audit CyMed + CyCom data integrity and ZATCA/JoFotara transmission readiness ahead of a production cutover."

    def add_arguments(self, parser):
        parser.add_argument("--tenant-id", required=True, help="Tenant UUID to audit.")
        parser.add_argument(
            "--sample-size", type=int, default=10,
            help="Max number of example rows to print per issue category (default 10).",
        )

    def handle(self, *args, **options):
        try:
            tenant_id = uuid.UUID(options["tenant_id"])
        except ValueError as exc:
            raise CommandError(f"--tenant-id is not a valid UUID: {exc}") from exc

        sample_size = options["sample_size"]
        hard_issues = 0

        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL app.current_tenant_id = %s;", [str(tenant_id)])

        self.stdout.write(self.style.WARNING(f"=== validate_cutover: tenant {tenant_id} ==="))
        self.stdout.write(self.style.WARNING(
            "Scope: CyMed (products.cymed.*) + CyCom (products.cycom.*) only -- both share this "
            "process's database. CyShop is a SEPARATE Django project (cyshop/backend) with its "
            "own database, NOT reachable from here -- validate it separately."
        ))

        hard_issues += self._check_patient_data(tenant_id, sample_size)
        hard_issues += self._check_referential_integrity(tenant_id, sample_size)
        hard_issues += self._check_inventory(tenant_id, sample_size)
        hard_issues += self._check_tax_compliance(tenant_id, sample_size)

        self.stdout.write("")
        if hard_issues == 0:
            self.stdout.write(self.style.SUCCESS(f"=== CUTOVER CHECK PASSED -- 0 hard issues for tenant {tenant_id} ==="))
        else:
            self.stdout.write(self.style.ERROR(f"=== CUTOVER CHECK FAILED -- {hard_issues} hard issue(s) for tenant {tenant_id} ==="))
            raise CommandError(f"{hard_issues} hard issue(s) found -- see output above.")

    # -- Section 1: CyMed patient data ---------------------------------
    def _check_patient_data(self, tenant_id, sample_size) -> int:
        from products.cymed.core.patients.models import Patient

        self.stdout.write("")
        self.stdout.write(self.style.WARNING("-- CyMed: Patient data --"))

        patients = Patient.objects.filter(tenant_id=tenant_id)
        total = patients.count()
        missing_national_id = patients.filter(national_id__isnull=True) | patients.filter(national_id="")
        missing_count = missing_national_id.distinct().count()

        self.stdout.write(f"  Total patients: {total}")
        if missing_count:
            self.stdout.write(self.style.WARNING(
                f"  {missing_count} patient(s) missing national_id (regional-compliance gap, not a hard failure -- "
                "these can still transact, but should be followed up on)."
            ))
            for p in missing_national_id.distinct()[:sample_size]:
                self.stdout.write(f"    - mrn={p.mrn} ({p.first_name} {p.last_name})")
        else:
            self.stdout.write(self.style.SUCCESS("  All patients have national_id on file."))

        return 0  # informational only -- national_id gaps are not a hard cutover blocker

    # -- Section 2: cross-app loose-UUID referential integrity --------
    def _check_referential_integrity(self, tenant_id, sample_size) -> int:
        from products.cymed.core.patients.models import Patient
        from products.cymed.rcm.billing.models import PatientAccount
        from products.cymed.rcm.eligibility.models import EligibilityRequest
        from products.cymed.rcm.insurance.models import InsuranceMember
        from products.cymed.rcm.preauthorization.models import Preauthorization

        self.stdout.write("")
        self.stdout.write(self.style.WARNING("-- CyMed: cross-app referential integrity --"))
        self.stdout.write(
            "  rcm/* references Patient via a loose UUID (patient_id), not a real FK (established "
            "convention -- see PatientAccount/InsuranceMember/EligibilityRequest/Preauthorization). "
            "That means the DB does NOT enforce these -- checking here instead."
        )

        known_patient_ids = set(Patient.objects.filter(tenant_id=tenant_id).values_list("id", flat=True))
        hard_issues = 0

        checks = [
            ("PatientAccount", PatientAccount.objects.filter(tenant_id=tenant_id)),
            ("InsuranceMember", InsuranceMember.objects.filter(tenant_id=tenant_id)),
            ("EligibilityRequest", EligibilityRequest.objects.filter(tenant_id=tenant_id)),
            ("Preauthorization", Preauthorization.objects.filter(tenant_id=tenant_id)),
        ]
        for label, queryset in checks:
            rows = list(queryset.values_list("id", "patient_id"))
            dangling = [(row_id, pid) for row_id, pid in rows if pid not in known_patient_ids]
            if dangling:
                hard_issues += 1
                self.stdout.write(self.style.ERROR(
                    f"  {label}: {len(dangling)}/{len(rows)} row(s) reference a patient_id that does not exist in Patient."
                ))
                for row_id, pid in dangling[:sample_size]:
                    self.stdout.write(f"    - {label} {row_id} -> missing patient_id {pid}")
            else:
                self.stdout.write(self.style.SUCCESS(f"  {label}: {len(rows)} row(s), all patient_id references resolve."))

        return hard_issues

    # -- Section 3: CyCom inventory / FEFO ------------------------------
    def _check_inventory(self, tenant_id, sample_size) -> int:
        from products.cycom.inventory.models import StockBatch, StockItem

        self.stdout.write("")
        self.stdout.write(self.style.WARNING("-- CyCom: inventory / FEFO --"))

        items = StockItem.objects.filter(tenant_id=tenant_id)
        batches = StockBatch.objects.filter(tenant_id=tenant_id)
        self.stdout.write(f"  StockItem rows: {items.count()}, StockBatch rows: {batches.count()}")

        # batch_number/expiry_date are non-nullable model fields -- a
        # mismatch here would mean the DB schema itself is out of sync
        # with migrations, which is a real hard-fail signal worth
        # surfacing explicitly rather than assuming it can't happen.
        incomplete_batches = batches.filter(batch_number="") | batches.filter(expiry_date__isnull=True)
        incomplete_count = incomplete_batches.distinct().count()
        hard_issues = 0
        if incomplete_count:
            hard_issues += 1
            self.stdout.write(self.style.ERROR(
                f"  {incomplete_count} StockBatch row(s) missing batch_number/expiry_date -- "
                "should be impossible under the current schema; migrations may be out of sync."
            ))
        else:
            self.stdout.write(self.style.SUCCESS("  All StockBatch rows have batch_number and expiry_date (as the schema requires)."))

        # Reconciliation: for items that have at least one batch, the sum
        # of batch quantities should equal the item's own aggregate --
        # both are maintained by StockMovement.save(), but drift is
        # possible if anything ever bypasses that path.
        mismatches = []
        for item in items.prefetch_related("batches"):
            item_batches = list(item.batches.all())
            if not item_batches:
                continue
            batch_total = sum(b.quantity_on_hand for b in item_batches)
            if batch_total != item.quantity:
                mismatches.append((item.sku, item.quantity, batch_total))
        if mismatches:
            hard_issues += 1
            self.stdout.write(self.style.ERROR(
                f"  {len(mismatches)} StockItem(s) where quantity != sum(batch.quantity_on_hand) -- "
                "aggregate/batch drift, needs reconciliation before go-live."
            ))
            for sku, item_qty, batch_qty in mismatches[:sample_size]:
                self.stdout.write(f"    - {sku}: item.quantity={item_qty} vs sum(batches)={batch_qty}")
        else:
            self.stdout.write(self.style.SUCCESS("  All batch-tracked StockItem quantities reconcile against their batches."))

        return hard_issues

    # -- Section 4: tax/compliance readiness for ZATCA/JoFotara --------
    def _check_tax_compliance(self, tenant_id, sample_size) -> int:
        from products.cymed.commercial.compliance_settings.models import TenantComplianceSettings
        from products.cymed.rcm.billing.models import Invoice, InvoiceLine

        self.stdout.write("")
        self.stdout.write(self.style.WARNING("-- Tax configuration (ZATCA/JoFotara) --"))
        self.stdout.write(
            "  Real home: products.cymed.commercial.compliance_settings.TenantComplianceSettings "
            "-- NOT under products.cycom (there is no cycom tax-config model)."
        )

        settings_row = TenantComplianceSettings.objects.filter(tenant_id=tenant_id).first()
        hard_issues = 0
        if settings_row is None:
            hard_issues += 1
            self.stdout.write(self.style.ERROR("  No TenantComplianceSettings row exists for this tenant -- nothing is configured."))
            return hard_issues

        if settings_row.zatca_enabled and not settings_row.zatca_production_csid:
            hard_issues += 1
            self.stdout.write(self.style.ERROR(
                "  ZATCA is enabled but zatca_production_csid is not set -- "
                "ZatcaFatoorahService.submit() will honestly no-op ('not_submitted') for every invoice."
            ))
        elif settings_row.zatca_enabled:
            self.stdout.write(self.style.SUCCESS("  ZATCA enabled and Production CSID is configured."))
        else:
            self.stdout.write("  ZATCA not enabled for this tenant.")

        if settings_row.jofotara_enabled and not (settings_row.jofotara_client_id and settings_row.jofotara_client_secret):
            hard_issues += 1
            self.stdout.write(self.style.ERROR(
                "  JoFotara is enabled but Client-Id/Client-Secret are not both set -- "
                "JoFotaraISTDService.submit() will honestly no-op ('not_submitted') for every invoice."
            ))
        elif settings_row.jofotara_enabled:
            self.stdout.write(self.style.SUCCESS("  JoFotara enabled and Client-Id/Client-Secret are configured."))
        else:
            self.stdout.write("  JoFotara not enabled for this tenant.")

        # Visibility only (not a hard failure): invoices that would be
        # eligible for transmission but haven't been submitted yet.
        transmittable_statuses = ["issued", "sent", "partial", "paid"]
        pending_zatca = pending_jofotara = 0
        if settings_row.zatca_enabled:
            pending_zatca = Invoice.objects.filter(
                tenant_id=tenant_id, status__in=transmittable_statuses, zatca_status="not_submitted",
            ).count()
        if settings_row.jofotara_enabled:
            pending_jofotara = Invoice.objects.filter(
                tenant_id=tenant_id, status__in=transmittable_statuses, jofotara_status="not_submitted",
            ).count()
        if pending_zatca or pending_jofotara:
            self.stdout.write(self.style.WARNING(
                f"  Pending transmission (not a hard failure, review before go-live): "
                f"{pending_zatca} invoice(s) awaiting ZATCA submission, {pending_jofotara} awaiting JoFotara submission."
            ))

        # Anomaly check: every InvoiceLine should be at the real standard
        # rate now (0.15) -- see vat.py's correction (no more 0% citizen
        # zero-rate on the tax_rate itself, only government_subsidy_amount
        # varies). A line at any other rate predates that fix.
        anomalous_lines = InvoiceLine.objects.filter(tenant_id=tenant_id).exclude(tax_rate="0.1500").count()
        if anomalous_lines:
            self.stdout.write(self.style.WARNING(
                f"  {anomalous_lines} InvoiceLine(s) with tax_rate != 0.15 -- predates the ZATCA "
                "subsidy-model correction (vat.py), review before go-live."
            ))
        else:
            self.stdout.write(self.style.SUCCESS("  All InvoiceLine rows are at the real ZATCA standard rate (15%)."))

        return hard_issues
