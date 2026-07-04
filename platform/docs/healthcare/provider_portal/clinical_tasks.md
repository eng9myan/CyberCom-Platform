# CyMed Provider Portal — Clinical Tasks

## Overview

The clinical task system is the backbone of care coordination in the portal.
All actionable clinical work items surface as tasks — from critical result
follow-ups to wound care to discharge planning.

## Task Types

| Type | Initiator |
|---|---|
| `critical_result_review` | Auto-created by result feed on critical value |
| `lab_follow_up` | Provider after reviewing trending results |
| `imaging_follow_up` | Provider after radiology report |
| `medication_review` | Clinical pharmacist or prescribing physician |
| `patient_callback` | Nurse or care coordinator |
| `referral` | Attending physician |
| `discharge_planning` | Care coordinator or attending |
| `care_coordination` | Care coordinator |
| `documentation` | Any provider (unsigned note reminder) |
| `order_review` | Senior physician co-reviewing resident orders |
| `wound_care` | Nursing or wound care specialist |
| `vital_signs` | Nursing |
| `blood_glucose` | Nursing or endocrinology team |
| `medication_administration` | Nursing |
| `custom` | Any provider |

## Priority Levels

| Priority | Response Expectation |
|---|---|
| `stat` | Immediate (≤ 15 minutes) |
| `critical` | Urgent (≤ 1 hour) |
| `urgent` | Same-day |
| `routine` | Within scheduled workflow |

## Status Lifecycle

```
pending → in_progress → completed
pending → escalated → (reassigned)
pending → cancelled
```

## Task Escalation

`TaskEscalation` records every escalation:
- `escalated_by_provider_id` — who escalated
- `escalated_to_provider_id` — receiving provider
- `escalation_reason` — clinical justification
- `previous_priority` / `new_priority` — audit trail

Escalation triggers a `cymed.provider.task.escalated` event published to Kafka.
Escalated-to provider receives a `MobilePushNotification` with `priority=critical`.

## Source Linkage

`ClinicalTask.source_type` + `source_id` links tasks to their origin:
- `lab_result` → `ProviderResultView.id`
- `imaging` → `ProviderResultView.id` (imaging type)
- `order` → `ProviderOrderRequest.id`
- `manual` → no source (provider-created)

## Task Collaboration

`TaskAssignment` supports multi-provider tasks:
- `assignment_type=primary` — responsible provider
- `assignment_type=collaborator` — contributing provider
- `assignment_type=observer` — read-only visibility

`TaskComment` enables inline clinical communication on the task record.
