# CyMed Patient Portal — Appointments & Scheduling

## Appointment Request Flow

```
Patient selects provider → fills appointment request → PortalAppointmentRequest (status=pending)
         ↓
CyMed Clinic/Hospital processes request → confirms slot
         ↓
PortalAppointmentRequest.status = confirmed, confirmed_datetime set
cymed_appointment_id linked to CyMed Clinic/Hospital appointment
         ↓
AppointmentReminder created (24h, 2h before)
         ↓
PatientNotification: appointment_confirmed
```

## PortalAppointmentRequest Fields

| Field | Purpose |
|---|---|
| `provider_type` | hospital / clinic / telemedicine |
| `preferred_date_1/2/3` | Three preferred dates for scheduling |
| `preferred_time_slot` | morning / afternoon / evening / any |
| `appointment_type` | consultation, follow_up, procedure, vaccination, checkup, telemedicine, home_visit |
| `is_for_dependent` | True if booking on behalf of a family member |
| `dependent_patient_id` | Child/dependent patient ID (requires FamilyAccessPermission) |
| `cymed_appointment_id` | Linked CyMed Clinic/Hospital appointment UUID |
| `insurance_id` | Selected InsuranceCard for this appointment |

## Waitlist

`WaitlistEntry` manages demand for overbooked providers:
- `waitlist_type`: next_available, specific_physician, specific_date
- `status`: waiting → offered → accepted / expired / cancelled
- `offered_slot` + `offer_expires_at`: provider offers a slot; patient has a window to accept

## Reminders

`AppointmentReminder` is auto-created at confirmation:
- 24-hour reminder (push + SMS)
- 2-hour reminder (push)
- Channels: email, sms, push, in_app
- `status`: pending → sent / failed / cancelled

## Appointment Rating

Post-appointment `AppointmentRating`:
- Overall, wait time, staff, facility, physician (1–5)
- `would_recommend` boolean
- Linked to `ProviderReview` aggregation for directory ratings

## Telemedicine Appointments

`appointment_type=telemedicine` → triggers `TelemedicineSession` creation:
- `meeting_url` provided by telemedicine service via CyIntegrationHub
- Patient joins via portal or mobile app

## Integration with CyMed Clinical Modules

| Portal Action | CyMed System |
|---|---|
| Book clinic appointment | CyMed Clinic → `ClinicAppointment` |
| Book hospital appointment | CyMed Hospital → `HospitalAppointment` |
| Confirm + link | `cymed_appointment_id` populated |
| Cancel | Event published → CyMed cancels slot |
