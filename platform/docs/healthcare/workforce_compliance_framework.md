# CyMed Workforce Compliance Framework

> **Status:** Approved — Phase 1.2
> **Owner:** Workforce Planning Architect + Clinical Safety Architect
> **Related Documents:** [healthcare_workforce_architecture.md](healthcare_workforce_architecture.md), [acuity_staffing_model.md](acuity_staffing_model.md)

This document establishes the configurable rule-engine schema that handles multi-country labor rules, accreditation standards, and local hospital policies.

---

## 1. Compliance Configuration Architecture

To support scaling across new countries without altering application code, CyMed defines a **Hierarchical Compliance Config Schema**. Settings applied at higher nodes (e.g., Country) are inherited by lower nodes (e.g., Department Unit) unless overridden.

```
 [Country Config]  ➔ E.g., Max weekly hours, Holiday calendars
       │
       ▼
 [Regional Config] ➔ E.g., State-mandated nurse-to-patient ratios
       │
       ▼
 [Hospital Group]  ➔ E.g., Collective bargaining contracts
       │
       ▼
 [Department Unit] ➔ E.g., Ward-level minimum rest rules
```

### JSON Schema Specification (`compliance-rules-v1.json`)
The following schema defines how labor, safety, and accreditation constraints are represented:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WorkforceComplianceRules",
  "type": "OBJECT",
  "properties": {
    "country_code": { "type": "STRING" },
    "region_code": { "type": "STRING" },
    "labor_rules": {
      "type": "OBJECT",
      "properties": {
        "max_weekly_hours": { "type": "INTEGER" },
        "max_consecutive_days": { "type": "INTEGER" },
        "min_rest_hours_between_shifts": { "type": "INTEGER" },
        "overtime_threshold_daily_hours": { "type": "INTEGER" }
      },
      "required": ["max_weekly_hours", "max_consecutive_days", "min_rest_hours_between_shifts"]
    },
    "accreditation_rules": {
      "type": "OBJECT",
      "properties": {
        "accreditation_body": { "type": "STRING" }, -- E.g., "JCIA", "CBAHI"
        "mandatory_shift_supervisor": { "type": "BOOLEAN" },
        "credential_verification_frequency_days": { "type": "INTEGER" }
      }
    }
  }
}
```

---

## 2. Country Configurations

### 2.1 United States Configuration (California Example)
*   **Regulatory Focus:** Fair Labor Standards Act (FLSA), California Title 22 Nurse Staffing Mandates, and ACGME residency requirements.
*   **JSON Config Stub:**
    ```json
    {
      "country_code": "USA",
      "region_code": "CA",
      "labor_rules": {
        "max_weekly_hours": 40, -- Standard; overtime applies beyond
        "max_consecutive_days": 6,
        "min_rest_hours_between_shifts": 8,
        "overtime_threshold_daily_hours": 8
      },
      "accreditation_rules": {
        "accreditation_body": "TJC", -- The Joint Commission
        "mandatory_shift_supervisor": true,
        "credential_verification_frequency_days": 365
      },
      "ratios": {
        "icu": [1, 2], -- 1 nurse per 2 patients
        "med_surg": [1, 5]
      }
    }
    ```

### 2.2 Saudi Arabia Configuration
*   **Regulatory Focus:** Saudi Labor Law (Articles 98–108), CBAHI (Saudi Central Board for Accrediting Healthcare Institutions) guidelines.
*   **JSON Config Stub:**
    ```json
    {
      "country_code": "SAU",
      "region_code": "ALL",
      "labor_rules": {
        "max_weekly_hours": 48, -- 8h daily limit per Article 98
        "max_consecutive_days": 6,
        "min_rest_hours_between_shifts": 11,
        "overtime_threshold_daily_hours": 8
      },
      "accreditation_rules": {
        "accreditation_body": "CBAHI",
        "mandatory_shift_supervisor": true,
        "credential_verification_frequency_days": 365
      },
      "ramadan_rules": {
        "muslim_max_daily_hours": 6, -- Article 99 reduction
        "muslim_max_weekly_hours": 36
      }
    }
    ```

### 2.3 Jordan Configuration
*   **Regulatory Focus:** Jordanian Labor Law (Article 56), JCIA (Joint Commission International) standards.
*   **JSON Config Stub:**
    ```json
    {
      "country_code": "JOR",
      "region_code": "ALL",
      "labor_rules": {
        "max_weekly_hours": 48, -- Article 56 limit
        "max_consecutive_days": 6,
        "min_rest_hours_between_shifts": 10,
        "overtime_threshold_daily_hours": 8
      },
      "accreditation_rules": {
        "accreditation_body": "JCIA",
        "mandatory_shift_supervisor": true,
        "credential_verification_frequency_days": 730
      }
    }
    ```

### 2.4 United Arab Emirates Configuration
*   **Regulatory Focus:** UAE Federal Decree-Law No. 33 of 2021 (Labor Relations), Dubai Health Authority (DHA) / Department of Health (DOH) licensing requirements, JCIA.
*   **JSON Config Stub:**
    ```json
    {
      "country_code": "ARE",
      "region_code": "DXB", -- Dubai
      "labor_rules": {
        "max_weekly_hours": 48,
        "max_consecutive_days": 6,
        "min_rest_hours_between_shifts": 11,
        "overtime_threshold_daily_hours": 8
      },
      "accreditation_rules": {
        "accreditation_body": "JCIA",
        "mandatory_shift_supervisor": true,
        "credential_verification_frequency_days": 365
      }
    }
    ```
