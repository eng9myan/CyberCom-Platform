"use client";

import React, { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ComplianceFramework =
  | "hipaa" | "gdpr" | "pdpl" | "uae_dp" | "jordan_dp"
  | "soc2" | "iso27001" | "nca_ecc" | "healthcare_accreditation" | "pci_dss";

type ViolationStatus = "open" | "acknowledged" | "remediated" | "accepted_risk" | "false_positive";
type AssessmentResult = "passed" | "failed" | "partial" | "pending";
type LegalHoldStatus = "active" | "released" | "expired";

interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  category: string;
  actor_username: string;
  resource_type: string;
  resource_id: string;
  status: "success" | "failure" | "denied";
  data_classification: string;
  is_high_risk: boolean;
  tenant_slug: string;
}

interface ComplianceViolation {
  id: string;
  rule_id: string;
  rule_name: string;
  framework: ComplianceFramework;
  severity: "critical" | "high" | "medium" | "low";
  status: ViolationStatus;
  detected_at: string;
  description: string;
  tenant_slug: string;
}

interface LegalHold {
  id: string;
  name: string;
  case_reference: string;
  status: LegalHoldStatus;
  created_by: string;
  activated_at: string;
  resource_types: string[];
  custodians: string[];
}

interface ComplianceProfile {
  id: string;
  framework: ComplianceFramework;
  name: string;
  score: number;
  result: AssessmentResult;
  total_rules: number;
  passed_rules: number;
  open_violations: number;
  last_assessed: string;
}

interface RetentionPolicy {
  id: string;
  category: string;
  data_classification: string;
  hot_retention_days: number;
  warm_retention_days: number;
  cold_retention_years: number;
  compliance_basis: string;
}

interface EvidencePackage {
  id: string;
  name: string;
  purpose: string;
  case_reference: string;
  is_sealed: boolean;
  record_count: number;
  created_by: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  { id: "1", timestamp: "2026-06-22T10:30:00Z", action: "patient.chart.read", category: "clinical", actor_username: "dr.khalid", resource_type: "patient_record", resource_id: "PAT-0012", status: "success", data_classification: "phi", is_high_risk: false, tenant_slug: "kfsh" },
  { id: "2", timestamp: "2026-06-22T10:28:00Z", action: "break_glass.activated", category: "clinical", actor_username: "dr.sara", resource_type: "patient_record", resource_id: "PAT-0099", status: "success", data_classification: "phi", is_high_risk: true, tenant_slug: "dha" },
  { id: "3", timestamp: "2026-06-22T10:25:00Z", action: "user.login", category: "authentication", actor_username: "admin@acme.com", resource_type: "session", resource_id: "sess-abc", status: "success", data_classification: "internal", is_high_risk: false, tenant_slug: "acme" },
  { id: "4", timestamp: "2026-06-22T10:20:00Z", action: "financial.posting.created", category: "financial", actor_username: "finance@acme.com", resource_type: "ledger_entry", resource_id: "LE-0234", status: "success", data_classification: "financial", is_high_risk: false, tenant_slug: "acme" },
  { id: "5", timestamp: "2026-06-22T10:15:00Z", action: "ai.inference.completed", category: "ai", actor_username: "ai-service", resource_type: "model_inference", resource_id: "INF-0056", status: "success", data_classification: "confidential", is_high_risk: false, tenant_slug: "kfsh" },
  { id: "6", timestamp: "2026-06-22T10:10:00Z", action: "user.login", category: "authentication", actor_username: "unknown", resource_type: "session", resource_id: "", status: "denied", data_classification: "internal", is_high_risk: true, tenant_slug: "acme" },
];

