"""
Real MLLP (Minimal Lower Layer Protocol) listener for lab analyzer HL7v2
interfaces -- a long-running TCP server, not a Django request/response
endpoint, since it needs to sit on a fixed port waiting for whatever
analyzer connects and pushes a result whenever one's ready.

MLLP framing: <VT>message<FS><CR> (VT=0x0b, FS=0x1c, CR=0x0d). This
listener receives ORU^R01 (results) from the analyzer and ACKs each one;
sending ORM^O01 (orders) to the analyzer's worklist is the outbound half,
exposed as send_orm_to_analyzer() for callers (e.g. a post_save signal on
LabOrderItem) to use, not run from this command.

Run standalone (own process/container), not inside the Django dev server
or gunicorn -- this blocks on accept() in a loop.

Usage:
    python manage.py run_mllp_listener --host 0.0.0.0 --port 2575 --tenant-id <uuid>
"""

import logging
import socket
import threading
from datetime import datetime, timezone as dt_timezone
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError

from platform.cyintegrationhub.services import TransformationEngine

logger = logging.getLogger("cybercom.laboratory.mllp")

VT = b"\x0b"
FS = b"\x1c"
CR = b"\x0d"


def wrap_mllp(hl7_message: str) -> bytes:
    return VT + hl7_message.encode("utf-8") + FS + CR


def unwrap_mllp(framed: bytes) -> str:
    """
    Strips exactly the MLLP envelope: a leading VT and a trailing FS+CR.
    Deliberately not bytes.strip(VT+FS+CR) -- strip() removes any of those
    byte VALUES from either end as a set, and HL7 segments themselves end
    in \\r (the same byte as the MLLP trailer's CR), so strip() silently
    eats the message's own trailing segment terminator too.
    """
    body = framed
    if body[:1] == VT:
        body = body[1:]
    if body[-2:] == FS + CR:
        body = body[:-2]
    return body.decode("utf-8")


def build_ack(message_control_id: str, sending_app: str = "CYBERCOM") -> str:
    now = datetime.now(dt_timezone.utc).strftime("%Y%m%d%H%M%S")
    return (
        f"MSH|^~\\&|{sending_app}|CYBERCOM_LAB|||{now}||ACK|{message_control_id}|P|2.5\r"
        f"MSA|AA|{message_control_id}\r"
    )


def build_nack(message_control_id: str, reason: str, sending_app: str = "CYBERCOM") -> str:
    now = datetime.now(dt_timezone.utc).strftime("%Y%m%d%H%M%S")
    return (
        f"MSH|^~\\&|{sending_app}|CYBERCOM_LAB|||{now}||ACK|{message_control_id}|P|2.5\r"
        f"MSA|AE|{message_control_id}|{reason}\r"
    )


def ingest_oru_result(tenant_id: str, parsed: dict) -> list[str]:
    """
    Matches each OBR/OBX order group in a parsed ORU message back to a
    LabOrderItem (via LabOrder.order_number/hl7_placer_order_number ==
    OBR-2 Placer Order Number, and LabTest.code == OBR-4 Universal Service
    ID), creates/updates the real LabResult/ResultValue rows, and moves
    the item to "resulted". Never fabricates a match -- an order group
    that doesn't resolve to a real LabOrderItem is skipped and reported,
    not silently dropped.
    """
    from products.cymed.laboratory.orders.models import LabOrder, LabOrderItem
    from products.cymed.laboratory.results.models import LabResult, ResultValue

    unmatched: list[str] = []

    for group in parsed.get("order_groups", []):
        placer_number = group.get("placer_order_number", "")
        service_id = group.get("universal_service_id", "")
        if not placer_number:
            unmatched.append("order group with no Placer Order Number (OBR-2)")
            continue

        order = LabOrder.objects.filter(tenant_id=tenant_id, order_number=placer_number).first()
        if order is None:
            order = LabOrder.objects.filter(
                tenant_id=tenant_id, hl7_placer_order_number=placer_number
            ).first()
        if order is None:
            unmatched.append(f"no LabOrder matches placer order number {placer_number!r}")
            continue

        item = LabOrderItem.objects.filter(order=order, test__code=service_id).first()
        if item is None:
            # Fall back to the order's only item when there's exactly one --
            # common for single-test STAT orders where OBR-4 doesn't
            # exactly echo our internal test code.
            candidates = list(LabOrderItem.objects.filter(order=order))
            item = candidates[0] if len(candidates) == 1 else None
        if item is None:
            unmatched.append(
                f"no LabOrderItem matches test code {service_id!r} on order {placer_number!r}"
            )
            continue

        result, _ = LabResult.objects.get_or_create(
            order_item=item, defaults={"tenant_id": tenant_id}
        )
        result.status = "resulted"
        result.resulted_at = datetime.now(dt_timezone.utc)
        result.save(update_fields=["status", "resulted_at"])

        for seq, obs in enumerate(group.get("observations", [])):
            value_numeric = None
            try:
                value_numeric = Decimal(obs["value"])
            except (InvalidOperation, KeyError, TypeError):
                pass

            ResultValue.objects.create(
                tenant_id=tenant_id,
                result=result,
                analyte_code=obs.get("observation_id", ""),
                analyte_name=obs.get("observation_id", ""),
                value_type="numeric" if value_numeric is not None else "text",
                value_numeric=value_numeric,
                value_text="" if value_numeric is not None else obs.get("value", ""),
                unit=obs.get("units", ""),
                sequence=seq,
            )

        item.status = "resulted"
        item.resulted_at = datetime.now(dt_timezone.utc)
        item.save(update_fields=["status", "resulted_at"])
        logger.info("Ingested ORU result for order %s / item %s", order.order_number, item.id)

    return unmatched


