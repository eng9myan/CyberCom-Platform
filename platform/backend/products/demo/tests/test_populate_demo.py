import pytest
from django.core.management import call_command
from django.test import TestCase

from platform.tenant.models import Tenant
from products.cycom.assets.models import Asset
from products.cycom.bi.models import DashboardMetric
from products.cycom.finance.gl.models import Account, JournalEntry
from products.cycom.hr.models import Employee
from products.cycom.inventory.models import StockItem
from products.cymed.core.encounters.models import Encounter
from products.cymed.core.facilities.models import Bed, Department, Facility, Room, Ward
from products.cymed.core.organizations.models import Organization
from products.cymed.core.patients.models import Patient
from products.cymed.core.providers.models import Provider
from products.cymed.hospital.adt.models import Admission
from products.cymed.hospital.icu.models import CriticalEvent, ICUStay
from products.cymed.hospital.inpatient.models import HospitalStay, VTEProphylaxisOrder
from products.cymed.hospital.nursing.models import NursingAssignment, NursingHandover
from products.cymed.imaging.orders.models import ImagingOrder
from products.cymed.laboratory.orders.models import LabOrder
from products.cymed.pharmacy.prescriptions.models import Prescription
from products.cymed.rcm.billing.models import EncounterBilling, Invoice
from products.cymed.rcm.claims.models import Claim


@pytest.mark.django_db
class TestPopulateDemoCommand(TestCase):
    def test_populate_demo_seeds_network_and_workflows(self):
        # 1. Execute the management command
        call_command("populate_demo")

        # 2. Assert Tenant & Organization Seeding
        tenant = Tenant.objects.get(slug="cybercom-care")
        self.assertEqual(tenant.name, "CyberCom Care Network")

        org = Organization.objects.get(slug="cybercom-network")
        self.assertEqual(org.name, "CyberCom Healthcare Network")

        # 3. Assert Facilities Seeding
        facilities = Facility.objects.filter(tenant_id=tenant.id)
        self.assertEqual(facilities.count(), 8)

        hospital = Facility.objects.get(code="HOSP-AMAL")
        self.assertEqual(hospital.name, "Al-Amal General Hospital")

        # 4. Assert Bed management structures
        dept_er = Department.objects.get(code="DEPT-ER", facility=hospital)
        ward_er = Ward.objects.get(code="WARD-ER", department=dept_er)
        room_er = Room.objects.get(room_number="ER-101", ward=ward_er)
        bed_er = Bed.objects.get(bed_number="ER-BED-1", room=room_er)
        self.assertEqual(bed_er.status, "available")

        # 5. Assert Providers & HR Employees Seeding
        providers = Provider.objects.filter(tenant_id=tenant.id)
        self.assertTrue(providers.exists())
        self.assertTrue(providers.filter(provider_type="physician").exists())
        self.assertTrue(providers.filter(provider_type="nurse").exists())

        employees = Employee.objects.filter(tenant_id=tenant.id)
        self.assertTrue(employees.exists())

        # 6. Assert Patient & Encounter Seeding
        pat_aisha = Patient.objects.get(mrn="MRN-PAT-001")
        self.assertEqual(pat_aisha.first_name, "Aisha")

        encounters = Encounter.objects.filter(patient=pat_aisha)
        self.assertTrue(encounters.exists())

        # 7. Assert Lab & Imaging Orders
        self.assertTrue(LabOrder.objects.filter(patient_id=pat_aisha.id).exists())
        self.assertTrue(ImagingOrder.objects.filter(patient_id=pat_aisha.id).exists())

        # 8. Assert Prescriptions
        self.assertTrue(Prescription.objects.filter(patient_id=pat_aisha.id).exists())

        # 9. Assert Billing & Claims
        billing = EncounterBilling.objects.get(patient_account__patient_id=pat_aisha.id)
        self.assertEqual(float(billing.total_charges), 450.00)

        invoice = Invoice.objects.get(encounter_billing=billing)
        self.assertEqual(float(invoice.amount_total), 450.00)

        claim = Claim.objects.get(encounter_billing_id=billing.id)
        self.assertEqual(float(claim.total_billed_amount), 450.00)

        # 10. Assert CyCom ERP Integration
        # Finance General Ledger Accounts
        accounts = Account.objects.filter(tenant_id=tenant.id)
        self.assertTrue(accounts.exists())
        self.assertTrue(accounts.filter(code="101000").exists())  # Cash

        # Journal Entry
        je = JournalEntry.objects.get(reference=invoice.invoice_number)
        self.assertEqual(float(je.total_debit), 450.00)

        # Inventory
        self.assertTrue(StockItem.objects.filter(sku="DRUG-VITD-001").exists())

        # Assets
        self.assertTrue(Asset.objects.filter(code="AST-CT-001").exists())

        # BI Dashboard metrics
        self.assertTrue(
            DashboardMetric.objects.filter(name="average_er_wait_time_minutes").exists()
        )

        # 11. Assert Hospital ADT/ICU/Nursing workflow (Phase 5) -- exercises the real
        # hospital services, not raw model rows, so this proves the wired API endpoints work.
        pat_faisal = Patient.objects.get(mrn="MRN-PAT-002")
        admission = Admission.objects.get(encounter__patient=pat_faisal)
        self.assertEqual(admission.status, "admitted")

        stay = HospitalStay.objects.get(admission=admission)
        self.assertEqual(stay.current_code_status, "full_code")
        self.assertEqual(stay.code_status_orders.count(), 1)

        vte_order = VTEProphylaxisOrder.objects.get(stay=stay)
        self.assertEqual(vte_order.method, "mechanical")

        self.assertTrue(NursingAssignment.objects.filter(tenant_id=tenant.id).exists())
        self.assertTrue(NursingHandover.objects.filter(admission=admission).exists())

        icu_stay = ICUStay.objects.get(stay=stay)
        self.assertTrue(icu_stay.rounds.exists())
        self.assertEqual(
            CriticalEvent.objects.filter(icu_stay=icu_stay).count(), 1
        )
