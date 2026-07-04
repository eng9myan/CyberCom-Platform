# Customer Success Playbook

**Version:** 1.0
**Date:** 2026-06-28
**Audience:** CyberCom Customer Success Managers, Account Managers, Support Team

---

## Customer Journey Overview

```
Sales → Contract → Implementation → Go-Live → Hypercare → Adoption → Renewal → Expansion
```

Customer Success owns the journey from Go-Live onwards. Implementation team hands off at hypercare exit.

---

## Handoff from Implementation

At hypercare exit, the following must be documented and handed to Customer Success:

- [ ] Customer profile (facility type, size, modules deployed, edition)
- [ ] Open issues log with priorities and dates
- [ ] Known workarounds for any P2/P3 issues
- [ ] Key contacts (IT lead, clinical lead, executive sponsor)
- [ ] Training completion report
- [ ] UAT sign-off documentation
- [ ] Integration map (what's connected, what's pending)
- [ ] Custom configuration notes (anything non-standard)
- [ ] First renewal date
- [ ] Expansion opportunities identified

---

## Customer Touchpoint Cadence

### Month 1–3 (Post Go-Live — Early Success)

| Touchpoint | Frequency | Owner | Purpose |
|-----------|-----------|-------|---------|
| Issue triage call | Daily (week 1–2) | CSM + Support | Resolve blockers |
| Success check-in | Weekly | CSM | Adoption review, issue escalation |
| Executive update | Bi-weekly | CSM | Executive sponsor briefing |

### Month 3–12 (Steady State)

| Touchpoint | Frequency | Owner | Purpose |
|-----------|-----------|-------|---------|
| Success review | Monthly | CSM | Metrics, expansion, issues |
| Executive business review (EBR) | Quarterly | CSM + Account | Strategy, renewal, expansion |
| Technical health check | Quarterly | Technical CSM | Performance, updates, backups |
| Release briefing | Per release | CSM | New features, upgrade plan |

---

## Health Score Model

Track four dimensions, score 1–5 each:

| Dimension | Signals (Good) | Signals (Bad) |
|-----------|---------------|---------------|
| Product Adoption | Daily active users > 80%, all modules used | < 50% users active, modules unused |
| Technical Health | < 1 P1 per month, p95 API < 200ms | Frequent P1s, performance degradation |
| Engagement | Responds to CSM within 24h, attends EBRs | Non-responsive, missing meetings |
| Commercial | On-time payment, expansion interest | Late payments, reduction requests |

**Score 4–5:** Green — on track
**Score 3:** Yellow — attention needed
**Score 1–2:** Red — at-risk escalation

At-risk customers trigger escalation to VP Customer Success and Account Executive.

---

## Support Tiers

### Severity Classification

| Severity | Definition | Response SLA | Resolution SLA |
|---------|-----------|-------------|---------------|
| P0 — Critical | Patient safety impact OR complete system down | 30 minutes | 4 hours |
| P1 — High | Major workflow blocked, significant user impact | 1 hour | 8 hours |
| P2 — Medium | Workflow partially impaired, workaround available | 4 hours | 2 business days |
| P3 — Low | Minor issue, cosmetic, enhancement | 1 business day | Next release |

### Support Channels

| Channel | Availability | For |
|---------|------------|-----|
| Emergency hotline | 24/7 | P0 only |
| Support portal (ticket) | 24/7 submission | All severities |
| Email | Business hours | P2, P3 |
| CSM direct | Business hours | Escalations, strategy |

### Escalation Path

P0: Support Engineer → On-Call Engineering Lead → CTO (if > 2 hours unresolved)
P1: Support Engineer → Technical CSM → Engineering on-call

---

## Renewal Management

### Renewal Timeline

| T-90 days | Initial renewal conversation |
| T-60 days | Renewal proposal sent |
| T-30 days | Signed renewal received |
| T-0 | License renewed, platform updated |

### Renewal Risks and Actions

