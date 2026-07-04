# Appointment Management

## 1. Overview
The `appointments` app provides clinic-specific scheduling operations on top of the core `scheduling` platform module. It adds waitlist management, automated reminders, and customizable scheduling templates.

## 2. Model Structure
*   **`ClinicAppointment`**: Extends the core `Appointment` model. Links a core appointment with specialty codes and receptionist check-in status tracking.
*   **`AppointmentRule`**: Configuration to define rule sets per specialty (e.g. maximum duration, double-booking prevention policy).
*   **`AppointmentWaitlist`**: Prioritized queue for patients waiting for earlier slot openings.
*   **`AppointmentTemplate`**: Configures weekly schedules and recurring slot durations per clinician.
*   **`AppointmentReminder`**: Tracks automated communication touchpoints (SMS, email, WhatsApp) triggered via `CyConnect`.

## 3. Double-Booking Prevention
When a clinic appointment is created, the system checks the corresponding `AppointmentRule` for the requested specialty:
1. If `allow_conflicting_bookings` is `False`, the system queries all participants of the new appointment.
2. If any clinician or resource is already scheduled during the requested timeframe, a validation error is thrown:
   ```json
   {
       "detail": "Participant <id> has a conflicting appointment."
   }
   ```

## 4. Notifications & Reminders
Upon creation, the serializer automatically schedules an initial reminder task 24 hours prior to the slot using `CyConnect` mock interfaces.
*   Outbox Event emitted: `cymed.clinic.appointment.reminder_queued`
