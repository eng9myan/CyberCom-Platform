# CyData Foundation Guide (Program 2.7)

This guide documents the analytics, data catalog, and lakehouse architectures of the **CyData Platform**.

---

## 1. Data Lakehouse & CDC (Apache Iceberg)

CyData consolidates transactional databases and analytical engines into an **Apache Iceberg** lakehouse catalog.

### Change Data Capture (CDC)
Debezium monitors PostgreSQL transactions via WAL. CDC pipelines capture mutations and update Iceberg tables:
```
[PostgreSQL WAL] ──> [Debezium Connector] ──> [Kafka Topic] ──> [Iceberg Catalog]
```
CDC execution history is recorded in `platform_cdc_pipeline_logs`.

---

## 2. Metadata Catalog & Lineage (OpenLineage)

### Data Catalog
The `DataAsset` model serves as the central directory for logical tables, paths, schema descriptions, and privacy classifications.

### Data Lineage
We track data transformations using **OpenLineage**-compliant DAG relations (`DataLineage` model). This maps input assets to derived metrics and dashboards, ensuring full compliance with auditability guidelines.

---

## 3. Data Quality Engine

The `DataQualityEngine` validates asset constraints at ingestion or transformation:
*   **Assertions Supported:** `not_null` (validates field presence), `min_value` (validates range bounds), and custom rules.
```python
from platform.cydata.services import DataQualityEngine
audit_report = DataQualityEngine.evaluate_asset(data_asset, records_list)
```

---

## 4. Master Data Management (MDM)

The `MasterDataReconciler` links records across disparate applications (e.g. Epic EHR and Odoo ERP) into a unified **Golden Record ID** to maintain consistent entities (Patients, Employees, Customers) across domains:
```python
from platform.cydata.services import MasterDataReconciler
mapping = MasterDataReconciler.match_and_link(
    entity_type="Patient",
    source_system="Epic",
    source_id="EPIC-10429",
    matching_fields={"email": "patient@cybercom.io", "national_id": "1009249281"}
)
```

---

## 5. Security & Privacy Controls

*   **PII/PHI Columns:** Fields containing sensitive info are cataloged in `pii_columns` and `phi_columns`.
*   **Data Residency:** Evaluates residency configurations (`data_residency_region` defaults to `me-central-1`) to comply with national privacy regulations (e.g. Saudi PDPL).
*   **Row-Level Tenant Isolation:** Strictly partitions analytical aggregates by `tenant_id`.
