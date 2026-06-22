"use client";

/**
 * CyberCom Multi-Tenant Admin Portal
 * Program 2.2 — Tenant Framework
 * Tabs: Dashboard | Provisioning | Configuration | Branding | Licensing | Features | Compliance | Domains | Audit
 * EN/AR bilingual · RTL/LTR · Dark/Light theme
 */

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TenantStatus = "provisioning" | "pending" | "active" | "suspended" | "archived" | "terminated" | "decommissioned";
type TenantType = "saas" | "dedicated" | "dedicated_cluster" | "government" | "healthcare_sovereign" | "on_premise";
type TenantTier = "shared" | "schema" | "database" | "cluster";
type ComplianceFramework = "hipaa" | "gdpr" | "pdpl" | "uae_dp" | "jordan_dp" | "iso27001" | "soc2" | "pci_dss";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  tenant_type: TenantType;
  tier: TenantTier;
  status: TenantStatus;
  country_code: string;
  locale: string;
  home_region: string;
  keycloak_realm_name: string;
  activated_at: string | null;
  created_at: string;
}

interface TenantSubscription {
  id: string;
  plan: string;
  is_active: boolean;
  started_at: string;
  ends_at: string | null;
  monthly_price_usd: string;
}

interface TenantLicense {
  id: string;
  module: string;
  license_type: string;
  edition: string;
  max_seats: number | null;
  valid_until: string | null;
  is_active: boolean;
  is_valid: boolean;
}

interface TenantFeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string;
  expires_at: string | null;
}

interface TenantDomain {
  id: string;
  domain: string;
  is_primary: boolean;
  is_verified: boolean;
  ssl_enabled: boolean;
  verified_at: string | null;
}

