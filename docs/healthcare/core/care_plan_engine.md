# Care Plan Engine Architecture

## 1. Overview
The Care Plan Engine (`careplans` app) supports chronic care management and clinical pathways. It enables care teams to outline long-term goals, schedule recurring interventions, and track compliance.

## 2. Domain Models
*   **`CarePlan`**: The overall care plan container outlining active clinical scopes, category tags, status, and patient links.
*   **`CareGoal`**: Target outcomes for the patient (e.g., "Maintain blood pressure below 130/80 mmHg", "Reduce weight by 5kg").
*   **`CareTask`**: Specific actions required to meet goals (e.g., "Check blood sugar daily", "Attend physical therapy twice a week").
*   **`CareIntervention`**: Clinical actions performed by practitioners (e.g., administering medication, nutritional counseling).
*   **`CarePathway`**: Standardized, template-driven sets of goals and tasks for specific diagnoses (e.g., "Post-Stroke Care Pathway").
*   **`CareTeam`**: Multi-disciplinary teams assigned to manage and execute the care plan.

## 3. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/careplans/` | GET | List care plans for a patient |
| `/api/v1/careplans/` | POST | Create a care plan (publishes `cymed.careplan.created`) |
| `/api/v1/careplans/{id}/tasks/` | GET/POST | Query and manage care tasks |

## 4. FHIR Mapping
*   `CarePlan` ──> **FHIR CarePlan**
*   `CareGoal` ──> **FHIR Goal**
*   `CareTask` / `CareIntervention` ──> **FHIR Task**
