"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

interface OutboxEvent {
  id: string;
  topic: string;
  eventType: string;
  status: "pending" | "published" | "failed";
  createdAt: string;
}

interface DLQEvent {
  id: string;
  topic: string;
  errorMessage: string;
  failedAt: string;
}

export default function EventsAdminConsole() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "Event Framework Control Center",
      subtitle: "Monitor Outbox, Dead Letter Queues, and Trigger Replays",
      toggleLang: "العربية",
      outboxTab: "Outbox Queue",
      dlqTab: "Dead Letter Queue (DLQ)",
      replayTab: "Trigger Replay",
      topic: "Topic",
      eventType: "Event Type",
      status: "Status",
      createdAt: "Created At",
      errorMsg: "Error Message",
      actions: "Actions",
      retry: "Retry Processing",
      triggerReplay: "Trigger Replay",
      tenantId: "Tenant ID",
      replaySuccess: "Replay initiated successfully.",
      dlqSuccess: "Dead letter event retried.",
    },
    ar: {
      title: "مركز التحكم في إطار العمل الخاص بالأحداث",
      subtitle: "مراقبة قائمة الصادر، وقوائم الرسائل المهملة (DLQ)، وتفعيل إعادة التشغيل",
      toggleLang: "English",
      outboxTab: "قائمة الأحداث الصادرة",
      dlqTab: "قائمة الأحداث المهملة (DLQ)",
      replayTab: "إعادة تشغيل الأحداث",
      topic: "الموضوع (Topic)",
      eventType: "نوع الحدث",
      status: "الحالة",
      createdAt: "تاريخ الإنشاء",
      errorMsg: "رسالة الخطأ",
      actions: "الإجراءات",
      retry: "إعادة المحاولة",
      triggerReplay: "بدء إعادة التشغيل",
      tenantId: "معرف المستأجر",
      replaySuccess: "تم بدء إعادة تشغيل الأحداث بنجاح.",
      dlqSuccess: "تمت إعادة محاولة معالجة الحدث المهمل.",
    }
  }[lang];

  const [activeTab, setActiveTab] = useState<"outbox" | "dlq" | "replay">("outbox");
  const [notification, setNotification] = useState<string | null>(null);

  const [outbox] = useState<OutboxEvent[]>([
    { id: "e1", topic: "platform.identity.events", eventType: "cyidentity.user.provisioned", status: "published", createdAt: "2026-06-22T17:30:00Z" },
    { id: "e2", topic: "product.cymed.clinical.events", eventType: "cymed.patient.admission", status: "pending", createdAt: "2026-06-22T18:00:00Z" },
    { id: "e3", topic: "product.cycom.erp.events", eventType: "cycom.transaction.approved", status: "failed", createdAt: "2026-06-22T18:05:00Z" }
  ]);

  const [dlq, setDlq] = useState<DLQEvent[]>([
    { id: "d1", topic: "platform.audit.events", errorMessage: "Schema Registry connection timeout", failedAt: "2026-06-22T16:00:00Z" }
  ]);

  const [replayParams, setReplayParams] = useState({ tenantId: "", topic: "", startTime: "" });

  const handleRetry = (id: string) => {
    setDlq(dlq.filter(d => d.id !== id));
    setNotification(t.dlqSuccess);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReplay = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(t.replaySuccess);
    setReplayParams({ tenantId: "", topic: "", startTime: "" });
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
          <button onClick={() => setActiveTab("outbox")} style={{ background: activeTab === "outbox" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", textAlign: isRtl ? "right" : "left", cursor: "pointer" }}>{t.outboxTab}</button>
          <button onClick={() => setActiveTab("dlq")} style={{ background: activeTab === "dlq" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", textAlign: isRtl ? "right" : "left", cursor: "pointer" }}>{t.dlqTab}</button>
          <button onClick={() => setActiveTab("replay")} style={{ background: activeTab === "replay" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", textAlign: isRtl ? "right" : "left", cursor: "pointer" }}>{t.replayTab}</button>
        </aside>

        <main className="glass-card" style={{ gridColumn: "span 9" }}>
          {activeTab === "outbox" && (
            <div>
              <h2>{t.outboxTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>ID</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.topic}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.eventType}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.status}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.createdAt}</th>
                  </tr>
                </thead>
                <tbody>
                  {outbox.map(e => (
                    <tr key={e.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                      <td style={{ padding: "8px" }}>{e.id}</td>
                      <td style={{ padding: "8px" }}><code>{e.topic}</code></td>
                      <td style={{ padding: "8px" }}>{e.eventType}</td>
                      <td style={{ padding: "8px", color: e.status === "published" ? "var(--color-success)" : e.status === "pending" ? "var(--color-warning)" : "var(--color-error)" }}>{e.status.toUpperCase()}</td>
                      <td style={{ padding: "8px" }}><small>{new Date(e.createdAt).toLocaleTimeString()}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "dlq" && (
            <div>
              <h2>{t.dlqTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.topic}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.errorMsg}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.createdAt}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {dlq.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "var(--color-text-muted)" }}>No toxic events found.</td></tr>
                  ) : (
                    dlq.map(e => (
                      <tr key={e.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                        <td style={{ padding: "8px" }}><code>{e.topic}</code></td>
                        <td style={{ padding: "8px", color: "var(--color-warning)" }}>{e.errorMessage}</td>
                        <td style={{ padding: "8px" }}><small>{new Date(e.failedAt).toLocaleTimeString()}</small></td>
                        <td style={{ padding: "8px" }}>
                          <button onClick={() => handleRetry(e.id)} style={{ background: "var(--color-success)", border: "none", color: "white", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>{t.retry}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "replay" && (
            <form onSubmit={handleReplay} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
              <h2>{t.replayTab}</h2>
              <div className="form-group">
                <label>{t.tenantId}</label>
                <input type="text" required value={replayParams.tenantId} onChange={e => setReplayParams({ ...replayParams, tenantId: e.target.value })} placeholder="00000000-0000-0000-0000-000000000000" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", padding: "8px", color: "white", borderRadius: "4px", width: "100%" }} />
              </div>
              <div className="form-group">
                <label>{t.topic}</label>
                <input type="text" required value={replayParams.topic} onChange={e => setReplayParams({ ...replayParams, topic: e.target.value })} placeholder="platform.identity.events" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", padding: "8px", color: "white", borderRadius: "4px", width: "100%" }} />
              </div>
              <button type="submit" style={{ background: "var(--color-primary)", border: "none", color: "white", padding: "10px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>{t.triggerReplay}</button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
