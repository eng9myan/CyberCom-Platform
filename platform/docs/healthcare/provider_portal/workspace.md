# CyMed Provider Portal — Unified Workspace

## Overview

`ProviderWorkspace` is the root record tying a CyIdentity user to their clinical
workspace. One workspace per provider per tenant. All portal state is anchored here.

## Dashboard Customization

`ProviderDashboard` (OneToOne to ProviderWorkspace):
- `layout_config` JSONField — widget grid positions (x, y, width, height)
- Widget toggles: `show_tasks`, `show_results`, `show_messages`, `show_schedule`, `show_approvals`, `show_census`
- `pinned_patient_ids` — quick-access patient list
- `active_patient_list_id` — currently selected patient list

## Provider Preferences

`ProviderPreferences` (OneToOne to ProviderWorkspace):
- `default_note_template` — pre-selected note type on new note creation
- `smart_phrase_favorites` — ordered list of favourite smart phrase codes
- Notification toggles: `result_critical_alert_sound`, `task_notification_push/email`, `message_notification_push`
- `handoff_auto_include_summary` — auto-populate handoff with AI summary
- `ai_suggestions_enabled` — toggle CyAI sidebar suggestions
- `voice_dictation_enabled` — Nuance/AWS Transcribe Medical dictation

## Role-Specific Dashboards

| Provider Type | Default Widgets |
|---|---|
| Physician | Patient census, results, tasks, orders, documentation |
| Nurse | Patient list (unit), medication administration, tasks, vitals |
| Pharmacist | Medication orders, clinical pharmacy tasks, drug interactions |
| Radiologist | Worklist (imaging orders), PACS viewer link, reports pending |
| Lab Technologist | Specimen queue, orders pending, results to validate |
| Administrator | Staff census, credential expiry, leave approvals, metrics |

## Session Management

`WorkspaceSession` tracks active provider sessions:
- `session_token` — per-device session identifier (unique)
- `device_type` — desktop/tablet/mobile
- `context_patient_id` — currently viewed patient (for handoff detection)
- `is_active` + `ended_at` — session lifecycle
- `ip_address` — audit field

## Home Unit Assignment

`ProviderWorkspace.home_unit_id` + `home_unit_name` set on workspace creation
from CyMed Hospital/Clinic unit assignment. Determines default patient list
auto-population for ward and clinic lists.
