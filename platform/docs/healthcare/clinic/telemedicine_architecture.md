# Telemedicine Architecture

## 1. Overview
The `telemedicine` app contains the workflows and structures for virtual consultations, video visits, remote screening, and digital consent logging.

## 2. Models
*   **`VirtualVisit`**: Extends standard outpatient encounters with virtual-specific metadata.
*   **`VirtualSession`**: Tracks active call room metadata, status (waiting, in-progress, completed), and connection credentials.
*   **`VirtualRecording`**: Records video streams (if consented by the patient) for auditing and compliance.
*   **`VirtualConsent`**: Records digital signatures and patient acceptance of virtual visit terms.

## 3. WebRTC Meeting Integrations
Virtual sessions leverage `CyConnect` for real-time signaling.
1. When a `VirtualVisit` is created, the system auto-generates a secure WebRTC room token and URL structure:
   `https://cyconnect.cymed.io/meeting/<session-uuid>`
2. Patients and doctors receive room link invites via automated email/SMS channels.
3. Upon doctor initiation, `/api/v1/clinic/telemedicine/visits/<id>/start_session/` is called:
   * Sets status to `in_progress`.
   * Sets session `started_at` to the current timestamp.
   * Publishes outbox event: `cymed.clinic.telemedicine.started`.
