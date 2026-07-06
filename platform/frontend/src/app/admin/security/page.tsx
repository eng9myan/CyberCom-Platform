"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

interface SecretPath {
  id: string;
  path: string;
  keys: string[];
  lastRotated: string;
}

interface OPAPolicy {
  id: string;
  name: string;
  resource: string;
  action: string;
  verdict: "allow" | "deny";
}

export default function SecurityAdminConsole() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "Hardening & Platform Security Console",
      subtitle: "Secrets Manager (Vault), Runtime Policies (OPA), and Security Baselines",
      toggleLang: "العربية",
      vaultTab: "Vault Secret Store",
      opaTab: "OPA Access Policies",
      path: "Secret Path",
      keys: "Stored Keys",
      lastRotated: "Last Rotated",
      policy: "Policy Target",
      resource: "Resource",
      action: "Action",
      verdict: "Verdict",
      vaultStatus: "Vault Engine Status: Connected",
    },
    ar: {
      title: "لوحة تحكم الحماية والتحصين الأمنية",
      subtitle: "إدارة الأسرار والمفاتيح (Vault)، وسياسات الوصول أثناء التشغيل (OPA)، والمعايير الأمنية",
      toggleLang: "English",
      vaultTab: "مخزن أسرار Vault",
      opaTab: "سياسات وصول OPA",
      path: "مسار السر",
      keys: "المفاتيح المخزنة",
      lastRotated: "آخر تدوير",
      policy: "هدف السياسة",
      resource: "المورد",
      action: "الإجراء",
      verdict: "القرار",
      vaultStatus: "حالة محرك Vault: متصل",
    }
  }[lang];

  const [activeTab, setActiveTab] = useState<"vault" | "opa">("vault");

  const [secrets] = useState<SecretPath[]>([
    { id: "s1", path: "cybercom/data/database/postgres", keys: ["username", "password"], lastRotated: "2026-06-22T04:00:00Z" },
    { id: "s2", path: "cybercom/data/identity/keycloak-client", keys: ["client_secret"], lastRotated: "2026-06-21T12:00:00Z" },
    { id: "s3", path: "cybercom/data/certificates/ssl-private-key", keys: ["tls.key"], lastRotated: "2026-05-22T00:00:00Z" }
  ]);

  const [policies] = useState<OPAPolicy[]>([
    { id: "o1", name: "platform/admin", resource: "realms/provision", action: "create", verdict: "allow" },
    { id: "o2", name: "clinical/access", resource: "patient/medical-records", action: "write", verdict: "deny" },
    { id: "o3", name: "clinical/access", resource: "patient/medical-records", action: "read", verdict: "allow" }
  ]);

  return (
    <div className="dashboard-container" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <header className="dashboard-header">
        <div>
          <h1>{t.title}</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="theme-toggle-btn">
          {t.toggleLang}
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "var(--spacing-lg)" }}>
        <aside className="glass-card" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", height: "fit-content" }}>
          <button onClick={() => setActiveTab("vault")} style={{ background: activeTab === "vault" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.vaultTab}</button>
          <button onClick={() => setActiveTab("opa")} style={{ background: activeTab === "opa" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.opaTab}</button>
        </aside>

        <main className="glass-card" style={{ gridColumn: "span 9" }}>
          {activeTab === "vault" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2>{t.vaultTab}</h2>
                <span style={{ color: "var(--color-success)", fontWeight: "bold" }}>● {t.vaultStatus}</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.path}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.keys}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.lastRotated}</th>
                  </tr>
                </thead>
                <tbody>
                  {secrets.map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px" }}><code>{s.path}</code></td>
                      <td style={{ padding: "8px" }}>
                        {s.keys.map(k => (
                          <span key={k} style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", marginRight: "4px", borderRadius: "4px", fontSize: "0.8rem" }}>{k}</span>
                        ))}
                      </td>
                      <td style={{ padding: "8px" }}><small>{new Date(s.lastRotated).toLocaleString()}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "opa" && (
            <div>
              <h2>{t.opaTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.policy}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.resource}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.action}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.verdict}</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px" }}><code>{p.name}</code></td>
                      <td style={{ padding: "8px" }}>{p.resource}</td>
                      <td style={{ padding: "8px" }}>{p.action.toUpperCase()}</td>
                      <td style={{ padding: "8px", color: p.verdict === "allow" ? "var(--color-success)" : "var(--color-error)", fontWeight: "bold" }}>{p.verdict.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
