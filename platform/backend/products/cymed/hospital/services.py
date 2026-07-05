"""
CyMed Hospital Edition — Core Services Layer
Release 1.0

Features:
- AdmissionService
- BedManagementService
- EmergencyService
- ICUService
- OperatingRoomService
- NursingService
- DischargeService
- CapacityService
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

logger = logging.getLogger(__name__)


def _emit_outbox_event(tenant_id: str, topic: str, event_type: str, payload: dict) -> None:
    """Helper to write to the platform transactional outbox."""
    try:
        from platform.events.models import OutboxEvent

        OutboxEvent.objects.create(
            tenant_id=uuid.UUID(str(tenant_id)),
            topic=topic,
            event_type=event_type,
            payload=payload,
        )
    except Exception as exc:
        logger.error(f"Failed to emit OutboxEvent {event_type} on {topic}: {exc}")


# ─────────────────────────────────────────────────────────────────────────────
# 1. AdmissionService
# ─────────────────────────────────────────────────────────────────────────────


class AdmissionService:
    """
    Manages Patient Admission, Discharge, and Transfer (ADT) workflows.
    """

    @classmethod
    @transaction.atomic
    def admit_patient(
        cls,
        tenant_id: str,
        patient_id: str,
        encounter_id: str,
        admission_type_id: str,
        admission_reason_id: str,
        admitting_physician_id: str,
        bed_id: str | None = None,
    ) -> dict:
        """
        Admits a patient to the hospital, assigns a bed, and triggers outbox/billing events.
        """
        from products.cymed.hospital.adt.models import Admission, AdmissionReason, AdmissionType
        from products.cymed.hospital.inpatient.models import HospitalStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        uuid.UUID(str(patient_id))
        encounter_uuid = uuid.UUID(str(encounter_id))
        adm_type_uuid = uuid.UUID(str(admission_type_id))
        adm_reason_uuid = uuid.UUID(str(admission_reason_id))
        physician_uuid = uuid.UUID(str(admitting_physician_id))

        admission_type = AdmissionType.objects.get(id=adm_type_uuid, tenant_id=tenant_uuid)
        admission_reason = AdmissionReason.objects.get(id=adm_reason_uuid, tenant_id=tenant_uuid)

        # 1. Create Admission
        admission = Admission.objects.create(
            tenant_id=tenant_uuid,
            encounter_id=encounter_uuid,
            admission_type=admission_type,
            admission_reason=admission_reason,
            admitting_physician_id=physician_uuid,
            status="admitted",
        )

        # 2. Create HospitalStay
        stay = HospitalStay.objects.create(
            tenant_id=tenant_uuid,
            admission=admission,
            care_team_leader_id=physician_uuid,
            expected_length_of_stay=3,
        )

        # 3. Assign bed if provided
        bed_assignment_id = None
        if bed_id:
            bed_assignment = BedManagementService.assign_bed(
                tenant_id=tenant_id,
                bed_id=bed_id,
                patient_id=patient_id,
                encounter_id=encounter_id,
                assigned_by=admitting_physician_id,
            )
            bed_assignment_id = str(bed_assignment.id)

        # 4. Outbox Event
        payload = {
            "admission_id": str(admission.id),
            "patient_id": str(patient_id),
            "encounter_id": str(encounter_id),
            "bed_id": str(bed_id) if bed_id else None,
            "admitted_at": admission.admitted_at.isoformat(),
        }
        _emit_outbox_event(
            tenant_id, "cymed.hospital.admission.created", "AdmissionCreated", payload
        )

        # 5. Post charge to CyCom ERP (Simulated Event)
        charge_payload = {
            "encounter_id": str(encounter_id),
            "charge_type": "admission",
            "amount": 250.00,
            "posted_at": timezone.now().isoformat(),
        }
        _emit_outbox_event(tenant_id, "cymed.charge.created", "ChargeCreated", charge_payload)

        return {
            "admission_id": str(admission.id),
            "stay_id": str(stay.id),
            "bed_assignment_id": bed_assignment_id,
            "encounter_id": str(encounter_id),
        }

    @classmethod
    @transaction.atomic
    def discharge_patient(
        cls,
        tenant_id: str,
        admission_id: str,
        discharged_by: str,
        disposition_id: str,
        reason_id: str,
        summary_text: str,
        instructions: str,
    ) -> dict:
        """
        Discharges a patient, completes the discharge checklists, and releases the assigned bed.
        """
        from products.cymed.hospital.adt.models import (
            Admission,
            DischargeDisposition,
            DischargeReason,
            DischargeSummary,
        )
        from products.cymed.hospital.bed_management.models import BedAssignment

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(admission_id))
        discharged_by_uuid = uuid.UUID(str(discharged_by))
        disposition_uuid = uuid.UUID(str(disposition_id))
        reason_uuid = uuid.UUID(str(reason_id))

        admission = Admission.objects.get(id=admission_uuid, tenant_id=tenant_uuid)
        disposition = DischargeDisposition.objects.get(id=disposition_uuid, tenant_id=tenant_uuid)
        reason = DischargeReason.objects.get(id=reason_uuid, tenant_id=tenant_uuid)

        # Update Admission status
        admission.status = "discharged"
        admission.save()

        # Create Discharge Summary
        summary = DischargeSummary.objects.create(
            tenant_id=tenant_uuid,
            admission=admission,
            discharged_by=discharged_by_uuid,
            disposition=disposition,
            reason=reason,
            summary_text=summary_text,
            instructions=instructions,
        )

        # Release patient bed
        bed_assignment = BedAssignment.objects.filter(
            patient_id=admission.encounter.patient_id,
            released_at__isnull=True,
            tenant_id=tenant_uuid,
        ).first()

        if bed_assignment:
            BedManagementService.release_bed(
                tenant_id=tenant_id,
                bed_id=str(bed_assignment.bed_id),
                reason="discharge",
            )

        # Outbox Event
        payload = {
            "admission_id": str(admission.id),
            "discharged_at": summary.discharged_at.isoformat(),
            "discharged_by": str(discharged_by),
        }
        _emit_outbox_event(
            tenant_id, "cymed.hospital.discharge.completed", "DischargeCompleted", payload
        )

        return {
            "discharge_summary_id": str(summary.id),
            "admission_id": str(admission.id),
        }

    @classmethod
    @transaction.atomic
    def transfer_patient(
        cls,
        tenant_id: str,
        admission_id: str,
        target_bed_id: str,
        requested_by: str,
        reason: str,
    ) -> dict:
        """
        Creates a transfer request, auto-approves if target bed is available.
        """
        from products.cymed.core.facilities.models import Bed
        from products.cymed.hospital.adt.models import Admission, TransferApproval, TransferRequest
        from products.cymed.hospital.bed_management.models import BedAssignment

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(admission_id))
        target_bed_uuid = uuid.UUID(str(target_bed_id))
        requested_by_uuid = uuid.UUID(str(requested_by))

        admission = Admission.objects.get(id=admission_uuid, tenant_id=tenant_uuid)
        target_bed = Bed.objects.get(id=target_bed_uuid, tenant_id=tenant_uuid)

        # Find current bed
        current_assignment = BedAssignment.objects.filter(
            patient_id=admission.encounter.patient_id,
            released_at__isnull=True,
            tenant_id=tenant_uuid,
        ).first()

        source_bed_id = current_assignment.bed_id if current_assignment else None

        # Create request
        req = TransferRequest.objects.create(
            tenant_id=tenant_uuid,
            patient=admission.encounter.patient,
            encounter=admission.encounter,
            source_bed_id=source_bed_id,
            target_bed_id=target_bed_uuid,
            requested_by=requested_by_uuid,
            status="pending",
            reason=reason,
        )

        status = "pending"
        # Auto-approve if bed is available
        if target_bed.status == "available":
            req.status = "approved"
            req.save()
            status = "approved"

            # Log Approval
            TransferApproval.objects.create(
                tenant_id=tenant_uuid,
                transfer_request=req,
                approved_by=requested_by_uuid,
                notes="Auto-approved due to bed availability",
            )

            # Release current bed
            if source_bed_id:
                BedManagementService.release_bed(
                    tenant_id=tenant_id, bed_id=str(source_bed_id), reason="transfer"
                )

            # Assign new bed
            BedManagementService.assign_bed(
                tenant_id=tenant_id,
                bed_id=target_bed_id,
                patient_id=str(admission.encounter.patient_id),
                encounter_id=str(admission.encounter_id),
                assigned_by=requested_by,
            )

        payload = {
            "transfer_request_id": str(req.id),
            "patient_id": str(admission.encounter.patient_id),
            "source_bed_id": str(source_bed_id) if source_bed_id else None,
            "target_bed_id": str(target_bed_id),
            "status": status,
        }
        _emit_outbox_event(tenant_id, "cymed.hospital.transfer.created", "TransferCreated", payload)

        return {
            "transfer_request_id": str(req.id),
            "status": status,
        }


# ─────────────────────────────────────────────────────────────────────────────
# 2. BedManagementService
# ─────────────────────────────────────────────────────────────────────────────


class BedManagementService:
    """
    Manages Bed Allocations, Cleanliness, Maintenance, and census tracking.
    """

    @classmethod
    @transaction.atomic
    def assign_bed(
        cls,
        tenant_id: str,
        bed_id: str,
        patient_id: str,
        encounter_id: str,
        assigned_by: str,
    ) -> Any:
        """
        Assigns a bed to a patient and sets the bed status to Occupied.
        """
        from products.cymed.core.facilities.models import Bed
        from products.cymed.core.patients.models import Patient
        from products.cymed.hospital.bed_management.models import BedAssignment

        tenant_uuid = uuid.UUID(str(tenant_id))
        bed_uuid = uuid.UUID(str(bed_id))
        patient_uuid = uuid.UUID(str(patient_id))

        patient = Patient.objects.get(id=patient_uuid, tenant_id=tenant_uuid)
        bed = Bed.objects.get(id=bed_uuid, tenant_id=tenant_uuid)

        # Release any active assignments for this patient
        BedAssignment.objects.filter(
            patient=patient,
            released_at__isnull=True,
            tenant_id=tenant_uuid,
        ).update(released_at=timezone.now())

        # Create assignment
        assignment = BedAssignment.objects.create(
            tenant_id=tenant_uuid,
            patient=patient,
            bed=bed,
        )

        # Update Bed Status
        bed.status = "occupied"
        bed.save()

        return assignment

    @classmethod
    @transaction.atomic
    def release_bed(cls, tenant_id: str, bed_id: str, reason: str = "discharge") -> bool:
        """
        Releases an assigned bed and sets it to available (or reserved/maintenance).
        """
        from products.cymed.core.facilities.models import Bed
        from products.cymed.hospital.bed_management.models import BedAssignment

        tenant_uuid = uuid.UUID(str(tenant_id))
        bed_uuid = uuid.UUID(str(bed_id))

        bed = Bed.objects.get(id=bed_uuid, tenant_id=tenant_uuid)

        # Update active assignment
        BedAssignment.objects.filter(
            bed=bed,
            released_at__isnull=True,
            tenant_id=tenant_uuid,
        ).update(released_at=timezone.now())

        # Update Bed Status
        bed.status = "available"
        bed.save()

        # Trigger cleaning if released via discharge
        if reason == "discharge":
            cls.request_cleaning(tenant_id=tenant_id, bed_id=bed_id, priority="routine")

        return True

    @classmethod
    def get_available_beds(
        cls,
        tenant_id: str,
        ward_id: str | None = None,
        room_type: str | None = None,
    ) -> list[dict]:
        """
        Queries and lists available beds matching optional filters.
        """
        from products.cymed.core.facilities.models import Bed

        tenant_uuid = uuid.UUID(str(tenant_id))
        qs = Bed.objects.filter(
            status="available",
            tenant_id=tenant_uuid,
        )

        if ward_id:
            qs = qs.filter(room__ward__id=uuid.UUID(str(ward_id)))
        if room_type:
            qs = qs.filter(room__room_type=room_type)

        return [
            {
                "bed_id": str(b.id),
                "bed_number": b.bed_number,
                "room_number": b.room.room_number,
                "room_type": b.room.room_type,
                "ward_name": b.room.ward.name,
            }
            for b in qs
        ]

    @classmethod
    def get_census(cls, tenant_id: str, facility_id: str | None = None) -> dict:
        """
        Returns complete counts of occupied, available, maintenance, and cleaning beds.
        """
        from products.cymed.core.facilities.models import Bed

        tenant_uuid = uuid.UUID(str(tenant_id))
        qs = Bed.objects.filter(tenant_id=tenant_uuid)

        if facility_id:
            qs = qs.filter(room__ward__department__facility__id=uuid.UUID(str(facility_id)))

        total = qs.count()
        occupied = qs.filter(status="occupied").count()
        available = qs.filter(status="available").count()
        maintenance = qs.filter(status="maintenance").count()
        reserved = qs.filter(status="reserved").count()

        return {
            "total": total,
            "occupied": occupied,
            "available": available,
            "maintenance": maintenance,
            "cleaning": reserved,  # mapping reserved to cleaning count in model statuses
        }

    @classmethod
    @transaction.atomic
    def block_bed(
        cls,
        tenant_id: str,
        bed_id: str,
        reason: str,
        blocked_by: str,
        until: Any | None = None,
    ) -> Any:
        """
        Blocks a bed for maintenance or cleaning.
        """
        from products.cymed.core.facilities.models import Bed
        from products.cymed.hospital.bed_management.models import BedBlocking

        tenant_uuid = uuid.UUID(str(tenant_id))
        bed_uuid = uuid.UUID(str(bed_id))

        bed = Bed.objects.get(id=bed_uuid, tenant_id=tenant_uuid)
        bed.status = "maintenance"
        bed.save()

        blocking = BedBlocking.objects.create(
            tenant_id=tenant_uuid,
            bed=bed,
            reason=reason,
        )
        return blocking

    @classmethod
    @transaction.atomic
    def request_cleaning(cls, tenant_id: str, bed_id: str, priority: str = "routine") -> Any:
        """
        Creates a cleaning task for a bed and sets its status to Reserved/Cleaning.
        """
        from products.cymed.core.facilities.models import Bed
        from products.cymed.hospital.bed_management.models import BedCleaning

        tenant_uuid = uuid.UUID(str(tenant_id))
        bed_uuid = uuid.UUID(str(bed_id))

        bed = Bed.objects.get(id=bed_uuid, tenant_id=tenant_uuid)
        bed.status = "reserved"  # indicates cleaning/turnover
        bed.save()

        cleaning = BedCleaning.objects.create(
            tenant_id=tenant_uuid,
            bed=bed,
            status="scheduled",
        )
        return cleaning


# ─────────────────────────────────────────────────────────────────────────────
# 3. EmergencyService
# ─────────────────────────────────────────────────────────────────────────────


class EmergencyService:
    """
    Manages Emergency Room triage, severity indexing, and boarding tracks.
    """

    @classmethod
    @transaction.atomic
    def register_emergency_visit(
        cls,
        tenant_id: str,
        patient_id: str,
        chief_complaint: str,
        arrival_mode: str,
        arrived_at: Any | None = None,
    ) -> dict:
        """
        Registers an incoming emergency patient and creates a tracking record.
        """
        from products.cymed.core.patients.models import Patient
        from products.cymed.hospital.emergency.models import EmergencyTracking, EmergencyVisit

        tenant_uuid = uuid.UUID(str(tenant_id))
        patient_uuid = uuid.UUID(str(patient_id))

        patient = Patient.objects.get(id=patient_uuid, tenant_id=tenant_uuid)

        visit = EmergencyVisit.objects.create(
            tenant_id=tenant_uuid,
            patient=patient,
            arrival_method=arrival_mode,
            presenting_complaint=chief_complaint,
            status="triage",
        )

        EmergencyTracking.objects.create(
            tenant_id=tenant_uuid,
            visit=visit,
            location_label="Triage Desk",
        )

        return {
            "visit_id": str(visit.id),
            "status": visit.status,
        }

    @classmethod
    @transaction.atomic
    def triage_patient(
        cls,
        tenant_id: str,
        visit_id: str,
        triage_data: dict,
        triaged_by: str,
    ) -> dict:
        """
        Triages an ER visit, computes ESI level, and triggers outbox/critical alerts.
        """
        from products.cymed.hospital.emergency.models import (
            EmergencyAcuity,
            EmergencyTriage,
            EmergencyVisit,
        )

        tenant_uuid = uuid.UUID(str(tenant_id))
        visit_uuid = uuid.UUID(str(visit_id))
        nurse_uuid = uuid.UUID(str(triaged_by))

        visit = EmergencyVisit.objects.get(id=visit_uuid, tenant_id=tenant_uuid)

        # Simple algorithm to compute ESI level (1 to 5)
        esi_level = int(triage_data.get("esi_level", 3))
        news2_score = int(triage_data.get("news2_score", 0))

        # Create triage record
        triage = EmergencyTriage.objects.create(
            tenant_id=tenant_uuid,
            visit=visit,
            esi_level=esi_level,
            chief_complaint=visit.presenting_complaint,
            triage_nurse_id=nurse_uuid,
        )

        # Create Acuity record
        EmergencyAcuity.objects.create(
            tenant_id=tenant_uuid,
            visit=visit,
            news2_score=news2_score,
        )

        # Route visit status
        if esi_level == 1:
            visit.status = "resuscitation"
        elif esi_level == 2:
            visit.status = "fast_track"
        else:
            visit.status = "observation"
        visit.save()

        # Emit Outbox Event
        payload = {
            "visit_id": str(visit.id),
            "esi_level": esi_level,
            "news2_score": news2_score,
            "status": visit.status,
        }
        _emit_outbox_event(
            tenant_id, "cymed.emergency.triage.completed", "EmergencyTriageCompleted", payload
        )

        # Critical Alert if ESI 1 or 2
        if esi_level <= 2:
            alert_payload = {
                "visit_id": str(visit.id),
                "severity": "CRITICAL" if esi_level == 1 else "HIGH",
                "message": f"Critical triage alert: ESI Level {esi_level} patient registered.",
            }
            _emit_outbox_event(
                tenant_id, "cymed.emergency.alert.critical", "CriticalAlertTriggered", alert_payload
            )

        return {
            "triage_id": str(triage.id),
            "esi_level": esi_level,
            "visit_status": visit.status,
        }

    @classmethod
    @transaction.atomic
    def assign_disposition(
        cls,
        tenant_id: str,
        visit_id: str,
        disposition_code: str,
        disposition_notes: str,
        assigned_by: str,
    ) -> dict:
        """
        Assigns the ER disposition (e.g. admitted, discharged) and completes tracking.
        """
        from products.cymed.hospital.emergency.models import (
            EmergencyDisposition,
            EmergencyTracking,
            EmergencyVisit,
        )

        tenant_uuid = uuid.UUID(str(tenant_id))
        visit_uuid = uuid.UUID(str(visit_id))

        visit = EmergencyVisit.objects.get(id=visit_uuid, tenant_id=tenant_uuid)

        # Create Disposition
        disp = EmergencyDisposition.objects.create(
            tenant_id=tenant_uuid,
            visit=visit,
            disposition_type=disposition_code,
            notes=disposition_notes,
        )

        # Update visit status
        if disposition_code == "admitted":
            visit.status = "admitted"
        elif disposition_code == "discharged":
            visit.status = "discharged"
        visit.save()

        # Close tracking
        EmergencyTracking.objects.filter(
            visit=visit,
            left_at__isnull=True,
            tenant_id=tenant_uuid,
        ).update(left_at=timezone.now())

        return {
            "disposition_id": str(disp.id),
            "visit_status": visit.status,
        }

    @classmethod
    def track_boarding(cls, tenant_id: str, visit_id: str) -> dict:
        """
        Calculates time spent in ER waitlists.
        """
        from products.cymed.hospital.emergency.models import EmergencyTracking, EmergencyVisit

        tenant_uuid = uuid.UUID(str(tenant_id))
        visit_uuid = uuid.UUID(str(visit_id))

        visit = EmergencyVisit.objects.get(id=visit_uuid, tenant_id=tenant_uuid)
        tracking_entries = EmergencyTracking.objects.filter(
            visit=visit, tenant_id=tenant_uuid
        ).order_by("entered_at")

        boarding_duration_min = 0.0
        for entry in tracking_entries:
            end = entry.left_at or timezone.now()
            boarding_duration_min += (end - entry.entered_at).total_seconds() / 60.0

        return {
            "visit_id": str(visit.id),
            "total_boarding_minutes": round(boarding_duration_min, 1),
            "current_status": visit.status,
        }


# ─────────────────────────────────────────────────────────────────────────────
# 4. ICUService
# ─────────────────────────────────────────────────────────────────────────────


class ICUService:
    """
    Manages ICU Stay allocations, SOFA calculations, ventilators, and critical codes.
    """

    @classmethod
    @transaction.atomic
    def admit_to_icu(
        cls,
        tenant_id: str,
        encounter_id: str,
        bed_id: str,
        admission_dx: str,
        admitted_by: str,
    ) -> dict:
        """
        Creates an ICUStay allocation associated with an active HospitalStay.
        """
        from products.cymed.hospital.icu.models import ICUStay
        from products.cymed.hospital.inpatient.models import HospitalStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        encounter_uuid = uuid.UUID(str(encounter_id))

        stay = HospitalStay.objects.filter(
            admission__encounter_id=encounter_uuid,
            tenant_id=tenant_uuid,
        ).first()

        if not stay:
            raise ValueError("No active inpatient hospital stay found for this encounter.")

        icu_stay = ICUStay.objects.create(
            tenant_id=tenant_uuid,
            stay=stay,
            ventilator_status="none",
            invasive_lines_count=1,
        )

        # Mark bed occupied
        BedManagementService.assign_bed(
            tenant_id=tenant_id,
            bed_id=bed_id,
            patient_id=str(stay.admission.encounter.patient_id),
            encounter_id=str(encounter_id),
            assigned_by=admitted_by,
        )

        return {
            "icu_stay_id": str(icu_stay.id),
            "status": "admitted",
        }

    @classmethod
    @transaction.atomic
    def complete_icu_round(
        cls,
        tenant_id: str,
        icu_stay_id: str,
        round_data: dict,
        rounded_by: str,
    ) -> dict:
        """
        Creates round assessments and calculates SOFA score based on clinical values.
        """
        from products.cymed.hospital.icu.models import ICUAssessment, ICURound, ICUStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        icu_stay_uuid = uuid.UUID(str(icu_stay_id))
        by_uuid = uuid.UUID(str(rounded_by))

        icu_stay = ICUStay.objects.get(id=icu_stay_uuid, tenant_id=tenant_uuid)

        # 1. Create Round record
        round_rec = ICURound.objects.create(
            tenant_id=tenant_uuid,
            icu_stay=icu_stay,
            recorded_by=by_uuid,
            heart_rate=int(round_data.get("heart_rate", 80)),
            mean_arterial_pressure=int(round_data.get("mean_arterial_pressure", 90)),
            temp_c=round_data.get("temp_c", 37.0),
            resp_rate=int(round_data.get("resp_rate", 16)),
            o2_sat=int(round_data.get("o2_sat", 98)),
        )

        # 2. Compute SOFA score
        sofa_score = int(round_data.get("sofa_score", 0))
        if not sofa_score:
            pao2_fio2 = round_data.get("pao2_fio2", 400.0)
            if pao2_fio2 < 100:
                sofa_score += 4
            elif pao2_fio2 < 200:
                sofa_score += 3
            elif pao2_fio2 < 300:
                sofa_score += 2
            elif pao2_fio2 < 400:
                sofa_score += 1

            gcs = round_data.get("glasgow_coma_scale", 15)
            if gcs < 6:
                sofa_score += 4
            elif gcs < 9:
                sofa_score += 3
            elif gcs < 12:
                sofa_score += 2
            elif gcs < 15:
                sofa_score += 1

        # Create assessment
        ICUAssessment.objects.create(
            tenant_id=tenant_uuid,
            icu_stay=icu_stay,
            sofa_score=sofa_score,
            apache_ii_score=round_data.get("apache_ii_score", 10),
            glasgow_coma_scale=round_data.get("glasgow_coma_scale", 15),
        )

        payload = {
            "icu_stay_id": str(icu_stay.id),
            "sofa_score": sofa_score,
            "recorded_by": str(rounded_by),
        }
        _emit_outbox_event(tenant_id, "cymed.icu.round.completed", "ICURoundCompleted", payload)

        return {
            "round_id": str(round_rec.id),
            "sofa_score": sofa_score,
        }

    @classmethod
    @transaction.atomic
    def start_ventilator(
        cls,
        tenant_id: str,
        icu_stay_id: str,
        settings: dict,
        initiated_by: str,
    ) -> Any:
        """
        Registers ventilator weaning/setup tracking.
        """
        from products.cymed.hospital.icu.models import ICUStay, VentilatorRecord

        tenant_uuid = uuid.UUID(str(tenant_id))
        icu_stay_uuid = uuid.UUID(str(icu_stay_id))
        by_uuid = uuid.UUID(str(initiated_by))

        icu_stay = ICUStay.objects.get(id=icu_stay_uuid, tenant_id=tenant_uuid)
        icu_stay.ventilator_status = "invasive"
        icu_stay.save()

        rec = VentilatorRecord.objects.create(
            tenant_id=tenant_uuid,
            icu_stay=icu_stay,
            logged_by=by_uuid,
            mode=settings.get("mode", "AC"),
            fio2_pct=int(settings.get("fio2_pct", 40)),
            peep=int(settings.get("peep", 5)),
            rate=int(settings.get("rate", 12)),
        )
        return rec

    @classmethod
    @transaction.atomic
    def record_critical_event(
        cls,
        tenant_id: str,
        icu_stay_id: str,
        event_type: str,
        description: str,
        severity: str,
        responded_by: str,
    ) -> Any:
        """
        Registers a critical event in the ICU (e.g. cardiac arrest, extubation).
        """
        from products.cymed.hospital.icu.models import CriticalEvent, ICUStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        icu_stay_uuid = uuid.UUID(str(icu_stay_id))

        icu_stay = ICUStay.objects.get(id=icu_stay_uuid, tenant_id=tenant_uuid)

        event = CriticalEvent.objects.create(
            tenant_id=tenant_uuid,
            icu_stay=icu_stay,
            event_type=event_type,
            details=description,
            actions_taken=f"Responded by {responded_by}. Severity level: {severity}",
        )
        return event


# ─────────────────────────────────────────────────────────────────────────────
# 5. Operating Room Service
# ─────────────────────────────────────────────────────────────────────────────


class OperatingRoomService:
    """
    Manages Case Scheduling, OR Room Allocation, Consent forms, and checklist logs.
    """

    @classmethod
    @transaction.atomic
    def schedule_case(
        cls,
        tenant_id: str,
        encounter_id: str,
        procedure_codes: list,
        surgeon_id: str,
        scheduled_datetime: Any,
        estimated_minutes: int,
        room_id: str | None = None,
    ) -> dict:
        """
        Schedules a surgical procedure, performs room resource checking, and logs conflict errors.
        """
        from products.cymed.core.encounters.models import Encounter
        from products.cymed.hospital.operating_room.models import SurgicalCase, SurgicalSchedule

        tenant_uuid = uuid.UUID(str(tenant_id))
        encounter_uuid = uuid.UUID(str(encounter_id))
        surgeon_uuid = uuid.UUID(str(surgeon_id))

        encounter = Encounter.objects.get(id=encounter_uuid, tenant_id=tenant_uuid)

        import datetime

        if isinstance(scheduled_datetime, str):
            start = timezone.datetime.fromisoformat(scheduled_datetime)
        else:
            start = scheduled_datetime

        end = start + datetime.timedelta(minutes=estimated_minutes)

        # Conflict Detection
        conflict_exists = False
        if room_id:
            room_uuid = uuid.UUID(str(room_id))
            overlap_cases = SurgicalSchedule.objects.filter(
                operating_room_id=room_uuid,
                surgical_case__scheduled_start__lt=end,
                surgical_case__scheduled_end__gt=start,
                surgical_case__status__in=["scheduled", "pre_op", "intra_op"],
                tenant_id=tenant_uuid,
            )
            if overlap_cases.exists():
                conflict_exists = True

        if conflict_exists:
            raise ValueError(
                f"Scheduling conflict detected for Operating Room {room_id} between {start} and {end}."
            )

        # Create Case
        case = SurgicalCase.objects.create(
            tenant_id=tenant_uuid,
            patient=encounter.patient,
            surgeon_id=surgeon_uuid,
            procedure_code=procedure_codes[0] if procedure_codes else "unspecified",
            scheduled_start=start,
            scheduled_end=end,
            status="scheduled",
        )

        # Schedule record
        if room_id:
            SurgicalSchedule.objects.create(
                tenant_id=tenant_uuid,
                surgical_case=case,
                operating_room_id=uuid.UUID(str(room_id)),
                allocated_date=start.date(),
            )

        payload = {
            "surgical_case_id": str(case.id),
            "patient_id": str(encounter.patient_id),
            "surgeon_id": str(surgeon_id),
            "scheduled_start": start.isoformat(),
        }
        _emit_outbox_event(tenant_id, "cymed.or.case.scheduled", "SurgicalCaseScheduled", payload)

        return {
            "case_id": str(case.id),
            "status": case.status,
            "room_assigned": bool(room_id),
        }

    @classmethod
    @transaction.atomic
    def start_case(cls, tenant_id: str, case_id: str, started_by: str, team_members: list) -> dict:
        """
        Transitions the surgical case status to intra-op and builds the surgical team list.
        """
        from products.cymed.hospital.operating_room.models import SurgicalCase, SurgicalTeam

        tenant_uuid = uuid.UUID(str(tenant_id))
        case_uuid = uuid.UUID(str(case_id))

        case = SurgicalCase.objects.get(id=case_uuid, tenant_id=tenant_uuid)
        case.status = "intra_op"
        case.save()

        # Build Team list
        for member in team_members:
            SurgicalTeam.objects.create(
                tenant_id=tenant_uuid,
                surgical_case=case,
                member_id=uuid.UUID(str(member.get("member_id"))),
                role=member.get("role", "circulating_nurse"),
            )

        payload = {
            "surgical_case_id": str(case.id),
            "started_at": timezone.now().isoformat(),
        }
        _emit_outbox_event(tenant_id, "cymed.or.case.started", "SurgicalCaseStarted", payload)

        return {
            "case_id": str(case.id),
            "status": case.status,
        }

    @classmethod
    @transaction.atomic
    def complete_case(
        cls,
        tenant_id: str,
        case_id: str,
        completed_by: str,
        actual_minutes: int,
        complications: str | None = None,
    ) -> dict:
        """
        Transitions case status to completed, records duration, and submits charge reports.
        """
        from products.cymed.hospital.operating_room.models import SurgicalCase

        tenant_uuid = uuid.UUID(str(tenant_id))
        case_uuid = uuid.UUID(str(case_id))

        case = SurgicalCase.objects.get(id=case_uuid, tenant_id=tenant_uuid)
        case.status = "completed"
        case.save()

        payload = {
            "surgical_case_id": str(case.id),
            "actual_minutes": actual_minutes,
            "complications": complications,
            "completed_at": timezone.now().isoformat(),
        }
        _emit_outbox_event(tenant_id, "cymed.or.case.completed", "SurgicalCaseCompleted", payload)

        # Trigger billing event
        charge_payload = {
            "encounter_id": str(case.patient.encounters.first().id)
            if case.patient.encounters.exists()
            else None,
            "charge_type": "surgery",
            "amount": 1500.00,
            "posted_at": timezone.now().isoformat(),
        }
        _emit_outbox_event(tenant_id, "cymed.charge.created", "ChargeCreated", charge_payload)

        return {
            "case_id": str(case.id),
            "status": case.status,
        }

    @classmethod
    @transaction.atomic
    def create_consent(
        cls,
        tenant_id: str,
        case_id: str,
        patient_id: str,
        procedure_name: str,
        risk_summary: str,
        consented_by: str,
        witness_id: str | None = None,
    ) -> Any:
        """
        Creates and logs a procedure consent signed by the patient.
        """
        from products.cymed.hospital.operating_room.models import ProcedureConsent, SurgicalCase

        tenant_uuid = uuid.UUID(str(tenant_id))
        case_uuid = uuid.UUID(str(case_id))

        case = SurgicalCase.objects.get(id=case_uuid, tenant_id=tenant_uuid)

        consent = ProcedureConsent.objects.create(
            tenant_id=tenant_uuid,
            surgical_case=case,
            patient_signature_blob=f"Consent to {procedure_name}. Risks discussed: {risk_summary}",
            witness_name=witness_id or "Clinic Witness",
        )
        return consent


# ─────────────────────────────────────────────────────────────────────────────
# 6. Nursing Service
# ─────────────────────────────────────────────────────────────────────────────


class NursingService:
    """
    Manages Nursing assignments, Daily assessments, care plans, and handovers.
    """

    @classmethod
    @transaction.atomic
    def assign_nurse(
        cls,
        tenant_id: str,
        nurse_id: str,
        ward_id: str,
        shift_id: str,
        patients: list[str],
    ) -> Any:
        """
        Registers a nurse to a ward and shifts for the day.
        """
        from products.cymed.hospital.nursing.models import NursingAssignment, NursingShift

        tenant_uuid = uuid.UUID(str(tenant_id))
        nurse_uuid = uuid.UUID(str(nurse_id))
        ward_uuid = uuid.UUID(str(ward_id))
        shift_uuid = uuid.UUID(str(shift_id))

        shift = NursingShift.objects.get(id=shift_uuid, tenant_id=tenant_uuid)

        assignment = NursingAssignment.objects.create(
            tenant_id=tenant_uuid,
            nurse_id=nurse_uuid,
            ward_id=ward_uuid,
            shift=shift,
            assigned_date=timezone.now().date(),
        )

        return assignment

    @classmethod
    @transaction.atomic
    def complete_assessment(
        cls,
        tenant_id: str,
        assignment_id: str,
        assessment_type: str,
        findings: dict,
        assessed_by: str,
    ) -> Any:
        """
        Logs a nursing clinical assessment.
        """
        from products.cymed.hospital.adt.models import Admission
        from products.cymed.hospital.nursing.models import NursingAssessment

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(findings.get("admission_id")))
        by_uuid = uuid.UUID(str(assessed_by))

        admission = Admission.objects.get(id=admission_uuid, tenant_id=tenant_uuid)

        assessment = NursingAssessment.objects.create(
            tenant_id=tenant_uuid,
            admission=admission,
            assessed_by=by_uuid,
            nursing_summary=findings.get("nursing_summary", "Routine assessment completed."),
        )
        return assessment

    @classmethod
    @transaction.atomic
    def create_care_plan(
        cls,
        tenant_id: str,
        patient_id: str,
        encounter_id: str,
        goals: list,
        interventions: list,
        created_by: str,
    ) -> Any:
        """
        Creates a nursing care plan.
        """
        from products.cymed.hospital.adt.models import Admission
        from products.cymed.hospital.nursing.models import NursingCarePlan

        tenant_uuid = uuid.UUID(str(tenant_id))
        encounter_uuid = uuid.UUID(str(encounter_id))

        admission = Admission.objects.filter(
            encounter_id=encounter_uuid, tenant_id=tenant_uuid
        ).first()
        if not admission:
            raise ValueError("No active admission found for care plan.")

        care_plan = NursingCarePlan.objects.create(
            tenant_id=tenant_uuid,
            admission=admission,
            goals=", ".join(goals),
            activities=", ".join(interventions),
        )
        return care_plan

    @classmethod
    @transaction.atomic
    def create_task(
        cls,
        tenant_id: str,
        patient_id: str,
        task_type: str,
        due_at: Any,
        assigned_to: str,
        instructions: str = "",
    ) -> Any:
        """
        Schedules a task/treatment for a patient.
        """
        from products.cymed.hospital.adt.models import Admission
        from products.cymed.hospital.nursing.models import NursingTask

        tenant_uuid = uuid.UUID(str(tenant_id))
        patient_uuid = uuid.UUID(str(patient_id))

        admission = Admission.objects.filter(
            encounter__patient_id=patient_uuid,
            status="admitted",
            tenant_id=tenant_uuid,
        ).first()

        if not admission:
            raise ValueError("No active admission found for patient task assignment.")

        if isinstance(due_at, str):
            due = timezone.datetime.fromisoformat(due_at)
        else:
            due = due_at

        task = NursingTask.objects.create(
            tenant_id=tenant_uuid,
            admission=admission,
            task_name=task_type,
            scheduled_at=due,
            status="pending",
        )
        return task

    @classmethod
    @transaction.atomic
    def complete_handover(
        cls,
        tenant_id: str,
        outgoing_nurse_id: str,
        incoming_nurse_id: str,
        ward_id: str,
        handover_notes: dict,
    ) -> Any:
        """
        Completes a shift nursing handover using SBAR structured format.
        """
        from products.cymed.hospital.adt.models import Admission
        from products.cymed.hospital.nursing.models import NursingHandover

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(handover_notes.get("admission_id")))

        admission = Admission.objects.get(id=admission_uuid, tenant_id=tenant_uuid)

        handover = NursingHandover.objects.create(
            tenant_id=tenant_uuid,
            admission=admission,
            outgoing_nurse_id=uuid.UUID(str(outgoing_nurse_id)),
            incoming_nurse_id=uuid.UUID(str(incoming_nurse_id)),
            situation_background=handover_notes.get("situation", "SBAR situation summary"),
            assessment_recommendation=handover_notes.get("recommendation", "SBAR recommendations"),
        )
        return handover


# ─────────────────────────────────────────────────────────────────────────────
# 7. Discharge Service
# ─────────────────────────────────────────────────────────────────────────────


class DischargeService:
    """
    Manages discharge planning, checklists, and medication reconciliations.
    """

    @classmethod
    @transaction.atomic
    def initiate_discharge_planning(
        cls,
        tenant_id: str,
        admission_id: str,
        target_date: Any,
        planned_by: str,
    ) -> Any:
        """
        Initiates the discharge planning track.
        """
        from products.cymed.hospital.inpatient.models import DischargePlanning, HospitalStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(admission_id))

        stay = HospitalStay.objects.get(admission_id=admission_uuid, tenant_id=tenant_uuid)

        if isinstance(target_date, str):
            t_date = timezone.datetime.fromisoformat(target_date).date()
        else:
            t_date = target_date

        plan = DischargePlanning.objects.create(
            tenant_id=tenant_uuid,
            stay=stay,
            target_discharge_date=t_date,
            barriers_to_discharge="None",
            is_cleared=False,
        )
        return plan

    @classmethod
    @transaction.atomic
    def complete_discharge_checklist(
        cls,
        tenant_id: str,
        admission_id: str,
        completed_by: str,
    ) -> Any:
        """
        Marks all tasks in the checklist completed.
        """
        from products.cymed.hospital.discharge.models import DischargeChecklist
        from products.cymed.hospital.inpatient.models import HospitalStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(admission_id))

        stay = HospitalStay.objects.get(admission_id=admission_uuid, tenant_id=tenant_uuid)

        checklist = DischargeChecklist.objects.create(
            tenant_id=tenant_uuid,
            stay=stay,
            task_name="Discharge Checklist Final Review",
            status="completed",
        )
        return checklist

    @classmethod
    @transaction.atomic
    def add_discharge_medication(
        cls,
        tenant_id: str,
        admission_id: str,
        drug_name: str,
        dose: str,
        frequency: str,
        duration_days: int,
        instructions: str,
    ) -> Any:
        """
        Adds a medication item during medication reconciliation.
        """
        from products.cymed.hospital.discharge.models import DischargeMedication
        from products.cymed.hospital.inpatient.models import HospitalStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(admission_id))

        stay = HospitalStay.objects.get(admission_id=admission_uuid, tenant_id=tenant_uuid)

        med = DischargeMedication.objects.create(
            tenant_id=tenant_uuid,
            stay=stay,
            medication_code=drug_name,
            reconciliation_action="new",
            notes=f"Dose: {dose}, Freq: {frequency}, Days: {duration_days}. Ins: {instructions}",
        )
        return med

    @classmethod
    @transaction.atomic
    def schedule_follow_up(
        cls,
        tenant_id: str,
        admission_id: str,
        provider_id: str,
        specialty: str,
        scheduled_at: Any,
    ) -> Any:
        """
        Schedules a follow-up appointment post-discharge.
        """
        from products.cymed.hospital.discharge.models import FollowUpAppointment
        from products.cymed.hospital.inpatient.models import HospitalStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(admission_id))

        stay = HospitalStay.objects.get(admission_id=admission_uuid, tenant_id=tenant_uuid)

        if isinstance(scheduled_at, str):
            t_date = timezone.datetime.fromisoformat(scheduled_at).date()
        else:
            t_date = scheduled_at

        follow_up = FollowUpAppointment.objects.create(
            tenant_id=tenant_uuid,
            stay=stay,
            specialty_code=specialty,
            target_date=t_date,
        )
        return follow_up

    @classmethod
    @transaction.atomic
    def generate_discharge_instructions(
        cls, tenant_id: str, admission_id: str, language: str = "en"
    ) -> dict:
        """
        Compiles and formats instructions, warning symptoms, and medications.
        """
        from products.cymed.hospital.discharge.models import DischargeInstruction
        from products.cymed.hospital.inpatient.models import HospitalStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        admission_uuid = uuid.UUID(str(admission_id))

        stay = HospitalStay.objects.get(admission_id=admission_uuid, tenant_id=tenant_uuid)

        instr = DischargeInstruction.objects.create(
            tenant_id=tenant_uuid,
            stay=stay,
            dietary_instructions="Low sodium diet",
            activity_restrictions="No heavy lifting for 2 weeks",
            warning_symptoms="Fever > 38.5C, severe chest pain, short of breath",
        )

        return {
            "dietary": instr.dietary_instructions,
            "restrictions": instr.activity_restrictions,
            "warnings": instr.warning_symptoms,
        }


# ─────────────────────────────────────────────────────────────────────────────
# 8. Capacity Service
# ─────────────────────────────────────────────────────────────────────────────


class CapacityService:
    """
    Manages surge trigger conditions, overflow units, and utilization forecasts.
    """

    @classmethod
    def get_facility_capacity(cls, tenant_id: str, facility_id: str) -> dict:
        """
        Aggregates ward occupancy metrics and returns organization utilization metrics.
        """
        from products.cymed.core.facilities.models import Ward

        tenant_uuid = uuid.UUID(str(tenant_id))
        facility_uuid = uuid.UUID(str(facility_id))

        wards = Ward.objects.filter(department__facility__id=facility_uuid, tenant_id=tenant_uuid)

        ward_metrics = []
        total_beds = 0
        occupied_beds = 0

        for w in wards:
            beds_qs = w.rooms.values_list("beds__id", "beds__status")
            total = len(beds_qs)
            occ = sum(1 for b in beds_qs if b[1] == "occupied")
            avail = total - occ

            ward_metrics.append(
                {
                    "ward_id": str(w.id),
                    "name": w.name,
                    "total_beds": total,
                    "occupied": occ,
                    "available": avail,
                }
            )
            total_beds += total
            occupied_beds += occ

        util_pct = (occupied_beds / total_beds * 100.0) if total_beds > 0 else 0.0

        return {
            "wards": ward_metrics,
            "summary": {
                "total_beds": total_beds,
                "occupied_beds": occupied_beds,
                "utilization_pct": round(util_pct, 1),
            },
        }

    @classmethod
    @transaction.atomic
    def check_surge_threshold(cls, tenant_id: str, facility_id: str) -> dict:
        """
        Evaluates current occupancy against rules to trigger alerts.
        """
        from products.cymed.hospital.capacity_management.models import (
            CapacityRule,
            CapacityThreshold,
        )

        tenant_uuid = uuid.UUID(str(tenant_id))

        # Check census
        census = BedManagementService.get_census(tenant_id=tenant_id, facility_id=facility_id)
        total = census["total"]
        occupied = census["occupied"]
        util_pct = (occupied / total * 100.0) if total > 0 else 0.0

        alert_level = "normal"
        if util_pct > 90.0:
            alert_level = "critical"
        elif util_pct > 75.0:
            alert_level = "warning"

        # Record metrics against rules
        rule, _ = CapacityRule.objects.get_or_create(
            tenant_id=tenant_uuid,
            rule_name="Standard Utilization Alert",
            metric_source="census",
            threshold_value=80,
            action_plan_name="Activate overflow units",
        )

        CapacityThreshold.objects.create(
            tenant_id=tenant_uuid,
            rule=rule,
            current_value=int(util_pct),
            status_level=alert_level,
        )

        return {
            "alert_level": alert_level,
            "utilization_pct": round(util_pct, 1),
        }

    @classmethod
    @transaction.atomic
    def activate_surge_plan(
        cls, tenant_id: str, facility_id: str, surge_level: str, activated_by: str
    ) -> Any:
        """
        Activates surge protocol and unlocks overflow capacity.
        """
        from products.cymed.hospital.capacity_management.models import OverflowUnit, SurgePlan

        tenant_uuid = uuid.UUID(str(tenant_id))

        plan = SurgePlan.objects.create(
            tenant_id=tenant_uuid,
            name=f"Level {surge_level} Surge Protocol",
            trigger_condition="High occupancy",
            allocated_beds_count=20,
            is_active=True,
        )

        # Open overflow units
        OverflowUnit.objects.create(
            tenant_id=tenant_uuid,
            name=f"Temporary Overflow Unit {surge_level}",
            temporary_capacity=20,
            current_occupancy=0,
            is_open=True,
        )

        payload = {
            "surge_plan_id": str(plan.id),
            "surge_level": surge_level,
            "activated_by": activated_by,
        }
        _emit_outbox_event(
            tenant_id, "cymed.hospital.surge.activated", "SurgePlanActivated", payload
        )

        return plan

    @classmethod
    def get_capacity_forecast(cls, tenant_id: str, facility_id: str, hours_ahead: int = 24) -> dict:
        """
        Projects admissions/discharges for the requested window from the trailing
        7-day hourly rate, and derives a trend by comparing the last 24h to the
        prior 6 days' average.
        """
        from products.cymed.hospital.adt.models import Admission, DischargeSummary

        tenant_uuid = uuid.UUID(str(tenant_id))
        now = timezone.now()
        window_start = now - timezone.timedelta(days=7)

        admissions_qs = Admission.objects.filter(
            tenant_id=tenant_uuid, admitted_at__gte=window_start, admitted_at__lte=now
        )
        discharges_qs = DischargeSummary.objects.filter(
            tenant_id=tenant_uuid, discharged_at__gte=window_start, discharged_at__lte=now
        )

        total_hours = (now - window_start).total_seconds() / 3600.0
        admission_rate_per_hour = admissions_qs.count() / total_hours if total_hours else 0.0
        discharge_rate_per_hour = discharges_qs.count() / total_hours if total_hours else 0.0

        last_24h_admissions = admissions_qs.filter(admitted_at__gte=now - timezone.timedelta(hours=24)).count()
        prior_avg_daily_admissions = max(admissions_qs.count() - last_24h_admissions, 0) / 6.0

        if last_24h_admissions > prior_avg_daily_admissions * 1.1:
            trend = "increasing"
        elif last_24h_admissions < prior_avg_daily_admissions * 0.9:
            trend = "decreasing"
        else:
            trend = "stable"

        return {
            "projected_admissions": round(admission_rate_per_hour * hours_ahead, 1),
            "projected_discharges": round(discharge_rate_per_hour * hours_ahead, 1),
            "utilization_trend": trend,
            "forecast_hours": hours_ahead,
        }


# ─────────────────────────────────────────────────────────────────────────────
# 9. Clinical Safety Service — code status, HAI device surveillance, VTE prophylaxis
# ─────────────────────────────────────────────────────────────────────────────


class ClinicalSafetyService:
    """
    Patient-safety tracking not covered elsewhere: resuscitation directives
    (code status), central-line/catheter HAI surveillance (CLABSI/CAUTI), and
    VTE prophylaxis ordering. These are standard hospital core-measure/quality
    metrics benchmarked by every accreditation body (Joint Commission, CBAHI).
    """

    @classmethod
    @transaction.atomic
    def set_code_status(
        cls,
        tenant_id: str,
        stay_id: str,
        status: str,
        ordered_by: str,
        reason: str = "",
        discussed_with_patient: bool = False,
        discussed_with_family: bool = False,
    ) -> Any:
        """
        Records a new code-status order (immutable audit entry) and updates
        the stay's denormalized current status for fast safety-check reads.
        """
        from products.cymed.hospital.inpatient.models import CodeStatusOrder, HospitalStay

        tenant_uuid = uuid.UUID(str(tenant_id))
        stay_uuid = uuid.UUID(str(stay_id))
        by_uuid = uuid.UUID(str(ordered_by))

        stay = HospitalStay.objects.get(id=stay_uuid, tenant_id=tenant_uuid)

        order = CodeStatusOrder.objects.create(
            tenant_id=tenant_uuid,
            stay=stay,
            status=status,
            ordered_by=by_uuid,
            reason=reason,
            discussed_with_patient=discussed_with_patient,
            discussed_with_family=discussed_with_family,
        )

        stay.current_code_status = status
        stay.save(update_fields=["current_code_status", "updated_at"])

        payload = {
            "stay_id": str(stay.id),
            "status": status,
            "ordered_by": str(ordered_by),
        }
        _emit_outbox_event(
            tenant_id, "cymed.hospital.code_status.changed", "CodeStatusChanged", payload
        )

        return order

    @classmethod
    @transaction.atomic
    def insert_device(
        cls,
        tenant_id: str,
        stay_id: str,
        device_type: str,
        inserted_by: str,
        insertion_site: str = "",
        inserted_at: Any | None = None,
    ) -> Any:
        """Registers a central line / urinary catheter insertion (HAI surveillance start)."""
        from products.cymed.hospital.inpatient.models import HospitalStay, IndwellingDevice

        tenant_uuid = uuid.UUID(str(tenant_id))
        stay_uuid = uuid.UUID(str(stay_id))
        by_uuid = uuid.UUID(str(inserted_by))

        stay = HospitalStay.objects.get(id=stay_uuid, tenant_id=tenant_uuid)

        if isinstance(inserted_at, str):
            ts = timezone.datetime.fromisoformat(inserted_at)
        else:
            ts = inserted_at or timezone.now()

        device = IndwellingDevice.objects.create(
            tenant_id=tenant_uuid,
            stay=stay,
            device_type=device_type,
            insertion_site=insertion_site,
            inserted_at=ts,
            inserted_by=by_uuid,
        )
        return device

    @classmethod
    @transaction.atomic
    def remove_device(cls, tenant_id: str, device_id: str, removal_reason: str = "") -> Any:
        """Closes out an indwelling device's device-days window."""
        from products.cymed.hospital.inpatient.models import IndwellingDevice

        tenant_uuid = uuid.UUID(str(tenant_id))
        device_uuid = uuid.UUID(str(device_id))

        device = IndwellingDevice.objects.get(id=device_uuid, tenant_id=tenant_uuid)
        device.removed_at = timezone.now()
        device.removal_reason = removal_reason
        device.save(update_fields=["removed_at", "removal_reason", "updated_at"])
        return device

    @classmethod
    @transaction.atomic
    def record_device_infection(
        cls,
        tenant_id: str,
        device_id: str,
        diagnosed_by: str,
        organism: str = "",
        notes: str = "",
    ) -> Any:
        """Records a confirmed CLABSI/CAUTI event attributable to a device."""
        from products.cymed.hospital.inpatient.models import (
            DeviceAssociatedInfection,
            IndwellingDevice,
        )

        tenant_uuid = uuid.UUID(str(tenant_id))
        device_uuid = uuid.UUID(str(device_id))
        by_uuid = uuid.UUID(str(diagnosed_by))

        device = IndwellingDevice.objects.get(id=device_uuid, tenant_id=tenant_uuid)

        infection = DeviceAssociatedInfection.objects.create(
            tenant_id=tenant_uuid,
            device=device,
            diagnosed_by=by_uuid,
            organism=organism,
            notes=notes,
        )

        payload = {
            "device_id": str(device.id),
            "device_type": device.device_type,
            "stay_id": str(device.stay_id),
            "organism": organism,
        }
        _emit_outbox_event(
            tenant_id, "cymed.hospital.hai.detected", "DeviceAssociatedInfectionDetected", payload
        )

        return infection

    @classmethod
    @transaction.atomic
    def order_vte_prophylaxis(
        cls,
        tenant_id: str,
        stay_id: str,
        method: str,
        ordered_by: str,
        contraindication_reason: str = "",
    ) -> Any:
        """Orders (or replaces) the VTE prophylaxis plan for a stay."""
        from products.cymed.hospital.inpatient.models import HospitalStay, VTEProphylaxisOrder

        tenant_uuid = uuid.UUID(str(tenant_id))
        stay_uuid = uuid.UUID(str(stay_id))
        by_uuid = uuid.UUID(str(ordered_by))

        stay = HospitalStay.objects.get(id=stay_uuid, tenant_id=tenant_uuid)

        order, _created = VTEProphylaxisOrder.objects.update_or_create(
            stay=stay,
            defaults={
                "tenant_id": tenant_uuid,
                "method": method,
                "ordered_by": by_uuid,
                "contraindication_reason": contraindication_reason,
            },
        )
        return order

    @classmethod
    def get_hai_rates(cls, tenant_id: str, days: int = 30) -> dict:
        """
        Computes CLABSI/CAUTI rates per 1,000 device-days over the trailing
        window -- the standard infection-control surveillance metric.
        """
        from products.cymed.hospital.inpatient.models import (
            DeviceAssociatedInfection,
            IndwellingDevice,
        )

        tenant_uuid = uuid.UUID(str(tenant_id))
        window_start = timezone.now() - timezone.timedelta(days=days)
        now = timezone.now()

        rates = {}
        for device_type, label in [
            ("central_line", "clabsi"),
            ("foley_catheter", "cauti"),
        ]:
            devices = IndwellingDevice.objects.filter(
                tenant_id=tenant_uuid,
                device_type=device_type,
                inserted_at__lte=now,
            ).filter(Q(removed_at__isnull=True) | Q(removed_at__gte=window_start))

            device_days = 0.0
            for d in devices:
                window_in_start = max(d.inserted_at, window_start)
                window_in_end = min(d.removed_at or now, now)
                if window_in_end > window_in_start:
                    device_days += (window_in_end - window_in_start).total_seconds() / 86400.0

            infections = DeviceAssociatedInfection.objects.filter(
                tenant_id=tenant_uuid,
                device__device_type=device_type,
                diagnosed_at__gte=window_start,
                diagnosed_at__lte=now,
            ).count()

            rate = round((infections / device_days) * 1000, 2) if device_days > 0 else 0.0
            rates[label] = {
                "infections": infections,
                "device_days": round(device_days, 1),
                "rate_per_1000_device_days": rate,
            }

        return rates


