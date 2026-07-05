# Hospital — Enterprise Report (Phase 1)

**Benchmark:** Epic, Oracle Health, InterSystems TrakCare, MEDITECH
**Base:** `platform/backend/products/cymed/hospital/` (13 submodules) + `products/cymed/core/` (shared clinical foundation) — both already scaffolded in CyberCom-Platform (Release 0, per its own `AI/ROADMAP.md`).

## What was found on inspection

A full read of all 13 hospital submodules, the shared core foundation, the commercial/demo/licensing layer, CyAI, and terminology services turned up a consistent pattern: **the data model is broad and mostly sound, but the business-logic layer (`hospital/services.py`, ~1620 lines, 8 service classes, ~35 methods — admit/discharge/transfer, ICU rounds+SOFA, ER triage, OR case lifecycle, nursing handover, discharge planning, surge capacity) was fully implemented but never wired to any HTTP endpoint.** Every hospital ViewSet was plain CRUD; the workflow logic was only reachable from its own test suite, not from the API. Two metrics endpoints also returned fabricated numbers instead of computing from real data.

## Fixed this pass

1. **Workflow API wiring (Critical).** Added 30 `@action` endpoints across all 8 service-backed submodules (ADT, bed management, emergency, ICU, operating room, nursing, discharge, capacity) so every real clinical workflow the platform already implements is now callable over HTTP — e.g. `POST /admissions/admit/`, `POST /admissions/{id}/discharge/`, `POST /icu/stays/{id}/round/`, `POST /or/cases/{id}/start/`. A shared `run_service_action()` helper translates `ValueError`/`DoesNotExist` into proper 400/404 responses.
2. **Clinical Command Center metrics (Critical).** Fixed a bed-occupancy math bug (`occupied/100*100`, which just echoed the raw count back as if it were already a percentage) — now computed against real bed inventory. Replaced hardcoded `discharge_efficiency_index: 0.85` and `"98.2% compliant"` strings with a real discharge-efficiency ratio (on-time vs. planned discharge date, trailing 30 days) and a real nurse:patient ratio (today's `NursingAssignment` vs. active admissions). Where no data source exists at all yet (physician duty-hours — nothing tracks this anywhere in the codebase), it now reports `"not_tracked"` instead of inventing a number.
3. **Capacity forecast (High).** `CapacityService.get_capacity_forecast` returned hardcoded `projected_admissions: 5, projected_discharges: 3` regardless of input. Now computed from trailing-7-day `Admission`/`DischargeSummary` rates, with a real increasing/decreasing/stable trend comparison.
4. **CyAI real LLM integration (Critical, platform-wide).** `ModelGateway.generate_completion` — the shared AI advisory service every product's "AI assistant" would depend on — was fully simulated (`f"[Claude {model}] Response to: ..."`, no real API call for any provider). Wired real SDK calls for Anthropic, OpenAI, Gemini (google-genai), and Ollama. Missing API key/SDK now raises a clean `config_error`, logged, instead of silently faking success.
5. **Code status/DNR + audit trail (Critical).** Added `HospitalStay.current_code_status` + immutable `CodeStatusOrder` history (medico-legal requirement: a resuscitation directive is never overwritten in place, it's a new order). Wired to `POST /inpatient/stays/{id}/code_status/`.
6. **CLABSI/CAUTI infection surveillance (Critical).** Added `IndwellingDevice` (central line/urinary catheter, tracked with insertion/removal timestamps) + `DeviceAssociatedInfection`, feeding a real `get_hai_rates()` — infections per 1,000 device-days, the standard infection-control metric every accreditation body benchmarks. Previously: zero HAI tracking existed anywhere in the codebase.
7. **VTE prophylaxis ordering (Critical).** Added `VTEProphylaxisOrder` (pharmacologic/mechanical/both/contraindicated per stay) — a standard Joint Commission core measure that had no model at all before.
8. **Hospital demo tenant data (High).** The only demo seeder never created a single hospital-model row. Extended it (Phase 5) with a full real-service-call narrative for the existing "Faisal" patient: ER registration + ESI-2 triage, ward admission, code-status + VTE orders, nursing assignment + SBAR handover, then an ICU escalation with a vitals round and a critical event. Test asserts on the actual resulting state, not just "command didn't crash."
9. **Hospital AI assistant (Critical — this was an explicit mission requirement, "ask about admissions/beds/staffing").** Extracted the command-center's metrics computation into `HospitalOperationsService.get_snapshot()` (dashboard and AI assistant now share one source of truth). Added `HospitalAIAssistant.ask()`: grounds a real-data snapshot + the user's question into a prompt, routes through CyAI's `ModelGateway` (real provider call, guardrailed, audited) — advisory only, refuses to invent numbers not in the snapshot. New endpoint: `POST /hospital/command-center/ai/ask/`.

All changes verified: Django system check passes, all new endpoints resolve via the URL resolver, `makemigrations` produced clean migrations, full hospital service-layer suite is 11/11 passing (up from 6 at the start of this phase), cyai suite 10/10, demo seeder test passes end-to-end with real assertions on the new hospital state. Hospital API-level test suite fails identically on the unmodified baseline (confirmed via `git stash` — a pre-existing Keycloak JWKS sandbox limitation, not a regression from any of this work).

## Gap classification (not yet fixed — for next Hospital pass)

**Critical:**
- Dual, unsynchronized bed-state tracking: `core.facilities.Bed.status` vs. `hospital.bed_management`'s separate cleaning/blocking models can desync if a raw CRUD POST bypasses the service layer (the new action endpoints keep them in sync; direct `POST /beds/cleaning/` or `/beds/blocking/` still doesn't set `Bed.status`).

**High:**
- No hospital-specific *login* users (Keycloak realm/user provisioning) — the demo tenant now has real hospital *data*, but no one can log into it yet. This needs a live Keycloak instance to build/test against, which this sandbox doesn't have (confirmed: Keycloak JWKS calls fail here) — real external-environment blocker, not skipped work.
- No nurse:patient ratio *staffing model* (the command-center/AI snapshot reports today's actual ratio, but there's no target/compliance rule to check it against).
- ESI triage level is operator-entered, not algorithmically derived from vitals/complaint; APACHE II is a passthrough/default rather than computed.

**Medium:**
- No CRRT/dialysis tracking, no delirium (CAM-ICU) scoring, no restraint documentation in ICU.
- No block-scheduling/utilization analytics or implant/device UDI tracking in OR.
- `core.registries` (population/disease registry) is minimal — 2 models, 32 lines.
- Hospital AI assistant has no prompt beyond the one general-purpose Q&A template — no dedicated "generate patient summary" or "revenue" prompts yet (revenue specifically needs an RCM/billing snapshot merged in, not built this pass).

**Low:**
- `careplans`/`orders`/`scheduling`/`consents`/`registries` in core share a single shallow test class.

## Verdict

**NOT READY** for Epic/Oracle Health-class certification — that is a multi-year scope for any vendor and this report will not pretend otherwise. **Substantial, verified progress across two extended passes**: real API-reachable workflows, three Critical patient-safety gaps closed (code status, HAI surveillance, VTE prophylaxis), a real (not simulated) AI gateway with a working hospital-specific assistant, and real demo data exercising the whole ADT→ICU pipeline. Remaining Critical/High items (bed-state CRUD-bypass guard, Keycloak login provisioning, staffing compliance rules, algorithmic ESI) are concretely scoped for the next pass.
