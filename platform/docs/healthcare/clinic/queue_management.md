# Queue Management

## 1. Overview
The `queues` app tracks patient flows in real-time, managing waiting rooms, nurse stations, and clinician queues. It powers the physical queue display boards visible to patients.

## 2. Models
*   **`Queue`**: Represents a physical or logical waiting list (e.g. "Pediatrics Waiting Area", "Lab Queue").
*   **`QueueEntry`**: Tracks a specific patient's ticket status inside a queue (e.g. `waiting`, `called`, `in_consultation`, `skipped`).
*   **`ProviderQueue`**: Map of active queues assigned to a specific physician or practitioner.
*   **`QueueBoard`**: Configurations for digital display boards, storing layouts, theme configurations, and queue associations.

## 3. Waiting Room Integration
1. During patient check-in (`reception`), a unique ticket number starting with `T-` (e.g., `T-247`) is auto-generated.
2. The check-in serializer auto-registers the ticket inside the default department queue.
3. The live digital board queries `/api/v1/clinic/queues/boards/` to render active tickets.
4. When a clinician calls a patient, the ticket status changes to `called` and triggers visual/audible notifications on the board.
