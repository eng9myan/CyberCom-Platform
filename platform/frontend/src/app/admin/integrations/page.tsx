"use client";

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
  const [lang, setLang] = useState<"en" | "ar">("en");
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

      {notification && (
        <div className="glass-card" style={{ marginBottom: "var(--spacing-md)", borderLeft: "4px solid var(--color-success)", color: "white" }}>
          {notification}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "var(--spacing-lg)" }}>
        <aside className="glass-card" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", height: "fit-content" }}>
          <button onClick={() => setActiveTab("connectors")} style={{ background: activeTab === "connectors" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.connectorTab}</button>
          <button onClick={() => setActiveTab("audits")} style={{ background: activeTab === "audits" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.auditTab}</button>
        </aside>

        <main className="glass-card" style={{ gridColumn: "span 9" }}>
          {activeTab === "connectors" && (
            <div>
              <h2>{t.connectorTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.name}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.type}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.url}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.status}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {connectors.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px" }}>{c.name}</td>
                      <td style={{ padding: "8px" }}><span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>{c.type.toUpperCase()}</span></td>
                      <td style={{ padding: "8px" }}><code>{c.url}</code></td>
                      <td style={{ padding: "8px", color: c.active ? "var(--color-success)" : "var(--color-text-subtle)" }}>{c.active ? t.active : t.inactive}</td>
                      <td style={{ padding: "8px" }}>
                        <button onClick={() => handleTest(c.name)} style={{ background: "var(--color-primary)", border: "none", color: "white", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>{t.test}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "audits" && (
            <div>
              <h2>{t.auditTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>Message ID</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.type}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.direction}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.status}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.duration}</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map(a => (
                    <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px" }}>{a.id}</td>
                      <td style={{ padding: "8px" }}><span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>{a.connectorType.toUpperCase()}</span></td>
                      <td style={{ padding: "8px" }}>{a.direction.toUpperCase()}</td>
                      <td style={{ padding: "8px", color: a.status === "success" ? "var(--color-success)" : "var(--color-error)" }}>{a.status.toUpperCase()}</td>
                      <td style={{ padding: "8px" }}>{a.duration} ms</td>
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
