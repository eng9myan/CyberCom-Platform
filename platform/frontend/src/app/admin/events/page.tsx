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

  const navBtnCls = (active: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${isRtl ? "text-right" : "text-left"} ${
      active ? "border-brand-400/60 bg-brand-500 text-white" : "border-ink/10 text-ink/70 hover:bg-ink/5"
    }`;

  const inputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink";
  const labelCls = "mb-1.5 block text-[13px] font-semibold text-ink/50";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-ink/50">{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {t.toggleLang}
        </button>
      </header>

      {notification && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-3.5 text-sm font-semibold text-emerald-400">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <aside className="cy-card col-span-3 flex h-fit flex-col gap-2 p-4">
          <button onClick={() => setActiveTab("outbox")} className={navBtnCls(activeTab === "outbox")}>{t.outboxTab}</button>
          <button onClick={() => setActiveTab("dlq")} className={navBtnCls(activeTab === "dlq")}>{t.dlqTab}</button>
          <button onClick={() => setActiveTab("replay")} className={navBtnCls(activeTab === "replay")}>{t.replayTab}</button>
        </aside>

        <main className="cy-card col-span-9 p-6">
          {activeTab === "outbox" && (
            <div>
              <h2 className="text-lg font-bold">{t.outboxTab}</h2>
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>ID</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.topic}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.eventType}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.status}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.createdAt}</th>
                  </tr>
                </thead>
                <tbody>
                  {outbox.map(e => (
                    <tr key={e.id} className="border-b border-ink/5">
                      <td className="px-4 py-3">{e.id}</td>
                      <td className="px-4 py-3"><code className="font-mono text-xs">{e.topic}</code></td>
                      <td className="px-4 py-3">{e.eventType}</td>
                      <td className={`px-4 py-3 font-semibold ${e.status === "published" ? "text-emerald-400" : e.status === "pending" ? "text-amber-400" : "text-red-400"}`}>{e.status.toUpperCase()}</td>
                      <td className="px-4 py-3"><small className="text-xs text-ink/50">{new Date(e.createdAt).toLocaleTimeString()}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "dlq" && (
            <div>
              <h2 className="text-lg font-bold">{t.dlqTab}</h2>
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.topic}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.errorMsg}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.createdAt}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {dlq.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-sm text-ink/50">No toxic events found.</td></tr>
                  ) : (
                    dlq.map(e => (
                      <tr key={e.id} className="border-b border-ink/5">
                        <td className="px-4 py-3"><code className="font-mono text-xs">{e.topic}</code></td>
                        <td className="px-4 py-3 text-amber-400">{e.errorMessage}</td>
                        <td className="px-4 py-3"><small className="text-xs text-ink/50">{new Date(e.failedAt).toLocaleTimeString()}</small></td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleRetry(e.id)} className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600">{t.retry}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "replay" && (
            <form onSubmit={handleReplay} className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">{t.replayTab}</h2>
              <div>
                <label className={labelCls}>{t.tenantId}</label>
                <input type="text" required value={replayParams.tenantId} onChange={e => setReplayParams({ ...replayParams, tenantId: e.target.value })} placeholder="00000000-0000-0000-0000-000000000000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t.topic}</label>
                <input type="text" required value={replayParams.topic} onChange={e => setReplayParams({ ...replayParams, topic: e.target.value })} placeholder="platform.identity.events" className={inputCls} />
              </div>
              <button type="submit" className="cy-btn cy-btn-primary">{t.triggerReplay}</button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