def send_orm_to_analyzer(host: str, port: int, order, item, timeout: float = 10.0) -> str:
    """
    Dials out to the analyzer and pushes an ORM^O01 order message ("orders
    out" -- the direction this listener doesn't itself handle, since
    that's a client role, not a server one). Returns the raw ACK/NACK
    response for the caller to inspect.
    """
    from products.cymed.core.patients.models import Patient

    patient = Patient.objects.filter(id=order.patient_id).first()
    patient_name = f"{patient.last_name}^{patient.first_name}" if patient else ""
    patient_mrn = patient.mrn if patient else ""

    now = datetime.now(dt_timezone.utc).strftime("%Y%m%d%H%M%S")
    control_id = f"ORM{item.id.hex[:12].upper()}"
    message = (
        f"MSH|^~\\&|CYBERCOM|CYBERCOM_LAB|||{now}||ORM^O01|{control_id}|P|2.5\r"
        f"PID|||{patient_mrn}||{patient_name}\r"
        f"ORC|NW|{order.order_number}\r"
        f"OBR|1|{order.order_number}||{item.test.code if item.test else ''}^{item.test.name if item.test else ''}"
        f"|||{now}\r"
    )

    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.sendall(wrap_mllp(message))
        response = sock.recv(65536)
    return unwrap_mllp(response) if response else ""


class Command(BaseCommand):
    help = "Run the MLLP TCP listener for lab analyzer HL7v2 result (ORU) interfaces."

    def add_arguments(self, parser):
        parser.add_argument("--host", default="0.0.0.0", help="Address to bind to.")
        parser.add_argument("--port", type=int, default=2575, help="TCP port to listen on.")
        parser.add_argument(
            "--tenant-id", required=True, help="Tenant UUID whose LabOrders this listener serves."
        )

    def handle(self, *args, **options):
        tenant_id = options["tenant_id"]
        server = start_mllp_server(options["host"], options["port"], tenant_id)
        self.stdout.write(
            self.style.SUCCESS(
                f"MLLP listener bound to {options['host']}:{options['port']} (tenant: {tenant_id})"
            )
        )
        try:
            serve_forever(server, tenant_id)
        except OSError as exc:
            raise CommandError(f"MLLP listener failed: {exc}") from exc
        finally:
            server.close()


def start_mllp_server(host: str, port: int, tenant_id: str) -> socket.socket:
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((host, port))
    server.listen(5)
    return server


def serve_forever(server: socket.socket, tenant_id: str) -> None:
    while True:
        try:
            conn, addr = server.accept()
        except OSError:
            # server.close() from another thread (shutdown) surfaces here
            # as accept() failing on the now-closed socket -- that's the
            # stop signal, not a real error.
            return
        threading.Thread(
            target=handle_connection, args=(conn, addr, tenant_id), daemon=True
        ).start()


def handle_connection(conn: socket.socket, addr, tenant_id: str) -> None:
    logger.info("MLLP connection from %s", addr)
    buffer = b""
    try:
        while True:
            chunk = conn.recv(65536)
            if not chunk:
                break
            buffer += chunk
            while FS + CR in buffer:
                framed, _, buffer = buffer.partition(FS + CR)
                framed += FS + CR
                _process_message(conn, framed, tenant_id)
    except Exception:
        logger.exception("MLLP connection from %s failed", addr)
    finally:
        conn.close()


def _process_message(conn: socket.socket, framed: bytes, tenant_id: str) -> None:
    control_id = ""
    try:
        hl7_message = unwrap_mllp(framed)
        parsed = TransformationEngine.transform(hl7_message, "hl7v2")
        control_id = parsed.get("message_control_id", "")

        if parsed.get("message_code") == "ORU":
            unmatched = ingest_oru_result(tenant_id, parsed)
            if unmatched:
                logger.warning("ORU %s had unmatched order groups: %s", control_id, unmatched)
        # Non-ORU messages are acknowledged but otherwise ignored -- this
        # listener's job is ORU ingestion, not general HL7 routing.
        conn.sendall(wrap_mllp(build_ack(control_id)))
    except Exception as exc:
        logger.exception("Failed to process MLLP message")
        conn.sendall(wrap_mllp(build_nack(control_id, str(exc))))