const MOCK_VIOLATIONS: ComplianceViolation[] = [
  { id: "v1", rule_id: "HIPAA-MFA-1", rule_name: "MFA for Workforce Members", framework: "hipaa", severity: "high", status: "open", detected_at: "2026-06-20T08:00:00Z", description: "2 workforce accounts without MFA enrolled", tenant_slug: "kfsh" },
  { id: "v2", rule_id: "GDPR-RT-1", rule_name: "Retention Policy Active", framework: "gdpr", severity: "medium", status: "acknowledged", detected_at: "2026-06-18T09:00:00Z", description: "User data retention policy not configured", tenant_slug: "acme" },
  { id: "v3", rule_id: "NCA-3-1", rule_name: "Security Event Logging", framework: "nca_ecc", severity: "critical", status: "remediated", detected_at: "2026-06-15T12:00:00Z", description: "SIEM export not enabled for government tenant", tenant_slug: "moh-jordan" },
];

const MOCK_HOLDS: LegalHold[] = [
  { id: "h1", name: "Case 2026-KFSH-001", case_reference: "LEGAL-2026-001", status: "active", created_by: "legal@kfsh.sa", activated_at: "2026-06-10T00:00:00Z", resource_types: ["patient_record", "clinical_note"], custodians: ["dr.khalid", "admin@kfsh.sa"] },
  { id: "h2", name: "DHA Regulatory Inquiry", case_reference: "DHA-INQ-2026", status: "active", created_by: "legal@dha.ae", activated_at: "2026-06-01T00:00:00Z", resource_types: ["clinical_audit"], custodians: ["legal@dha.ae"] },
];

const MOCK_PROFILES: ComplianceProfile[] = [
  { id: "cp1", framework: "hipaa", name: "HIPAA S164 Profile", score: 87, result: "passed", total_rules: 7, passed_rules: 6, open_violations: 1, last_assessed: "2026-06-22T06:00:00Z" },
  { id: "cp2", framework: "gdpr", name: "GDPR Profile", score: 83, result: "passed", total_rules: 6, passed_rules: 5, open_violations: 1, last_assessed: "2026-06-22T06:00:00Z" },
  { id: "cp3", framework: "nca_ecc", name: "NCA ECC Profile", score: 100, result: "passed", total_rules: 5, passed_rules: 5, open_violations: 0, last_assessed: "2026-06-22T06:00:00Z" },
  { id: "cp4", framework: "iso27001", name: "ISO 27001 Profile", score: 80, result: "passed", total_rules: 5, passed_rules: 4, open_violations: 1, last_assessed: "2026-06-21T06:00:00Z" },
];

const MOCK_RETENTION: RetentionPolicy[] = [
  { id: "r1", category: "clinical", data_classification: "phi", hot_retention_days: 90, warm_retention_days: 365, cold_retention_years: 10, compliance_basis: "hipaa" },
  { id: "r2", category: "authentication", data_classification: "internal", hot_retention_days: 90, warm_retention_days: 365, cold_retention_years: 7, compliance_basis: "iso27001" },
  { id: "r3", category: "financial", data_classification: "financial", hot_retention_days: 90, warm_retention_days: 365, cold_retention_years: 7, compliance_basis: "soc2" },
  { id: "r4", category: "government", data_classification: "government_sensitive", hot_retention_days: 90, warm_retention_days: 365, cold_retention_years: 10, compliance_basis: "nca_ecc" },
];

