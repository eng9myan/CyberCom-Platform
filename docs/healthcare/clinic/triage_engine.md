# Triage Engine & Calculations

## 1. Overview
The `triage` app captures patient vital signs and executes standardized physiological risk scoring. It computes the body mass index (BMI) and the Modified Early Warning Score (MEWS) to categorize patients and flag urgent cases.

## 2. Models
*   **`TriageAssessment`**: Records patient complaints, primary symptoms, assessment nurse details, and triage severity level.
*   **`TriageVitalSigns`**: Stores measured metrics (weight, height, temperature, blood pressure, pulse, respiratory rate, oxygen saturation, pain).
*   **`TriageRiskScore`**: Automatically generated record summarizing calculated metrics, clinical flags, and AI-assisted triage advice.

## 3. MEWS Scoring Algorithm
The triage serializer evaluates vital signs and accumulates points based on standard physiological deviations:

| Vital Parameter | MEWS 3 | MEWS 2 | MEWS 1 | MEWS 0 | MEWS 1 | MEWS 2 | MEWS 3 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Systolic BP** | ≤ 70 | 71–80 | 81–100 | 101–199 | - | ≥ 200 | - |
| **Heart Rate** | - | ≤ 40 | 41–50 | 51–100 | 101–110 | 111–129 | ≥ 130 |
| **Temp (°C)** | - | ≤ 35.0 | - | 35.1–38.4 | - | ≥ 38.5 | - |
| **Resp Rate** | - | ≤ 9 | - | 10–14 | 15–20 | 21–29 | ≥ 30 |

*   If the accumulated score is **≥ 4**, the system marks the case as high-risk, sets the `abnormal_flag` to `True`, and elevates the `risk_level` to `high`.

## 4. BMI Calculator
The triage system automatically calculates Body Mass Index (BMI) using height and weight measurements:
$$\text{BMI} = \frac{\text{Weight (kg)}}{\left(\frac{\text{Height (cm)}}{100}\right)^2}$$
Calculations are formatted to two decimal places and persisted to the database.

## 5. AI Risk Assistance
If abnormal vitals are identified, `TriageRiskScore` triggers suggestions from the `CyAI` engine to provide emergency tips (e.g. airway checks) for clinical review.
