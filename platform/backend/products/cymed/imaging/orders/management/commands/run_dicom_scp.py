"""
Real DICOM SCP (Service Class Provider) -- a long-running TCP listener,
not a Django request/response endpoint, since DICOM associations are
stateful. Handles:

  - C-ECHO   (verification -- "can this modality reach us at all")
  - C-STORE  (receive images pushed from a modality/PACS)
  - C-FIND   (Modality Worklist -- so a modality can pull today's ordered
              studies instead of a technologist re-typing patient data)

Run standalone (own process/container, see docker-compose.yml's
`dicom-scp` service), not inside the Django dev server or gunicorn --
pynetdicom's AE.start_server() blocks the calling thread.

Usage:
    python manage.py run_dicom_scp --ae-title CYBERCOM --port 11112 \
        --storage-dir /var/lib/cybercom/dicom-store --tenant-id <uuid>
"""

import logging
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from pydicom.dataset import Dataset
from pydicom.uid import UID
from pynetdicom import AE, ALL_TRANSFER_SYNTAXES, AllStoragePresentationContexts, evt
from pynetdicom.sop_class import ModalityWorklistInformationFind, Verification
from pynetdicom.status import Status

logger = logging.getLogger("cybercom.imaging.dicom_scp")


# -- C-ECHO -------------------------------------------------------------------
def on_c_echo(event):
    logger.info("C-ECHO from %s", event.assoc.requestor.ae_title)
    return Status.SUCCESS


# -- C-STORE --------------------------------------------------------------------
def on_c_store(event, storage_dir: Path, tenant_id: str):
    """
    Persists the received instance to disk, then runs it through the same
    real pydicom-based parser used elsewhere (CyIntegrationHub's
    ConnectorFramework.parse_dicom_metadata) and links it back to the
    matching ImagingOrderItem by StudyInstanceUID, if one exists.
    """
    from platform.cyintegrationhub.services import ConnectorFramework
    from products.cymed.imaging.orders.models import ImagingOrderItem

    dataset = event.dataset
    dataset.file_meta = event.file_meta

    sop_instance_uid = dataset.get("SOPInstanceUID", "unknown")
    file_path = storage_dir / f"{sop_instance_uid}.dcm"
    dataset.save_as(file_path, write_like_original=False)
    logger.info("C-STORE received, saved to %s", file_path)

    try:
        with open(file_path, "rb") as handle:
            metadata = ConnectorFramework.parse_dicom_metadata(handle.read())
    except Exception:
        logger.exception("Failed to parse stored DICOM instance %s", file_path)
        return 0x0000  # storage already succeeded; parsing failure is non-fatal to C-STORE

    study_instance_uid = metadata.get("study_instance_uid")
    if study_instance_uid:
        matched = ImagingOrderItem.objects.filter(
            tenant_id=tenant_id, dicom_study_instance_uid=study_instance_uid
        ).first()
        if matched is not None:
            matched.status = "completed"
            matched.save(update_fields=["status"])
            logger.info("Linked C-STORE to ImagingOrderItem %s", matched.id)

    return 0x0000  # Success


# -- C-FIND (Modality Worklist) -------------------------------------------------
def on_c_find_mwl(event, tenant_id: str):
    """
    Responds to a Modality Worklist query with every pending/scheduled
    ImagingOrderItem for this tenant -- lets the modality pull the day's
    ordered studies instead of a technologist re-typing patient
    demographics at the console (a real, common source of wrong-patient
    imaging errors).
    """
    from products.cymed.core.patients.models import Patient
    from products.cymed.imaging.orders.models import ImagingOrderItem

    items = ImagingOrderItem.objects.filter(
        tenant_id=tenant_id, status__in=["pending", "scheduled"]
    ).select_related("order", "procedure")

    for item in items:
        patient = Patient.objects.filter(id=item.order.patient_id).first()
        if patient is None:
            continue

        response = Dataset()
        response.PatientName = f"{patient.last_name}^{patient.first_name}"
        response.PatientID = patient.mrn
        response.PatientBirthDate = (
            patient.dob.strftime("%Y%m%d") if getattr(patient, "dob", None) else ""
        )
        response.PatientSex = (getattr(patient, "gender", "") or "")[:1].upper()
        response.AccessionNumber = item.accession_number or item.order.order_number
        response.Modality = item.procedure.modality
        response.RequestedProcedureDescription = item.procedure.name
        response.StudyInstanceUID = item.dicom_study_instance_uid or UID(_generate_fallback_uid(item.id))

        # Scheduled Procedure Step Sequence -- the actual worklist entry
        sps = Dataset()
        sps.Modality = item.procedure.modality
        sps.ScheduledStationAETitle = "ANY"
        sps.ScheduledProcedureStepDescription = item.procedure.name
        response.ScheduledProcedureStepSequence = [sps]

        yield (0xFF00, response)  # Pending -- more matches follow

    yield (0x0000, None)  # Success -- no more matches


def _generate_fallback_uid(item_id) -> str:
    """
    Deterministic UID derived from the order item id for items that
    haven't been assigned a real StudyInstanceUID yet -- lets the
    worklist entry round-trip back to this item once the modality does
    push images, without waiting on a separate UID-assignment step.
    """
    digits = str(int(item_id.hex, 16))[:20]
    return f"2.25.{digits}"


def build_dicom_scp_ae(ae_title: str, storage_dir: Path, tenant_id: str) -> tuple[AE, list]:
    """
    Builds the configured AE + event handlers -- shared by the management
    command (real usage) and tests (spin up on an ephemeral port).
    """
    ae = AE(ae_title=ae_title)
    ae.add_supported_context(Verification, ALL_TRANSFER_SYNTAXES)
    for context in AllStoragePresentationContexts:
        ae.add_supported_context(context.abstract_syntax, ALL_TRANSFER_SYNTAXES)
    ae.add_supported_context(ModalityWorklistInformationFind, ALL_TRANSFER_SYNTAXES)

    evt_handlers = [
        (evt.EVT_C_ECHO, on_c_echo),
        (evt.EVT_C_STORE, on_c_store, [storage_dir, tenant_id]),
        (evt.EVT_C_FIND, on_c_find_mwl, [tenant_id]),
    ]
    return ae, evt_handlers


class Command(BaseCommand):
    help = "Run the DICOM SCP (C-ECHO / C-STORE / Modality Worklist C-FIND) TCP listener."

    def add_arguments(self, parser):
        parser.add_argument("--ae-title", default="CYBERCOM", help="This SCP's AE title.")
        parser.add_argument("--port", type=int, default=11112, help="TCP port to listen on.")
        parser.add_argument(
            "--storage-dir", required=True, help="Directory to write received DICOM instances to."
        )
        parser.add_argument(
            "--tenant-id", required=True, help="Tenant UUID whose ImagingOrders this SCP serves."
        )

    def handle(self, *args, **options):
        storage_dir = Path(options["storage_dir"])
        storage_dir.mkdir(parents=True, exist_ok=True)
        tenant_id = options["tenant_id"]

        ae, evt_handlers = build_dicom_scp_ae(options["ae_title"], storage_dir, tenant_id)

        self.stdout.write(
            self.style.SUCCESS(
                f"DICOM SCP '{options['ae_title']}' listening on port {options['port']} "
                f"(storage: {storage_dir}, tenant: {tenant_id})"
            )
        )
        try:
            ae.start_server(("0.0.0.0", options["port"]), block=True, evt_handlers=evt_handlers)
        except OSError as exc:
            raise CommandError(f"Could not bind port {options['port']}: {exc}") from exc