const MOCK_PACKAGES: EvidencePackage[] = [
  { id: "ep1", name: "KFSH Legal Bundle 2026-001", purpose: "legal_proceeding", case_reference: "LEGAL-2026-001", is_sealed: true, record_count: 45, created_by: "legal@kfsh.sa", created_at: "2026-06-12T00:00:00Z" },
  { id: "ep2", name: "HIPAA Attestation Package Q1-2026", purpose: "compliance_certification", case_reference: "", is_sealed: false, record_count: 12, created_by: "compliance@kfsh.sa", created_at: "2026-06-20T00:00:00Z" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TABS = ["Audit Dashboard", "Audit Search", "Compliance", "Rules & Violations", "Legal Holds", "Retention", "Evidence", "Reports"] as const;
type Tab = typeof TABS[number];

const FRAMEWORK_LABELS: Record<string, string> = {
  hipaa: "HIPAA", gdpr: "GDPR", pdpl: "PDPL", uae_dp: "UAE DP", jordan_dp: "Jordan DP",
  soc2: "SOC 2", iso27001: "ISO 27001", nca_ecc: "NCA ECC",
  healthcare_accreditation: "JCI/TJC", pci_dss: "PCI DSS",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#DC2626", high: "#EA580C", medium: "#D97706", low: "#65A30D", informational: "#6B7280",
};

const STATUS_COLOR: Record<string, string> = {
  open: "#DC2626", acknowledged: "#D97706", remediated: "#16A34A",
  accepted_risk: "#6B7280", false_positive: "#94A3B8",
  active: "#2563EB", released: "#16A34A", expired: "#94A3B8",
  success: "#16A34A", failure: "#DC2626", denied: "#EA580C",
  passed: "#16A34A", failed: "#DC2626", partial: "#D97706", pending: "#6B7280",
};

const classify_color: Record<string, string> = {
  phi: "#DC2626", pii: "#EA580C", financial: "#D97706",
  government_sensitive: "#7C3AED", restricted: "#9333EA",
  confidential: "#2563EB", internal: "#6B7280", public: "#16A34A",
};

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 600, background: color ? color + "22" : "#E2E8F0",
      color: color || "#475569", border: `1px solid ${color || "#CBD5E1"}44`,
    }}>
      {label}
    </span>
  );
}

function ScoreBar({ score, passing = 80 }: { score: number; passing?: number }) {
  const color = score >= passing ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 100, height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}%</span>
    </div>
  );
}

