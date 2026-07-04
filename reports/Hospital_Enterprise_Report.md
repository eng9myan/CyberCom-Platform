# Hospital — Enterprise Report (Phase 1)

**Benchmark:** Epic, Oracle Health, InterSystems TrakCare, MEDITECH
**Base:** `platform/backend/products/cymed/hospital/` (13 submodules) + `products/cymed/core/` (shared clinical foundation) — both already scaffolded in CyberCom-Platform (Release 0, per its own `AI/ROADMAP.md`).

## What was found on inspection

A full read of all 13 hospital submodules, the shared core foundation, the commercial/demo/licensing layer, CyAI, and terminology services turned up a consistent pattern: **the data model is broad and mostly sound, but the business-logic layer (`hospital/services.py`, ~1620 lines, 8 service classes, ~35 methods — admit/discharge/transfer, ICU rounds+SOFA, ER triage, OR case lifecycle, nursing handover, discharge planning, surge capacity) was fully implemented but never wired to any HTTP endpoint.** Every hospital ViewSet was plain CRUD; the workflow logic was only reachable from its own test suite, not from the API. Two metrics endpoints also returned fabricated numbers instead of computing from real data.

## Fixed this pass

1. **Workflow API wiring (Critical).** Added 30 `@action` endpoints across all 8 service-backed submodules (ADT, bed management, emergency, ICU, operating room, nursing, discharge, capacity) so every real clinical workflow the platform already implements is now callable over HTTP — e.g. `POST /admissions/admit/`, `POST /admissions/{id}/discharge/`, `POST /icu/stays/{id}/round/`, `POST /or/cases/{id}/start/`. A shared `run_service_action()` helper translates `ValueError`/`DoesNotExist` into proper 400/404 responses.
2. **Clinical Command Center metrics (Critical).** Fixed a bed-occupancy math bug (`occupied/100*100`, which just echoed the raw count back as if it were already a percentage) — now computed against real bed inventory. Replaced hardcoded `discharge_efficiency_index: 0.85` and `"98.2% compliant"` strings with a real discharge-efficiency ratio (on-time vs. planned discharge date, trailing 30 days) and a real nurse:patient ratio (today's `NursingAssignment` vs. active admissions). Where no data source exists at all yet (physician duty-hours — nothing tracks this anywhere in the codebase), it now reports `"not_tracked"` instead of inventing a number.
3. **Capacity forecast (High).** `CapacityService.get_capacity_forecast` returned hardcoded `projected_admissions: 5, projected_discharges: 3` regardless of input. Now computed from trailing-7-day `Admission`/`DischargeSummary` rates, with a real increasing/decreasing/stable trend comparison.
4. **CyAI real LLM integration (Critical, platform-wide).** `ModelGateway.generate_completion` — the shared AI advisory service every product's "AI assistant" would depend on — was fully simulated (`f"[Claude {model}] Response to: ..."`, no real API call for any provider). Wired real SDK calls for Anthropic, OpenAI, Gemini (google-genai), and Ollama. Missing API key/SDK now raises a clean `config_error`, logged, instead of silently faking success. This unblocks the "hospital AI assistant" requirement (and every other product's AI assistant) — see `CyAI_Report` follow-up.

All changes verified: Django system check passes, all new endpoints resolve via the URL resolver, cyai test suite passes 10/10 (non-network tests), hospital test suite fails identically on the unmodified baseline (confirmed via `git stash` — a pre-existing Keycloak JWKS sandbox limitation, not a regression).

## Gap classification (not yet fixed — for next Hospital pass)

**Critical:**
- No code status/DNR field anywhere in hospital or core clinical models — a hard safety gap for any real hospital deployment.
- No CLABSI/CAUTI/VTE-prophylaxis surveillance in ICU or nursing.
- Dual, unsynchronized bed-state tracking: `core.facilities.Bed.status` vs. `hospital.bed_management`'s separate cleaning/blocking models can desync.

**High:**
- No hospital-specific demo tenant or role-based demo login users. The only demo seeder (`products/demo/populate_demo.py`) seeds a shared multi-product tenant and never touches any hospital model (no `Admission`, `ICUStay`, `SurgicalCase`, etc.) or creates login credentials at all. `hospital.cy-com.com`'s "demo tenant + role-based demo users + realistic dummy data" requirement is unmet.
- No nurse:patient ratio *staffing model* (the command-center metric above reports today's actual ratio, but there's no target/compliance rule to check it against).
- ESI triage level is operator-entered, not algorithmically derived from vitals/complaint; APACHE II is a passthrough/default rather than computed.

**Medium:**
- No CRRT/dialysis tracking, no delirium (CAM-ICU) scoring, no restraint documentation in ICU.
- No block-scheduling/utilization analytics or implant/device UDI tracking in OR.
- `core.registries` (population/disease registry) is minimal — 2 models, 32 lines.

**Low:**
- `careplans`/`orders`/`scheduling`/`consents`/`registries` in core share a single shallow test class.

## CyAI hospital-specific prompts

Not yet built — `platform/cyai` is fully generic today (zero hospital-specific prompt templates or guardrails registered). "Ask about bed availability / lab delays / staffing" needs prompt templates + a query layer that respects RBAC/tenant scoping; the gateway itself is now real, so this is prompt/authoring work, not plumbing work.

## Verdict

**NOT READY** for Epic/Oracle Health-class certification — that is a multi-year scope for any vendor and this report will not pretend otherwise. **Substantial, verified progress this pass**: the platform's own hospital business logic is now actually usable via API, two fabricated-metrics bugs are fixed, and the AI gateway that every product depends on is now real instead of simulated. Next Hospital pass should prioritize: code status/DNR field, demo tenant + login users, and closing the bed-state duality — all concretely scoped above.
