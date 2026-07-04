# Teleradiology

## Overview

CyMed Teleradiology Edition enables remote reporting across facilities and
networks. The architecture separates reading queues, case assignment, and
second-opinion workflows from the core RIS.

## Reading Queues

`ReadingQueue` defines a logical pool of cases:

| `queue_type` | Use Case |
|---|---|
| `general` | Standard daytime reads |
| `subspecialty` | Neuroradiology, MSK, cardiac, etc. |
| `urgent` | Stat reads, < 30 min TAT |
| `night_hawk` | After-hours remote reading |
| `second_opinion` | Expert consultation |

Each queue has `max_turnaround_hours` and optional `subspecialty` tag.

## Teleradiology Case Lifecycle

```
TeleradiologyCase (pending)
  → ReadingAssignment (assigned) — assigned_by can be AI worklist prioritization
  → radiologist accepts (in_progress)
  → RadiologyReport finalized
  → TeleradiologyCase (completed)
```

`TeleradiologyCase` links to:
- `ImagingOrderItem` — the order being read
- `DICOMStudy` — DICOM metadata for viewer launch
- `ReadingQueue` — queue it was pulled from

`ReadingAssignment` tracks:
- `radiologist_id`, `assigned_by`
- `accepted_at`, `completed_at`
- `turnaround_minutes` (actual)
- `subspecialty` required

## Second Opinions

`SecondOpinion` links to an existing `RadiologyReport` and records:

```python
SecondOpinion(
    original_report=...,
    requested_by=...,
    second_opinion_radiologist_id=...,
    clinical_question="...",
    concurs_with_original=False,           # None until completed
    discrepancy_level="major",             # none | minor | major | critical
    opinion_text="...",
)
```

Discrepancies automatically trigger:
1. `QualityAudit` record creation
2. Notification to department head
3. Case flag for clinical audit review

## Night Hawk Reading

Night hawk cases use `queue_type="night_hawk"`. Radiologists in different
time zones maintain reading availability. Queue monitoring dashboard shows:

- Cases pending assignment
- Current assignee per queue
- TAT compliance rate (rolling 7-day)

## Performance SLAs

| Priority | Target TAT |
|---|---|
| Routine | 24 hours |
| Urgent | 4 hours |
| STAT | 30 minutes |
| Night Hawk | Per contract (typically 1–2 hours) |

`ReadingAssignment.turnaround_minutes` is measured from `assigned_at` to
`completed_at`. SLA compliance fed to `TeleradiologyDashboard` analytics snapshot.

## CyAI Worklist Prioritization

`StudyQueue.ai_priority_score` populated by CyAI advisory:
- Based on clinical indication, history, and image characteristics
- High-priority cases bubble to top of reading queue
- AI score is advisory — radiologist or coordinator can override position
