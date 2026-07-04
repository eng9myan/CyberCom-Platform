# Clinical Terminology Foundation Guide

## 1. Introduction
The Clinical Terminology Foundation (Program 2.10) provides a unified abstraction layer (`platform.terminology`) for all medical terminology engines. Following strict regulatory compliance and design principles, CyMed products and other business modules **must never** directly reference or implement terminology logic (such as ICD-11 stem codes, SNOMED CT concepts, LOINC properties, or ICF descriptors). 

All clinical coding operations are decoupled from business databases and managed via the standard `TerminologyService` interface.

---

## 2. Terminology Abstraction & Registry Architecture

```
        ┌─────────────────────────────────────────────────────────┐
        │                 Clinical Core & Modules                 │
        └────────────────────────────┬────────────────────────────┘
                                     │ (Terminology Lookup)
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │                   TerminologyService                    │
        └────────────────────────────┬────────────────────────────┘
                                     │ (Dynamic Adapter Discovery)
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │               TerminologyProviderRegistry               │
        └──────┬──────────┬──────────┬──────────┬──────────┬──────┘
               │          │          │          │          │
               ▼          ▼          ▼          ▼          ▼
             ICD11      SNOMED     LOINC       ICF        FHIR
            Adapter    Adapter    Adapter    Adapter    Adapter
```

### 2.1 The TerminologyProvider Interface
All adapters implement the base class `TerminologyProvider` (`platform/terminology/providers/base.py`), which defines standard methods:
*   `search(query, limit, **kwargs)`: Free-text concept search.
*   `lookup(code, **kwargs)`: Detailed concept definition and property lookup.
*   `validate(code, **kwargs)`: Verifies if a code is valid.
*   `translate(code, target_system, **kwargs)`: Concept translation.
*   `expand(value_set, filter_str, **kwargs)`: Expands a ValueSet.
*   `get_children(code, **kwargs)`: Traverses child concepts.
*   `get_parents(code, **kwargs)`: Traverses parent concepts.
*   `get_synonyms(code, **kwargs)`: Retrieves synonyms.
*   `get_mappings(code, target_system, **kwargs)`: Retrieves external mapping systems.
*   `get_version()`: Retrieves adapter/database version.

### 2.2 TerminologyProviderRegistry
The registry (`providers/registry.py`) is a thread-safe singleton managing the lifecycle of terminology providers:
*   **Discovery**: Providers register themselves at boot using `TerminologyProviderRegistry.register_provider(name, provider)`.
*   **Hot-Swapping**: Registrations can be updated at runtime, allowing zero-downtime upgrades of underlying databases (e.g., swapping a mock ICD-11 provider with a live server, or updating LOINC databases).
*   **Lifecycle**: Enables listing active providers, dynamic version inspection, and deregistration.

---

## 3. Provider Adapters

### 3.1 ICD-11 Adapter (`ICD11Provider`)
*   **Core Duties**: Search and validate ICD-11 codes.
*   **Post-Coordination Clusters**: Parses and validates post-coordination cluster codes (e.g. `FA81&XY1Y&XS17` representing Osteoarthritis of knee, unilateral, left).
*   **ICD-10 Crosswalks**: Supports mapping between legacy ICD-10 and current ICD-11 codes.

### 3.2 SNOMED CT Adapter (`SNOMEDProvider`)
*   **Core Duties**: Standardized clinical concept queries.
*   **Hierarchical Traversal**: Parent/child relationship checks (`get_parents()`, `get_children()`).
*   **Semantic Equivalence**: Subsumption checking to see if concept A is a subconcept of concept B.

### 3.3 LOINC Adapter (`LOINCProvider`)
*   **Core Duties**: Lab test results, observations, and measurement properties.
*   **Mappings**: Connectors mapping LOINC observations to equivalent SNOMED concepts.

### 3.4 ICF Adapter (`ICFProvider`)
*   **Core Duties**: Functioning, disability, and health status tracking.
*   **Translations**: Bidirectional conversions between ICF disability classifications and clinical scales (e.g. WHODAS-D linkings).

### 3.5 FHIR Terminology Adapter (`FHIRTerminologyProvider`)
*   **Core Duties**: Outward integration with external FHIR servers.
*   **FHIR Ops**: Implements standard FHIR operations: `$lookup`, `$expand`, `$validate-code`, `$translate`, and `$subsumes`.

---

## 4. Cross-Cutting Foundations
*   **Multi-Tenant Awareness**: Every terminology query requires a `tenant_id` to enforce strict visibility, custom value sets, and localized translation sets.
*   **Transactional Auditing**: The `TerminologyAuditLog` records every read, lookup, validation, translation, and expansion query in a dedicated, tenant-isolated ledger containing performance metrics (`duration_ms`), user details, query parameters, and counts.
*   **OpenTelemetry Instrumentation**: Distributed tracing spans wrap terminology provider operations for end-to-end performance tracing.

---

## 5. API Reference

All terminology services are exposed via POST requests to ensure large/complex search filters are not truncated by URL length limits.

| Action | Endpoint | Payload Structure |
|---|---|---|
| **Search** | `/api/v1/terminology/search/` | `{"provider": "icd11", "query": "asthma", "tenant_id": "<uuid>"}` |
| **Lookup** | `/api/v1/terminology/lookup/` | `{"provider": "snomed", "code": "2339-0", "tenant_id": "<uuid>"}` |
| **Validate** | `/api/v1/terminology/validate/` | `{"provider": "icd11", "code": "FA81", "tenant_id": "<uuid>"}` |
| **Translate** | `/api/v1/terminology/translate/` | `{"provider": "snomed", "code": "195967001", "target_system": "icd11", "tenant_id": "<uuid>"}` |
| **Expand** | `/api/v1/terminology/expand/` | `{"provider": "fhir", "value_set": "http://hl7.org/fhir/ValueSet/administrative-gender", "tenant_id": "<uuid>"}` |
| **Subsumes** | `/api/v1/terminology/subsumes/` | `{"provider": "snomed", "code_a": "195967001", "code_b": "50731006", "tenant_id": "<uuid>"}` |