function fmt(ts: string) {
  return new Date(ts).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

// ---------------------------------------------------------------------------
// Tab Panels
// ---------------------------------------------------------------------------

function AuditDashboard() {
  const highRisk = MOCK_AUDIT_EVENTS.filter(e => e.is_high_risk).length;
  const denied = MOCK_AUDIT_EVENTS.filter(e => e.status === "denied").length;
  const clinical = MOCK_AUDIT_EVENTS.filter(e => e.category === "clinical").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Events (24h)", value: MOCK_AUDIT_EVENTS.length, color: "#2563EB" },
          { label: "High Risk", value: highRisk, color: "#DC2626" },
          { label: "Denied", value: denied, color: "#EA580C" },
          { label: "Clinical (PHI)", value: clinical, color: "#7C3AED" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#1E293B" }}>Recent Audit Events</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F1F5F9" }}>
            {["Time", "Action", "Category", "Actor", "Resource", "Classification", "Status", "Risk"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_AUDIT_EVENTS.map((ev, i) => (
            <tr key={ev.id} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <td style={{ padding: "8px 12px", color: "#64748B", whiteSpace: "nowrap" }}>{fmt(ev.timestamp)}</td>
              <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{ev.action}</td>
              <td style={{ padding: "8px 12px" }}><Chip label={ev.category} /></td>
              <td style={{ padding: "8px 12px" }}>{ev.actor_username}</td>
              <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{ev.resource_type}/{ev.resource_id}</td>
              <td style={{ padding: "8px 12px" }}>
                <Chip label={ev.data_classification.toUpperCase()} color={classify_color[ev.data_classification]} />
              </td>
              <td style={{ padding: "8px 12px" }}>
                <Chip label={ev.status} color={STATUS_COLOR[ev.status]} />
              </td>
              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                {ev.is_high_risk && <span style={{ color: "#DC2626", fontWeight: 700, fontSize: 16 }}>!</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = ["all", "authentication", "authorization", "clinical", "financial", "government", "security", "ai", "erp"];
  const filtered = MOCK_AUDIT_EVENTS.filter(ev =>
    (category === "all" || ev.category === category) &&
    (query === "" || ev.action.includes(query) || ev.actor_username.includes(query) || ev.resource_id.includes(query))
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search action, actor, resource..."
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>{filtered.length} events found</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F1F5F9" }}>
            {["Time", "Tenant", "Action", "Actor", "Resource", "Status"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((ev, i) => (
            <tr key={ev.id} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <td style={{ padding: "8px 12px", color: "#64748B" }}>{fmt(ev.timestamp)}</td>
              <td style={{ padding: "8px 12px" }}><Chip label={ev.tenant_slug} /></td>
              <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{ev.action}</td>
              <td style={{ padding: "8px 12px" }}>{ev.actor_username}</td>
              <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{ev.resource_type}/{ev.resource_id}</td>
              <td style={{ padding: "8px 12px" }}><Chip label={ev.status} color={STATUS_COLOR[ev.status]} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComplianceDashboard() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Frameworks Active", value: MOCK_PROFILES.length, color: "#2563EB" },
          { label: "Open Violations", value: MOCK_VIOLATIONS.filter(v => v.status === "open").length, color: "#DC2626" },
          { label: "Active Legal Holds", value: MOCK_HOLDS.filter(h => h.status === "active").length, color: "#7C3AED" },
          { label: "Avg Compliance Score", value: Math.round(MOCK_PROFILES.reduce((s, p) => s + p.score, 0) / MOCK_PROFILES.length) + "%", color: "#16A34A" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Framework Status</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F1F5F9" }}>
            {["Framework", "Score", "Status", "Rules", "Violations", "Last Assessed"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_PROFILES.map((p, i) => (
            <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <td style={{ padding: "8px 12px", fontWeight: 600 }}>{FRAMEWORK_LABELS[p.framework]}</td>
              <td style={{ padding: "8px 12px" }}><ScoreBar score={p.score} /></td>
              <td style={{ padding: "8px 12px" }}><Chip label={p.result} color={STATUS_COLOR[p.result]} /></td>
              <td style={{ padding: "8px 12px" }}>{p.passed_rules}/{p.total_rules}</td>
              <td style={{ padding: "8px 12px" }}>
                {p.open_violations > 0
                  ? <span style={{ color: "#DC2626", fontWeight: 700 }}>{p.open_violations}</span>
                  : <span style={{ color: "#16A34A" }}>0</span>}
              </td>
              <td style={{ padding: "8px 12px", color: "#64748B" }}>{fmt(p.last_assessed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ViolationsPanel() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? MOCK_VIOLATIONS : MOCK_VIOLATIONS.filter(v => v.status === filter);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "open", "acknowledged", "remediated"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: "6px 14px", border: "1px solid #CBD5E1", borderRadius: 6, cursor: "pointer",
              background: filter === s ? "#1B4F8A" : "#fff", color: filter === s ? "#fff" : "#475569", fontSize: 13,
            }}>
            {s}
          </button>
        ))}
      </div>
      {filtered.map(v => (
        <div key={v.id} style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, marginBottom: 12,
          borderLeft: `4px solid ${SEVERITY_COLOR[v.severity]}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontWeight: 700, marginRight: 8 }}>{v.rule_id}</span>
              <span style={{ color: "#475569" }}>{v.rule_name}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Chip label={v.framework.toUpperCase()} />
              <Chip label={v.severity} color={SEVERITY_COLOR[v.severity]} />
              <Chip label={v.status} color={STATUS_COLOR[v.status]} />
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "#64748B" }}>{v.description}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#94A3B8" }}>Detected: {fmt(v.detected_at)} — Tenant: {v.tenant_slug}</div>
        </div>
      ))}
    </div>
  );
}

function LegalHoldsPanel() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Active Legal Holds</h3>
        <button style={{ padding: "8px 16px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          + New Legal Hold
        </button>
      </div>
      {MOCK_HOLDS.map(hold => (
        <div key={hold.id} style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{hold.name}</div>
              {hold.case_reference && <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>Ref: {hold.case_reference}</div>}
            </div>
            <Chip label={hold.status} color={STATUS_COLOR[hold.status]} />
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><span style={{ color: "#64748B" }}>Created by:</span> {hold.created_by}</div>
            <div><span style={{ color: "#64748B" }}>Activated:</span> {fmt(hold.activated_at)}</div>
            <div>
              <span style={{ color: "#64748B" }}>Resource types:</span>{" "}
              {hold.resource_types.map(r => <Chip key={r} label={r} />)}
            </div>
            <div>
              <span style={{ color: "#64748B" }}>Custodians:</span>{" "}
              {hold.custodians.join(", ")}
            </div>
          </div>
          {hold.status === "active" && (
            <button style={{ marginTop: 12, padding: "6px 14px", background: "#fff", border: "1px solid #DC2626", color: "#DC2626", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Release Hold
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function RetentionPanel() {
  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Retention Policies</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F1F5F9" }}>
            {["Category", "Classification", "Hot (days)", "Warm (days)", "Cold (years)", "Basis"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_RETENTION.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.category}</td>
              <td style={{ padding: "8px 12px" }}>
                <Chip label={r.data_classification.toUpperCase()} color={classify_color[r.data_classification]} />
              </td>
              <td style={{ padding: "8px 12px" }}>{r.hot_retention_days}</td>
              <td style={{ padding: "8px 12px" }}>{r.warm_retention_days}</td>
              <td style={{ padding: "8px 12px" }}>{r.cold_retention_years}</td>
              <td style={{ padding: "8px 12px" }}><Chip label={FRAMEWORK_LABELS[r.compliance_basis] || r.compliance_basis} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EvidencePanel() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Evidence Packages</h3>
        <button style={{ padding: "8px 16px", background: "#1B4F8A", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          + New Package
        </button>
      </div>
      {MOCK_PACKAGES.map(pkg => (
        <div key={pkg.id} style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{pkg.name}</div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{pkg.purpose.replace(/_/g, " ")}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {pkg.is_sealed
                ? <Chip label="Sealed" color="#16A34A" />
                : <Chip label="Open" color="#D97706" />}
            </div>
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><span style={{ color: "#64748B" }}>Records:</span> {pkg.record_count}</div>
            <div><span style={{ color: "#64748B" }}>Created by:</span> {pkg.created_by}</div>
            <div><span style={{ color: "#64748B" }}>Created:</span> {fmt(pkg.created_at)}</div>
          </div>
          {!pkg.is_sealed && (
            <button style={{ marginTop: 12, padding: "6px 14px", background: "#1B4F8A", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Seal Package
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ReportsPanel() {
  const frameworks: ComplianceFramework[] = ["hipaa", "gdpr", "nca_ecc", "iso27001"];
  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Generate Compliance Reports</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {frameworks.map(fw => (
          <div key={fw} style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{FRAMEWORK_LABELS[fw]}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>Generate compliance report for the selected period</div>
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ flex: 1, padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 6 months</option>
                <option>Last year</option>
              </select>
              <button style={{ padding: "6px 14px", background: "#1B4F8A", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Generate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Audit Dashboard");

  const tabContent: Record<Tab, React.ReactNode> = {
    "Audit Dashboard": <AuditDashboard />,
    "Audit Search": <AuditSearch />,
    "Compliance": <ComplianceDashboard />,
    "Rules & Violations": <ViolationsPanel />,
    "Legal Holds": <LegalHoldsPanel />,
    "Retention": <RetentionPanel />,
    "Evidence": <EvidencePanel />,
    "Reports": <ReportsPanel />,
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ background: "#1B4F8A", color: "#fff", padding: "16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Audit & Compliance</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
              ADR-0028 — Immutable audit sink, hash-chained, tamper-evident
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Chip label="Chain: Verified" color="#16A34A" />
            <Chip label="279 Events (1h)" color="#00B4D8" />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #E2E8F0", background: "#fff", padding: "0 24px", overflowX: "auto" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 16px", border: "none", borderBottom: activeTab === tab ? "2px solid #1B4F8A" : "2px solid transparent",
              background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? "#1B4F8A" : "#64748B", whiteSpace: "nowrap",
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
