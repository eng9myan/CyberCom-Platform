# CyMed Deployment Profiles

## Profiles

| Profile | Type | Internet | Telemetry | Gov. Clearance | Offline License |
|---------|------|----------|-----------|----------------|-----------------|
| SaaS | `saas` | Yes | Yes | No | No |
| Private Cloud | `private_cloud` | Yes | Yes | No | No |
| Government Cloud | `government_cloud` | No | No | Yes | Yes |
| Hybrid | `hybrid` | Yes | Yes | No | No |
| Air-Gapped | `air_gapped` | No | No | Yes | Yes |

## Seeded Capabilities

Each profile has `DeploymentCapability` records:

| Profile | Capabilities |
|---------|-------------|
| SaaS | online_activation, auto_update, telemetry, cloud_backup, multi_tenant |
| Private Cloud | online_activation, auto_update, telemetry, local_backup |
| Government Cloud | offline_activation, manual_update, local_backup, fips_compliance |
| Hybrid | online_activation, auto_update, telemetry, local_backup, cloud_sync |
| Air-Gapped | offline_activation, manual_update, local_backup, fips_compliance, data_sovereignty |

## Customer Deployment Configuration

`DeploymentConfiguration` stores per-customer infrastructure details:
- Cloud provider (AWS, Azure, GCP, On-prem)
- Region, cluster name, database host
- VPN requirements, IP whitelist
- Update channel (stable, lts, edge)
- Maintenance window

## Update Channels

- `stable`: Standard production releases
- `lts`: Long-Term Support releases (government/air-gapped)
- `edge`: Pre-release for beta customers

## API Endpoints

```
GET  /api/v1/commercial/deployments/profiles/
POST /api/v1/commercial/deployments/configurations/
GET  /api/v1/commercial/deployments/capabilities/
```
