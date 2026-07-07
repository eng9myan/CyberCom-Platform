"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";
import Head from "next/head";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

// --- Types & Interfaces ---
interface Realm {
  id: string;
  name: string;
  type: string;
  status: "pending" | "active" | "suspended" | "decommissioned";
  region: string;
  locale: string;
  mfaEnforced: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  enabled: boolean;
  lockedUntil: string | null;
  failedLoginCount: number;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  clientRole: boolean;
  description: string;
}

interface Group {
  id: string;
  name: string;
  path: string;
  description: string;
}

interface Client {
  id: string;
  clientId: string;
  name: string;
  protocol: string;
  publicClient: boolean;
  mfaRequired: boolean;
  secretHint?: string;
}

interface UserSession {
  id: string;
  username: string;
  ipAddress: string;
  status: "active" | "revoked" | "idle_timeout";
  startedAt: string;
  lastActivityAt: string;
}

interface BreakGlass {
  id: string;
  username: string;
  reason: string;
  justification: string;
  targetResource: string;
  targetAction: string;
  status: "requested" | "approved" | "active" | "expired" | "revoked";
  approvedBy?: string;
  secondApprover?: string;
  expiresAt?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  outcome: string;
  usernameAttempted: string;
  ipAddress: string;
  details: string;
}

