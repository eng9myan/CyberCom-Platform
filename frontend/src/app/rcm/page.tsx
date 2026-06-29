"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface RCMDashboardRaw {
  days_in_ar?: number;
  total_ar?: number;
  collection_rate_pct_pct?: number;
  denial_rate_pct?: number;
  net_collection_rate_pct_pct?: number;
  gross_charges?: number;
  net_revenue?: number;
  adjustments?: number;
  cash_collected?: number;
  outstanding?: number;
  ar_by_age?: ARByAge[];
}

interface RCMMetrics {
  days_in_ar: number;
  total_ar: number;
  collection_rate_pct: number;
  denial_rate_pct: number;
  net_collection_rate_pct: number;
  gross_charges: number;
  net_revenue: number;
  adjustments: number;
  cash_collected: number;
  outstanding: number;
}

interface ARByAge {
  bucket: string;
  amount: number;
}

const METRICS: RCMMetrics = {
  days_in_ar: 42.3,
  total_ar: 2400000.00,
  collection_rate_pct: 94.2,
  denial_rate_pct: 8.1,
  net_collection_rate_pct: 91.8,
  gross_charges: 1500000.00,
  net_revenue: 1380000.00,
  adjustments: 120000.00,
  cash_collected: 847000.00,
  outstanding: 653000.00,
};

const AGING_BUCKETS: ARByAge[] = [
  { bucket: "0-30 days", amount: 1200000.00 },
  { bucket: "31-60 days", amount: 600000.00 },
  { bucket: "61-90 days", amount: 400000.00 },
  { bucket: "91-120 days", amount: 150000.00 },
  { bucket: "120+ days", amount: 50000.00 },
];

export default function RCMDashboard() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [metrics, setMetrics] = useState<RCMMetrics>(METRICS);
  const [aging, setAging] = useState<ARByAge[]>(AGING_BUCKETS);
  useEffect(() => {
    async function fetchRcmData() {
      try {
        const dashboard = await apiFetch<RCMDashboardRaw>("/api/v1/rcm/analytics/dashboard/");
        if (dashboard) {
          setMetrics({
            days_in_ar: dashboard.days_in_ar ?? 42.3,
            total_ar: dashboard.total_ar ?? 2400000.00,
            collection_rate_pct: dashboard.collection_rate_pct_pct ?? 94.2,
            denial_rate_pct: dashboard.denial_rate_pct ?? 8.1,
            net_collection_rate_pct: dashboard.net_collection_rate_pct_pct ?? 91.8,
            gross_charges: dashboard.gross_charges ?? 1500000.00,
            net_revenue: dashboard.net_revenue ?? 1380000.00,
            adjustments: dashboard.adjustments ?? 120000.00,
            cash_collected: dashboard.cash_collected ?? 847000.00,
            outstanding: dashboard.outstanding ?? 653000.00,
          });
          if (dashboard.ar_by_age) {
            setAging(dashboard.ar_by_age);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live RCM data, using mock data:", err);
      }
    }
    void fetchRcmData();
  }, []);

  const totalCollected = metrics.cash_collected;
  const targetColor = metrics.denial_rate_pct > 10 ? "#ef4444" : metrics.denial_rate_pct > 5 ? "#f59e0b" : "#22c55e";

  return (
    <div className="dashboard-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Revenue Cycle (RCM)" : "دورة الإيرادات سايمد (RCM)"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Financial Performance & Accounts Receivable" : "الأداء المالي وحسابات المدينين"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>{lang === "en" ? "Days in A/R" : "أيام حسابات المدينين"}</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.5rem" }}>{metrics.days_in_ar} {lang === "en" ? "days" : "يوم"}</div>
        </div>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>{lang === "en" ? "Clean Claim Rate" : "معدل المطالبات النظيفة"}</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.5rem" }}>{metrics.collection_rate_pct}%</div>
        </div>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>{lang === "en" ? "Claim Denial Rate" : "معدل رفض المطالبات"}</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: targetColor, marginTop: "0.5rem" }}>{metrics.denial_rate_pct}%</div>
        </div>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>{lang === "en" ? "Net Collection Rate" : "صافي معدل التحصيل"}</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.5rem" }}>{metrics.net_collection_rate_pct}%</div>
        </div>
      </section>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        {/* Financial Summary */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "1.5rem" }}>
            {lang === "en" ? "Financial Rollup Summary" : "ملخص تسوية الإيرادات والتحصيل"}
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{lang === "en" ? "Gross Charges" : "إجمالي الرسوم الباهظة"}</span>
              <span style={{ fontWeight: 600 }}>SAR {metrics.gross_charges.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{lang === "en" ? "Net Expected Revenue" : "صافي الإيرادات المتوقعة"}</span>
              <span style={{ fontWeight: 600 }}>SAR {metrics.net_revenue.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{lang === "en" ? "Contractual Adjustments" : "التسويات التعاقدية"}</span>
              <span style={{ fontWeight: 600 }}>SAR {metrics.adjustments.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{lang === "en" ? "Cash Collected" : "النقد المحصل فعلياً"}</span>
              <span style={{ fontWeight: 600, color: "#22c55e" }}>SAR {totalCollected.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{lang === "en" ? "Outstanding Balance" : "الرصيد المتبقي المستحق"}</span>
              <span style={{ fontWeight: 600, color: "#ef4444" }}>SAR {metrics.outstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* AR Aging */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "1.5rem" }}>
            {lang === "en" ? "A/R Aging Buckets" : "أعمار الديون المستحقة"}
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {aging.map((item) => (
              <div key={item.bucket} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--color-text)" }}>{item.bucket}</span>
                  <span style={{ fontWeight: 600 }}>SAR {item.amount.toLocaleString()}</span>
                </div>
                <div style={{ height: "8px", background: "rgba(0,0,0,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.min(100, (item.amount / metrics.total_ar) * 100)}%`,
                    height: "100%",
                    background: "var(--color-primary)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
