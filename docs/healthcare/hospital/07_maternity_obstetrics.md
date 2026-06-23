# Maternity & Obstetrics
**CyMed Hospital Edition | Module: Maternity**

---

## Overview

The Maternity module provides complete obstetric record management from prenatal care through delivery, newborn assessment, and postpartum follow-up. It is designed for compliance with WHO and JCIA maternity standards.

---

## Models

| Model | Description |
|---|---|
| `Pregnancy` | Master pregnancy record linked to the mother's Patient profile |
| `PrenatalEncounter` | Antenatal care visit with gestational age, fetal HR, maternal BP |
| `LaborEpisode` | Active labor tracking — stage, cervical dilation, fetal monitoring |
| `Delivery` | Delivery record with method, Apgar scores, and outcome |
| `NewbornRecord` | Newborn anthropometric data linked to delivery and new Patient record |
| `PostpartumCare` | Post-delivery clinical assessment of maternal and newborn condition |

---

## API Endpoints

```
POST  /api/v1/hospital/maternity/pregnancies/
POST  /api/v1/hospital/maternity/prenatal-encounters/
POST  /api/v1/hospital/maternity/labor-episodes/
POST  /api/v1/hospital/maternity/deliveries/
POST  /api/v1/hospital/maternity/newborns/
POST  /api/v1/hospital/maternity/postpartum-checks/
```

---

## Clinical Standards

### Apgar Score
- Recorded at 1 minute and 5 minutes post-delivery
- Stored as `apgar_1m` and `apgar_5m`
- Score 0–3: Severely depressed | 4–6: Moderately depressed | 7–10: Normal

### Gestational Age
- Stored as decimal weeks (e.g., `36.0`, `38.5`)

### Delivery Methods
Supported values: `vaginal`, `cesarean`, `vacuum`, `forceps`

### Labor Stage Tracking
- Stage 1: Latent + Active labor
- Stage 2: Pushing
- Stage 3: Delivery of placenta
- Stage 4: Recovery

---

## Patient Identity

- Each `NewbornRecord` optionally links to a newly created `Patient` record for the baby
- This enables the newborn to have their own medical history from day 0
