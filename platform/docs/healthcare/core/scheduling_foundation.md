# Scheduling Foundation Architecture

## 1. Overview
The Scheduling Foundation (`scheduling` app) provides slot-based booking engines for patients, practitioners, and clinical resources (e.g., MRI suites, operating rooms). It supports multi-participant appointments, status tracking, and double-booking protection.

## 2. Domain Models
*   **`Appointment`**: The booking entity storing start/end times, type (checkup, surgery, follow_up, consultation), status (booked, arrived, cancelled, completed), and description.
*   **`AppointmentParticipant`**: Link table mapping participants (patients, providers, or rooms/beds) with their status (required, optional, information-only) and participation status (accepted, declined, tentative).
*   **`AppointmentType`**: Classification tags.
*   **`AppointmentStatus`**: Lifecycle transitions.
*   **`ProviderSchedule`**: Calendar allocations for practitioners.
*   **`ResourceSchedule`**: Calendar allocations for clinical rooms or specialized diagnostic machines.
*   **`ScheduleSlot`**: Discrete booking slots (e.g., 15-minute segments) that can be booked, marked as busy, or held.

## 3. Double-Booking Protection
When an appointment is scheduled:
1.  The booking engine queries the `AppointmentParticipant` table to verify if the required patient, provider, or room has conflicting bookings during the requested timeframe.
2.  If conflict exists and the `AllowConflicts` flag is False, the booking fails.
3.  Successful bookings set slots to `busy` and trigger outbox events.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/scheduling/` | GET | Query scheduled appointments |
| `/api/v1/scheduling/` | POST | Book an appointment (publishes `cymed.appointment.created`) |
| `/api/v1/scheduling/{id}/cancel/` | POST | Cancel appointment (publishes `cymed.appointment.cancelled`) |

## 5. Event Specifications
Events are published to `cymed.appointment.events`:
*   **`cymed.appointment.created`**: Triggered when a booking is confirmed.
*   **`cymed.appointment.cancelled`**: Triggered when a booking is cancelled.
*   **`cymed.appointment.completed`**: Triggered when the appointment checkout is finished.

## 6. FHIR Mapping
*   `Appointment` ──> **FHIR Appointment**
*   `ProviderSchedule` / `ResourceSchedule` ──> **FHIR Schedule**
*   `ScheduleSlot` ──> **FHIR Slot**
