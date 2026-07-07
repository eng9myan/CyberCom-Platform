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

  // --- Shared presentational helpers ---
  const inputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink";
  const labelCls = "mb-1.5 block text-[13px] font-semibold text-ink/50";
  const thCls = `px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`;
  const navBtnCls = (active: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${isRtl ? "text-right" : "text-left"} ${
      active ? "border-brand-400/60 bg-brand-500 text-white" : "border-ink/10 text-ink/70 hover:bg-ink/5"
    }`;

  return (
    <>
      <Head>
        <title>{t.title} | CyberCom</title>
        <meta name="description" content="CyberCom CyIdentity core administrative control plane dashboard." />
      </Head>

      <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-6xl">
        {/* --- Header Section --- */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
            <p className="mt-1 text-sm text-ink/50">{t.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              id="cyidentity-lang-toggle"
              className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm"
            >
              {t.toggleLang}
            </button>
            <button
              onClick={toggleTheme}
              id="cyidentity-theme-toggle"
              className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm"
            >
              {t.toggleTheme}
            </button>
          </div>
        </header>

        {/* --- Notification Banner --- */}
        {notification && (
          <div
            className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold ${
              notification.type === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <span>{notification.message}</span>
            <button className="font-bold" onClick={() => setNotification(null)}>✕</button>
          </div>
        )}

        {/* --- Main Grid Layout --- */}
        <div className="mt-6 grid grid-cols-12 gap-6">

          {/* --- Navigation Side Panel --- */}
          <aside className="cy-card col-span-3 flex h-fit flex-col gap-2 p-4">
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
                className={navBtnCls(activeTab === tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          {/* --- Details Console Panel --- */}
          <main className="cy-card col-span-9 p-6">

            {/* 1. REALMS PANEL */}
            {activeTab === "realms" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">{t.navRealms}</h2>
                  <span className="text-sm text-ink/50">{realms.length} Domains Configured</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="mb-6 w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink/10">
                        <th className={thCls}>{t.realmName}</th>
                        <th className={thCls}>{t.realmType}</th>
                        <th className={thCls}>{t.region}</th>
                        <th className={thCls}>{t.status}</th>
                        <th className={thCls}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realms.map(r => (
                        <tr key={r.id} className="border-b border-ink/5">
                          <td className="px-4 py-3">{r.name}</td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-ink/10 px-1.5 py-0.5 text-xs">{r.type}</span>
                          </td>
                          <td className="px-4 py-3">{r.region}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${r.status === "active" ? "text-emerald-400" : r.status === "pending" ? "text-amber-400" : "text-red-400"}`}>
                              {r.status === "active" ? t.statusActive : r.status === "pending" ? t.statusPending : r.status === "suspended" ? t.statusSuspended : t.statusDecommissioned}
                            </span>
                          </td>
                          <td className="flex flex-wrap gap-1.5 px-4 py-3">
                            {r.status === "pending" && (
                              <button onClick={() => handleActivateRealm(r.id)} className="rounded bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-emerald-600">{t.activate}</button>
                            )}
                            {r.status === "active" && (
                              <button onClick={() => handleSuspendRealm(r.id)} className="rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-amber-600">{t.lock}</button>
                            )}
                            {r.status !== "decommissioned" && (
                              <button onClick={() => handleDecommissionRealm(r.id)} className="rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-600">🗑</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={handleProvisionRealm} className="cy-card mt-6 p-4">
                  <h3 className="mb-2 text-sm font-bold">{t.provisionRealm}</h3>
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>{t.realmName}</label>
                      <input type="text" value={newRealm.name} onChange={e => setNewRealm({ ...newRealm, name: e.target.value })} placeholder="e.g. corp-workforce" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t.realmType}</label>
                      <select value={newRealm.type} onChange={e => setNewRealm({ ...newRealm, type: e.target.value })} className={inputCls}>
                        <option value="workforce">Workforce</option>
                        <option value="customer">Customer (Multi-Tenant)</option>
                        <option value="citizen">Citizen</option>
                        <option value="partner">Partner B2B</option>
                        <option value="workload">Workload (M2M)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={newRealm.mfaEnforced} onChange={e => setNewRealm({ ...newRealm, mfaEnforced: e.target.checked })} />
                      {t.mfa}
                    </label>
                    <button type="submit" className="cy-btn cy-btn-primary">{t.save}</button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. USERS PANEL */}
            {activeTab === "users" && (
              <div>
                <h2 className="text-lg font-bold">{t.navUsers}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="mb-6 w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink/10">
                        <th className={thCls}>{t.username}</th>
                        <th className={thCls}>{t.email}</th>
                        <th className={thCls}>{t.status}</th>
                        <th className={thCls}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-ink/5">
                          <td className="px-4 py-3">
                            <div>{u.displayName}</div>
                            <small className="text-ink/50">@{u.username}</small>
                          </td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${!u.enabled ? "text-ink/40" : u.lockedUntil ? "text-red-400" : "text-emerald-400"}`}>
                              {!u.enabled ? "Disabled" : u.lockedUntil ? "Locked" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleLockUser(u.id)}
                              className={`rounded px-2 py-1 text-xs font-semibold text-white ${u.lockedUntil ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}`}
                            >
                              {u.lockedUntil ? t.unlock : t.lock}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={handleProvisionUser} className="cy-card p-4">
                  <h3 className="mb-2 text-sm font-bold">{t.provisionUser}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>{t.username}</label>
                      <input type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="e.g. s.johansson" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t.email}</label>
                      <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@cybercom.com" className={inputCls} />
                    </div>
                    <div className="flex flex-col justify-end">
                      <button type="submit" className="cy-btn cy-btn-primary">{t.save}</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* 3. ROLES PANEL */}
            {activeTab === "roles" && (
              <div>
                <h2 className="text-lg font-bold">{t.navRoles}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink/10">
                        <th className={thCls}>{t.roleName}</th>
                        <th className={thCls}>{t.roleType}</th>
                        <th className={thCls}>{t.description}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(r => (
                        <tr key={r.id} className="border-b border-ink/5">
                          <td className="px-4 py-3 font-bold">{r.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${r.clientRole ? "text-cyan-400" : "text-brand-300"}`}>
                              {r.clientRole ? "Client-Scoped" : "Realm-Scoped"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-ink/50">{r.description}</td>
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
                <h2 className="text-lg font-bold">{t.navGroups}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink/10">
                        <th className={thCls}>{t.groupName}</th>
                        <th className={thCls}>{t.path}</th>
                        <th className={thCls}>{t.description}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(g => (
                        <tr key={g.id} className="border-b border-ink/5">
                          <td className="px-4 py-3 font-bold">{g.name}</td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-xs">{g.path}</code>
                          </td>
                          <td className="px-4 py-3 text-ink/50">{g.description}</td>
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
                <h2 className="text-lg font-bold">{t.navClients}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink/10">
                        <th className={thCls}>{t.clientId}</th>
                        <th className={thCls}>{t.protocol}</th>
                        <th className={thCls}>{t.secretHint}</th>
                        <th className={thCls}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(c => (
                        <tr key={c.id} className="border-b border-ink/5">
                          <td className="px-4 py-3">
                            <div>{c.name}</div>
                            <small className="text-ink/50">{c.clientId}</small>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-ink/10 px-1.5 py-0.5 text-xs uppercase">{c.protocol}</span>
                          </td>
                          <td className="px-4 py-3">
                            {c.publicClient ? (
                              <span className="text-xs text-ink/40">Public Client (No Secret)</span>
                            ) : (
                              <code>•••• {c.secretHint || "None"}</code>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!c.publicClient && (
                              <button
                                onClick={() => handleRotateSecret(c.id)}
                                className="rounded bg-cyan-500 px-2 py-1 text-xs font-semibold text-white hover:bg-cyan-600"
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
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">{t.navSessions}</h2>
                  <button onClick={handleEnforceIdleTimeout} className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-amber-600">
                    {t.enforceIdle}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink/10">
                        <th className={thCls}>{t.username}</th>
                        <th className={thCls}>{t.ipAddress}</th>
                        <th className={thCls}>{t.startedAt}</th>
                        <th className={thCls}>{t.status}</th>
                        <th className={thCls}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id} className="border-b border-ink/5">
                          <td className="px-4 py-3">{s.username}</td>
                          <td className="px-4 py-3"><code>{s.ipAddress}</code></td>
                          <td className="px-4 py-3">{new Date(s.startedAt).toLocaleTimeString()}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${s.status === "active" ? "text-emerald-400" : "text-ink/40"}`}>
                              {s.status === "active" ? "Active" : s.status === "revoked" ? "Revoked" : "Idle Expired"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {s.status === "active" && (
                              <button
                                onClick={() => handleRevokeSession(s.id)}
                                className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
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
                <h2 className="text-lg font-bold">{t.navBreakGlass}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="mb-6 w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink/10">
                        <th className={thCls}>Requestor</th>
                        <th className={thCls}>{t.reason} / {t.justification}</th>
                        <th className={thCls}>{t.target}</th>
                        <th className={thCls}>{t.status}</th>
                        <th className={thCls}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakGlasses.map(bg => (
                        <tr key={bg.id} className="border-b border-ink/5">
                          <td className="px-4 py-3">{bg.username}</td>
                          <td className="px-4 py-3">
                            <div><strong>{bg.reason.toUpperCase()}</strong></div>
                            <small className="text-ink/50">{bg.justification}</small>
                          </td>
                          <td className="px-4 py-3">
                            <div><code>{bg.targetResource}</code></div>
                            <small className="text-brand-300">{bg.targetAction}</small>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${bg.status === "active" ? "text-emerald-400" : bg.status === "requested" ? "text-amber-400" : "text-ink/40"}`}>
                              {bg.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {bg.status === "requested" && (
                              <button onClick={() => setSelectedBgId(bg.id)} className="rounded bg-brand-500 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-600">
                                {t.approve}
                              </button>
                            )}
                            {bg.status === "approved" && (
                              <button onClick={() => handleActivateBreakGlass(bg.id)} className="rounded bg-emerald-500 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600">
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
                  <form onSubmit={handleApproveBreakGlass} className="cy-card border border-amber-500/50 p-4">
                    <h3 className="mb-2 text-sm font-bold text-amber-400">Dual Signature Required</h3>
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>{t.approver1}</label>
                        <input type="text" required value={dualApproval.approver} onChange={e => setDualApproval({ ...dualApproval, approver: e.target.value })} placeholder="Chief Security Officer" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>{t.approver2}</label>
                        <input type="text" required value={dualApproval.secondApprover} onChange={e => setDualApproval({ ...dualApproval, secondApprover: e.target.value })} placeholder="Clinical Director" className={inputCls} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2.5">
                      <button type="button" onClick={() => setSelectedBgId(null)} className="cy-btn cy-btn-ghost !min-h-0 !py-1.5 !px-3 text-sm">{t.cancel}</button>
                      <button type="submit" className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-bold text-black hover:bg-amber-600">Sign &amp; Approve</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 8. AUDIT PANEL */}
            {activeTab === "audit" && (
              <div>
                <h2 className="text-lg font-bold">{t.navAudit}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink/10">
                        <th className={thCls}>{t.timestamp}</th>
                        <th className={thCls}>User</th>
                        <th className={thCls}>{t.outcome}</th>
                        <th className={thCls}>{t.details}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(a => (
                        <tr key={a.id} className="border-b border-ink/5">
                          <td className="whitespace-nowrap px-4 py-3"><small>{new Date(a.timestamp).toLocaleString()}</small></td>
                          <td className="px-4 py-3">
                            <div>{a.usernameAttempted}</div>
                            <small className="text-ink/50">{a.ipAddress}</small>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${a.outcome === "success" ? "text-emerald-400" : "text-red-400"}`}>
                              {a.outcome.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-ink/50">{a.details}</td>
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
