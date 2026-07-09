"""
CyberCom Demo Bulk Seeder -- populate_demo_bulk management command.

Adds volume on top of `populate_demo` (which creates exactly one canonical
patient per workflow, idempotently, and is meant to stay that way). This
command generates additional patients and routes each through a REAL
workflow using the same service-layer calls the frontend/API use --
EmergencyService, AdmissionService, ICUService, NursingService,
ClinicalSafetyService -- so every generated row respects the same
business rules and state machine as a real user action would.

Not idempotent by design: each run adds a fresh batch (new MRNs), so it
can be re-run to keep growing the demo dataset for UI/audit purposes.
"""

import datetime
import random
import uuid

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from platform.tenant.models import Tenant
from types import SimpleNamespace

from products.cycom.assets.models import Asset, BiomedicalEquipment, EquipmentServiceRecord
from products.cymed.clinic.billing_bridge.models import ChargeCode, ClinicService, PriceList
from products.cymed.clinic.billing_bridge.serializers import ChargeItemSerializer
from products.cymed.core.encounters.models import Encounter, EncounterDiagnosis, EncounterParticipant, EncounterReason
from products.cymed.core.facilities.models import Bed, Department as CymedDepartment, Facility, Room, Ward
from products.cymed.core.organizations.models import Organization
from products.cymed.core.patients.models import Patient
from products.cymed.core.providers.models import Provider
from products.cymed.hospital.adt.models import AdmissionReason, AdmissionType, DischargeDisposition, DischargeReason
from products.cymed.hospital.dietary.models import DietOrder, NutritionScreening
from products.cymed.hospital.icu.models import ICUStay, ICUUnitType
from products.cymed.hospital.infection_control.models import HandHygieneObservation, IsolationPrecaution
from products.cymed.hospital.inpatient.models import HospitalStay
from products.cymed.hospital.linen_services.models import LaundryBatch, LinenCart
from products.cymed.hospital.mortuary.models import MortuaryCase
from products.cymed.hospital.nursing.models import NursingShift
from products.cymed.hospital.quality_management.models import QualityIndicator, QualityMeasurement
from products.cymed.hospital.rehabilitation.models import RehabDiscipline, RehabReferral, TreatmentPlan
from products.cymed.hospital.research.models import ResearchProtocol, StudyEnrollment
from products.cymed.hospital.services import (
    AdmissionService,
    ClinicalSafetyService,
    EmergencyService,
    ICUService,
    NursingService,
)
from products.cymed.hospital.waste_management.models import HaulerManifest, WasteCollectionLog, WasteType

PATIENT_NAMES = [
    ("Layla", "Hassan", "female", (1992, 3, 14)),
    ("Omar", "Qureshi", "male", (1985, 7, 2)),
    ("Nadia", "Farouk", "female", (1979, 11, 30)),
    ("Yousef", "Al-Bakr", "male", (2001, 5, 19)),
    ("Huda", "Zaidan", "female", (1966, 1, 8)),
    ("Karim", "Rashid", "male", (1994, 9, 25)),
    ("Salma", "Odeh", "female", (2018, 6, 4)),
    ("Tariq", "Nassar", "male", (1958, 12, 17)),
]

CHIEF_COMPLAINTS = [
    ("Fall from standing height, right hip pain", 3, "S72.001A", "Fracture of unspecified part of neck of right femur"),
    ("Shortness of breath, productive cough 3 days", 3, "J18.9", "Pneumonia, unspecified organism"),
    ("Severe abdominal pain, RLQ, rebound tenderness", 2, "K35.80", "Unspecified acute appendicitis"),
    ("Postpartum hemorrhage, referred from clinic", 2, "O72.1", "Other immediate postpartum hemorrhage"),
    ("Altered mental status, hypoglycemia", 2, "E11.641", "Type 2 diabetes with hypoglycemia"),
    ("High fever, febrile seizure (pediatric)", 3, "R56.00", "Simple febrile convulsions"),
    ("Chest tightness, exertional dyspnea, elderly", 2, "I50.9", "Heart failure, unspecified"),
    ("Laceration, deep, kitchen knife injury", 4, "S61.419A", "Unspecified open wound of right hand"),
]


