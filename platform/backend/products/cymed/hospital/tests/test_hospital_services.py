import uuid

import pytest
from django.utils import timezone

from platform.events.models import OutboxEvent
from products.cymed.core.encounters.models import Encounter
from products.cymed.core.facilities.models import Bed, Department, Facility, Room, Ward
from products.cymed.core.organizations.models import Organization
from products.cymed.core.patients.models import Patient
from products.cymed.hospital.adt.models import (
    AdmissionReason,
    AdmissionType,
    DischargeDisposition,
    DischargeReason,
)
from products.cymed.hospital.inpatient.models import HospitalStay
from products.cymed.hospital.services import (
    AdmissionService,
    BedManagementService,
    CapacityService,
    ClinicalSafetyService,
    EmergencyService,
    HospitalAIAssistant,
    HospitalOperationsService,
    ICUService,
    OperatingRoomService,
)


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture
def setup_base_data(test_tenant_id):
    org = Organization.objects.create(
        tenant_id=test_tenant_id, name="Hospital Org", slug="hosp-org", organization_type="hospital"
    )
    facility = Facility.objects.create(
        tenant_id=test_tenant_id, organization=org, name="Main Hospital Facility", code="MAIN-HOSP"
    )
    dept = Department.objects.create(
        tenant_id=test_tenant_id, facility=facility, name="Cardiology", code="CARD"
    )
    ward = Ward.objects.create(
        tenant_id=test_tenant_id, department=dept, name="Cardio Ward A", code="CWA"
    )
    room = Room.objects.create(
        tenant_id=test_tenant_id, ward=ward, room_number="101", room_type="standard"
    )
    bed = Bed.objects.create(
        tenant_id=test_tenant_id, room=room, bed_number="101-A", status="available"
    )
    patient = Patient.objects.create(
        tenant_id=test_tenant_id,
        first_name="Ahmad",
        last_name="Kamal",
        dob="1985-05-15",
        mrn="MRN-H-001",
    )
    encounter = Encounter.objects.create(
        tenant_id=test_tenant_id,
        patient=patient,
        encounter_type="inpatient",
        status="in_progress",
        organization=org,
        facility=facility,
    )
    return {
        "org": org,
        "facility": facility,
        "dept": dept,
        "ward": ward,
        "room": room,
        "bed": bed,
        "patient": patient,
        "encounter": encounter,
    }


