# CyMed Feature Matrix

This matrix compares the clinical, operational, and technical feature capabilities of **CyMed** against major global and regional Electronic Health Record (EHR) competitors: **Epic Systems**, **Oracle Health (Cerner)**, **InterSystems TrakCare**, **Hakeem (Jordan)**, **Meditech**, and **Allscripts**.

## Feature Comparison Matrix

| Domain / Feature | CyMed | Epic Systems | Oracle Health | InterSystems | Hakeem | Meditech | Allscripts |
|---|---|---|---|---|---|---|---|
| **Core EMR / EHR** | Native FHIR | Legacy MUMPS | Relational/OCI | Native IRIS | Legacy VistA | Proprietary | Relational |
| **Nursing Charting** | Yes (RSC/Web) | Yes (Rich) | Yes (Rich) | Yes (Rich) | Yes (Basic) | Yes (Basic) | Yes (Mod) |
| **Lab (LIS)** | Integrated | Beaker LIS | Pathfinder LIS| Integrated LIS| Basic | LIS | LIS |
| **Imaging (PACS/RIS)** | Metadata | Radiant RIS | RadNet RIS | Integrated | Basic RIS | RIS | RIS |
| **Pharmacy (Clinical)** | Formularies | Willow | PharmNet | Yes | Yes | Yes | Yes |
| **RCM & Billing** | Produces data | Resolute RCM | Patient Account| Financials | External | Integrated | Integrated |
| **Scheduling** | Yes | Cadence | Scheduling | Yes | Yes | Yes | Yes |
| **Workforce / Roster** | RLS Gated | Yes | Yes | Yes | Basic | Basic | Basic |
| **Patient Portal** | Yes (i18n/RTL) | MyChart | HealtheLife | Personal | No | Yes | Yes |
| **Patient Mobile App** | React Native | Yes (Native) | Yes (Native) | Yes | No | Yes | Yes |
| **Provider Mobile App**| React Native | Haiku/Canto | PowerChart | TrakCare Mob | No | Yes | Yes |
| **Telemedicine** | Integrated | Integrated | Integrated | External | No | External | External |
| **Population Health** | via CyData | Healthy Planet | HealtheIntent | Active Analytics| No | External | CareInMotion|
| **Research / Cohorts** | via CyData | Cosmos | Yes | Clinical Viewer| No | No | Mod |
| **Quality & Auditing** | Tamper WORM | Yes | Yes | Yes | Basic | Yes | Yes |
| **Infection Control** | OPA Policy | Yes | Yes | Yes | No | Yes | Yes |
| **Blood Bank** | Integrations | Yes | Yes | Yes | No | Yes | No |
| **CSSD (Sterilization)**| Workflow | Yes | Yes | Yes | No | Yes | No |
| **Clinical Pathways** | Templates | Yes | Yes | Yes | Basic | Yes | Yes |
| **AI Decision Support**| CyAI (Triton) | Aura | Oracle AI | IRIS AI | No | Basic | Basic |
| **Interoperability** | Native FHIR | Carequality/HL7| CommonWell/HL7| Native FHIR | HL7 | HL7 | HL7 |
| **ICD-11 Support** | Native | Mapped | Mapped | Mapped | Mapped | Mapped | Mapped |
| **SNOMED CT / LOINC** | Native | Yes | Yes | Yes | Basic | Yes | Yes |
| **Analytics Engine** | CyData | Caboodle/Slicer| LightsOn | IRIS Analytics| No | Basic | Mod |
| **Security Architecture**| Zero Trust/ABAC| RBAC | RBAC | RBAC | Basic | RBAC | RBAC |
| **Gov Reporting / HIE** | Direct Sync | Carequality | CommonWell | Local HIE | National HIE| HL7 | HL7 |

---

## Key Legend
*   **Native:** Built into the database schema and application core without translation layers.
*   **Integrated:** Fully supported and delivered as part of the core product bundle.
*   **External / Mapped:** Requires third-party adapters, translation engines, or mapping modules.
*   **Basic:** Minimal functionality, lacking automation or modern configurability.
