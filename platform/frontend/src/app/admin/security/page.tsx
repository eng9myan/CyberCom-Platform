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
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-ink/50">{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {t.toggleLang}
        </button>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <aside className="cy-card col-span-3 flex h-fit flex-col gap-2 p-4">
          <button
            onClick={() => setActiveTab("vault")}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === "vault" ? "bg-brand-500 text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            {t.vaultTab}
          </button>
          <button
            onClick={() => setActiveTab("opa")}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === "opa" ? "bg-brand-500 text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            {t.opaTab}
          </button>
        </aside>

        <main className="cy-card col-span-9 p-6">
          {activeTab === "vault" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{t.vaultTab}</h2>
                <span className="text-sm font-bold text-emerald-400">● {t.vaultStatus}</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-ink/10">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.path}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.keys}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.lastRotated}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secrets.map(s => (
                      <tr key={s.id} className="border-b border-ink/5">
                        <td className="px-4 py-3"><code className="text-xs text-ink/70">{s.path}</code></td>
                        <td className="px-4 py-3">
                          {s.keys.map(k => (
                            <span key={k} className="mr-1 rounded-md bg-ink/10 px-2 py-1 text-xs">{k}</span>
                          ))}
                        </td>
                        <td className="px-4 py-3"><small className="text-xs text-ink/50">{new Date(s.lastRotated).toLocaleString()}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "opa" && (
            <div>
              <h2 className="text-lg font-bold">{t.opaTab}</h2>
              <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.policy}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.resource}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.action}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.verdict}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map(p => (
                      <tr key={p.id} className="border-b border-ink/5">
                        <td className="px-4 py-3"><code className="text-xs text-ink/70">{p.name}</code></td>
                        <td className="px-4 py-3">{p.resource}</td>
                        <td className="px-4 py-3">{p.action.toUpperCase()}</td>
                        <td className={`px-4 py-3 font-bold ${p.verdict === "allow" ? "text-emerald-400" : "text-red-400"}`}>{p.verdict.toUpperCase()}</td>
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
  );
}
