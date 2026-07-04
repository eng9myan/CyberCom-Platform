# Encounter Management Architecture

## 1. Overview
The Encounter Management module (`encounters` app) tracks patient visits and episodes of care. It models the entire interaction timeline, active practitioners, physical locations, diagnoses, and state transitions (e.g., planned -> in progress -> finished).

## 2. Domain Models
*   **`Encounter`**: The core visit record tracking patient, type (outpatient, emergency, inpatient, telemedicine, home_care), current status (planned, arrived, in_progress, onhold, finished, cancelled, entered_in_error), and start/end times.
*   **`EncounterParticipant`**: Healthcare professionals involved in the visit (e.g., admitting physician, primary nurse).
*   **`EncounterReason`**: Structured symptoms or reasons for the visit.
*   **`EncounterDiagnosis`**: Diagnoses assigned during the encounter, including ranking (primary vs. secondary).
*   **`EncounterLocation`**: Physical bed, room, or ward where the patient stayed during the encounter.
*   **`EncounterStatusHistory`**: Tracks timestamps for state transitions for operational reporting.
*   **`EncounterNote`**: Brief notes, instructions, or administrative logs.
*   **`EpisodeOfCare`**: Long-running clinical concerns spanning multiple individual encounters (e.g., a pregnancy episode or chronic disease cycle).

## 3. Encounter Types
*   **Outpatient**: Scheduled clinic consultations.
*   **Emergency**: Immediate ER visits.
*   **Inpatient**: Multi-day admissions.
*   **Telemedicine**: Remote virtual visits.
*   **Home Care**: In-home caregiver visits.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/encounters/` | GET | List and filter active encounters |
| `/api/v1/encounters/` | POST | Create an encounter (publishes `cymed.encounter.created`) |
| `/api/v1/encounters/{id}/start/` | POST | Move status to `in_progress` (publishes `cymed.encounter.started`) |
| `/api/v1/encounters/{id}/close/` | POST | Move status to `finished` (publishes `cymed.encounter.closed`) |

## 5. Event Specifications
Events are published to `cymed.encounter.events`:
*   **`cymed.encounter.created`**: Triggered when a visit is registered.
*   **`cymed.encounter.started`**: Triggered when a patient check-in occurs.
*   **`cymed.encounter.closed`**: Triggered on patient discharge/check-out.

## 6. FHIR Mapping
*   `Encounter` ──> **FHIR Encounter**
*   `EpisodeOfCare` ──> **FHIR EpisodeOfCare**
