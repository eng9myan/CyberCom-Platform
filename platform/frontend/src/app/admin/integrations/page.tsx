"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

interface Connector {
  id: string;
  name: string;
  type: string;
  url: string;
  active: boolean;
}

interface MessageAudit {
  id: string;
  connectorType: string;
  direction: "inbound" | "outbound";
  status: "success" | "failed";
  duration: number;
}

export default function IntegrationsAdminConsole() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "CyIntegration Hub Configuration",
      subtitle: "Configure Connectors, Mappings, and Audit Interoperability Streams",
      toggleLang: "العربية",
      connectorTab: "Connectors",
      auditTab: "Message Audits",
      name: "Connector Name",
      type: "Protocol Type",
      url: "Endpoint URL",
      status: "Status",
      direction: "Direction",
      duration: "Duration (ms)",
      actions: "Actions",
      active: "Active",
      inactive: "Inactive",
      test: "Test Connection",
      connSuccess: "Connection tested successfully.",
    },
    ar: {
      title: "تهيئة محور التكامل (CyIntegration Hub)",
      subtitle: "إعداد الموصلات، والمطابقات، وتدقيق تدفقات العمل المشترك",
      toggleLang: "English",
      connectorTab: "الموصلات",
      auditTab: "تدقيق الرسائل",
      name: "اسم الموصل",
      type: "نوع البروتوكول",
      url: "عنوان الرابط",
      status: "الحالة",
      direction: "الاتجاه",
      duration: "المدة (ملي ثانية)",
      actions: "الإجراءات",
      active: "نشط",
      inactive: "غير نشط",
      test: "اختبار الاتصال",
      connSuccess: "تم اختبار الاتصال بنجاح.",
    }
  }[lang];

  const [activeTab, setActiveTab] = useState<"connectors" | "audits">("connectors");
  const [notification, setNotification] = useState<string | null>(null);

  const [connectors] = useState<Connector[]>([
    { id: "c1", name: "Epic EHR FHIR Gateway", type: "fhir", url: "https://fhir.epic.com/api/v1", active: true },
    { id: "c2", name: "Lab Systems HL7 Feed", type: "hl7v2", url: "mllp://labs.cybercom.local:2575", active: true },
    { id: "c3", name: "Billing SOAP Connector", type: "soap", url: "https://soap.billing.com/ws", active: false }
  ]);

  const [audits] = useState<MessageAudit[]>([
    { id: "m1", connectorType: "fhir", direction: "inbound", status: "success", duration: 142 },
    { id: "m2", connectorType: "hl7v2", direction: "inbound", status: "success", duration: 88 },
    { id: "m3", connectorType: "soap", direction: "outbound", status: "failed", duration: 520 }
  ]);

  const handleTest = (name: string) => {
    setNotification(`${t.connSuccess} (${name})`);
    setTimeout(() => setNotification(null), 3000);
  };

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

      {notification && (
        <div className="cy-card mb-4 border-l-4 border-emerald-500 p-4 text-sm font-semibold">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <aside className="cy-card col-span-3 flex h-fit flex-col gap-2 p-4">
          <button
            onClick={() => setActiveTab("connectors")}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === "connectors" ? "bg-brand-500 text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            {t.connectorTab}
          </button>
          <button
            onClick={() => setActiveTab("audits")}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === "audits" ? "bg-brand-500 text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            {t.auditTab}
          </button>
        </aside>

        <main className="cy-card col-span-9 p-6">
          {activeTab === "connectors" && (
            <div>
              <h2 className="text-lg font-bold">{t.connectorTab}</h2>
              <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.name}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.type}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.url}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.status}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectors.map(c => (
                      <tr key={c.id} className="border-b border-ink/5">
                        <td className="px-4 py-3">{c.name}</td>
                        <td className="px-4 py-3"><span className="rounded-md bg-ink/10 px-2 py-1 text-xs font-semibold">{c.type.toUpperCase()}</span></td>
                        <td className="px-4 py-3"><code className="text-xs text-ink/70">{c.url}</code></td>
                        <td className={`px-4 py-3 font-semibold ${c.active ? "text-emerald-400" : "text-ink/40"}`}>{c.active ? t.active : t.inactive}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleTest(c.name)} className="cy-btn cy-btn-primary !min-h-0 !py-1.5 !px-3 text-xs">{t.test}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "audits" && (
            <div>
              <h2 className="text-lg font-bold">{t.auditTab}</h2>
              <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">Message ID</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.type}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.direction}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.status}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.duration}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map(a => (
                      <tr key={a.id} className="border-b border-ink/5">
                        <td className="px-4 py-3">{a.id}</td>
                        <td className="px-4 py-3"><span className="rounded-md bg-ink/10 px-2 py-1 text-xs font-semibold">{a.connectorType.toUpperCase()}</span></td>
                        <td className="px-4 py-3">{a.direction.toUpperCase()}</td>
                        <td className={`px-4 py-3 font-semibold ${a.status === "success" ? "text-emerald-400" : "text-red-400"}`}>{a.status.toUpperCase()}</td>
                        <td className="px-4 py-3">{a.duration} ms</td>
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
