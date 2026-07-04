# PACS Gateway

## Overview

The PACS Gateway (`img_pacs`) is the integration layer between CyMed and external
Picture Archiving and Communication Systems. CyMed never stores pixel data; the
gateway manages routing metadata, query results, and event notifications.

## PACSNode Configuration

Each connected PACS is represented as a `PACSNode`:

```python
PACSNode(
    code="SECTRA-MAIN",
    name="Sectra PACS — Main",
    ae_title="SECTRA01",
    host="10.0.1.50",
    port=11112,                          # traditional DICOM
    protocol="dicomweb",                 # or "dicom"
    wado_rs_url="https://...",
    qido_rs_url="https://...",
    stow_rs_url="https://...",
    tls_enabled=True,
    api_key_reference="secrets/pacs/sectra-main-api-key",  # NOT the actual key
    is_primary=True,
)
```

`api_key_reference` stores only the secrets-manager path. The actual key is
fetched at runtime by the secrets client — never logged or serialized.

## Query Types

| `query_type` | Protocol | Trigger |
|---|---|---|
| `find` | C-FIND / QIDO-RS | Check if study exists |
| `move` | C-MOVE | Request study delivery |
| `get` | C-GET | Inline study pull |
| `qido_rs` | QIDO-RS | REST study metadata query |
| `wado_rs` | WADO-RS | REST study/frame retrieval metadata |

`PACSQuery` records every outbound query with request params and response summary
for audit purposes.

## Study Routing

`StudyRoute` tracks DICOM study movement between PACS nodes:

- `route_type`: forward | pre-fetch | migrate | backup
- `status`: pending | in_progress | completed | failed
- Completed routes record `transferred_at` and `file_count`

Example use: routing a teleradiology case from facility PACS to cloud archive.

## PACS Event Notifications

`PACSEvent` captures inbound events from PACS (typically via STOW-RS notification
webhook or HL7 ADT/ORM):

| event_type | Meaning |
|---|---|
| `study_received` | PACS confirms acquisition complete |
| `study_retrieved` | Study pulled for reading |
| `study_deleted` | Study removed from online tier |
| `archive_complete` | Study archived to warm/cold |
| `error` | PACS-side error |

Unacknowledged events visible in dashboard; acknowledged by workflow service on
successful downstream processing.

## Failure Handling

- `PACSQuery.retry_count` tracks retry attempts
- Failed queries re-queued by Celery task with exponential backoff
- `PACSNode.last_ping_at` / `last_error` for health monitoring
- Alert fired to operations team when primary PACS node error count exceeds threshold
