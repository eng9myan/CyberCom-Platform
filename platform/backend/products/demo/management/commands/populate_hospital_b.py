"""
Seeds the "test-hospital-b" tenant with a real, independent hospital
(org, facilities, wards, beds, staff, patients, ER-to-admission workflow)
through the same service-layer calls populate_demo/populate_demo_bulk
use. Exists so the Multi-Hospital Dashboard / HealthGroup snapshot has a
second real hospital to aggregate against, instead of one real hospital
plus one empty tenant shell reporting all zeros.
"""

import datetime
import uuid

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from platform.tenant.models import Tenant
from products.cymed.core.encounters.models import Encounter, EncounterParticipant, EncounterReason
from products.cymed.core.facilities.models import Bed, Department as CymedDepartment, Facility, Room, Ward
from products.cymed.core.organizations.models import Organization
from products.cymed.core.patients.models import Patient
from products.cymed.core.providers.models import Provider
from products.cymed.hospital.adt.models import AdmissionReason, AdmissionType, DischargeDisposition, DischargeReason
from products.cymed.hospital.services import AdmissionService, ClinicalSafetyService, EmergencyService

PATIENTS = [
    ("Mona", "Rasheed", "female", (1990, 2, 11), "Sudden severe headache, worst of life", 2, "R51.9", "Headache, unspecified"),
    ("Bandar", "Otaibi", "male", (1982, 6, 30), "Motor vehicle collision, chest wall pain", 3, "S29.9XXA", "Unspecified injury of thorax"),
    ("Reem", "Sabri", "female", (2005, 9, 3), "Twisted ankle playing football", 4, "S93.409A", "Sprain of unspecified ligament of ankle"),
]


class Command(BaseCommand):
    help = "Seed the test-hospital-b tenant with a real, independent second hospital for cross-tenant testing."

    def handle(self, *args, **options):
        with transaction.atomic():
            tenant = Tenant.objects.get(slug="test-hospital-b")
            t_id = tenant.id
            self.stdout.write(self.style.WARNING(f"Seeding Hospital B ({t_id})..."))

            org, _ = Organization.objects.get_or_create(
                tenant_id=t_id, slug="hospital-b-network",
                defaults={"name": "Hospital B Network", "organization_type": "hospital"},
            )
            hosp, _ = Facility.objects.get_or_create(
                tenant_id=t_id, code="HOSP-B",
                defaults={"organization": org, "name": "Hospital B Medical Center", "is_active": True},
            )

            dept_er, _ = CymedDepartment.objects.get_or_create(
                tenant_id=t_id, facility=hosp, code="DEPT-ER", defaults={"name": "Emergency Room"}
            )
            ward_er, _ = Ward.objects.get_or_create(
                tenant_id=t_id, department=dept_er, code="WARD-ER", defaults={"name": "Emergency Ward"}
            )
            dept_med, _ = CymedDepartment.objects.get_or_create(
                tenant_id=t_id, facility=hosp, code="DEPT-INPATIENT", defaults={"name": "Inpatient Medicine"}
            )
            ward_med, _ = Ward.objects.get_or_create(
                tenant_id=t_id, department=dept_med, code="WARD-MED", defaults={"name": "Medical Ward"}
            )

            beds = {"er": [], "med": []}
            for i in range(1, 3):
                room, _ = Room.objects.get_or_create(
                    tenant_id=t_id, ward=ward_er, room_number=f"B-ER-10{i}", defaults={"room_type": "exam"}
                )
                bed, _ = Bed.objects.get_or_create(
                    tenant_id=t_id, room=room, bed_number=f"B-ER-BED-{i}", defaults={"status": "available"}
                )
                beds["er"].append(bed)
            for i in range(1, 4):
                room, _ = Room.objects.get_or_create(
                    tenant_id=t_id, ward=ward_med, room_number=f"B-MED-20{i}", defaults={"room_type": "standard"}
                )
                bed, _ = Bed.objects.get_or_create(
                    tenant_id=t_id, room=room, bed_number=f"B-MED-BED-{i}", defaults={"status": "available"}
                )
                beds["med"].append(bed)

            phys, _ = Provider.objects.get_or_create(
                npi="NPI-PHYS-B01",
                defaults={
                    "tenant_id": t_id, "user_id": uuid.uuid4(), "first_name": "Lina", "last_name": "Fakhoury",
                    "provider_type": "physician", "is_active": True,
                },
            )
            nurse, _ = Provider.objects.get_or_create(
                npi="NPI-NURSE-B01",
                defaults={
                    "tenant_id": t_id, "user_id": uuid.uuid4(), "first_name": "Dana", "last_name": "Khalil",
                    "provider_type": "nurse", "is_active": True,
                },
            )

            adm_type_er, _ = AdmissionType.objects.get_or_create(
                tenant_id=t_id, code="T-EMERGENCY", defaults={"name": "Emergency"}
            )
            adm_reason, _ = AdmissionReason.objects.get_or_create(
                tenant_id=t_id, code="R-GEN", defaults={"name": "General Admission"}
            )
            DischargeReason.objects.get_or_create(tenant_id=t_id, code="R-DIS-RECOVERED", defaults={"name": "Recovered"})
            DischargeDisposition.objects.get_or_create(tenant_id=t_id, code="D-DIS-HOME", defaults={"name": "Home"})

            for idx, (first, last, gender, dob, complaint, esi, icd_code, icd_display) in enumerate(PATIENTS):
                mrn = f"MRN-HB-{idx + 1:03d}"
                if Patient.objects.filter(mrn=mrn).exists():
                    continue
                patient = Patient.objects.create(
                    tenant_id=t_id, mrn=mrn, first_name=first, last_name=last,
                    dob=datetime.date(*dob), gender=gender,
                    national_id=str(3000000000 + idx),
                )
                self.stdout.write(f"  {first} {last} ({mrn}): {complaint}")

                arrived_at = timezone.now() - datetime.timedelta(minutes=20 + idx * 15)
                er_visit = EmergencyService.register_emergency_visit(
                    tenant_id=str(t_id), patient_id=str(patient.id), chief_complaint=complaint,
                    arrival_mode="walk_in", arrived_at=arrived_at,
                )
                EmergencyService.triage_patient(
                    tenant_id=str(t_id), visit_id=er_visit["visit_id"],
                    triage_data={"esi_level": esi}, triaged_by=str(nurse.user_id),
                )

                if esi <= 3:
                    enc = Encounter.objects.create(
                        tenant_id=t_id, patient=patient, encounter_type="inpatient", status="in_progress",
                        organization=org, facility=hosp, start_time=arrived_at,
                    )
                    EncounterParticipant.objects.create(tenant_id=t_id, encounter=enc, provider=phys, role="lead")
                    EncounterReason.objects.create(tenant_id=t_id, encounter=enc, reason_code=icd_code, reason_text=complaint)
                    med_bed = beds["med"][idx % len(beds["med"])]
                    admit_res = AdmissionService.admit_patient(
                        tenant_id=str(t_id), patient_id=str(patient.id), encounter_id=str(enc.id),
                        admission_type_id=str(adm_type_er.id), admission_reason_id=str(adm_reason.id),
                        admitting_physician_id=str(phys.user_id), bed_id=str(med_bed.id),
                    )
                    ClinicalSafetyService.set_code_status(
                        tenant_id=str(t_id), stay_id=admit_res["stay_id"], status="full_code",
                        ordered_by=str(phys.user_id), reason="Standard admission code status discussion",
                        discussed_with_patient=True, discussed_with_family=False,
                    )

        self.stdout.write(self.style.SUCCESS("Hospital B seeded: 3 patients, real ER + admission workflow."))
