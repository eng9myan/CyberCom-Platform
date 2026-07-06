"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface PopHealthRiskRaw {
  total?: number;
  by_category?: { low: number; moderate: number; high: number; very_high: number };
}

interface PopHealthGapsRaw {
  total_gaps?: number;
  closed_mtd?: number;
  compliance_rate?: number;
}

interface PopHealthMetrics {
  enrolled_patients: number;
  open_care_gaps: number;
  gaps_closed_mtd: number;
  compliance_rate_pct: number;
  active_outbreaks: number;
  total_risk_evaluated: number;
}

interface RiskDistribution {
  level: string;
  level_ar: string;
  count: number;
  percentage: number;
  color: string;
}

const METRICS: PopHealthMetrics = {
  enrolled_patients: 8432,
  open_care_gaps: 12005,
  gaps_closed_mtd: 842,
  compliance_rate_pct: 84.7,
  active_outbreaks: 2,
  total_risk_evaluated: 45832,
};

const RISK_DIST: RiskDistribution[] = [
  { level: "Low Risk", level_ar: "مخاطر منخفضة", count: 28415, percentage: 62, color: "#22c55e" },
  { level: "Moderate Risk", level_ar: "مخاطر متوسطة", count: 11000, percentage: 24, color: "#3b82f6" },
  { level: "High Risk", level_ar: "مخاطر عالية", count: 5041, percentage: 11, color: "#f59e0b" },
  { level: "Very High Risk", level_ar: "مخاطر عالية جداً", count: 1376, percentage: 3, color: "#ef4444" },
];

export default function PopulationHealthDashboard() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [metrics, setMetrics] = useState<PopHealthMetrics>(METRICS);
  const [riskDist, setRiskDist] = useState<RiskDistribution[]>(RISK_DIST);
  useEffect(() => {
    async function fetchPopHealthData() {
      try {
        const riskSummary = await apiFetch<PopHealthRiskRaw>("/api/v1/population-health/risk/summary/");
        const gapsSummary = await apiFetch<PopHealthGapsRaw>("/api/v1/population-health/gaps/summary/");

        if (riskSummary ?? gapsSummary) {
          const totalRiskEval = riskSummary?.total ?? 45832;
          setMetrics({
            enrolled_patients: 8432,
            open_care_gaps: gapsSummary?.total_gaps ?? 12005,
            gaps_closed_mtd: gapsSummary?.closed_mtd ?? 842,
            compliance_rate_pct: gapsSummary?.compliance_rate ?? 84.7,
            active_outbreaks: 2,
            total_risk_evaluated: totalRiskEval,
          });

          if (riskSummary?.by_category) {
            const raw = riskSummary.by_category;
            setRiskDist([
              { level: "Low Risk", level_ar: "مخاطر منخفضة", count: Math.round(totalRiskEval * (raw.low / 100)), percentage: raw.low, color: "#22c55e" },
              { level: "Moderate Risk", level_ar: "مخاطر متوسطة", count: Math.round(totalRiskEval * (raw.moderate / 100)), percentage: raw.moderate, color: "#3b82f6" },
              { level: "High Risk", level_ar: "مخاطر عالية", count: Math.round(totalRiskEval * (raw.high / 100)), percentage: raw.high, color: "#f59e0b" },
              { level: "Very High Risk", level_ar: "مخاطر عالية جداً", count: Math.round(totalRiskEval * (raw.very_high / 100)), percentage: raw.very_high, color: "#ef4444" },
            ]);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live Population Health data, using mock data:", err);
      }
    }
    void fetchPopHealthData();
  }, []);

  return (
    <div className="dashboard-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Population Health" : "الصحة السكانية سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Risk Stratification, Preventive Care Gaps & Epidemiological Surveillance" : "تصنيف المخاطر، فجوات الرعاية الوقائية والمراقبة الوبائية"}
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
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>{lang === "en" ? "Chronic Registry Enrollment" : "المسجلين في السجلات المزمنة"}</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.5rem" }}>{metrics.enrolled_patients.toLocaleString()}</div>
        </div>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>{lang === "en" ? "HEDIS Compliance Rate" : "معدل الامتثال الوقائي"}</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#22c55e", marginTop: "0.5rem" }}>{metrics.compliance_rate_pct}%</div>
        </div>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>{lang === "en" ? "Active Outbreaks" : "فاشيات وبائية نشطة"}</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#ef4444", marginTop: "0.5rem" }}>{metrics.active_outbreaks}</div>
        </div>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>{lang === "en" ? "Total Risk Profiles" : "إجمالي ملفات تصنيف المخاطر"}</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.5rem" }}>{metrics.total_risk_evaluated.toLocaleString()}</div>
        </div>
      </section>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Risk Stratification */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "1.5rem" }}>
            {lang === "en" ? "Clinical Risk Stratification" : "تصنيف المخاطر السريرية"}
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {riskDist.map((item) => (
              <div key={item.level} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{lang === "en" ? item.level : item.level_ar}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {item.count.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div style={{ height: "8px", background: "rgba(0,0,0,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${item.percentage}%`,
                    height: "100%",
                    background: item.color,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Epidemiology Alerts */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "1.5rem" }}>
            {lang === "en" ? "Epidemiological Surveillance & Alerts" : "التنبيهات والمراقبة الوبائية"}
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ borderLeft: "4px solid #ef4444", padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.05)", borderRadius: "0 8px 8px 0" }}>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{lang === "en" ? "Outbreak Detected: Influenza A" : "تم رصد فاشية: إنفلونزا أ"}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                {lang === "en" ? "5 confirmed cases in Ward A. Increased surveillance active." : "5 حالات مؤكدة في الجناح أ. تفعيل المراقبة المكثفة."}
              </div>
            </div>
            <div style={{ borderLeft: "4px solid #f59e0b", padding: "0.75rem 1rem", background: "rgba(245, 158, 11, 0.05)", borderRadius: "0 8px 8px 0" }}>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{lang === "en" ? "Mandatory Notification logged to MoH" : "تسجيل إخطار إلزامي لوزارة الصحة"}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                {lang === "en" ? "Active tuberculosis case reported from Pulmonology clinic." : "الإبلاغ عن حالة سل نشطة من عيادة الأمراض الصدرية."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
