"use client";

import React, { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId =
  | "catalog"
  | "applications"
  | "keys"
  | "subscriptions"
  | "webhooks"
  | "usage"
  | "contracts"
  | "fhir";

interface ApiCatalogEntry {
  id: string;
  name: string;
  slug: string;
  classification: string;
  status: string;
  base_path: string;
  owner_team: string;
}

interface ApiApplication {
  id: string;
  name: string;
  slug: string;
  classification: string;
  status: string;
  owner_email: string;
  key_count: number;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  status: string;
  application: string;
  scopes: string[];
  expires_at: string | null;
  last_used_at: string | null;
}

interface Webhook {
  id: string;
  name: string;
  target_url: string;
  events: string[];
  status: string;
  failure_count: number;
  last_delivery_at: string | null;
}

interface UsageStats {
  endpoint: string;
  method: string;
  total: number;
  errors: number;
  avg_latency_ms: number;
  p99_latency_ms: number;
}

interface ApiContract {
  id: string;
  catalog: string;
  consumer_name: string;
  is_valid: boolean;
  last_validated_at: string;
}

interface FHIRResource {
  resource_type: string;
  fhir_version: string;
  endpoint: string;
  description: string;
  smart_scopes: string[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CATALOG: ApiCatalogEntry[] = [
  { id: "1", name: "Patient API", slug: "patient-api", classification: "fhir", status: "active", base_path: "/api/v1/fhir/R4/Patient/", owner_team: "Clinical Informatics" },
  { id: "2", name: "Encounter API", slug: "encounter-api", classification: "fhir", status: "active", base_path: "/api/v1/fhir/R4/Encounter/", owner_team: "Clinical Informatics" },
  { id: "3", name: "Tenant Management API", slug: "tenant-api", classification: "internal", status: "active", base_path: "/api/v1/tenants/", owner_team: "Platform Engineering" },
  { id: "4", name: "Audit API", slug: "audit-api", classification: "internal", status: "active", base_path: "/api/v1/audit/", owner_team: "Security" },
  { id: "5", name: "Billing API", slug: "billing-api", classification: "partner", status: "deprecated", base_path: "/api/v1/billing/", owner_team: "Finance" },
  { id: "6", name: "Analytics API", slug: "analytics-api", classification: "internal", status: "draft", base_path: "/api/v1/analytics/", owner_team: "Data Platform" },
];

const MOCK_APPLICATIONS: ApiApplication[] = [
  { id: "1", name: "KFSH EMR Integration", slug: "kfsh-emr", classification: "partner", status: "active", owner_email: "integration@kfsh.med.sa", key_count: 3 },
  { id: "2", name: "DHA Reporting Service", slug: "dha-reporting", classification: "government", status: "active", owner_email: "api@dha.gov.ae", key_count: 1 },
  { id: "3", name: "CyberCom Analytics Worker", slug: "analytics-worker", classification: "internal", status: "active", owner_email: "platform@cybercom.io", key_count: 2 },
  { id: "4", name: "ACME Pharmacy", slug: "acme-pharmacy", classification: "partner", status: "suspended", owner_email: "dev@acme-pharmacy.com", key_count: 0 },
];

const MOCK_KEYS: ApiKey[] = [
  { id: "1", name: "KFSH Production Key", key_prefix: "ck_prod_kfsh", status: "active", application: "KFSH EMR Integration", scopes: ["fhir:read", "fhir:write"], expires_at: "2027-01-01", last_used_at: "2026-06-22T08:34:00Z" },
  { id: "2", name: "DHA Read Key", key_prefix: "ck_dha_read1", status: "active", application: "DHA Reporting Service", scopes: ["fhir:read", "audit:read"], expires_at: "2026-12-31", last_used_at: "2026-06-22T06:12:00Z" },
  { id: "3", name: "Analytics Worker Key", key_prefix: "ck_anlytc_01", status: "active", application: "CyberCom Analytics Worker", scopes: ["analytics:read", "audit:read"], expires_at: null, last_used_at: "2026-06-21T23:59:00Z" },
  { id: "4", name: "ACME Legacy Key", key_prefix: "ck_acme_lgcy", status: "revoked", application: "ACME Pharmacy", scopes: ["fhir:read"], expires_at: "2026-01-01", last_used_at: "2025-12-30T10:00:00Z" },
];

const MOCK_WEBHOOKS: Webhook[] = [
  { id: "1", name: "KFSH Patient Events", target_url: "https://kfsh.med.sa/hooks/patient", events: ["patient.created", "patient.updated"], status: "active", failure_count: 0, last_delivery_at: "2026-06-22T08:30:00Z" },
  { id: "2", name: "DHA Compliance Alerts", target_url: "https://dha.gov.ae/hooks/alerts", events: ["compliance.violation"], status: "active", failure_count: 2, last_delivery_at: "2026-06-22T07:15:00Z" },
  { id: "3", name: "Billing Events", target_url: "https://billing.internal/hooks", events: ["*"], status: "failed", failure_count: 47, last_delivery_at: "2026-06-20T12:00:00Z" },
];

const MOCK_USAGE: UsageStats[] = [
  { endpoint: "/api/v1/fhir/R4/Patient/", method: "GET", total: 184320, errors: 412, avg_latency_ms: 38, p99_latency_ms: 180 },
  { endpoint: "/api/v1/fhir/R4/Encounter/", method: "GET", total: 72100, errors: 89, avg_latency_ms: 45, p99_latency_ms: 210 },
  { endpoint: "/api/v1/tenants/", method: "GET", total: 28900, errors: 12, avg_latency_ms: 22, p99_latency_ms: 95 },
  { endpoint: "/api/v1/audit/events/", method: "GET", total: 19300, errors: 5, avg_latency_ms: 55, p99_latency_ms: 240 },
  { endpoint: "/api/v1/fhir/R4/Observation/", method: "POST", total: 14200, errors: 290, avg_latency_ms: 62, p99_latency_ms: 280 },
];

const MOCK_CONTRACTS: ApiContract[] = [
  { id: "1", catalog: "patient-api", consumer_name: "KFSH EMR", is_valid: true, last_validated_at: "2026-06-22T06:00:00Z" },
  { id: "2", catalog: "patient-api", consumer_name: "DHA Reporting", is_valid: true, last_validated_at: "2026-06-22T06:00:00Z" },
  { id: "3", catalog: "billing-api", consumer_name: "Finance Service", is_valid: false, last_validated_at: "2026-06-21T12:00:00Z" },
];

const MOCK_FHIR: FHIRResource[] = [
  { resource_type: "Patient", fhir_version: "R4", endpoint: "/fhir/R4/Patient/", description: "FHIR R4 Patient resource — demographics, identifiers, contacts", smart_scopes: ["patient/Patient.read", "patient/Patient.write"] },
  { resource_type: "Encounter", fhir_version: "R4", endpoint: "/fhir/R4/Encounter/", description: "Clinical encounters — inpatient, outpatient, emergency", smart_scopes: ["patient/Encounter.read"] },
  { resource_type: "Observation", fhir_version: "R4", endpoint: "/fhir/R4/Observation/", description: "Vital signs, lab results, clinical findings", smart_scopes: ["patient/Observation.read", "patient/Observation.write"] },
  { resource_type: "Practitioner", fhir_version: "R4", endpoint: "/fhir/R4/Practitioner/", description: "Healthcare practitioner registry", smart_scopes: ["user/Practitioner.read"] },
  { resource_type: "MedicationRequest", fhir_version: "R4", endpoint: "/fhir/R4/MedicationRequest/", description: "Medication orders and prescriptions", smart_scopes: ["patient/MedicationRequest.read", "patient/MedicationRequest.write"] },
  { resource_type: "DiagnosticReport", fhir_version: "R5", endpoint: "/fhir/R5/DiagnosticReport/", description: "Lab and imaging diagnostic reports (R5 preview)", smart_scopes: ["patient/DiagnosticReport.read"] },
];

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    deprecated: "bg-amber-500/15 text-amber-400",
    draft: "bg-ink/10 text-ink/50",
    suspended: "bg-orange-500/15 text-orange-400",
    revoked: "bg-red-500/15 text-red-400",
    failed: "bg-red-500/15 text-red-400",
    paused: "bg-amber-500/15 text-amber-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? "bg-ink/10 text-ink/50"}`}>
      {status}
    </span>
  );
}

function ClassificationBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    fhir: "bg-brand-500/15 text-brand-300",
    internal: "bg-ink/10 text-ink/50",
    partner: "bg-purple-500/15 text-purple-400",
    government: "bg-indigo-500/15 text-indigo-400",
    public: "bg-emerald-500/15 text-emerald-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[value] ?? "bg-ink/10 text-ink/50"}`}>
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tab content panels
// ---------------------------------------------------------------------------

function ApiCatalogTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">API Catalog</h2>
        <button className="bg-brand-500 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-600">+ Register API</button>
      </div>
      <div className="grid gap-3">
        {MOCK_CATALOG.map((api) => (
          <div key={api.id} className="border border-ink/10 rounded-lg p-4 bg-surface-raised hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-ink">{api.name}</span>
                  <ClassificationBadge value={api.classification} />
                  <StatusBadge status={api.status} />
                </div>
                <div className="text-xs text-ink/50 font-mono mb-1">{api.base_path}</div>
                <div className="text-xs text-ink/40">Owner: {api.owner_team}</div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-brand-400 hover:underline">OpenAPI</button>
                <button className="text-xs text-ink/50 hover:underline">SDK</button>
                <button className="text-xs text-ink/50 hover:underline">Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Applications</h2>
        <button className="bg-brand-500 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-600">+ Register App</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-ink/10">
            <th className="pb-2 font-medium text-ink/50">Name</th>
            <th className="pb-2 font-medium text-ink/50">Classification</th>
            <th className="pb-2 font-medium text-ink/50">Status</th>
            <th className="pb-2 font-medium text-ink/50">Owner</th>
            <th className="pb-2 font-medium text-ink/50">Keys</th>
            <th className="pb-2 font-medium text-ink/50">Actions</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_APPLICATIONS.map((app) => (
            <tr key={app.id} className="border-b border-ink/5 hover:bg-ink/5">
              <td className="py-2.5 font-medium">{app.name}</td>
              <td className="py-2.5"><ClassificationBadge value={app.classification} /></td>
              <td className="py-2.5"><StatusBadge status={app.status} /></td>
              <td className="py-2.5 text-ink/50 text-xs">{app.owner_email}</td>
              <td className="py-2.5">{app.key_count}</td>
              <td className="py-2.5">
                <div className="flex gap-2">
                  <button className="text-xs text-brand-400 hover:underline">Keys</button>
                  <button className="text-xs text-ink/50 hover:underline">{app.status === "active" ? "Suspend" : "Activate"}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">API Keys</h2>
        <button className="bg-brand-500 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-600">+ Generate Key</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-ink/10">
            <th className="pb-2 font-medium text-ink/50">Name</th>
            <th className="pb-2 font-medium text-ink/50">Application</th>
            <th className="pb-2 font-medium text-ink/50">Prefix</th>
            <th className="pb-2 font-medium text-ink/50">Status</th>
            <th className="pb-2 font-medium text-ink/50">Scopes</th>
            <th className="pb-2 font-medium text-ink/50">Last Used</th>
            <th className="pb-2 font-medium text-ink/50">Expires</th>
            <th className="pb-2 font-medium text-ink/50">Actions</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_KEYS.map((key) => (
            <tr key={key.id} className="border-b border-ink/5 hover:bg-ink/5">
              <td className="py-2.5 font-medium">{key.name}</td>
              <td className="py-2.5 text-xs text-ink/50">{key.application}</td>
              <td className="py-2.5 font-mono text-xs text-ink/50">{key.key_prefix}...</td>
              <td className="py-2.5"><StatusBadge status={key.status} /></td>
              <td className="py-2.5">
                <div className="flex flex-wrap gap-1">
                  {key.scopes.map((s) => (
                    <span key={s} className="text-xs bg-ink/10 text-ink/50 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </td>
              <td className="py-2.5 text-xs text-ink/50">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "—"}</td>
              <td className="py-2.5 text-xs text-ink/50">{key.expires_at ?? "Never"}</td>
              <td className="py-2.5">
                {key.status === "active" && (
                  <div className="flex gap-2">
                    <button className="text-xs text-brand-400 hover:underline">Rotate</button>
                    <button className="text-xs text-red-400 hover:underline">Revoke</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WebhooksTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Webhooks</h2>
        <button className="bg-brand-500 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-600">+ Register Webhook</button>
      </div>
      <div className="grid gap-3">
        {MOCK_WEBHOOKS.map((wh) => (
          <div key={wh.id} className={`border rounded-lg p-4 bg-surface-raised ${wh.failure_count > 10 ? "border-red-400/30" : "border-ink/10"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-ink">{wh.name}</span>
                  <StatusBadge status={wh.status} />
                  {wh.failure_count > 0 && (
                    <span className="text-xs text-red-400 font-medium">{wh.failure_count} failures</span>
                  )}
                </div>
                <div className="text-xs font-mono text-ink/50 mb-1">{wh.target_url}</div>
                <div className="flex gap-1">
                  {wh.events.map((e) => (
                    <span key={e} className="text-xs bg-brand-500/10 text-brand-400 px-1.5 py-0.5 rounded">{e}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <button className="text-xs text-brand-400 hover:underline">Deliveries</button>
                <button className="text-xs text-ink/50 hover:underline">Pause</button>
              </div>
            </div>
            {wh.last_delivery_at && (
              <div className="mt-2 text-xs text-ink/40">Last delivery: {new Date(wh.last_delivery_at).toLocaleString()}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UsageTab() {
  const totalRequests = MOCK_USAGE.reduce((s, u) => s + u.total, 0);
  const totalErrors = MOCK_USAGE.reduce((s, u) => s + u.errors, 0);
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);

  return (
    <div>
      <h2 className="text-lg font-bold text-ink mb-4">API Usage Analytics</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-brand-500/10 border border-brand-400/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-300">{totalRequests.toLocaleString()}</div>
          <div className="text-xs text-brand-400 mt-1">Total Requests (30d)</div>
        </div>
        <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">{errorRate}%</div>
          <div className="text-xs text-red-400 mt-1">Error Rate</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-400">38ms</div>
          <div className="text-xs text-emerald-400 mt-1">Avg Latency</div>
        </div>
      </div>

      <h3 className="font-medium text-ink/70 mb-3 text-sm">Top Endpoints</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-ink/10">
            <th className="pb-2 font-medium text-ink/50">Endpoint</th>
            <th className="pb-2 font-medium text-ink/50">Method</th>
            <th className="pb-2 font-medium text-ink/50">Requests</th>
            <th className="pb-2 font-medium text-ink/50">Errors</th>
            <th className="pb-2 font-medium text-ink/50">Avg Latency</th>
            <th className="pb-2 font-medium text-ink/50">P99</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_USAGE.map((u, i) => (
            <tr key={i} className="border-b border-ink/5 hover:bg-ink/5">
              <td className="py-2.5 font-mono text-xs text-ink/50">{u.endpoint}</td>
              <td className="py-2.5"><span className="text-xs font-medium text-brand-400">{u.method}</span></td>
              <td className="py-2.5">{u.total.toLocaleString()}</td>
              <td className="py-2.5 text-red-400">{u.errors}</td>
              <td className="py-2.5">{u.avg_latency_ms}ms</td>
              <td className="py-2.5">{u.p99_latency_ms}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">API Contracts</h2>
        <button className="bg-brand-500 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-600">+ Register Contract</button>
      </div>
      <div className="mb-4 p-3 bg-brand-500/10 border border-brand-400/20 rounded-lg text-sm text-brand-300">
        Contract testing ensures backward compatibility when API schemas change. {MOCK_CONTRACTS.filter(c => !c.is_valid).length} contract(s) currently have schema drift detected.
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-ink/10">
            <th className="pb-2 font-medium text-ink/50">Catalog</th>
            <th className="pb-2 font-medium text-ink/50">Consumer</th>
            <th className="pb-2 font-medium text-ink/50">Status</th>
            <th className="pb-2 font-medium text-ink/50">Last Validated</th>
            <th className="pb-2 font-medium text-ink/50">Actions</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_CONTRACTS.map((c) => (
            <tr key={c.id} className="border-b border-ink/5 hover:bg-ink/5">
              <td className="py-2.5 font-mono text-xs">{c.catalog}</td>
              <td className="py-2.5 font-medium">{c.consumer_name}</td>
              <td className="py-2.5">
                {c.is_valid
                  ? <span className="text-xs text-emerald-400 font-medium">Valid</span>
                  : <span className="text-xs text-red-400 font-medium">Schema Drift</span>}
              </td>
              <td className="py-2.5 text-xs text-ink/50">{new Date(c.last_validated_at).toLocaleString()}</td>
              <td className="py-2.5">
                <button className="text-xs text-brand-400 hover:underline">Re-validate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FHIRTab() {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink mb-2">FHIR API</h2>
      <div className="text-sm text-ink/50 mb-4">
        SMART on FHIR R4/R5 endpoints. Authentication via CyIdentity (OAuth 2.1 + PKCE). Base: <code className="bg-ink/10 px-1 rounded">/api/v1/fhir/</code>
      </div>

      <div className="flex gap-2 mb-4">
        <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full font-medium">R4 Stable</span>
        <span className="text-xs bg-brand-500/15 text-brand-300 px-2 py-1 rounded-full font-medium">R5 Preview</span>
        <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-1 rounded-full font-medium">SMART on FHIR</span>
      </div>

      <div className="grid gap-3">
        {MOCK_FHIR.map((r) => (
          <div key={r.resource_type} className="border border-ink/10 rounded-lg p-4 bg-surface-raised">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-ink">{r.resource_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.fhir_version === "R4" ? "bg-emerald-500/15 text-emerald-400" : "bg-brand-500/15 text-brand-300"}`}>
                    {r.fhir_version}
                  </span>
                </div>
                <div className="text-xs font-mono text-ink/50 mb-2">{r.endpoint}</div>
                <div className="text-xs text-ink/50 mb-2">{r.description}</div>
                <div className="flex flex-wrap gap-1">
                  {r.smart_scopes.map((s) => (
                    <span key={s} className="text-xs bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-mono">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-brand-400 hover:underline">Try it</button>
                <button className="text-xs text-ink/50 hover:underline">Schema</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">API Subscriptions</h2>
        <button className="bg-brand-500 text-white px-3 py-1.5 rounded text-sm hover:bg-brand-600">+ Subscribe</button>
      </div>
      <div className="grid gap-3">
        {[
          { id: "1", app: "KFSH EMR Integration", api: "Patient API", scopes: ["fhir:read", "fhir:write"], status: "active", approved_by: "platform_admin", approved_at: "2026-01-15" },
          { id: "2", app: "DHA Reporting Service", api: "Audit API", scopes: ["audit:read"], status: "active", approved_by: "security_admin", approved_at: "2026-02-01" },
          { id: "3", app: "CyberCom Analytics Worker", api: "Analytics API", scopes: ["analytics:read"], status: "active", approved_by: "platform_admin", approved_at: "2026-03-10" },
        ].map((sub) => (
          <div key={sub.id} className="border border-ink/10 rounded-lg p-4 bg-surface-raised">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-ink">{sub.app}</span>
                  <span className="text-ink/40">→</span>
                  <span className="font-medium text-brand-400">{sub.api}</span>
                  <StatusBadge status={sub.status} />
                </div>
                <div className="flex gap-1 mt-1">
                  {sub.scopes.map((s) => (
                    <span key={s} className="text-xs bg-ink/10 text-ink/50 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
                <div className="text-xs text-ink/40 mt-1">Approved by {sub.approved_by} on {sub.approved_at}</div>
              </div>
              <button className="text-xs text-red-400 hover:underline">Revoke</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const TABS: { id: TabId; label: string }[] = [
  { id: "catalog", label: "API Catalog" },
  { id: "applications", label: "Applications" },
  { id: "keys", label: "API Keys" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "webhooks", label: "Webhooks" },
  { id: "usage", label: "Usage" },
  { id: "contracts", label: "Contracts" },
  { id: "fhir", label: "FHIR" },
];

export default function ApiManagementPage() {
  const [activeTab, setActiveTab] = useState<TabId>("catalog");

  const totalApps = MOCK_APPLICATIONS.filter((a) => a.status === "active").length;
  const totalKeys = MOCK_KEYS.filter((k) => k.status === "active").length;
  const activeApis = MOCK_CATALOG.filter((c) => c.status === "active").length;
  const failedWebhooks = MOCK_WEBHOOKS.filter((w) => w.status === "failed").length;

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-ink">API Management</h1>
          <p className="text-sm text-ink/50 mt-1">
            CyberCom Platform — OpenAPI 3.1 · RFC 7807 · FHIR R4/R5 · SMART on FHIR
          </p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-raised border border-ink/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-ink">{activeApis}</div>
            <div className="text-xs text-ink/50 mt-1">Active APIs</div>
          </div>
          <div className="bg-surface-raised border border-ink/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-ink">{totalApps}</div>
            <div className="text-xs text-ink/50 mt-1">Active Applications</div>
          </div>
          <div className="bg-surface-raised border border-ink/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-ink">{totalKeys}</div>
            <div className="text-xs text-ink/50 mt-1">Active Keys</div>
          </div>
          <div className="bg-surface-raised border border-ink/10 rounded-lg p-4">
            <div className={`text-2xl font-bold ${failedWebhooks > 0 ? "text-red-400" : "text-ink"}`}>
              {failedWebhooks}
            </div>
            <div className="text-xs text-ink/50 mt-1">Failed Webhooks</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-surface-raised border border-ink/10 rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-ink/10 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-brand-500 text-brand-400"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "catalog" && <ApiCatalogTab />}
            {activeTab === "applications" && <ApplicationsTab />}
            {activeTab === "keys" && <ApiKeysTab />}
            {activeTab === "subscriptions" && <SubscriptionsTab />}
            {activeTab === "webhooks" && <WebhooksTab />}
            {activeTab === "usage" && <UsageTab />}
            {activeTab === "contracts" && <ContractsTab />}
            {activeTab === "fhir" && <FHIRTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
