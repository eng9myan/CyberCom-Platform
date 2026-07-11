import socket
import threading
import time
import uuid
from decimal import Decimal

import pytest

from products.cymed.laboratory.orders.management.commands.run_mllp_listener import (
    FS,
    VT,
    build_ack,
    ingest_oru_result,
    serve_forever,
    start_mllp_server,
    unwrap_mllp,
    wrap_mllp,
)
from products.cymed.laboratory.orders.models import LabOrder, LabOrderItem, LabTest
from products.cymed.laboratory.results.models import LabResult, ResultValue


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


class TestMllpFraming:
    def test_wrap_unwrap_round_trip(self):
        message = "MSH|^~\\&|ANALYZER|LAB|||20260628||ORU^R01|MSG1|P|2.5\r"
        framed = wrap_mllp(message)
        assert framed[0:1] == VT
        assert framed[-2:-1] == FS
        assert unwrap_mllp(framed) == message

    def test_build_ack_contains_control_id(self):
        ack = build_ack("MSG123")
        assert "MSA|AA|MSG123" in ack


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture
def lab_order_with_item(test_tenant_id):
    test = LabTest.objects.create(
        tenant_id=test_tenant_id, code=f"CBC-{uuid.uuid4().hex[:8]}", name="Complete Blood Count"
    )
    order = LabOrder.objects.create(
        tenant_id=test_tenant_id, order_number=f"LAB-{uuid.uuid4().hex[:8].upper()}",
        patient_id=uuid.uuid4(), ordered_by=uuid.uuid4(),
    )
    item = LabOrderItem.objects.create(tenant_id=test_tenant_id, order=order, test=test)
    return order, item, test


@pytest.mark.django_db
class TestIngestOruResult:
    def test_matches_order_and_creates_result_values(self, test_tenant_id, lab_order_with_item):
        order, item, test = lab_order_with_item
        parsed = {
            "order_groups": [
                {
                    "placer_order_number": order.order_number,
                    "filler_order_number": "",
                    "universal_service_id": test.code,
                    "observations": [
                        {"observation_id": "WBC", "value": "7.2", "units": "10^3/uL", "result_status": "F"},
                        {"observation_id": "HGB", "value": "14.1", "units": "g/dL", "result_status": "F"},
                    ],
                }
            ]
        }

        unmatched = ingest_oru_result(str(test_tenant_id), parsed)

        assert unmatched == []
        result = LabResult.objects.get(order_item=item)
        assert result.status == "resulted"
        values = ResultValue.objects.filter(result=result)
        assert values.count() == 2
        wbc = values.get(analyte_code="WBC")
        assert wbc.value_numeric == Decimal("7.2")

        item.refresh_from_db()
        assert item.status == "resulted"

    def test_reports_unmatched_placer_order_number(self, test_tenant_id):
        parsed = {
            "order_groups": [
                {"placer_order_number": "NONEXISTENT-999", "universal_service_id": "X", "observations": []}
            ]
        }
        unmatched = ingest_oru_result(str(test_tenant_id), parsed)
        assert len(unmatched) == 1
        assert "NONEXISTENT-999" in unmatched[0]
        assert not LabResult.objects.exists()


@pytest.mark.django_db(transaction=True)
class TestMllpServerEndToEnd:
    """
    transaction=True: the server's connection-handler threads use their
    own DB connections, separate from the test's main-thread connection --
    same reasoning as the DICOM SCP tests.
    """

    def test_send_oru_over_real_socket_gets_acked_and_ingested(self, test_tenant_id, lab_order_with_item):
        order, item, test = lab_order_with_item
        port = _free_port()
        server = start_mllp_server("127.0.0.1", port, str(test_tenant_id))
        thread = threading.Thread(target=serve_forever, args=(server, str(test_tenant_id)), daemon=True)
        thread.start()
        time.sleep(0.2)

        message = (
            f"MSH|^~\\&|ANALYZER|LAB|||20260628120000||ORU^R01|MSG-E2E-1|P|2.5\r"
            f"PID|||{order.patient_id}||Doe^John\r"
            f"OBR|1|{order.order_number}||{test.code}|||20260628120000\r"
            f"OBX|1|NM|WBC||7.2|10^3/uL|4.0-11.0|N|||F\r"
        )

        try:
            with socket.create_connection(("127.0.0.1", port), timeout=5) as client:
                client.sendall(wrap_mllp(message))
                response = client.recv(65536)
        finally:
            server.close()

        ack = unwrap_mllp(response)
        assert "MSA|AA|MSG-E2E-1" in ack

        item.refresh_from_db()
        assert item.status == "resulted"
        assert ResultValue.objects.filter(result__order_item=item, analyte_code="WBC").exists()