# ─────────────────────────────────────────────────────────────────────────────
# 10. Hospital Operations Service — shared real-time snapshot
# ─────────────────────────────────────────────────────────────────────────────


class HospitalOperationsService:
    """
    Single source of truth for the hospital's real-time operational snapshot.
    Used by both ClinicalCommandCenterMetricsView (dashboard) and
    HospitalAIAssistant (natural-language Q&A) so the two never drift.
    """

    @classmethod
    def get_snapshot(cls, tenant_id: str) -> dict:
        from products.cymed.core.facilities.models import Bed
        from products.cymed.hospital.adt.models import Admission, DischargeSummary
        from products.cymed.hospital.bed_management.models import BedAssignment
        from products.cymed.hospital.emergency.models import EmergencyVisit
        from products.cymed.hospital.icu.models import ICUStay
        from products.cymed.hospital.inpatient.models import DischargePlanning
        from products.cymed.hospital.nursing.models import NursingAssignment
        from products.cymed.hospital.operating_room.models import SurgicalCase

        tenant_uuid = uuid.UUID(str(tenant_id))

        total_admissions = Admission.objects.filter(tenant_id=tenant_uuid, status="admitted").count()
        active_bed_assignments = BedAssignment.objects.filter(
            tenant_id=tenant_uuid, released_at__isnull=True
        ).count()
        active_ed_visits = EmergencyVisit.objects.filter(
            tenant_id=tenant_uuid,
            status__in=["triage", "fast_track", "resuscitation", "observation"],
        ).count()
        active_icu_stays = ICUStay.objects.filter(
            tenant_id=tenant_uuid, icu_released_at__isnull=True
        ).count()
        scheduled_surgeries = SurgicalCase.objects.filter(
            tenant_id=tenant_uuid, status="scheduled"
        ).count()

        total_beds = Bed.objects.filter(tenant_id=tenant_uuid).count()
        bed_occupancy_pct = (
            round(active_bed_assignments / total_beds * 100.0, 2) if total_beds > 0 else 0.0
        )

        window_start = timezone.now() - timezone.timedelta(days=30)
        planned = DischargePlanning.objects.filter(
            tenant_id=tenant_uuid, created_at__gte=window_start
        ).select_related("stay__admission")
        on_time = 0
        evaluated = 0
        for plan in planned:
            summary = DischargeSummary.objects.filter(
                admission=plan.stay.admission, tenant_id=tenant_uuid
            ).first()
            if summary:
                evaluated += 1
                if summary.discharged_at.date() <= plan.target_discharge_date:
                    on_time += 1
        discharge_efficiency_index = round(on_time / evaluated, 2) if evaluated > 0 else None

        nurses_on_duty_today = (
            NursingAssignment.objects.filter(
                tenant_id=tenant_uuid, assigned_date=timezone.now().date()
            )
            .values("nurse_id")
            .distinct()
            .count()
        )
        nurse_patient_ratio = (
            round(total_admissions / nurses_on_duty_today, 2) if nurses_on_duty_today > 0 else None
        )

        hai_rates = ClinicalSafetyService.get_hai_rates(tenant_id=tenant_id)

        return {
            "operational_census": {
                "active_admissions": total_admissions,
                "current_occupied_beds": active_bed_assignments,
                "total_beds": total_beds,
                "emergency_waiting": active_ed_visits,
                "icu_occupancy": active_icu_stays,
                "scheduled_procedures_today": scheduled_surgeries,
            },
            "capacity_indicators": {
                "bed_occupancy_percentage": bed_occupancy_pct,
                "icu_ventilator_utilization": active_icu_stays,
                "discharge_efficiency_index": discharge_efficiency_index,
            },
            "staffing_compliance": {
                "nurse_to_patient_ratio": (
                    f"1:{nurse_patient_ratio}" if nurse_patient_ratio is not None else "not_tracked"
                ),
                "physician_duty_hours_compliance": "not_tracked",
            },
            "infection_control": hai_rates,
        }