| Risk | Signal | Action |
|------|--------|--------|
| Low adoption | < 60% users active | Training reinforcement, champion identification |
| Unresolved P1 | Open P1 > 1 week | Engineering escalation, compensatory SLA credit |
| Executive change | New CTO/CMO | Re-engagement meeting, new champion briefing |
| Budget pressure | Procurement asks for discount | ROI analysis, expansion vs contraction discussion |

---

## Expansion Playbook

### Expansion Triggers

- Customer mentions new facility or department
- New module interest in support tickets
- Annual review reveals high user satisfaction
- Regulatory change requires new capability

### Expansion Paths

| Current | Expansion |
|---------|---------|
| CyMed Clinic | Add Hospital, Lab, Imaging, Pharmacy |
| CyMed Hospital | Add Patient Portal, Provider Portal, Population Health |
| CyMed Basic | Upgrade to Professional or Enterprise |
| Single facility | Multi-site or chain deployment |
| CyMed | Add CyCom ERP |
| CyMed | Add CyAI advanced CDS |

### Expansion Process

1. CSM identifies expansion opportunity in health score review
2. Account Executive joins next EBR
3. Demo or proof of concept arranged
4. Commercial proposal from Account Executive
5. Implementation team briefed on expansion scope
6. Expansion implementation follows same Activate methodology

---

## Customer Documentation Index

### For Administrators

| Document | Location |
|----------|---------|
| Administrator Guide | `docs/guides/` + Customer Portal |
| Deployment Guide | `docs/Production_Operations_Guide.md` |
| Tenant Configuration Guide | `docs/guides/Tenant_Operations_Guide.md` |
| Security Operations | `docs/Security_Operations_Guide.md` |
| Disaster Recovery Guide | `docs/Disaster_Recovery_Guide.md` |

### For End Users

| Document | Location |
|----------|---------|
| CyMed Clinic User Guide | Customer Portal → Docs |
| CyMed Hospital User Guide | Customer Portal → Docs |
| CyMed Pharmacy User Guide | Customer Portal → Docs |
| CyMed Laboratory User Guide | Customer Portal → Docs |
| CyMed Imaging User Guide | Customer Portal → Docs |

### For IT Teams

| Document | Location |
|----------|---------|
| API Guide | `/api/docs/` (Swagger UI on platform) |
| Integration Guide | `docs/CyIntegration_Hub_Guide.md` |
| FHIR API Guide | `docs/guides/FHIR_API_Guide.md` |
| Upgrade Guide | Customer Portal → Docs |

---

## Release Management for Customers

### Release Communication

| Step | Timeline | Owner |
|------|---------|-------|
| Release notes distributed | T-14 days | CSM |
| Breaking changes briefing | T-14 days | Technical CSM |
| Customer upgrade scheduled | T-7 days | Technical CSM + Customer IT |
| Staging upgrade and test | T-3 days | Customer IT + Support |
| Production upgrade | T-0 | Customer IT + On-call support |

### Customer Upgrade Checklist

- [ ] Release notes reviewed with customer IT lead
- [ ] Breaking changes reviewed with customer
- [ ] Staging environment upgraded and smoke-tested
- [ ] Maintenance window confirmed with customer
- [ ] Rollback procedure confirmed
- [ ] Production upgrade completed
- [ ] Health check passed post-upgrade
- [ ] Customer sign-off received

---

## Customer ROI Framework

Use the following metrics to demonstrate value at EBRs:

| Metric | Healthcare Customer |
|--------|-------------------|
| Registration time reduction | Target: 50% reduction vs paper/legacy |
| Appointment no-show rate | Target: 20% reduction with reminders |
| Lab TAT improvement | Target: 30% reduction in critical TAT |
| Drug error prevention | Report drug interaction alerts fired and resolved |
| Revenue cycle improvement | Days in AR, claim denial rate, first-pass rate |
| Staff time saved | Hours per workflow × volume |

Collect these metrics monthly via the CyberCom Analytics dashboards.

---

## Customer Reference Program

Post hypercare, qualified customers are invited to:

- Reference call program (speak to prospective customers)
- Case study co-development
- CyberCom Advisory Board membership
- Beta program for new features
- Conference speaking opportunities

Customer reference status is tracked in CyCom CRM.