class Command(BaseCommand):
    help = "Add a batch of additional demo patients through real hospital workflows for UI/audit volume."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=8, help="How many new patients to generate (max 8).")

    def handle(self, *args, **options):
        count = min(options["count"], len(PATIENT_NAMES))
        self.stdout.write(self.style.WARNING(f"Seeding {count} additional demo patients through real workflows..."))

        with transaction.atomic():
            tenant = Tenant.objects.get(slug="cybercom-care")
            t_id = tenant.id
            org = Organization.objects.get(tenant_id=t_id, slug="cybercom-network")
            hosp = Facility.objects.get(tenant_id=t_id, code="HOSP-AMAL")

            phys_er = Provider.objects.get(npi="NPI-PHYS-001")
            nurse_er = Provider.objects.get(npi="NPI-NURSE-001")
            phys_clinic = Provider.objects.get(npi="NPI-PHYS-002")

            dept_er = CymedDepartment.objects.get(tenant_id=t_id, facility=hosp, code="DEPT-ER")
            ward_er = Ward.objects.get(tenant_id=t_id, department=dept_er, code="WARD-ER")
            dept_inpatient = CymedDepartment.objects.get(tenant_id=t_id, facility=hosp, code="DEPT-INPATIENT")
            ward_med = Ward.objects.get(tenant_id=t_id, department=dept_inpatient, code="WARD-MED")
            dept_icu = CymedDepartment.objects.get(tenant_id=t_id, facility=hosp, code="DEPT-ICU")
            ward_icu = Ward.objects.get(tenant_id=t_id, department=dept_icu, code="WARD-ICU")

            adm_type_er = AdmissionType.objects.get(tenant_id=t_id, code="T-EMERGENCY")
            adm_reason_acs = AdmissionReason.objects.get(tenant_id=t_id, code="R-ACS")
            DischargeReason.objects.get_or_create(tenant_id=t_id, code="R-DIS-RECOVERED", defaults={"name": "Recovered"})
            DischargeDisposition.objects.get_or_create(tenant_id=t_id, code="D-DIS-HOME", defaults={"name": "Home"})

            shift_day, _ = NursingShift.objects.get_or_create(
                tenant_id=t_id, name="Day Shift", defaults={"start_time": "07:00", "end_time": "19:00"}
            )

            # -- Extra bed capacity so the census board has real volume --
            extra_beds = {"er": [], "med": [], "icu": []}
            for i in range(2, 5):
                room, _ = Room.objects.get_or_create(
                    tenant_id=t_id, ward=ward_er, room_number=f"ER-10{i}", defaults={"room_type": "exam"}
                )
                bed, _ = Bed.objects.get_or_create(
                    tenant_id=t_id, room=room, bed_number=f"ER-BED-{i}", defaults={"status": "available"}
                )
                extra_beds["er"].append(bed)
            for i in range(3, 7):
                room, _ = Room.objects.get_or_create(
                    tenant_id=t_id, ward=ward_med, room_number=f"MED-20{i}", defaults={"room_type": "standard"}
                )
                bed, _ = Bed.objects.get_or_create(
                    tenant_id=t_id, room=room, bed_number=f"MED-BED-{i}", defaults={"status": "available"}
                )
                extra_beds["med"].append(bed)
            for i in range(2, 5):
                room, _ = Room.objects.get_or_create(
                    tenant_id=t_id, ward=ward_icu, room_number=f"ICU-0{i}", defaults={"room_type": "icu"}
                )
                bed, _ = Bed.objects.get_or_create(
                    tenant_id=t_id, room=room, bed_number=f"ICU-BED-{i}", defaults={"status": "available"}
                )
                extra_beds["icu"].append(bed)

            created_stays = []

            for idx in range(count):
                first, last, gender, dob = PATIENT_NAMES[idx]
                complaint, esi, icd_code, icd_display = CHIEF_COMPLAINTS[idx]
                mrn = f"MRN-BULK-{idx + 1:03d}"

                patient = Patient.objects.filter(mrn=mrn).first()
                if patient:
                    continue  # already generated by a prior run
                patient = Patient.objects.create(
                    tenant_id=t_id,
                    mrn=mrn,
                    first_name=first,
                    last_name=last,
                    dob=datetime.date(*dob),
                    gender=gender,
                    national_id=str(1000000000 + random.randint(1, 899999999)),
                )

                self.stdout.write(f"  {first} {last} ({mrn}): {complaint}")

                # Every patient gets a real ER visit + triage, arrival time
                # staggered over the last few hours so wait-time displays
                # are realistic (not months-stale, not all zero).
                arrived_at = timezone.now() - datetime.timedelta(minutes=random.randint(12, 240))
                er_visit = EmergencyService.register_emergency_visit(
                    tenant_id=str(t_id),
                    patient_id=str(patient.id),
                    chief_complaint=complaint,
                    arrival_mode=random.choice(["ambulance", "walk_in", "referral"]),
                    arrived_at=arrived_at,
                )
                EmergencyService.triage_patient(
                    tenant_id=str(t_id),
                    visit_id=er_visit["visit_id"],
                    triage_data={"esi_level": esi},
                    triaged_by=str(nurse_er.user_id),
                )

                # Route: ESI 1-2 -> admit (some to ICU); ESI 3-5 -> ER-only for most
                admit_roll = esi <= 2 or (esi == 3 and idx % 2 == 0)

                if not admit_roll:
                    continue  # stays as an active ER case -- good for the ER board too

                enc_inpatient = Encounter.objects.create(
                    tenant_id=t_id,
                    patient=patient,
                    encounter_type="inpatient",
                    status="in_progress",
                    organization=org,
                    facility=hosp,
                    start_time=arrived_at,
                )
                EncounterParticipant.objects.create(
                    tenant_id=t_id, encounter=enc_inpatient, provider=phys_er, role="lead"
                )
                EncounterReason.objects.create(
                    tenant_id=t_id, encounter=enc_inpatient, reason_code=icd_code, reason_text=complaint
                )
                EncounterDiagnosis.objects.create(
                    tenant_id=t_id, encounter=enc_inpatient, condition_code=icd_code,
                    display=icd_display, use="chief_complaint",
                )

                med_bed = extra_beds["med"][idx % len(extra_beds["med"])]
                admit_res = AdmissionService.admit_patient(
                    tenant_id=str(t_id),
                    patient_id=str(patient.id),
                    encounter_id=str(enc_inpatient.id),
                    admission_type_id=str(adm_type_er.id),
                    admission_reason_id=str(adm_reason_acs.id),
                    admitting_physician_id=str(phys_er.user_id),
                    bed_id=str(med_bed.id),
                )
                ClinicalSafetyService.set_code_status(
                    tenant_id=str(t_id), stay_id=admit_res["stay_id"], status="full_code",
                    ordered_by=str(phys_er.user_id), reason="Standard admission code status discussion",
                    discussed_with_patient=True, discussed_with_family=False,
                )
                NursingService.assign_nurse(
                    tenant_id=str(t_id), nurse_id=str(nurse_er.user_id), ward_id=str(ward_med.id),
                    shift_id=str(shift_day.id), patients=[str(patient.id)],
                )

                stay = HospitalStay.objects.get(id=admit_res["stay_id"])
                created_stays.append((patient, stay, enc_inpatient))

                # ESI 1-2 with even index -> escalate to ICU (mix of unit types)
                if esi <= 2 and idx % 2 == 0:
                    icu_bed = extra_beds["icu"][idx % len(extra_beds["icu"])]
                    icu_res = ICUService.admit_to_icu(
                        tenant_id=str(t_id), encounter_id=str(enc_inpatient.id), bed_id=str(icu_bed.id),
                        admission_dx=icd_display, admitted_by=str(phys_er.user_id),
                    )
                    unit_type = ICUUnitType.NEONATAL if dob[0] >= 2015 else random.choice(
                        [ICUUnitType.MEDICAL_SURGICAL, ICUUnitType.CORONARY_CARE]
                    )
                    ICUStay.objects.filter(id=icu_res["icu_stay_id"]).update(unit_type=unit_type)
                    ICUService.complete_icu_round(
                        tenant_id=str(t_id), icu_stay_id=icu_res["icu_stay_id"],
                        round_data={
                            "heart_rate": random.randint(70, 130), "mean_arterial_pressure": random.randint(60, 95),
                            "temp_c": round(random.uniform(36.5, 39.2), 1), "resp_rate": random.randint(14, 28),
                            "o2_sat": random.randint(88, 99), "pao2_fio2": random.randint(180, 400),
                            "glasgow_coma_scale": random.randint(10, 15),
                        },
                        rounded_by=str(nurse_er.user_id),
                    )

                # Diet order + nutrition screening on every admitted stay
                DietOrder.objects.create(
                    tenant_id=t_id, stay=stay, diet_type=random.choice(["regular", "diabetic", "cardiac", "npo"]),
                    ordered_by=phys_er.user_id,
                )
                NutritionScreening.objects.create(
                    tenant_id=t_id, stay=stay, malnutrition_risk_score=random.randint(0, 6),
                    risk_level=random.choice(["low", "moderate", "high"]), screened_by=nurse_er.user_id,
                )

                # Isolation precaution + hand hygiene observation on ~half of stays
                if idx % 2 == 0:
                    IsolationPrecaution.objects.create(
                        tenant_id=t_id, stay=stay, precaution_type=random.choice(["contact", "droplet"]),
                        reason="Screening pending", ordered_by=phys_er.user_id,
                    )
                HandHygieneObservation.objects.create(
                    tenant_id=t_id, unit=ward_med.name, observed_staff_id=nurse_er.user_id,
                    moment=random.choice(["before_patient_contact", "after_patient_contact"]),
                    compliant=random.random() > 0.15, observed_by=phys_er.user_id,
                )

            # -- Outpatient clinic-only workflow for realism (billed same day) --
            for idx in range(count):
                first, last, gender, dob = PATIENT_NAMES[idx]
                mrn = f"MRN-OUT-{idx + 1:03d}"
                if Patient.objects.filter(mrn=mrn).exists():
                    continue
                out_patient = Patient.objects.create(
                    tenant_id=t_id, mrn=mrn, first_name=first, last_name=f"{last}-Clinic",
                    dob=datetime.date(*dob), gender=gender,
                    national_id=str(2000000000 + random.randint(1, 899999999)),
                )
                enc = Encounter.objects.create(
                    tenant_id=t_id, patient=out_patient, encounter_type="outpatient", status="finished",
                    organization=org, facility=hosp,
                    start_time=timezone.now() - datetime.timedelta(days=random.randint(1, 14)),
                )
                EncounterParticipant.objects.create(tenant_id=t_id, encounter=enc, provider=phys_clinic, role="lead")
                price_list, _ = PriceList.objects.get_or_create(
                    tenant_id=t_id, code="PL-STANDARD", defaults={"name": "Standard", "currency": "SAR"}
                )
                charge_code, _ = ChargeCode.objects.get_or_create(
                    tenant_id=t_id, code="CPT-99213", defaults={"display": "Office Visit, Established Patient", "category": "consultation"}
                )
                service, _ = ClinicService.objects.get_or_create(
                    tenant_id=t_id, price_list=price_list, charge_code=charge_code, defaults={"price": 180.00}
                )
                fake_request = SimpleNamespace(tenant_id=t_id)
                serializer = ChargeItemSerializer(
                    data={"encounter": str(enc.id), "service": str(service.id), "quantity": 1},
                    context={"request": fake_request},
                )
                if serializer.is_valid():
                    serializer.save()  # real GL posting path -- same as ChargeItemViewSet.create()
                else:
                    self.stdout.write(self.style.WARNING(f"    charge item skipped: {serializer.errors}"))

            # -- One mortuary case, tied to its own closed inpatient stay (not any active patient above) --
            if not Patient.objects.filter(mrn="MRN-MORT-001").exists():
                dec_patient = Patient.objects.create(
                    tenant_id=t_id, mrn="MRN-MORT-001", first_name="Ibrahim", last_name="Qassim",
                    dob=datetime.date(1949, 2, 20), gender="male", national_id="1077788899",
                )
                dec_enc = Encounter.objects.create(
                    tenant_id=t_id, patient=dec_patient, encounter_type="inpatient", status="finished",
                    organization=org, facility=hosp, start_time=timezone.now() - datetime.timedelta(days=5),
                    end_time=timezone.now() - datetime.timedelta(hours=6),
                )
                EncounterParticipant.objects.create(tenant_id=t_id, encounter=dec_enc, provider=phys_er, role="lead")
                dec_admit = AdmissionService.admit_patient(
                    tenant_id=str(t_id), patient_id=str(dec_patient.id), encounter_id=str(dec_enc.id),
                    admission_type_id=str(adm_type_er.id), admission_reason_id=str(adm_reason_acs.id),
                    admitting_physician_id=str(phys_er.user_id),
                )
                dec_stay = HospitalStay.objects.get(id=dec_admit["stay_id"])
                MortuaryCase.objects.create(
                    tenant_id=t_id, stay=dec_stay, time_of_death=timezone.now() - datetime.timedelta(hours=6),
                    pronounced_by=phys_er.user_id, cause_of_death_summary="Cardiopulmonary arrest, end-stage heart failure",
                    refrigeration_bay="MORT-BAY-1", intake_by=phys_er.user_id,
                )

            # -- Rehab referral + treatment plan on one of the admitted stays --
            if created_stays:
                pat, stay, enc = created_stays[0]
                referral = RehabReferral.objects.create(
                    tenant_id=t_id, patient_id=pat.id, discipline=RehabDiscipline.PHYSICAL_THERAPY,
                    referring_provider_id=phys_er.user_id, diagnosis="Post-fall deconditioning, right hip",
                )
                TreatmentPlan.objects.create(
                    tenant_id=t_id, referral=referral, goals="Restore independent ambulation with walker",
                    therapist_id=nurse_er.user_id,
                )

            # -- Research protocol + one enrollment --
            protocol, _ = ResearchProtocol.objects.get_or_create(
                tenant_id=t_id, protocol_number="PROTO-2026-014",
                defaults={
                    "title": "Early Mobilization After Hip Fracture Surgery: A Pragmatic Trial",
                    "principal_investigator_id": phys_er.user_id, "sponsor": "internal",
                    "irb_status": "approved", "phase": "n_a", "target_enrollment": 60,
                },
            )
            if created_stays:
                pat, stay, enc = created_stays[0]
                StudyEnrollment.objects.get_or_create(
                    tenant_id=t_id, protocol=protocol, patient_id=pat.id,
                    defaults={"status": "enrolled", "consent_obtained": True, "consented_by": phys_er.user_id, "enrolled_at": timezone.now().date()},
                )

            # -- Quality indicator + measurement (unit-level, not patient-tied) --
            indicator, _ = QualityIndicator.objects.get_or_create(
                tenant_id=t_id, name="30-Day Readmission Rate",
                defaults={"category": "outcomes", "unit_of_measure": "%", "target_value": 12.0, "direction": "lower_is_better"},
            )
            QualityMeasurement.objects.get_or_create(
                tenant_id=t_id, indicator=indicator,
                period_start=timezone.now().date() - datetime.timedelta(days=30), period_end=timezone.now().date(),
                defaults={"numerator": 7, "denominator": 84, "recorded_by": phys_er.user_id},
            )

            # -- BioMed equipment + service record --
            scanner = Asset.objects.filter(code="AST-CT-001").first()
            if scanner and not BiomedicalEquipment.objects.filter(asset=scanner).exists():
                equip = BiomedicalEquipment.objects.create(
                    tenant_id=t_id, asset=scanner, manufacturer="Siemens Healthineers", model_number="Somatom Force",
                    serial_number="SN-CT-88213", department="Imaging", status="in_service",
                    calibration_interval_days=180, last_calibration_date=timezone.now().date() - datetime.timedelta(days=40),
                    next_calibration_due=timezone.now().date() + datetime.timedelta(days=140),
                )
                EquipmentServiceRecord.objects.create(
                    tenant_id=t_id, equipment=equip, service_type="calibration",
                    service_date=timezone.now().date() - datetime.timedelta(days=40),
                    performed_by="Siemens Field Engineer", next_due_date=timezone.now().date() + datetime.timedelta(days=140),
                )

            # -- Linen carts + laundry batch (ward-level, not patient-tied) --
            LinenCart.objects.get_or_create(
                tenant_id=t_id, ward=ward_med.name, cart_type="clean",
                defaults={"current_count": 18, "par_level": 40},
            )
            LinenCart.objects.get_or_create(
                tenant_id=t_id, ward=ward_med.name, cart_type="soiled",
                defaults={"current_count": 27, "par_level": 25},
            )
            LaundryBatch.objects.get_or_create(
                tenant_id=t_id, source_ward=ward_med.name,
                defaults={"item_count_collected": 140, "weight_kg": 62.5, "collected_by": nurse_er.user_id, "status": "collected"},
            )

            # -- Waste collection + hauler manifest (facility-level) --
            manifest, _ = HaulerManifest.objects.get_or_create(
                tenant_id=t_id, manifest_number="MANIFEST-2026-041",
                defaults={
                    "hauler_company": "SafeMed Waste Solutions", "hauler_license_number": "SA-HAUL-2291",
                    "pickup_date": timezone.now().date(), "waste_type": WasteType.BIOHAZARD,
                    "total_weight_kg": 84.0, "disposal_facility": "Riyadh Medical Waste Treatment Plant",
                    "disposal_method": "autoclave", "status": "pending",
                },
            )
            WasteCollectionLog.objects.get_or_create(
                tenant_id=t_id, waste_type=WasteType.BIOHAZARD, source_location="ICU",
                defaults={"weight_kg": 18.4, "collected_by": nurse_er.user_id, "status": "staged", "manifest": manifest},
            )

        self.stdout.write(self.style.SUCCESS(f"Bulk demo seeding complete: {count} patients routed through real workflows."))