# ─────────────────────────────────────────────────────────────────────────────
# 11. Hospital AI Assistant — advisory-only natural-language Q&A over the
#     real operational snapshot. Routes through CyAI (platform/cyai), never
#     reimplements provider calls or guardrails here (architecture rule:
#     "AI Prompts, Providers, Guardrails -> CyAI -> never duplicate").
# ─────────────────────────────────────────────────────────────────────────────


class HospitalAIAssistant:
    """
    Answers operational questions (admissions, beds, staffing, infection
    control) grounded in HospitalOperationsService's real snapshot -- never
    the model's own knowledge. Advisory only: it reports what the data shows,
    it does not make or suggest clinical decisions.
    """

    PROMPT_NAME = "Hospital Operations Assistant"

    SYSTEM_INSTRUCTIONS = (
        "You are the CyberCom Hospital Operations Assistant. Answer the user's question "
        "using ONLY the JSON operational snapshot provided below -- never invent numbers, "
        "never use outside knowledge, and never suggest a clinical or treatment decision. "
        "If the snapshot doesn't contain what's needed to answer, say so plainly. "
        "Be concise and cite the specific figures you used.\n\n"
        "Operational snapshot:\n{snapshot_json}\n\n"
        "Question: {question}"
    )

    @classmethod
    def _get_prompt_template(cls):
        from platform.cyai.models import PromptTemplate

        template, _ = PromptTemplate.objects.get_or_create(
            name=cls.PROMPT_NAME,
            defaults={
                "template_text": cls.SYSTEM_INSTRUCTIONS,
                "variables": ["snapshot_json", "question"],
                "active": True,
            },
        )
        return template

    @classmethod
    def ask(cls, tenant_id: str, question: str, model_config_id: str | None = None) -> dict:
        import json

        from platform.cyai.models import ModelConfig
        from platform.cyai.services import ModelGateway

        if model_config_id:
            config = ModelConfig.objects.get(id=uuid.UUID(str(model_config_id)), active=True)
        else:
            config = ModelConfig.objects.filter(active=True).first()
            if not config:
                raise ValueError(
                    "No active CyAI ModelConfig configured -- an administrator must add one "
                    "before the hospital AI assistant can answer questions."
                )

        snapshot = HospitalOperationsService.get_snapshot(tenant_id)
        template = cls._get_prompt_template()

        result = ModelGateway.generate_completion(
            tenant_id=str(tenant_id),
            config=config,
            prompt=template.template_text,
            variables={"snapshot_json": json.dumps(snapshot), "question": question},
        )

        return {
            "answer": result["text"],
            "status": result["status"],
            "snapshot_used": snapshot,
            "log_id": result.get("log_id"),
        }
