# CyIntegration Hub Guide (Program 2.6)

This guide documents the interoperability architecture and connectors within the **CyIntegration Hub** platform.

---

## 1. Connector Registry & Framework

The CyIntegration Hub connects CyberCom to external systems (hospitals, labs, insurance providers, retail networks, government databases) using standard protocols.

### Available Connectors:
*   **FHIR (R4):** Syncs clinical resources (Patient, Encounter, Observation) using RESTful standards. Supports SMART on FHIR authorization flows.
*   **HL7v2 (MLLP):** Parses ADT (Admission, Discharge, Transfer) and ORU (Observational Result) messages.
*   **DICOM:** Archives and retrieves medical images via PACS/SOP instances.
*   **SOAP / Web Services:** Wraps legacy banking and ERP systems.
*   **LDAP / Active Directory / Keycloak:** Resolves identities and directories.
*   **SMTP:** Delivers notifications and email OTPs.
*   **REST / SFTP:** Integrates government, retail, and payment gateway APIs.

---

## 2. Transformation & Mapping Engines

### Transformation Engine
Converts raw non-JSON payloads (e.g. MLLP-wrapped HL7 segments or SOAP XML envelopes) into clean dictionaries.
```python
from platform.cyintegrationhub.services import TransformationEngine
parsed = TransformationEngine.transform(hl7_segment_string, "hl7v2")
```

### Mapping Engine
Translates keys from external schemas to target platform fields using dynamic `TransformationMapping` rules.
*   **Rule Example:** Maps external field `PatientName` to internal attribute `given_name`.
```python
mapped = MappingEngine.map_fields(parsed, mapping_object)
```

---

## 3. Message Routing & Audit Logs

### Routing Engine
Routes the transformed payloads to outbox events or target HTTP locations:
```python
from platform.cyintegrationhub.services import RoutingEngine
RoutingEngine.route_message(tenant_id, "product.cymed.clinical.events", "cymed.patient.admission", payload)
```

### Integration Auditing
Every inbound/outbound connection records an audit row in `platform_integration_message_audits`. This tracks payload sizes, execution duration (ms), and success/failure status for compliance reviews.