@pytest.mark.django_db
class TestHospitalServices:
    def test_full_adt_workflow(self, test_tenant_id, setup_base_data):
        patient = setup_base_data["patient"]
        encounter = setup_base_data["encounter"]
        bed = setup_base_data["bed"]

        reason = AdmissionReason.objects.create(
            tenant_id=test_tenant_id, name="Chest Pain", code="R-ADM-001"
        )
        adm_type = AdmissionType.objects.create(
            tenant_id=test_tenant_id, name="Emergency", code="T-ADM-001"
        )
        dis_reason = DischargeReason.objects.create(
            tenant_id=test_tenant_id, name="Recovered", code="R-DIS-001"
        )
        dis_disp = DischargeDisposition.objects.create(
            tenant_id=test_tenant_id, name="Home", code="D-DIS-001"
        )

        physician_id = str(uuid.uuid4())

        # 1. Admit patient
        res_admit = AdmissionService.admit_patient(
            tenant_id=str(test_tenant_id),
            patient_id=str(patient.id),
            encounter_id=str(encounter.id),
            admission_type_id=str(adm_type.id),
            admission_reason_id=str(reason.id),
            admitting_physician_id=physician_id,
            bed_id=str(bed.id),
        )
        assert res_admit["admission_id"] is not None
        assert res_admit["bed_assignment_id"] is not None

        # Verify bed is occupied
        bed.refresh_from_db()
        assert bed.status == "occupied"

        # Verify OutboxEvents
        events = OutboxEvent.objects.filter(tenant_id=test_tenant_id)
        assert events.filter(event_type="AdmissionCreated").exists()
        assert events.filter(event_type="ChargeCreated", payload__charge_type="admission").exists()

        # 2. Transfer Patient
        new_bed = Bed.objects.create(
            tenant_id=test_tenant_id,
            room=setup_base_data["room"],
            bed_number="101-B",
            status="available",
        )
        res_transfer = AdmissionService.transfer_patient(
            tenant_id=str(test_tenant_id),
            admission_id=res_admit["admission_id"],
            target_bed_id=str(new_bed.id),
            requested_by=physician_id,
            reason="Patient preferred window bed",
        )
        assert res_transfer["status"] == "approved"

        # Verify bed updates
        bed.refresh_from_db()
        new_bed.refresh_from_db()
        assert bed.status == "available"  # should be available now (or cleaning requested)
        assert new_bed.status == "occupied"

        # 3. Discharge patient
        res_discharge = AdmissionService.discharge_patient(
            tenant_id=str(test_tenant_id),
            admission_id=res_admit["admission_id"],
            discharged_by=physician_id,
            disposition_id=str(dis_disp.id),
            reason_id=str(dis_reason.id),
            summary_text="Patient condition improved significantly.",
            instructions="Take medication as prescribed and follow up in 2 weeks.",
        )
        assert res_discharge["discharge_summary_id"] is not None

        # Verify bed is released
        new_bed.refresh_from_db()
        assert new_bed.status == "reserved"  # indicates cleaning requested on discharge

    def test_emergency_triage_esi_calculation(self, test_tenant_id, setup_base_data):
        patient = setup_base_data["patient"]
        visit_res = EmergencyService.register_emergency_visit(
            tenant_id=str(test_tenant_id),
            patient_id=str(patient.id),
            chief_complaint="Sudden numbness on left side",
            arrival_mode="ambulance",
        )
        assert visit_res["visit_id"] is not None

        # Triage as ESI 2 (high risk)
        nurse_id = str(uuid.uuid4())
        triage_res = EmergencyService.triage_patient(
            tenant_id=str(test_tenant_id),
            visit_id=visit_res["visit_id"],
            triage_data={"esi_level": 2, "news2_score": 4},
            triaged_by=nurse_id,
        )
        assert triage_res["esi_level"] == 2
        assert triage_res["visit_status"] == "fast_track"

        # Check critical alert event was generated
        assert OutboxEvent.objects.filter(
            tenant_id=test_tenant_id, event_type="CriticalAlertTriggered"
        ).exists()

    def test_bed_management_assign_and_release(self, test_tenant_id, setup_base_data):
        patient = setup_base_data["patient"]
        encounter = setup_base_data["encounter"]
        bed = setup_base_data["bed"]
        physician_id = str(uuid.uuid4())

        # Assign
        assignment = BedManagementService.assign_bed(
            tenant_id=str(test_tenant_id),
            bed_id=str(bed.id),
            patient_id=str(patient.id),
            encounter_id=str(encounter.id),
            assigned_by=physician_id,
        )
        assert assignment.id is not None
        bed.refresh_from_db()
        assert bed.status == "occupied"

        # Release
        success = BedManagementService.release_bed(
            tenant_id=str(test_tenant_id), bed_id=str(bed.id), reason="transfer"
        )
        assert success
        bed.refresh_from_db()
        assert bed.status == "available"

    def test_icu_sofa_score_calculation(self, test_tenant_id, setup_base_data):
        patient = setup_base_data["patient"]
        encounter = setup_base_data["encounter"]
        bed = setup_base_data["bed"]
        physician_id = str(uuid.uuid4())

        reason = AdmissionReason.objects.create(
            tenant_id=test_tenant_id, name="ICU Admission", code="R-ICU-001"
        )
        adm_type = AdmissionType.objects.create(
            tenant_id=test_tenant_id, name="Emergency", code="T-ICU-001"
        )

        # Admit inpatient stay
        AdmissionService.admit_patient(
            tenant_id=str(test_tenant_id),
            patient_id=str(patient.id),
            encounter_id=str(encounter.id),
            admission_type_id=str(adm_type.id),
            admission_reason_id=str(reason.id),
            admitting_physician_id=physician_id,
            bed_id=str(bed.id),
        )

        icu_stay = ICUService.admit_to_icu(
            tenant_id=str(test_tenant_id),
            encounter_id=str(encounter.id),
            bed_id=str(bed.id),
            admission_dx="Septic shock",
            admitted_by=physician_id,
        )
        assert icu_stay["icu_stay_id"] is not None

        # Round with custom sofa score
        round_res = ICUService.complete_icu_round(
            tenant_id=str(test_tenant_id),
            icu_stay_id=icu_stay["icu_stay_id"],
            round_data={"sofa_score": 8, "glasgow_coma_scale": 11},
            rounded_by=physician_id,
        )
        assert round_res["sofa_score"] == 8

    def test_or_case_scheduling_conflict_detection(self, test_tenant_id, setup_base_data):
        encounter = setup_base_data["encounter"]
        bed = setup_base_data["bed"]
        surgeon_id = str(uuid.uuid4())

        # Schedule Case 1
        start_time = timezone.now() + timezone.timedelta(hours=2)
        case_res = OperatingRoomService.schedule_case(
            tenant_id=str(test_tenant_id),
            encounter_id=str(encounter.id),
            procedure_codes=["SNOMED-OR-01"],
            surgeon_id=surgeon_id,
            scheduled_datetime=start_time,
            estimated_minutes=60,
            room_id=str(bed.id),  # reusing bed id as room UUID for test
        )
        assert case_res["case_id"] is not None

        # Schedule Case 2 at conflicting time
        with pytest.raises(ValueError):
            OperatingRoomService.schedule_case(
                tenant_id=str(test_tenant_id),
                encounter_id=str(encounter.id),
                procedure_codes=["SNOMED-OR-02"],
                surgeon_id=surgeon_id,
                scheduled_datetime=start_time + timezone.timedelta(minutes=30),
                estimated_minutes=60,
                room_id=str(bed.id),
            )

    def test_capacity_service_census(self, test_tenant_id, setup_base_data):
        # Trigger capacity check
        res = CapacityService.check_surge_threshold(
            tenant_id=str(test_tenant_id), facility_id=str(setup_base_data["facility"].id)
        )
        assert res["alert_level"] is not None


