# Facility Registry Architecture

## 1. Overview
The Facility Registry (`facilities` app) manages the physical topology of the healthcare system. It models multi-building campuses, levels, specialized wards, exam rooms, operating rooms, and specific bed units, forming the base layout for admission, discharge, transfer (ADT), and appointment booking.

## 2. Domain Models
*   **`Facility`**: Represents a physical clinic branch or hospital campus linked to a parent Organization.
*   **`Building`**: Individual physical structures on a campus (e.g., "Tower A", "Outpatient Pavilion").
*   **`Floor`**: Floor levels within a building, mapping numeric levels (e.g., ground floor level `0`, basement level `-1`).
*   **`Department`**: Clinical departments assigned to facilities (e.g., Cardiology, Pediatrics, Emergency Medicine).
*   **`Ward`**: Wards within a department where patients are admitted (e.g., ICU, Pediatric Ward).
*   **`Room`**: Rooms within a ward categorized by type (icu, operating, recovery, standard, exam).
*   **`Bed`**: Specific patient beds with status tracking (available, occupied, maintenance, reserved).
*   **`ResourceLocation`**: Non-bed clinical resource allocations (e.g., Ventilator location, MRI Suite, Ultrasound bay).

## 3. Topologies & Capabilities
*   **Hospital Campuses & Multi-Building Facilities**: Outlines spatial navigation structures from Organization -> Facility -> Building -> Floor -> Ward -> Room -> Bed.
*   **Bed Management Ready**: The `Bed` status tracks real-time occupancy. Future ADT applications can interact with this model to execute transfers and update bed counts.
*   **Operating Room Setup**: Room instances flagged with `operating` type are decoupled from normal inpatient wards to allow surgical bookings.

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/facilities/` | GET | List facilities and campuses |
| `/api/v1/facilities/` | POST | Create facility profile |
| `/api/v1/facilities/beds/` | GET | Check real-time bed occupancy and availability |

## 5. FHIR Mapping
*   `Facility` / `Building` / `Room` / `Bed` ──> **FHIR Location** (modeled as hierarchical location resources using `.partOf` links).
