# Commercial Packaging

**Program**: CyMed Laboratory Edition — 4 Commercial Tiers

---

## Edition Comparison

| Feature | Basic | Advanced | Reference | National |
|---------|-------|----------|-----------|---------|
| Orders | ✓ | ✓ | ✓ | ✓ |
| Specimens | ✓ | ✓ | ✓ | ✓ |
| Accessioning | ✓ | ✓ | ✓ | ✓ |
| Worklists | ✓ | ✓ | ✓ | ✓ |
| Results | ✓ | ✓ | ✓ | ✓ |
| Blood Bank Foundation | ✓ | ✓ | ✓ | ✓ |
| Microbiology | — | ✓ | ✓ | ✓ |
| Pathology | — | ✓ | ✓ | ✓ |
| Histopathology | — | ✓ | ✓ | ✓ |
| Quality Management | — | ✓ | ✓ | ✓ |
| Analytics | — | ✓ | ✓ | ✓ |
| Reference Lab Routing | — | — | ✓ | ✓ |
| Multi-site | — | — | ✓ | ✓ |
| Cross-lab routing | — | — | ✓ | ✓ |
| Public Health Reporting | — | — | — | ✓ |
| National Registry | — | — | — | ✓ |
| Population Analytics | — | — | — | ✓ |
| Government Integration | — | — | — | ✓ |

---

## Feature Flag Keys

```python
# products.cymed.commercial.feature_flags.services

LAB_BASIC_FEATURES = [
    "lab.orders", "lab.specimens", "lab.accessioning",
    "lab.worklists", "lab.results", "lab.blood_bank",
]

LAB_ADVANCED_FEATURES = LAB_BASIC_FEATURES + [
    "lab.microbiology", "lab.pathology", "lab.histopathology",
    "lab.quality", "lab.analytics",
]

LAB_REFERENCE_FEATURES = LAB_ADVANCED_FEATURES + [
    "lab.reference_lab", "lab.multi_site", "lab.cross_lab_routing",
]

LAB_NATIONAL_FEATURES = LAB_REFERENCE_FEATURES + [
    "lab.public_health", "lab.national_registry",
    "lab.population_analytics", "lab.government_integration",
]

EDITION_FEATURE_MAP = {
    "cymed_laboratory:basic": LAB_BASIC_FEATURES,
    "cymed_laboratory:advanced": LAB_ADVANCED_FEATURES,
    "cymed_laboratory:reference": LAB_REFERENCE_FEATURES,
    "cymed_laboratory:national": LAB_NATIONAL_FEATURES,
}
```

---

## Competitive Positioning

| Competitor | Our Advantage |
|-----------|--------------|
| Cerner PathNet | Unified platform (no separate middleware), modern REST API |
| Sunquest | Integrated FHIR R4, cloud-native multi-tenant |
| Orchard Harvest | Full CyberCom ERP + LIS in one vendor |
| SCC Soft | Arabic + English UI, regional compliance (CBAHI, JCIA) |
| Epic Beaker | Open integration (CyIntegrationHub), no Epic dependency |
| TrakCare Lab | Lower TCO, mobile-first barcode workflow |
| Hakeem Lab | Enterprise-grade pathology + digital histopathology |

---

## Deployment Models

- **SaaS** — multi-tenant cloud (default)
- **On-premise** — single-tenant, air-gapped capable via CyIntegrationHub
- **Hybrid** — cloud analytics + on-premise clinical data