@pytest.mark.django_db
class TestClinicalSafetyService:
    def _admit(self, test_tenant_id, setup_base_data):
        patient = setup_base_data["patient"]
        encounter = setup_base_data["encounter"]
        bed = setup_base_data["bed"]
        reason = AdmissionReason.objects.create(
            tenant_id=test_tenant_id, name="Sepsis", code="R-ADM-SAFE"
        )
        adm_type = AdmissionType.objects.create(
            tenant_id=test_tenant_id, name="Emergency", code="T-ADM-SAFE"
        )
        physician_id = str(uuid.uuid4())
        res = AdmissionService.admit_patient(
            tenant_id=str(test_tenant_id),
            patient_id=str(patient.id),
            encounter_id=str(encounter.id),
            admission_type_id=str(adm_type.id),
            admission_reason_id=str(reason.id),
            admitting_physician_id=physician_id,
            bed_id=str(bed.id),
        )
        return HospitalStay.objects.get(id=res["stay_id"]), physician_id

    def test_code_status_order_updates_stay_and_is_audited(self, test_tenant_id, setup_base_data):
        stay, physician_id = self._admit(test_tenant_id, setup_base_data)
        assert stay.current_code_status == HospitalStay.CodeStatus.FULL_CODE

        order = ClinicalSafetyService.set_code_status(
            tenant_id=str(test_tenant_id),
            stay_id=str(stay.id),
            status=HospitalStay.CodeStatus.DNR,
            ordered_by=physician_id,
            reason="Patient wish, discussed with family",
            discussed_with_patient=True,
            discussed_with_family=True,
        )
        stay.refresh_from_db()
        assert stay.current_code_status == HospitalStay.CodeStatus.DNR
        assert order.status == HospitalStay.CodeStatus.DNR
        assert stay.code_status_orders.count() == 1

        events = OutboxEvent.objects.filter(tenant_id=test_tenant_id, event_type="CodeStatusChanged")
        assert events.exists()

    def test_device_infection_and_hai_rate_calculation(self, test_tenant_id, setup_base_data):
        stay, physician_id = self._admit(test_tenant_id, setup_base_data)

        device = ClinicalSafetyService.insert_device(
            tenant_id=str(test_tenant_id),
            stay_id=str(stay.id),
            device_type="central_line",
            inserted_by=physician_id,
            insertion_site="right subclavian",
            inserted_at=timezone.now() - timezone.timedelta(days=10),
        )

        infection = ClinicalSafetyService.record_device_infection(
            tenant_id=str(test_tenant_id),
            device_id=str(device.id),
            diagnosed_by=physician_id,
            organism="Staphylococcus aureus",
        )
        assert infection.device_id == device.id

        rates = ClinicalSafetyService.get_hai_rates(tenant_id=str(test_tenant_id), days=30)
        assert rates["clabsi"]["infections"] == 1
        assert rates["clabsi"]["device_days"] > 0
        assert rates["clabsi"]["rate_per_1000_device_days"] > 0
        assert rates["cauti"]["infections"] == 0

        ClinicalSafetyService.remove_device(
            tenant_id=str(test_tenant_id), device_id=str(device.id), removal_reason="no longer needed"
        )
        device.refresh_from_db()
        assert device.removed_at is not None

    def test_vte_prophylaxis_order_upserts(self, test_tenant_id, setup_base_data):
        stay, physician_id = self._admit(test_tenant_id, setup_base_data)

        order = ClinicalSafetyService.order_vte_prophylaxis(
            tenant_id=str(test_tenant_id),
            stay_id=str(stay.id),
            method="mechanical",
            ordered_by=physician_id,
        )
        assert order.method == "mechanical"

        # Re-ordering replaces the single order for this stay (OneToOne)
        order2 = ClinicalSafetyService.order_vte_prophylaxis(
            tenant_id=str(test_tenant_id),
            stay_id=str(stay.id),
            method="both",
            ordered_by=physician_id,
        )
        assert order2.id == order.id
        assert order2.method == "both"


