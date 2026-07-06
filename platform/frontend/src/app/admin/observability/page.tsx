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
          <button onClick={() => setActiveTab("metrics")} style={{ background: activeTab === "metrics" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.metricsTab}</button>
          <button onClick={() => setActiveTab("latency")} style={{ background: activeTab === "latency" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.latencyTab}</button>
        </aside>

        <main className="glass-card" style={{ gridColumn: "span 9" }}>
          {activeTab === "metrics" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
              <div className="glass-card" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h4>{t.apiCount}</h4>
                <p className="metric-value" style={{ color: "var(--color-success)" }}>1,248,510</p>
                <small style={{ color: "var(--color-text-muted)" }}>Total requests processed today</small>
              </div>
              <div className="glass-card" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h4>{t.errorRate}</h4>
                <p className="metric-value" style={{ color: "var(--color-error)" }}>0.04%</p>
                <small style={{ color: "var(--color-text-muted)" }}>HTTP 5xx rate matches SLO rules</small>
              </div>
              <div className="glass-card" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h4>{t.cpuLoad}</h4>
                <p className="metric-value">14.2%</p>
                <small style={{ color: "var(--color-text-muted)" }}>6 worker nodes average CPU load</small>
              </div>
              <div className="glass-card" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h4>{t.memoryUsage}</h4>
                <p className="metric-value">42.8%</p>
                <small style={{ color: "var(--color-text-muted)" }}>Kubernetes memory utilization</small>
              </div>
            </div>
          )}

          {activeTab === "latency" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h2>{t.latencyTab}</h2>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span>Identity Token Validation</span>
                <span style={{ fontWeight: "bold" }}>12 ms</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span>FHIR Connector Sync API</span>
                <span style={{ fontWeight: "bold" }}>142 ms</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span>Clinical Records Query</span>
                <span style={{ fontWeight: "bold" }}>38 ms</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span>AI Prompt Evaluation</span>
                <span style={{ fontWeight: "bold" }}>210 ms</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
