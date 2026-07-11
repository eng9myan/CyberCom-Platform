import socket
import time
import uuid
from pathlib import Path

import pytest
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import CTImageStorage, ExplicitVRLittleEndian, generate_uid
from pynetdicom import AE
from pynetdicom.sop_class import ModalityWorklistInformationFind, Verification

from products.cymed.core.facilities.models import Facility
from products.cymed.core.organizations.models import Organization
from products.cymed.core.patients.models import Patient
from products.cymed.imaging.orders.management.commands.run_dicom_scp import build_dicom_scp_ae
from products.cymed.imaging.orders.models import ImagingOrder, ImagingOrderItem, ImagingProcedure


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def _build_ct_dataset(study_instance_uid: str, patient_name="Doe^John", patient_id="MRN12345"):
    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = CTImageStorage
    file_meta.MediaStorageSOPInstanceUID = generate_uid()
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    file_meta.ImplementationClassUID = generate_uid()

    ds = FileDataset(None, {}, file_meta=file_meta, preamble=b"\x00" * 128)
    ds.PatientName = patient_name
    ds.PatientID = patient_id
    ds.SOPClassUID = CTImageStorage
    ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
    ds.StudyInstanceUID = study_instance_uid
    ds.SeriesInstanceUID = generate_uid()
    ds.StudyDate = "20260628"
    ds.Modality = "CT"
    ds.is_little_endian = True
    ds.is_implicit_VR = False
    return ds


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture
def dicom_scp_server(tmp_path, test_tenant_id):
    """
    Spins up the real SCP on an ephemeral localhost port for the duration
    of the test -- actual TCP socket, actual DICOM association negotiation,
    not a mocked handler.
    """
    port = _free_port()
    storage_dir = Path(tmp_path) / "dicom-store"
    storage_dir.mkdir(parents=True, exist_ok=True)
    ae, evt_handlers = build_dicom_scp_ae("CYBERCOM", storage_dir, str(test_tenant_id))
    server = ae.start_server(("127.0.0.1", port), block=False, evt_handlers=evt_handlers)
    time.sleep(0.2)  # let the listener thread actually bind before tests connect
    yield port, storage_dir
    server.shutdown()


@pytest.mark.django_db
class TestDicomScpEcho:
    def test_c_echo_succeeds(self, dicom_scp_server):
        port, _storage_dir = dicom_scp_server
        client = AE(ae_title="TEST_MODALITY")
        client.add_requested_context(Verification)
        assoc = client.associate("127.0.0.1", port, ae_title="CYBERCOM")
        assert assoc.is_established
        status = assoc.send_c_echo()
        assert status.Status == 0x0000
        assoc.release()


@pytest.mark.django_db(transaction=True)
class TestDicomScpStore:
    """
    transaction=True: the SCP handlers run in pynetdicom's own background
    thread, a separate DB connection from the test's main thread. The
    default django_db wraps each test in an uncommitted transaction on the
    main thread's connection, which a second thread/connection can't see
    -- with SQLite that surfaces as "database table is locked" instead of
    just "row not found". transaction=True makes writes actually commit,
    visible to the SCP thread's own connection, matching how this behaves
    against a real multi-connection database in production.
    """

    def test_c_store_persists_file_and_links_order_item(self, dicom_scp_server, test_tenant_id):
        port, storage_dir = dicom_scp_server

        org = Organization.objects.create(
            tenant_id=test_tenant_id, name="Test Hospital", slug="test-hosp", organization_type="hospital"
        )
        facility = Facility.objects.create(
            tenant_id=test_tenant_id, organization=org, name="Main", code="MAIN"
        )
        patient = Patient.objects.create(
            tenant_id=test_tenant_id, first_name="John", last_name="Doe", dob="1980-01-01",
            gender="male", mrn="MRN12345",
        )
        procedure = ImagingProcedure.objects.create(
            tenant_id=test_tenant_id, code="CT-HEAD", name="CT Head", modality="CT",
        )
        order = ImagingOrder.objects.create(
            tenant_id=test_tenant_id, order_number="IMG-TEST-001", patient_id=patient.id,
            ordered_by=uuid.uuid4(),
        )
        study_uid = generate_uid()
        item = ImagingOrderItem.objects.create(
            tenant_id=test_tenant_id, order=order, procedure=procedure,
            status="scheduled", dicom_study_instance_uid=study_uid,
        )

        dataset = _build_ct_dataset(study_instance_uid=study_uid)

        client = AE(ae_title="TEST_MODALITY")
        client.add_requested_context(CTImageStorage, ExplicitVRLittleEndian)
        assoc = client.associate("127.0.0.1", port, ae_title="CYBERCOM")
        assert assoc.is_established
        status = assoc.send_c_store(dataset)
        assoc.release()

        assert status.Status == 0x0000
        stored_files = list(storage_dir.glob("*.dcm"))
        assert len(stored_files) == 1

        item.refresh_from_db()
        assert item.status == "completed"


@pytest.mark.django_db(transaction=True)
class TestDicomScpModalityWorklist:
    def test_c_find_returns_pending_worklist_items(self, dicom_scp_server, test_tenant_id):
        port, _storage_dir = dicom_scp_server

        org = Organization.objects.create(
            tenant_id=test_tenant_id, name="Test Hospital", slug="test-hosp-2", organization_type="hospital"
        )
        Facility.objects.create(tenant_id=test_tenant_id, organization=org, name="Main", code="MAIN2")
        patient = Patient.objects.create(
            tenant_id=test_tenant_id, first_name="Sara", last_name="Ahmad", dob="1990-05-05",
            gender="female", mrn="MRN99999",
        )
        procedure = ImagingProcedure.objects.create(
            tenant_id=test_tenant_id, code="XR-CHEST", name="Chest X-Ray", modality="XR",
        )
        order = ImagingOrder.objects.create(
            tenant_id=test_tenant_id, order_number="IMG-TEST-002", patient_id=patient.id,
            ordered_by=uuid.uuid4(),
        )
        ImagingOrderItem.objects.create(
            tenant_id=test_tenant_id, order=order, procedure=procedure,
            status="pending", accession_number="ACC-002",
        )

        client = AE(ae_title="TEST_MODALITY")
        client.add_requested_context(ModalityWorklistInformationFind)
        assoc = client.associate("127.0.0.1", port, ae_title="CYBERCOM")
        assert assoc.is_established

        from pydicom.dataset import Dataset

        query = Dataset()
        query.PatientName = "*"
        query.Modality = "XR"

        results = []
        responses = assoc.send_c_find(query, ModalityWorklistInformationFind)
        for status, identifier in responses:
            if status and status.Status == 0xFF00:
                results.append(identifier)
        assoc.release()

        assert len(results) >= 1
        assert any(r.PatientID == "MRN99999" for r in results)
        assert any(r.AccessionNumber == "ACC-002" for r in results)