interface TenantComplianceProfile {
  id: string;
  framework: ComplianceFramework;
  is_active: boolean;
  is_current: boolean;
  certified_at: string | null;
  expires_at: string | null;
  certification_body: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_TENANTS: Tenant[] = [
  {
    id: "t1", name: "King Faisal Specialist Hospital", slug: "kfsh",
    display_name: "KFSH & RC", tenant_type: "healthcare_sovereign", tier: "cluster",
    status: "active", country_code: "SA", locale: "ar", home_region: "me-central-1",
    keycloak_realm_name: "customer-kfsh", activated_at: "2026-01-15T09:00:00Z",
    created_at: "2025-12-01T00:00:00Z",
  },
  {
    id: "t2", name: "Dubai Health Authority", slug: "dha",
    display_name: "DHA", tenant_type: "government", tier: "cluster",
    status: "active", country_code: "AE", locale: "ar", home_region: "me-west-1",
    keycloak_realm_name: "customer-dha", activated_at: "2026-02-01T09:00:00Z",
    created_at: "2025-12-15T00:00:00Z",
  },
  {
    id: "t3", name: "ACME Corp", slug: "acme",
    display_name: "ACME Corporation", tenant_type: "saas", tier: "shared",
    status: "active", country_code: "US", locale: "en", home_region: "us-east-1",
    keycloak_realm_name: "customer-acme", activated_at: "2026-03-01T09:00:00Z",
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "t4", name: "Ministry of Health Jordan", slug: "moh-jo",
    display_name: "Jordan MOH", tenant_type: "government", tier: "cluster",
    status: "provisioning", country_code: "JO", locale: "ar", home_region: "me-central-1",
    keycloak_realm_name: "", activated_at: null,
    created_at: "2026-06-01T00:00:00Z",
  },
];

const MOCK_SUBSCRIPTIONS: TenantSubscription[] = [
  { id: "s1", plan: "enterprise", is_active: true, started_at: "2026-01-15T00:00:00Z", ends_at: "2027-01-15T00:00:00Z", monthly_price_usd: "4999.00" },
  { id: "s2", plan: "government", is_active: true, started_at: "2026-02-01T00:00:00Z", ends_at: "2027-02-01T00:00:00Z", monthly_price_usd: "7500.00" },
];

const MOCK_LICENSES: TenantLicense[] = [
  { id: "l1", module: "cymed", license_type: "subscription", edition: "enterprise", max_seats: 5000, valid_until: "2027-01-15T00:00:00Z", is_active: true, is_valid: true },
  { id: "l2", module: "cyforms", license_type: "subscription", edition: "professional", max_seats: null, valid_until: "2027-01-15T00:00:00Z", is_active: true, is_valid: true },
  { id: "l3", module: "cyanalytics", license_type: "trial", edition: "starter", max_seats: 10, valid_until: "2026-07-15T00:00:00Z", is_active: true, is_valid: true },
];

const MOCK_FLAGS: TenantFeatureFlag[] = [
  { id: "f1", key: "cyidentity.enabled", enabled: true, description: "CyIdentity SSO", expires_at: null },
  { id: "f2", key: "audit.enabled", enabled: true, description: "Audit logging", expires_at: null },
  { id: "f3", key: "beta.ai_assist", enabled: false, description: "AI-powered clinical assist (beta)", expires_at: null },
  { id: "f4", key: "notifications.enabled", enabled: true, description: "Push notifications", expires_at: null },
  { id: "f5", key: "api.rate_limiting.enabled", enabled: true, description: "API rate limiting", expires_at: null },
];

const MOCK_DOMAINS: TenantDomain[] = [
  { id: "d1", domain: "kfsh.cybercom.io", is_primary: true, is_verified: true, ssl_enabled: true, verified_at: "2026-01-16T00:00:00Z" },
  { id: "d2", domain: "portal.kfsh.med.sa", is_primary: false, is_verified: true, ssl_enabled: true, verified_at: "2026-02-01T00:00:00Z" },
  { id: "d3", domain: "staff.kfsh.med.sa", is_primary: false, is_verified: false, ssl_enabled: false, verified_at: null },
];

const MOCK_COMPLIANCE: TenantComplianceProfile[] = [
  { id: "c1", framework: "hipaa", is_active: true, is_current: true, certified_at: "2026-01-01T00:00:00Z", expires_at: "2027-01-01T00:00:00Z", certification_body: "HITRUST" },
  { id: "c2", framework: "gdpr", is_active: true, is_current: true, certified_at: "2026-01-01T00:00:00Z", expires_at: "2027-01-01T00:00:00Z", certification_body: "BSI" },
  { id: "c3", framework: "iso27001", is_active: true, is_current: true, certified_at: "2025-06-01T00:00:00Z", expires_at: "2026-06-01T00:00:00Z", certification_body: "Bureau Veritas" },
];

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const T = {
  en: {
    title: "Tenant Management",
    tabs: ["Dashboard", "Provisioning", "Configuration", "Branding", "Licensing", "Features", "Compliance", "Domains", "Audit"],
    search: "Search tenants…",
    provision: "Provision Tenant",
    activate: "Activate",
    suspend: "Suspend",
    archive: "Archive",
    terminate: "Terminate",
    status: "Status",
    type: "Type",
    tier: "Tier",
    region: "Region",
    realm: "Realm",
    created: "Created",
    plan: "Plan",
    module: "Module",
    seats: "Seats",
    expires: "Expires",
    valid: "Valid",
    feature: "Feature",
    enabled: "Enabled",
    domain: "Domain",
    primary: "Primary",
    verified: "Verified",
    ssl: "SSL",
    framework: "Framework",
    certBody: "Certification Body",
    certExpires: "Cert Expires",
    current: "Current",
    tenants: "Tenants",
    active: "Active",
    provisioning: "Provisioning",
    suspended: "Suspended",
    name: "Name",
    slug: "Slug",
    country: "Country",
    locale: "Locale",
    noRealm: "Not assigned",
  },
  ar: {
    title: "إدارة المستأجرين",
    tabs: ["لوحة البيانات", "التوفير", "الإعداد", "العلامة التجارية", "التراخيص", "الميزات", "الامتثال", "النطاقات", "التدقيق"],
    search: "ابحث عن المستأجرين…",
    provision: "توفير مستأجر",
    activate: "تفعيل",
    suspend: "تعليق",
    archive: "أرشفة",
    terminate: "إنهاء",
    status: "الحالة",
    type: "النوع",
    tier: "المستوى",
    region: "المنطقة",
    realm: "المملكة",
    created: "تاريخ الإنشاء",
    plan: "الخطة",
    module: "الوحدة",
    seats: "المقاعد",
    expires: "تنتهي في",
    valid: "صالح",
    feature: "الميزة",
    enabled: "مفعّل",
    domain: "النطاق",
    primary: "رئيسي",
    verified: "موثّق",
    ssl: "SSL",
    framework: "الإطار",
    certBody: "جهة الاعتماد",
    certExpires: "انتهاء الشهادة",
    current: "حالي",
    tenants: "المستأجرون",
    active: "نشط",
    provisioning: "قيد التوفير",
    suspended: "معلّق",
    name: "الاسم",
    slug: "المعرّف",
    country: "الدولة",
    locale: "اللغة",
    noRealm: "غير مخصص",
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusColor: Record<TenantStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  provisioning: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  suspended: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  archived: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  terminated: "bg-red-500/20 text-red-300 border border-red-500/30",
  decommissioned: "bg-red-900/30 text-red-400 border border-red-800/30",
};

const tierColor: Record<TenantTier, string> = {
  shared: "text-slate-400",
  schema: "text-blue-400",
  database: "text-purple-400",
  cluster: "text-amber-400",
};

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : "—";
const fmtFramework = (f: ComplianceFramework) =>
  ({ hipaa: "HIPAA", gdpr: "GDPR", pdpl: "PDPL", uae_dp: "UAE DP", jordan_dp: "Jordan DP", iso27001: "ISO 27001", soc2: "SOC 2", pci_dss: "PCI DSS" }[f] ?? f.toUpperCase());

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TenantAdminPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant>(MOCK_TENANTS[0]);
  const [flags, setFlags] = useState(MOCK_FLAGS);
  const [notification, setNotification] = useState<string | null>(null);

  const t = T[lang];
  const isRTL = lang === "ar";
  const isDark = theme === "dark";

  const bg = isDark ? "bg-slate-900 text-slate-100" : "bg-gray-50 text-gray-900";
  const cardBg = isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200";
  const inputBg = isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900";
  const tableHdr = isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600";

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filtered = MOCK_TENANTS.filter(t2 =>
    t2.name.toLowerCase().includes(search.toLowerCase()) ||
    t2.slug.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: MOCK_TENANTS.length,
    active: MOCK_TENANTS.filter(t2 => t2.status === "active").length,
    provisioning: MOCK_TENANTS.filter(t2 => t2.status === "provisioning").length,
    suspended: MOCK_TENANTS.filter(t2 => t2.status === "suspended").length,
  };

  // ---------- Tab renders ----------

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.tenants, value: stats.total, color: "text-blue-400" },
          { label: t.active, value: stats.active, color: "text-emerald-400" },
          { label: t.provisioning, value: stats.provisioning, color: "text-blue-400" },
          { label: t.suspended, value: stats.suspended, color: "text-orange-400" },
        ].map(s => (
          <div key={s.label} className={`${cardBg} border rounded-xl p-4`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tenant list */}
      <div className={`${cardBg} border rounded-xl overflow-hidden`}>
        <div className="p-4 flex items-center gap-3">
          <input
            className={`${inputBg} border rounded-lg px-3 py-2 text-sm flex-1`}
            placeholder={t.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
            onClick={() => notify("Provision flow — connect to /api/v1/tenants/bootstrap/")}
          >
            + {t.provision}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={tableHdr}>
                {[t.name, t.type, t.tier, t.status, t.region, t.realm, t.created].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${isRTL ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tenant => (
                <tr
                  key={tenant.id}
                  className={`border-t ${isDark ? "border-slate-700 hover:bg-slate-700/50" : "border-gray-100 hover:bg-gray-50"} cursor-pointer transition-colors`}
                  onClick={() => { setSelectedTenant(tenant); setTab(2); }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{tenant.display_name || tenant.name}</div>
                    <div className="text-xs text-slate-500">{tenant.slug}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-400">{tenant.tenant_type.replace("_", " ")}</td>
                  <td className={`px-4 py-3 capitalize font-medium ${tierColor[tenant.tier]}`}>{tenant.tier}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[tenant.status]}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{tenant.home_region}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {tenant.keycloak_realm_name || <span className="text-slate-600">{t.noRealm}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(tenant.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProvisioning = () => (
    <div className={`${cardBg} border rounded-xl p-6 max-w-2xl`}>
      <h2 className="text-lg font-semibold mb-6">{t.provision}</h2>
      <div className="space-y-4">
        {[
          { label: t.name, field: "name", placeholder: "King Faisal Specialist Hospital" },
          { label: t.slug, field: "slug", placeholder: "kfsh" },
          { label: "Display Name", field: "display_name", placeholder: "KFSH & RC" },
          { label: "Contact Email", field: "contact_email", placeholder: "admin@hospital.sa" },
        ].map(f => (
          <div key={f.field}>
            <label className="block text-sm font-medium text-slate-400 mb-1">{f.label}</label>
            <input className={`${inputBg} border rounded-lg px-3 py-2 text-sm w-full`} placeholder={f.placeholder} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Tenant Type</label>
            <select className={`${inputBg} border rounded-lg px-3 py-2 text-sm w-full`}>
              <option value="saas">SaaS</option>
              <option value="dedicated">Dedicated DB</option>
              <option value="dedicated_cluster">Dedicated Cluster</option>
              <option value="government">Government</option>
              <option value="healthcare_sovereign">Healthcare Sovereign</option>
              <option value="on_premise">On-Premise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Isolation Tier (ADR-0002)</label>
            <select className={`${inputBg} border rounded-lg px-3 py-2 text-sm w-full`}>
              <option value="shared">Shared + RLS</option>
              <option value="schema">Schema-per-Tenant</option>
              <option value="database">Database-per-Tenant</option>
              <option value="cluster">Cluster (Sovereign)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Country</label>
            <select className={`${inputBg} border rounded-lg px-3 py-2 text-sm w-full`}>
              {[["SA", "Saudi Arabia"], ["AE", "UAE"], ["JO", "Jordan"], ["QA", "Qatar"], ["KW", "Kuwait"]].map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Plan</label>
            <select className={`${inputBg} border rounded-lg px-3 py-2 text-sm w-full`}>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
              <option value="government">Government</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Compliance Frameworks</label>
          <div className="flex flex-wrap gap-2">
            {(["hipaa", "gdpr", "pdpl", "uae_dp", "jordan_dp", "iso27001"] as ComplianceFramework[]).map(fw => (
              <label key={fw} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>{fmtFramework(fw)}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium"
          onClick={() => notify("POST /api/v1/tenants/bootstrap/ — provisioning tenant…")}
        >
          {t.provision}
        </button>
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-4 max-w-3xl">
      <div className={`${cardBg} border rounded-xl p-5`}>
        <h3 className="font-semibold mb-4">Selected: {selectedTenant.display_name}</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {[
            ["Max Users", "100"], ["Max API Calls/Day", "10,000"], ["Max Storage (GB)", "50"],
            ["MFA Required", "Yes"], ["Session Timeout", "900s"], ["Idle Timeout", "1800s"],
            ["Data Residency", "me-central-1 (SA)"], ["BYOK", "Disabled"], ["Guest Access", "Disabled"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-700/40 pb-2">
              <span className="text-slate-400">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
            onClick={() => notify("PATCH /api/v1/tenants/configurations/{id}/")}>Save Changes</button>
        </div>
      </div>
      <div className={`${cardBg} border rounded-xl p-5`}>
        <h3 className="font-semibold mb-3">Lifecycle Actions</h3>
        <div className="flex gap-3 flex-wrap">
          {selectedTenant.status !== "active" && (
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm"
              onClick={() => notify(`POST /api/v1/tenants/${selectedTenant.id}/activate/`)}>{t.activate}</button>
          )}
          {selectedTenant.status === "active" && (
            <button className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
              onClick={() => notify(`POST /api/v1/tenants/${selectedTenant.id}/suspend/`)}>{t.suspend}</button>
          )}
          <button className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm"
            onClick={() => notify(`POST /api/v1/tenants/${selectedTenant.id}/archive/`)}>{t.archive}</button>
          <button className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            onClick={() => notify(`POST /api/v1/tenants/${selectedTenant.id}/terminate/`)}>{t.terminate}</button>
        </div>
      </div>
    </div>
  );

  const renderBranding = () => (
    <div className={`${cardBg} border rounded-xl p-6 max-w-2xl`}>
      <h2 className="text-lg font-semibold mb-5">Branding — {selectedTenant.display_name}</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Primary Color", val: "#1B4F8A" },
            { label: "Secondary Color", val: "#00B4D8" },
            { label: "Accent Color", val: "#90E0EF" },
            { label: "Background", val: "#FFFFFF" },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md border border-slate-600" style={{ backgroundColor: c.val }} />
              <div>
                <div className="text-sm font-medium">{c.label}</div>
                <div className="text-xs font-mono text-slate-400">{c.val}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "App Name", placeholder: "KFSH Portal" },
            { label: "Tagline", placeholder: "Excellence in Healthcare" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-slate-400 mb-1">{f.label}</label>
              <input className={`${inputBg} border rounded-lg px-3 py-2 text-sm w-full`} placeholder={f.placeholder} />
            </div>
          ))}
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="rounded" />
            RTL Default
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" />
            Dark Theme Default
          </label>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
          onClick={() => notify("PATCH /api/v1/tenants/brandings/{id}/")}>Save Branding</button>
      </div>
    </div>
  );

  const renderLicensing = () => (
    <div className="space-y-4">
      <div className={`${cardBg} border rounded-xl overflow-hidden`}>
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold">Licenses — {selectedTenant.display_name}</h3>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-sm rounded-lg"
            onClick={() => notify("POST /api/v1/tenants/licenses/")}>+ Grant License</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHdr}>
              {[t.module, "Type", "Edition", t.seats, t.expires, t.valid].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${isRTL ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_LICENSES.map(lic => (
              <tr key={lic.id} className={`border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
                <td className="px-4 py-3 font-mono font-medium">{lic.module}</td>
                <td className="px-4 py-3 capitalize">{lic.license_type}</td>
                <td className="px-4 py-3 text-slate-400">{lic.edition}</td>
                <td className="px-4 py-3">{lic.max_seats ?? "Unlimited"}</td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(lic.valid_until)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lic.is_valid ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                    {lic.is_valid ? "Valid" : "Expired"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`${cardBg} border rounded-xl p-4`}>
        <h3 className="font-semibold mb-3">Subscriptions</h3>
        {MOCK_SUBSCRIPTIONS.map(sub => (
          <div key={sub.id} className="flex items-center justify-between py-2">
            <div>
              <span className="capitalize font-medium">{sub.plan}</span>
              <span className="text-slate-400 text-sm ml-2">starts {fmtDate(sub.started_at)}</span>
            </div>
            <div className="text-right">
              <div className="font-medium">${sub.monthly_price_usd}/mo</div>
              <div className="text-xs text-slate-400">ends {fmtDate(sub.ends_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className={`${cardBg} border rounded-xl overflow-hidden max-w-2xl`}>
      <div className="p-4 flex justify-between items-center">
        <h3 className="font-semibold">Feature Flags — {selectedTenant.display_name}</h3>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-sm rounded-lg"
          onClick={() => notify("POST /api/v1/tenants/feature-flags/toggle/")}>+ New Flag</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHdr}>
            {[t.feature, "Description", t.expires, t.enabled].map(h => (
              <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${isRTL ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flags.map(flag => (
            <tr key={flag.id} className={`border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
              <td className="px-4 py-3 font-mono text-xs">{flag.key}</td>
              <td className="px-4 py-3 text-slate-400">{flag.description}</td>
              <td className="px-4 py-3 text-slate-500">{fmtDate(flag.expires_at)}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
                    notify(`Flag '${flag.key}' ${flag.enabled ? "disabled" : "enabled"}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${flag.enabled ? "bg-emerald-600" : "bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${flag.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-4 max-w-3xl">
      <div className={`${cardBg} border rounded-xl overflow-hidden`}>
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold">Compliance Profiles — {selectedTenant.display_name}</h3>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-sm rounded-lg"
            onClick={() => notify("POST /api/v1/tenants/compliance/")}>+ Add Framework</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHdr}>
              {[t.framework, t.certBody, "Certified", t.certExpires, t.current].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${isRTL ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_COMPLIANCE.map(cp => (
              <tr key={cp.id} className={`border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
                <td className="px-4 py-3 font-bold">{fmtFramework(cp.framework)}</td>
                <td className="px-4 py-3 text-slate-400">{cp.certification_body}</td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(cp.certified_at)}</td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(cp.expires_at)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cp.is_current ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                    {cp.is_current ? "Current" : "Expired"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`${cardBg} border rounded-xl p-4`}>
        <h3 className="font-semibold mb-3">Data Residency Requirements</h3>
        <div className="space-y-2 text-sm">
          {[
            ["PHI / ePHI", "me-central-1 (SA) only", "HIPAA"],
            ["Personal Data (EU)", "me-west-1 (AE) or EU region", "GDPR"],
            ["Personal Data (SA)", "me-central-1 (SA) only", "PDPL"],
          ].map(([category, region, basis]) => (
            <div key={category} className="flex justify-between items-center py-2 border-b border-slate-700/30">
              <span className="font-medium">{category}</span>
              <span className="text-slate-400">{region}</span>
              <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">{basis}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDomains = () => (
    <div className={`${cardBg} border rounded-xl overflow-hidden max-w-2xl`}>
      <div className="p-4 flex justify-between items-center">
        <h3 className="font-semibold">Domains — {selectedTenant.display_name}</h3>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-sm rounded-lg"
          onClick={() => notify("POST /api/v1/tenants/domains/")}>+ Add Domain</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHdr}>
            {[t.domain, t.primary, t.verified, t.ssl, "Verified At", "Actions"].map(h => (
              <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${isRTL ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_DOMAINS.map(d => (
            <tr key={d.id} className={`border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
              <td className="px-4 py-3 font-mono">{d.domain}</td>
              <td className="px-4 py-3">{d.is_primary ? <span className="text-blue-400 font-medium">✓ Primary</span> : "—"}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs ${d.is_verified ? "bg-emerald-500/20 text-emerald-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                  {d.is_verified ? "Verified" : "Pending"}
                </span>
              </td>
              <td className="px-4 py-3">{d.ssl_enabled ? <span className="text-emerald-400">✓</span> : <span className="text-slate-600">—</span>}</td>
              <td className="px-4 py-3 text-slate-400">{fmtDate(d.verified_at)}</td>
              <td className="px-4 py-3">
                {!d.is_verified && (
                  <button className="text-xs text-blue-400 hover:text-blue-300"
                    onClick={() => notify(`POST /api/v1/tenants/domains/${d.id}/verify/`)}>Verify</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">Add CNAME record: <span className="font-mono text-slate-300">tenants.cybercom.io</span> to verify ownership.</div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className={`${cardBg} border rounded-xl overflow-hidden`}>
      <div className="p-4">
        <h3 className="font-semibold mb-1">Tenant Audit Log</h3>
        <p className="text-sm text-slate-400">Platform-wide audit trail for tenant lifecycle and configuration changes.</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHdr}>
            {["Timestamp", "Tenant", "Action", "Resource", "Actor", "Details"].map(h => (
              <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${isRTL ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { ts: "2026-06-22 09:41", tenant: "kfsh", action: "tenant.activated", resource: "Tenant", actor: "admin@cybercom.io", detail: "Status: provisioning → active" },
            { ts: "2026-06-22 09:38", tenant: "kfsh", action: "tenant.realm.created", resource: "Realm", actor: "system", detail: "Realm: customer-kfsh" },
            { ts: "2026-06-22 09:35", tenant: "kfsh", action: "tenant.provisioned", resource: "Tenant", actor: "admin@cybercom.io", detail: "Tier: cluster" },
            { ts: "2026-06-21 14:22", tenant: "dha", action: "tenant.feature.enabled", resource: "FeatureFlag", actor: "ops@cybercom.io", detail: "Key: beta.ai_assist" },
            { ts: "2026-06-21 11:15", tenant: "acme", action: "tenant.license.updated", resource: "License", actor: "admin@cybercom.io", detail: "Module: cyanalytics" },
          ].map((row, i) => (
            <tr key={i} className={`border-t ${isDark ? "border-slate-700" : "border-gray-100"} text-xs`}>
              <td className="px-4 py-3 font-mono text-slate-400">{row.ts}</td>
              <td className="px-4 py-3 font-mono">{row.tenant}</td>
              <td className="px-4 py-3"><span className="font-mono text-blue-400">{row.action}</span></td>
              <td className="px-4 py-3 text-slate-400">{row.resource}</td>
              <td className="px-4 py-3 text-slate-400">{row.actor}</td>
              <td className="px-4 py-3 text-slate-400">{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const tabRenderers = [
    renderDashboard, renderProvisioning, renderConfiguration,
    renderBranding, renderLicensing, renderFeatures,
    renderCompliance, renderDomains, renderAudit,
  ];

  return (
    <div className={`min-h-screen ${bg} font-sans`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
            <div>
              <h1 className="font-semibold text-lg">{t.title}</h1>
              <p className="text-xs text-slate-400">ADR-0002 · Multi-Tenant Framework</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === "en" ? "ar" : "en")}
              className={`px-3 py-1.5 rounded-lg text-sm border ${isDark ? "border-slate-600 hover:bg-slate-700" : "border-gray-300 hover:bg-gray-100"}`}>
              {lang === "en" ? "AR" : "EN"}
            </button>
            <button onClick={() => setTheme(t2 => t2 === "dark" ? "light" : "dark")}
              className={`px-3 py-1.5 rounded-lg text-sm border ${isDark ? "border-slate-600 hover:bg-slate-700" : "border-gray-300 hover:bg-gray-100"}`}>
              {isDark ? "☀" : "◑"}
            </button>
          </div>
        </div>
        {/* Tenant selector */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {MOCK_TENANTS.map(t2 => (
            <button
              key={t2.id}
              onClick={() => setSelectedTenant(t2)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTenant.id === t2.id
                  ? "bg-blue-600 text-white"
                  : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {t2.slug}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"} border-b px-6`}>
        <div className="flex gap-0 overflow-x-auto">
          {t.tabs.map((label, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === i
                  ? "border-blue-500 text-blue-400"
                  : `border-transparent ${isDark ? "text-slate-400 hover:text-slate-200" : "text-gray-500 hover:text-gray-900"}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {notification}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {tabRenderers[tab]?.()}
      </div>
    </div>
  );
}