export default function IdentityAdminPortal() {
  const { session: authSession } = useAuth();

  // --- Internationalization (EN / AR) ---
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "CyIdentity Administration Console",
      subtitle: "Workforce, Citizen & Partner Identity Control Plane",
      toggleLang: "العربية",
      toggleTheme: theme === "dark" ? "🌙 Dark" : "☀️ Light",
      navRealms: "Realms",
      navUsers: "Users",
      navRoles: "Roles & Perms",
      navGroups: "Groups",
      navClients: "Clients",
      navSessions: "Sessions",
      navBreakGlass: "Break Glass",
      navAudit: "Audit Logs",
      statusActive: "Active",
      statusPending: "Pending",
      statusSuspended: "Suspended",
      statusDecommissioned: "Decommissioned",
      actions: "Actions",
      save: "Save",
      cancel: "Cancel",
      search: "Search...",
      // Realms
      realmName: "Realm Name",
      realmType: "Realm Type",
      region: "Region",
      mfa: "MFA Enforced",
      provisionRealm: "Provision New Realm",
      // Users
      username: "Username",
      email: "Email",
      status: "Status",
      lock: "Lock",
      unlock: "Unlock",
      provisionUser: "Provision User",
      // Roles
      roleName: "Role Name",
      roleType: "Scope",
      description: "Description",
      // Groups
      groupName: "Group Name",
      path: "Path",
      // Clients
      clientId: "Client ID",
      protocol: "Protocol",
      rotateSecret: "Rotate Secret",
      secretHint: "Secret Hint",
      // Sessions
      ipAddress: "IP Address",
      startedAt: "Started At",
      revoke: "Revoke",
      enforceIdle: "Enforce Idle Timeout",
      // Break Glass
      reason: "Reason",
      justification: "Justification",
      target: "Target Resource/Action",
      approve: "Approve (Dual Signature)",
      activate: "Activate",
      duration: "Duration (seconds)",
      approver1: "First Approver",
      approver2: "Second Approver",
      // Audit
      timestamp: "Timestamp",
      outcome: "Outcome",
      details: "Details",
    },
    ar: {
      title: "لوحة تحكم إدارة الهوية (CyIdentity)",
      subtitle: "نظام التحكم في هويات الموظفين والمواطنين والشركاء",
      toggleLang: "English",
      toggleTheme: theme === "dark" ? "🌙 داكن" : "☀️ مضيء",
      navRealms: "المجالات (Realms)",
      navUsers: "المستخدمين",
      navRoles: "الأدوار والصلاحيات",
      navGroups: "المجموعات",
      navClients: "العملاء (Clients)",
      navSessions: "الجلسات النشطة",
      navBreakGlass: "الوصول الطارئ",
      navAudit: "سجلات التدقيق",
      statusActive: "نشط",
      statusPending: "معلق",
      statusSuspended: "موقوف",
      statusDecommissioned: "خارج الخدمة",
      actions: "الإجراءات",
      save: "حفظ",
      cancel: "إلغاء",
      search: "بحث...",
      // Realms
      realmName: "اسم المجال",
      realmType: "نوع المجال",
      region: "المنطقة الجغرافية",
      mfa: "المصادقة الثنائية إجبارية",
      provisionRealm: "إنشاء مجال جديد",
      // Users
      username: "اسم المستخدم",
      email: "البريد الإلكتروني",
      status: "الحالة",
      lock: "قفل الحساب",
      unlock: "إلغاء القفل",
      provisionUser: "إنشاء مستخدم",
      // Roles
      roleName: "اسم الدور",
      roleType: "نطاق الدور",
      description: "الوصف",
      // Groups
      groupName: "اسم المجموعة",
      path: "المسار",
      // Clients
      clientId: "معرف العميل",
      protocol: "البروتوكول",
      rotateSecret: "تدوير السر",
      secretHint: "ملمح السر",
      // Sessions
      ipAddress: "عنوان IP",
      startedAt: "بدأت في",
      revoke: "إنهاء الجلسة",
      enforceIdle: "فرض مهلة الخمول",
      // Break Glass
      reason: "السبب",
      justification: "المبرر",
      target: "المورد/الإجراء المستهدف",
      approve: "موافقة (توقيع ثنائي)",
      activate: "تفعيل",
      duration: "المدة (بالثواني)",
      approver1: "المعتمد الأول",
      approver2: "المعتمد الثاني",
      // Audit
      timestamp: "الطابع الزمني",
      outcome: "النتيجة",
      details: "التفاصيل",
    },
  }[lang];

  // --- Theme Toggle ---
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // --- Active Tab State ---
  const [activeTab, setActiveTab] = useState<
    "realms" | "users" | "roles" | "groups" | "clients" | "sessions" | "breakGlass" | "audit"
  >("realms");

  // --- Notifications State ---
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const notify = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- Mock Data & Action Handlers ---
  const [realms, setRealms] = useState<Realm[]>([
    { id: "1", name: "cybercom-workforce", type: "workforce", status: "active", region: "me-central-1", locale: "en", mfaEnforced: true },
    { id: "2", name: "cybercom-citizen", type: "citizen", status: "active", region: "me-central-1", locale: "ar", mfaEnforced: true },
    { id: "3", name: "cybercom-partner-a", type: "partner", status: "pending", region: "me-central-1", locale: "en", mfaEnforced: false },
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: "1", username: "doc.ahmed", email: "ahmed@cybercom.med", displayName: "Dr. Ahmed Sallam", enabled: true, lockedUntil: null, failedLoginCount: 0 },
    { id: "2", username: "nurse.fatima", email: "fatima@cybercom.med", displayName: "Fatima Al-Harbi", enabled: true, lockedUntil: "2026-06-22T12:00:00Z", failedLoginCount: 5 },
    { id: "3", username: "erp.auditor", email: "auditor@cybercom.com", displayName: "ERP Auditor", enabled: false, lockedUntil: null, failedLoginCount: 0 },
  ]);

  const [roles] = useState<Role[]>([
    { id: "1", name: "platform_admin", displayName: "Platform Admin", clientRole: false, description: "Full superuser access across all components" },
    { id: "2", name: "clinical_director", displayName: "Clinical Director", clientRole: true, description: "Manage clinical paths and emergency protocols" },
    { id: "3", name: "financial_officer", displayName: "Chief Financial Officer", clientRole: true, description: "Approve large ledger transactions" },
  ]);

  const [groups] = useState<Group[]>([
    { id: "1", name: "Clinical Staff", path: "/medical/clinicians", description: "All active physicians and healthcare providers" },
    { id: "2", name: "Financial Auditors", path: "/erp/finance/auditors", description: "Internal compliance auditing team" },
  ]);

  const [clients, setClients] = useState<Client[]>([
    { id: "1", clientId: "cymed-web", name: "CyMed Portal", protocol: "oidc", publicClient: true, mfaRequired: true },
    { id: "2", clientId: "cycom-erp", name: "CyCom ERP Service", protocol: "oauth2", publicClient: false, mfaRequired: true, secretHint: "A7f9" },
  ]);

  const [sessions, setSessions] = useState<UserSession[]>([
    { id: "s1", username: "doc.ahmed", ipAddress: "192.168.1.14", status: "active", startedAt: "2026-06-21T18:00:00Z", lastActivityAt: "2026-06-21T21:40:00Z" },
    { id: "s2", username: "nurse.fatima", ipAddress: "10.200.4.52", status: "active", startedAt: "2026-06-21T19:30:00Z", lastActivityAt: "2026-06-21T19:35:00Z" },
  ]);

  const [breakGlasses, setBreakGlasses] = useState<BreakGlass[]>([
    { id: "bg1", username: "doc.ahmed", reason: "clinical", justification: "Mass casualty disaster in North ER wing", targetResource: "patient_records", targetAction: "override-consent", status: "requested" },
  ]);

  const [auditLogs] = useState<AuditLog[]>([
    { id: "a1", timestamp: "2026-06-21T21:40:02Z", outcome: "success", usernameAttempted: "doc.ahmed", ipAddress: "192.168.1.14", details: "Successful MFA login via WebAuthn/Passkey" },
    { id: "a2", timestamp: "2026-06-21T21:38:15Z", outcome: "failure", usernameAttempted: "nurse.fatima", ipAddress: "10.200.4.52", details: "Failed password validation (5th attempt), account locked" },
  ]);

  // --- Dynamic Forms State ---
  const [newRealm, setNewRealm] = useState({ name: "", type: "customer", region: "me-central-1", mfaEnforced: true });
  const [newUser, setNewUser] = useState({ username: "", email: "", displayName: "" });
  const [dualApproval, setDualApproval] = useState({ approver: "", secondApprover: "" });
  const [glassDuration] = useState(3600);
  const [selectedBgId, setSelectedBgId] = useState<string | null>(null);

  // --- Actions ---
  const handleProvisionRealm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRealm.name) return notify("Realm name is required", "error");
    const created: Realm = {
      id: String(realms.length + 1),
      name: newRealm.name.toLowerCase().replace(/\s+/g, "-"),
      type: newRealm.type,
      status: "pending",
      region: newRealm.region,
      locale: lang === "ar" ? "ar" : "en",
      mfaEnforced: newRealm.mfaEnforced,
    };
    setRealms([...realms, created]);
    setNewRealm({ name: "", type: "customer", region: "me-central-1", mfaEnforced: true });
    notify(`Realm ${created.name} provisioned in PENDING status.`);
  };

  const handleActivateRealm = (id: string) => {
    setRealms(realms.map(r => r.id === id ? { ...r, status: "active" as const } : r));
    notify("Realm activated successfully.");
  };

  const handleSuspendRealm = (id: string) => {
    setRealms(realms.map(r => r.id === id ? { ...r, status: "suspended" as const } : r));
    notify("Realm suspended.");
  };

  const handleDecommissionRealm = (id: string) => {
    setRealms(realms.map(r => r.id === id ? { ...r, status: "decommissioned" as const } : r));
    notify("Realm decommissioned.");
  };

  const handleProvisionUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email) return notify("Username and Email are required", "error");
    const created: User = {
      id: String(users.length + 1),
      username: newUser.username.toLowerCase(),
      email: newUser.email,
      displayName: newUser.displayName || newUser.username,
      enabled: true,
      lockedUntil: null,
      failedLoginCount: 0,
    };
    setUsers([...users, created]);
    setNewUser({ username: "", email: "", displayName: "" });
    notify(`User ${created.username} provisioned.`);
  };

  const handleToggleLockUser = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const isLocked = !!u.lockedUntil;
        return {
          ...u,
          lockedUntil: isLocked ? null : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          failedLoginCount: isLocked ? 0 : 5,
        };
      }
      return u;
    }));
    notify("User lock status updated.");
  };

  const handleRotateSecret = (id: string) => {
    const secretChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newSecret = "";
    for (let i = 0; i < 32; i++) {
      newSecret += secretChars.charAt(Math.floor(Math.random() * secretChars.length));
    }
    const hint = newSecret.slice(-4);
    setClients(clients.map(c => c.id === id ? { ...c, secretHint: hint } : c));
    notify(`Secret rotated! New Cleartext: fake-secret-${newSecret} (Copy now, only shown once).`);
  };

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, status: "revoked" as const } : s));
    notify("Session revoked.");
  };

  const handleEnforceIdleTimeout = async () => {
    if (!authSession) {
      notify("Sign in required to call the real enforcement endpoint.");
      return;
    }
    try {
      const result = await apiFetch<{ revoked_count: number }>(
        "/api/v1/identity/sessions/enforce-idle-timeout/",
        { method: "POST", token: authSession.accessToken, tenantId: authSession.tenantId }
      );
      // Reflects the real response -- SessionService.enforce_idle_timeout()
      // only revokes sessions actually past the 30-minute inactivity
      // threshold, not every active session, so the local demo list here
      // is refreshed to show that count, not force-marked wholesale.
      setSessions(sessions.map((s, i) => i < result.revoked_count ? { ...s, status: "idle_timeout" as const } : s));
      notify(`${result.revoked_count} idle session(s) revoked by the server.`);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      notify(detail || "Failed to reach the idle-timeout enforcement endpoint.");
    }
  };

  const handleApproveBreakGlass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBgId) return;
    if (!dualApproval.approver || !dualApproval.secondApprover) {
      return notify("Dual approval signature required.", "error");
    }
    setBreakGlasses(breakGlasses.map(bg => bg.id === selectedBgId ? {
      ...bg,
      status: "approved" as const,
      approvedBy: dualApproval.approver,
      secondApprover: dualApproval.secondApprover,
    } : bg));
    setDualApproval({ approver: "", secondApprover: "" });
    setSelectedBgId(null);
    notify("Break glass emergency request approved.");
  };

  const handleActivateBreakGlass = (id: string) => {
    const expiry = new Date(Date.now() + glassDuration * 1000).toISOString();
    setBreakGlasses(breakGlasses.map(bg => bg.id === id ? {
      ...bg,
      status: "active" as const,
      expiresAt: expiry,
    } : bg));
    notify(`Break-glass active until: ${new Date(expiry).toLocaleTimeString()}`);
  };

  return (
    <>
      <Head>
        <title>{t.title} | CyberCom</title>
        <meta name="description" content="CyberCom CyIdentity core administrative control plane dashboard." />
      </Head>

      <div className="dashboard-container" style={{ direction: isRtl ? "rtl" : "ltr" }}>
        {/* --- Header Section --- */}
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)" }}>{t.title}</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{t.subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="theme-toggle-btn"
              id="cyidentity-lang-toggle"
              style={{ padding: "var(--spacing-sm) var(--spacing-md)" }}
            >
              {t.toggleLang}
            </button>
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              id="cyidentity-theme-toggle"
              style={{ padding: "var(--spacing-sm) var(--spacing-md)" }}
            >
              {t.toggleTheme}
            </button>
          </div>
        </header>

        {/* --- Notification Banner --- */}
        {notification && (
          <div
            className="glass-card"
            style={{
              marginBottom: "var(--spacing-md)",
              borderLeft: notification.type === "error" ? "4px solid var(--color-error)" : "4px solid var(--color-success)",
              borderRight: isRtl && notification.type === "error" ? "4px solid var(--color-error)" : isRtl ? "4px solid var(--color-success)" : "none",
              padding: "var(--spacing-sm) var(--spacing-md)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{notification.message}</span>
            <button style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontWeight: "bold" }} onClick={() => setNotification(null)}>✕</button>
          </div>
        )}

        {/* --- Main Grid Layout --- */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "var(--spacing-lg)", marginTop: "var(--spacing-lg)" }}>
          
          {/* --- Navigation Side Panel --- */}
          <aside className="glass-card" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", height: "fit-content" }}>
            {[
              { id: "realms", label: t.navRealms },
              { id: "users", label: t.navUsers },
              { id: "roles", label: t.navRoles },
              { id: "groups", label: t.navGroups },
              { id: "clients", label: t.navClients },
              { id: "sessions", label: t.navSessions },
              { id: "breakGlass", label: t.navBreakGlass },
              { id: "audit", label: t.navAudit },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  width: "100%",
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  background: activeTab === tab.id ? "var(--color-primary)" : "none",
                  border: "1px solid rgb(var(--color-ink-rgb) / 0.1)",
                  color: "white",
                  borderRadius: "var(--radius-md)",
                  textAlign: isRtl ? "right" : "left",
                  cursor: "pointer",
                  fontWeight: activeTab === tab.id ? "bold" : "normal",
                  transition: "var(--transition-fast)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          {/* --- Details Console Panel --- */}
          <main className="glass-card" style={{ gridColumn: "span 9" }}>
            
            {/* 1. REALMS PANEL */}
            {activeTab === "realms" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)" }}>
                  <h2>{t.navRealms}</h2>
                  <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>{realms.length} Domains Configured</span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "var(--spacing-lg)" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.15)" }}>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.realmName}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.realmType}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.region}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.status}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realms.map(r => (
                        <tr key={r.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                          <td style={{ padding: "var(--spacing-sm)" }}>{r.name}</td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <span style={{ background: "rgb(var(--color-ink-rgb) / 0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem" }}>{r.type}</span>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>{r.region}</td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <span style={{
                              color: r.status === "active" ? "var(--color-success)" : r.status === "pending" ? "var(--color-warning)" : "var(--color-error)",
                              fontWeight: "bold",
                            }}>
                              {r.status === "active" ? t.statusActive : r.status === "pending" ? t.statusPending : r.status === "suspended" ? t.statusSuspended : t.statusDecommissioned}
                            </span>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)", display: "flex", gap: "5px" }}>
                            {r.status === "pending" && (
                              <button onClick={() => handleActivateRealm(r.id)} style={{ background: "var(--color-success)", color: "white", border: "none", padding: "2px 8px", borderRadius: "4px", cursor: "pointer" }}>{t.activate}</button>
                            )}
                            {r.status === "active" && (
                              <button onClick={() => handleSuspendRealm(r.id)} style={{ background: "var(--color-warning)", color: "white", border: "none", padding: "2px 8px", borderRadius: "4px", cursor: "pointer" }}>{t.lock}</button>
                            )}
                            {r.status !== "decommissioned" && (
                              <button onClick={() => handleDecommissionRealm(r.id)} style={{ background: "var(--color-error)", color: "white", border: "none", padding: "2px 8px", borderRadius: "4px", cursor: "pointer" }}>🗑</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={handleProvisionRealm} className="glass-card" style={{ marginTop: "var(--spacing-lg)", padding: "var(--spacing-md)" }}>
                  <h3 style={{ marginBottom: "var(--spacing-sm)" }}>{t.provisionRealm}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-sm)" }}>
                    <div className="form-group">
                      <label>{t.realmName}</label>
                      <input type="text" value={newRealm.name} onChange={e => setNewRealm({ ...newRealm, name: e.target.value })} placeholder="e.g. corp-workforce" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", borderRadius: "4px", padding: "6px", color: "white", width: "100%" }} />
                    </div>
                    <div className="form-group">
                      <label>{t.realmType}</label>
                      <select value={newRealm.type} onChange={e => setNewRealm({ ...newRealm, type: e.target.value })} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", borderRadius: "4px", padding: "6px", color: "white", width: "100%" }}>
                        <option value="workforce">Workforce</option>
                        <option value="customer">Customer (Multi-Tenant)</option>
                        <option value="citizen">Citizen</option>
                        <option value="partner">Partner B2B</option>
                        <option value="workload">Workload (M2M)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input type="checkbox" checked={newRealm.mfaEnforced} onChange={e => setNewRealm({ ...newRealm, mfaEnforced: e.target.checked })} />
                      {t.mfa}
                    </label>
                    <button type="submit" style={{ background: "var(--color-primary)", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>{t.save}</button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. USERS PANEL */}
            {activeTab === "users" && (
              <div>
                <h2>{t.navUsers}</h2>
                <div style={{ overflowX: "auto", marginTop: "var(--spacing-md)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "var(--spacing-lg)" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.15)" }}>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.username}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.email}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.status}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <div>{u.displayName}</div>
                            <small style={{ color: "var(--color-text-muted)" }}>@{u.username}</small>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>{u.email}</td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <span style={{
                              color: !u.enabled ? "var(--color-text-subtle)" : u.lockedUntil ? "var(--color-error)" : "var(--color-success)",
                              fontWeight: "bold",
                            }}>
                              {!u.enabled ? "Disabled" : u.lockedUntil ? "Locked" : "Active"}
                            </span>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <button
                              onClick={() => handleToggleLockUser(u.id)}
                              style={{
                                background: u.lockedUntil ? "var(--color-success)" : "var(--color-warning)",
                                color: "white",
                                border: "none",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                              }}
                            >
                              {u.lockedUntil ? t.unlock : t.lock}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={handleProvisionUser} className="glass-card" style={{ padding: "var(--spacing-md)" }}>
                  <h3 style={{ marginBottom: "var(--spacing-sm)" }}>{t.provisionUser}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--spacing-sm)" }}>
                    <div className="form-group">
                      <label>{t.username}</label>
                      <input type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="e.g. s.johansson" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", borderRadius: "4px", padding: "6px", color: "white", width: "100%" }} />
                    </div>
                    <div className="form-group">
                      <label>{t.email}</label>
                      <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@cybercom.com" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", borderRadius: "4px", padding: "6px", color: "white", width: "100%" }} />
                    </div>
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <button type="submit" style={{ background: "var(--color-primary)", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>{t.save}</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* 3. ROLES PANEL */}
            {activeTab === "roles" && (
              <div>
                <h2>{t.navRoles}</h2>
                <div style={{ overflowX: "auto", marginTop: "var(--spacing-md)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.15)" }}>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.roleName}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.roleType}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.description}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(r => (
                        <tr key={r.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                          <td style={{ padding: "var(--spacing-sm)", fontWeight: "bold" }}>{r.name}</td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <span style={{
                              color: r.clientRole ? "var(--color-secondary-light)" : "var(--color-primary-light)",
                              fontSize: "0.8rem",
                            }}>
                              {r.clientRole ? "Client-Scoped" : "Realm-Scoped"}
                            </span>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)", color: "var(--color-text-muted)" }}>{r.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. GROUPS PANEL */}
            {activeTab === "groups" && (
              <div>
                <h2>{t.navGroups}</h2>
                <div style={{ overflowX: "auto", marginTop: "var(--spacing-md)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.15)" }}>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.groupName}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.path}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.description}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(g => (
                        <tr key={g.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                          <td style={{ padding: "var(--spacing-sm)", fontWeight: "bold" }}>{g.name}</td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>{g.path}</code>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)", color: "var(--color-text-muted)" }}>{g.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. CLIENTS PANEL */}
            {activeTab === "clients" && (
              <div>
                <h2>{t.navClients}</h2>
                <div style={{ overflowX: "auto", marginTop: "var(--spacing-md)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.15)" }}>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.clientId}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.protocol}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.secretHint}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(c => (
                        <tr key={c.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <div>{c.name}</div>
                            <small style={{ color: "var(--color-text-muted)" }}>{c.clientId}</small>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <span style={{ textTransform: "uppercase", fontSize: "0.8rem", background: "rgb(var(--color-ink-rgb) / 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{c.protocol}</span>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            {c.publicClient ? (
                              <span style={{ color: "var(--color-text-subtle)", fontSize: "0.85rem" }}>Public Client (No Secret)</span>
                            ) : (
                              <code>•••• {c.secretHint || "None"}</code>
                            )}
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            {!c.publicClient && (
                              <button
                                onClick={() => handleRotateSecret(c.id)}
                                style={{
                                  background: "var(--color-secondary)",
                                  color: "white",
                                  border: "none",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {t.rotateSecret}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. SESSIONS PANEL */}
            {activeTab === "sessions" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)" }}>
                  <h2>{t.navSessions}</h2>
                  <button onClick={handleEnforceIdleTimeout} style={{ background: "var(--color-warning)", border: "none", color: "white", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                    {t.enforceIdle}
                  </button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.15)" }}>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.username}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.ipAddress}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.startedAt}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.status}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                          <td style={{ padding: "var(--spacing-sm)" }}>{s.username}</td>
                          <td style={{ padding: "var(--spacing-sm)" }}><code>{s.ipAddress}</code></td>
                          <td style={{ padding: "var(--spacing-sm)" }}>{new Date(s.startedAt).toLocaleTimeString()}</td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <span style={{
                              color: s.status === "active" ? "var(--color-success)" : "var(--color-text-subtle)",
                              fontWeight: "bold",
                            }}>
                              {s.status === "active" ? "Active" : s.status === "revoked" ? "Revoked" : "Idle Expired"}
                            </span>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            {s.status === "active" && (
                              <button
                                onClick={() => handleRevokeSession(s.id)}
                                style={{
                                  background: "var(--color-error)",
                                  color: "white",
                                  border: "none",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {t.revoke}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. BREAK GLASS PANEL */}
            {activeTab === "breakGlass" && (
              <div>
                <h2>{t.navBreakGlass}</h2>
                <div style={{ overflowX: "auto", marginTop: "var(--spacing-md)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "var(--spacing-lg)" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.15)" }}>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>Requestor</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.reason} / {t.justification}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.target}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.status}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakGlasses.map(bg => (
                        <tr key={bg.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                          <td style={{ padding: "var(--spacing-sm)" }}>{bg.username}</td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <div><strong>{bg.reason.toUpperCase()}</strong></div>
                            <small style={{ color: "var(--color-text-muted)" }}>{bg.justification}</small>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <div><code>{bg.targetResource}</code></div>
                            <small style={{ color: "var(--color-primary-light)" }}>{bg.targetAction}</small>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <span style={{
                              color: bg.status === "active" ? "var(--color-success)" : bg.status === "requested" ? "var(--color-warning)" : "var(--color-text-subtle)",
                              fontWeight: "bold",
                            }}>
                              {bg.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            {bg.status === "requested" && (
                              <button onClick={() => setSelectedBgId(bg.id)} style={{ background: "var(--color-primary)", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}>
                                {t.approve}
                              </button>
                            )}
                            {bg.status === "approved" && (
                              <button onClick={() => handleActivateBreakGlass(bg.id)} style={{ background: "var(--color-success)", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}>
                                {t.activate}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* --- Approval Signature Sub-Form --- */}
                {selectedBgId && (
                  <form onSubmit={handleApproveBreakGlass} className="glass-card" style={{ padding: "var(--spacing-md)", border: "1px solid var(--color-warning)" }}>
                    <h3 style={{ color: "var(--color-warning)", marginBottom: "var(--spacing-sm)" }}>Dual Signature Required</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-sm)" }}>
                      <div className="form-group">
                        <label>{t.approver1}</label>
                        <input type="text" required value={dualApproval.approver} onChange={e => setDualApproval({ ...dualApproval, approver: e.target.value })} placeholder="Chief Security Officer" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", borderRadius: "4px", padding: "6px", color: "white", width: "100%" }} />
                      </div>
                      <div className="form-group">
                        <label>{t.approver2}</label>
                        <input type="text" required value={dualApproval.secondApprover} onChange={e => setDualApproval({ ...dualApproval, secondApprover: e.target.value })} placeholder="Clinical Director" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", borderRadius: "4px", padding: "6px", color: "white", width: "100%" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                      <button type="button" onClick={() => setSelectedBgId(null)} style={{ background: "none", border: "1px solid white", color: "white", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>{t.cancel}</button>
                      <button type="submit" style={{ background: "var(--color-warning)", color: "black", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Sign & Approve</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 8. AUDIT PANEL */}
            {activeTab === "audit" && (
              <div>
                <h2>{t.navAudit}</h2>
                <div style={{ overflowX: "auto", marginTop: "var(--spacing-md)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.15)" }}>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.timestamp}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>User</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.outcome}</th>
                        <th style={{ padding: "var(--spacing-sm)", textAlign: isRtl ? "right" : "left" }}>{t.details}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(a => (
                        <tr key={a.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                          <td style={{ padding: "var(--spacing-sm)", whiteSpace: "nowrap" }}><small>{new Date(a.timestamp).toLocaleString()}</small></td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <div>{a.usernameAttempted}</div>
                            <small style={{ color: "var(--color-text-muted)" }}>{a.ipAddress}</small>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)" }}>
                            <span style={{
                              color: a.outcome === "success" ? "var(--color-success)" : "var(--color-error)",
                              fontWeight: "bold",
                            }}>
                              {a.outcome.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "var(--spacing-sm)", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{a.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
