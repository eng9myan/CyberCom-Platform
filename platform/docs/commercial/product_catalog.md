# CyMed Product Catalog

## Products (8)

| Code | Product | Status |
|------|---------|--------|
| `cymed_clinic` | CyMed Clinic | GA |
| `cymed_hospital` | CyMed Hospital | GA |
| `cymed_laboratory` | CyMed Laboratory | Planned |
| `cymed_imaging` | CyMed Imaging | Planned |
| `cymed_pharmacy` | CyMed Pharmacy | Planned |
| `cymed_patient_portal` | CyMed Patient Portal | Planned |
| `cymed_provider_portal` | CyMed Provider Portal | Planned |
| `cymed_population_health` | CyMed Population Health | Planned |

## Versioning

`ProductVersion` tracks:
- Semantic version (e.g., `1.0.0`)
- Release date
- LTS flag
- Minimum upgrade path

## License Mapping

`ProductLicenseMapping` defines per product+edition:
- Which license types are allowed
- Which delivery modes are allowed
- White label support
- Multi-tenant support
- Government license requirement

## Feature Matrix

`ProductFeatureMatrix` provides a cross-product feature availability matrix for:
- Sales and marketing tools
- Customer comparison
- Contract generation
- Automated entitlement provisioning

## API Endpoints

```
GET  /api/v1/commercial/catalog/productversions/
GET  /api/v1/commercial/catalog/productlicensemappings/
GET  /api/v1/commercial/catalog/productfeaturematrix/
```
