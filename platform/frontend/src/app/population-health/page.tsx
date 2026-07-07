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

  const isAr = lang === "ar";

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === "en" ? "CyMed Population Health" : "الصحة السكانية سايمد"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Risk Stratification, Preventive Care Gaps & Epidemiological Surveillance" : "تصنيف المخاطر، فجوات الرعاية الوقائية والمراقبة الوبائية"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      {/* KPI Cards */}
      <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="cy-card p-5">
          <div className="text-sm font-medium text-ink/50">{lang === "en" ? "Chronic Registry Enrollment" : "المسجلين في السجلات المزمنة"}</div>
          <div className="mt-2 text-2xl font-bold">{metrics.enrolled_patients.toLocaleString()}</div>
        </div>
        <div className="cy-card p-5">
          <div className="text-sm font-medium text-ink/50">{lang === "en" ? "HEDIS Compliance Rate" : "معدل الامتثال الوقائي"}</div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{metrics.compliance_rate_pct}%</div>
        </div>
        <div className="cy-card p-5">
          <div className="text-sm font-medium text-ink/50">{lang === "en" ? "Active Outbreaks" : "فاشيات وبائية نشطة"}</div>
          <div className="mt-2 text-2xl font-bold text-red-400">{metrics.active_outbreaks}</div>
        </div>
        <div className="cy-card p-5">
          <div className="text-sm font-medium text-ink/50">{lang === "en" ? "Total Risk Profiles" : "إجمالي ملفات تصنيف المخاطر"}</div>
          <div className="mt-2 text-2xl font-bold">{metrics.total_risk_evaluated.toLocaleString()}</div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Risk Stratification */}
        <div className="cy-card p-6">
          <h2 className="mb-6 text-lg font-bold">
            {lang === "en" ? "Clinical Risk Stratification" : "تصنيف المخاطر السريرية"}
          </h2>
          <div className="grid gap-4">
            {riskDist.map((item) => (
              <div key={item.level} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{lang === "en" ? item.level : item.level_ar}</span>
                  <span className="text-ink/50">
                    {item.count.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Epidemiology Alerts */}
        <div className="cy-card p-6">
          <h2 className="mb-6 text-lg font-bold">
            {lang === "en" ? "Epidemiological Surveillance & Alerts" : "التنبيهات والمراقبة الوبائية"}
          </h2>
          <div className="grid gap-4">
            <div className="rounded-r-lg border-l-4 border-red-500 bg-red-500/5 px-4 py-3">
              <div className="text-sm font-semibold">{lang === "en" ? "Outbreak Detected: Influenza A" : "تم رصد فاشية: إنفلونزا أ"}</div>
              <div className="mt-1 text-[13px] text-ink/50">
                {lang === "en" ? "5 confirmed cases in Ward A. Increased surveillance active." : "5 حالات مؤكدة في الجناح أ. تفعيل المراقبة المكثفة."}
              </div>
            </div>
            <div className="rounded-r-lg border-l-4 border-amber-500 bg-amber-500/5 px-4 py-3">
              <div className="text-sm font-semibold">{lang === "en" ? "Mandatory Notification logged to MoH" : "تسجيل إخطار إلزامي لوزارة الصحة"}</div>
              <div className="mt-1 text-[13px] text-ink/50">
                {lang === "en" ? "Active tuberculosis case reported from Pulmonology clinic." : "الإبلاغ عن حالة سل نشطة من عيادة الأمراض الصدرية."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