@pytest.mark.django_db
class TestHospitalAIAssistant:
    def test_ask_without_model_config_raises_clean_error(self, test_tenant_id):
        from platform.cyai.models import ModelConfig

        ModelConfig.objects.filter(active=True).update(active=False)
        with pytest.raises(ValueError):
            HospitalAIAssistant.ask(tenant_id=str(test_tenant_id), question="How many beds are free?")

    def test_ask_grounds_answer_in_real_snapshot(self, test_tenant_id, setup_base_data, monkeypatch):
        """
        The assistant must build its context from HospitalOperationsService
        (real counts), then hand that off to the real CyAI gateway -- not
        answer from the model's own made-up numbers.
        """
        from platform.cyai.models import ModelConfig

        config = ModelConfig.objects.create(
            name="Hospital Assistant Model", provider="anthropic", model_name="claude-sonnet-5"
        )

        captured_prompts = []

        class _FakeTextBlock:
            def __init__(self, text):
                self.text = text

        class _FakeMessage:
            def __init__(self, text):
                self.content = [_FakeTextBlock(text)]

        class _FakeMessages:
            def create(self, **kwargs):
                prompt = kwargs["messages"][0]["content"]
                captured_prompts.append(prompt)
                return _FakeMessage("There are 0 active admissions right now.")

        class _FakeAnthropicClient:
            def __init__(self, api_key):
                self.messages = _FakeMessages()

        monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-not-real")
        import anthropic as anthropic_module

        monkeypatch.setattr(anthropic_module, "Anthropic", _FakeAnthropicClient)

        snapshot = HospitalOperationsService.get_snapshot(str(test_tenant_id))
        result = HospitalAIAssistant.ask(
            tenant_id=str(test_tenant_id),
            question="How many active admissions are there right now?",
            model_config_id=str(config.id),
        )

        assert result["status"] == "passed"
        assert "0" in result["answer"]
        assert result["snapshot_used"]["operational_census"]["active_admissions"] == (
            snapshot["operational_census"]["active_admissions"]
        )
        # The real snapshot numbers were actually sent to the model, not fabricated.
        assert str(snapshot["operational_census"]["active_admissions"]) in captured_prompts[0]
