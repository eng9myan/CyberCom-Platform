# Worklists & Analyzers

**App**: `products.cymed.laboratory.worklists` (label: `lab_worklists`)

---

## Models

| Model | Purpose |
|-------|---------|
| `Analyzer` | Physical analyzer (Cobas, XN-9000, Architect...) |
| `AnalyzerInterface` | Maps LabTest ↔ Analyzer instrument test code |
| `AnalyzerMessage` | Raw HL7 LIS2-A2 / ASTM inbound/outbound messages |
| `AnalyzerResult` | Parsed result from analyzer message |
| `LabWorklist` | Named work batch for a department/shift |
| `WorklistItem` | Single order item on a worklist |
| `TechnologistAssignment` | Technologist assigned to a worklist |

---

## Analyzer Framework

Every analyzer has:
- `integration_hub_channel` — CyIntegrationHub topic for routing
- `connection_type` — tcp_ip | serial | middleware | host_query
- `protocol` — hl7v2 | astm | proprietary

Inbound results flow: `Analyzer → CyIntegrationHub → AnalyzerMessage → AnalyzerResult → ResultValue`

---

## HL7 v2 Analyzer Messages

`AnalyzerMessage` stores the raw HL7 2.5 message (OML^O21 query, ORU^R01 result). Parsed asynchronously via Celery task. Supports air-gapped analyzers routed through CyIntegrationHub middleware.

---

## Worklist Lifecycle

```
OPEN → IN_PROGRESS → COMPLETED | CANCELLED
```

Department head creates worklist for date + department. Technologist accepts assignment. Items move from `pending → in_progress → resulted → verified`.

---

## Feature Flag

`required_feature = "lab.worklists"`
