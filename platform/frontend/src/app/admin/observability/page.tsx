"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

export default function ObservabilityAdminConsole() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "Platform Observability & Metrics",
      subtitle: "Real-time Metrics, OpenTelemetry traces, and Latency Benchmarks",
      toggleLang: "العربية",
      metricsTab: "System Telemetry",
      latencyTab: "Endpoint Latency",
      apiCount: "Total API Requests",
      errorRate: "Global Error Rate",
      cpuLoad: "Average CPU Load",
      memoryUsage: "Average Memory Usage",
      p95: "P95 Latency (ms)",
      p99: "P99 Latency (ms)",
      activeTraces: "Active OTel Traces",
    },
    ar: {
      title: "مراقبة المنصة والقياسات (Observability)",
      subtitle: "القياسات الفورية، وتتبعات OpenTelemetry، ومؤشرات سرعة الاستجابة",
      toggleLang: "English",
      metricsTab: "بيانات القياس عن بعد",
      latencyTab: "سرعة استجابة النهايات",
      apiCount: "إجمالي طلبات API",
      errorRate: "معدل الخطأ العام",
      cpuLoad: "معدل استهلاك المعالج",
      memoryUsage: "معدل استهلاك الذاكرة",
      p95: "سرعة الاستجابة P95",
      p99: "سرعة الاستجابة P99",
      activeTraces: "التتبعات النشطة OTel",
    }
  }[lang];

  const [activeTab, setActiveTab] = useState<"metrics" | "latency">("metrics");

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
            onClick={() => setActiveTab("metrics")}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === "metrics" ? "bg-brand-500 text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            {t.metricsTab}
          </button>
          <button
            onClick={() => setActiveTab("latency")}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === "latency" ? "bg-brand-500 text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            {t.latencyTab}
          </button>
        </aside>

        <main className="cy-card col-span-9 p-6">
          {activeTab === "metrics" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="cy-card p-5">
                <h4 className="text-sm font-semibold text-ink/70">{t.apiCount}</h4>
                <p className="my-2 text-3xl font-extrabold text-emerald-400">1,248,510</p>
                <small className="text-xs text-ink/50">Total requests processed today</small>
              </div>
              <div className="cy-card p-5">
                <h4 className="text-sm font-semibold text-ink/70">{t.errorRate}</h4>
                <p className="my-2 text-3xl font-extrabold text-red-400">0.04%</p>
                <small className="text-xs text-ink/50">HTTP 5xx rate matches SLO rules</small>
              </div>
              <div className="cy-card p-5">
                <h4 className="text-sm font-semibold text-ink/70">{t.cpuLoad}</h4>
                <p className="my-2 text-3xl font-extrabold text-brand-400">14.2%</p>
                <small className="text-xs text-ink/50">6 worker nodes average CPU load</small>
              </div>
              <div className="cy-card p-5">
                <h4 className="text-sm font-semibold text-ink/70">{t.memoryUsage}</h4>
                <p className="my-2 text-3xl font-extrabold text-brand-400">42.8%</p>
                <small className="text-xs text-ink/50">Kubernetes memory utilization</small>
              </div>
            </div>
          )}

          {activeTab === "latency" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">{t.latencyTab}</h2>
              <div className="flex justify-between border-b border-ink/10 pb-2">
                <span className="text-sm">Identity Token Validation</span>
                <span className="text-sm font-bold">12 ms</span>
              </div>
              <div className="flex justify-between border-b border-ink/10 pb-2">
                <span className="text-sm">FHIR Connector Sync API</span>
                <span className="text-sm font-bold">142 ms</span>
              </div>
              <div className="flex justify-between border-b border-ink/10 pb-2">
                <span className="text-sm">Clinical Records Query</span>
                <span className="text-sm font-bold">38 ms</span>
              </div>
              <div className="flex justify-between border-b border-ink/10 pb-2">
                <span className="text-sm">AI Prompt Evaluation</span>
                <span className="text-sm font-bold">210 ms</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
