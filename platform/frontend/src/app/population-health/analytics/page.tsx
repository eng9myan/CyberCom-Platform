"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Prevalence { condition: string; condition_ar: string; count: number; pct: number; trend: "up" | "stable" | "down"; }
interface RiskBand { label: string; label_ar: string; count: number; color: string; }
interface AgeGroup { age: string; total: number; high_risk: number; }

const MOCK_PREVALENCE: Prevalence[] = [
  { condition: "Hypertension", condition_ar: "ارتفاع ضغط الدم", count: 2640, pct: 24.0, trend: "up" },
  { condition: "Type 2 Diabetes", condition_ar: "السكري النوع الثاني", count: 1980, pct: 18.0, trend: "up" },
  { condition: "Obesity (BMI ≥30)", condition_ar: "السمنة", count: 1760, pct: 16.0, trend: "up" },
  { condition: "Dyslipidemia", condition_ar: "اضطراب الدهون", count: 1540, pct: 14.0, trend: "stable" },
  { condition: "Asthma / COPD", condition_ar: "الربو / الانسداد الرئوي", count: 990, pct: 9.0, trend: "stable" },
  { condition: "Depression / Anxiety", condition_ar: "الاكتئاب / القلق", count: 880, pct: 8.0, trend: "up" },
  { condition: "Chronic Kidney Disease", condition_ar: "الفشل الكلوي المزمن", count: 550, pct: 5.0, trend: "stable" },
  { condition: "Coronary Artery Disease", condition_ar: "أمراض القلب التاجية", count: 440, pct: 4.0, trend: "down" },
];
const MOCK_RISK: RiskBand[] = [
  { label: "Low Risk", label_ar: "خطر منخفض", count: 7150, color: "#22c55e" },
  { label: "Moderate Risk", label_ar: "خطر متوسط", count: 2420, color: "#f59e0b" },
  { label: "High Risk", label_ar: "خطر مرتفع", count: 880, color: "#ef4444" },
  { label: "Very High Risk", label_ar: "خطر مرتفع جداً", count: 550, color: "#7f1d1d" },
];
const MOCK_AGE: AgeGroup[] = [
  { age: "0-17", total: 1200, high_risk: 48 }, { age: "18-34", total: 2100, high_risk: 210 },
  { age: "35-49", total: 2800, high_risk: 560 }, { age: "50-64", total: 2400, high_risk: 840 },
  { age: "65-74", total: 1400, high_risk: 700 }, { age: "75+", total: 900, high_risk: 630 },
];
const TREND_ICON: Record<string, string> = { up: "↑", stable: "→", down: "↓" };
const TREND_COLOR: Record<string, string> = { up: "#ef4444", stable: "#22D3EE", down: "#22c55e" };

export default function PopHealthAnalyticsPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [prevalence, setPrevalence] = useState<Prevalence[]>(MOCK_PREVALENCE);
  const [risk, setRisk] = useState<RiskBand[]>(MOCK_RISK);
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";
  const totalPop = risk.reduce((a, r) => a + r.count, 0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<Prevalence[]>("/api/v1/population-health/analytics/prevalence/"),
      apiFetch<RiskBand[]>("/api/v1/population-health/analytics/risk-distribution/"),
    ]).then(([p, r]) => { if (p && p.length) setPrevalence(p); if (r && r.length) setRisk(r); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "تحليلات صحة المجتمع" : "Population Health Analytics"}</h1>
          <p className="text-sm text-ink/50">{isAr ? `مجموع المجتمع: ${totalPop.toLocaleString()} مريض` : `Total population: ${totalPop.toLocaleString()} patients`}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <a href="/population-health" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← صحة المجتمع" : "← Population Health"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <div className="cy-card p-5">
          <div className="mb-4 text-lg font-bold">{isAr ? "انتشار الأمراض المزمنة" : "Chronic Disease Prevalence"}</div>
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-ink/10">
              <th className={`px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "الحالة" : "Condition"}</th>
              <th className={`px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "العدد" : "Count"}</th>
              <th className={`px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>%</th>
              <th className={`px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "اتجاه" : "Trend"}</th>
            </tr></thead>
            <tbody>{prevalence.map(p => (
              <tr key={p.condition} className="border-b border-ink/10">
                <td className="px-3 py-2.5 text-sm">{isAr ? p.condition_ar : p.condition}</td>
                <td className="px-3 py-2.5 text-sm">{p.count.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded" style={{ width: `${p.pct * 3}px`, background: "#22D3EE" }} />
                    <span className="font-semibold">{p.pct}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-sm font-bold" style={{ color: TREND_COLOR[p.trend] }}>{TREND_ICON[p.trend]}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="cy-card p-5">
          <div className="mb-4 text-lg font-bold">{isAr ? "توزيع مستوى المخاطر" : "Risk Score Distribution"}</div>
          {risk.map(r => (
            <div key={r.label} className="mb-4">
              <div className="mb-1 flex justify-between">
                <span className="text-sm font-semibold">{isAr ? r.label_ar : r.label}</span>
                <span className="text-sm font-bold" style={{ color: r.color }}>{r.count.toLocaleString()} ({Math.round(r.count / totalPop * 100)}%)</span>
              </div>
              <div className="h-4 overflow-hidden rounded-lg bg-ink/[0.06]">
                <div className="h-full rounded-lg" style={{ width: `${(r.count / totalPop) * 100}%`, background: r.color }} />
              </div>
            </div>
          ))}
          <div className="mt-6">
            <div className="mb-4 text-lg font-bold">{isAr ? "المخاطرة حسب الفئة العمرية" : "High Risk by Age Group"}</div>
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-ink/10">
                <th className={`px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "العمر" : "Age"}</th>
                <th className={`px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المجموع" : "Total"}</th>
                <th className={`px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "مخاطر مرتفعة" : "High Risk"}</th>
                <th className={`px-3 py-2.5 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>%</th>
              </tr></thead>
              <tbody>{MOCK_AGE.map(a => (
                <tr key={a.age} className="border-b border-ink/10">
                  <td className="px-3 py-2.5 text-sm">{a.age}</td>
                  <td className="px-3 py-2.5 text-sm">{a.total.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-sm font-semibold text-amber-400">{a.high_risk}</td>
                  <td className="px-3 py-2.5 text-sm">{Math.round(a.high_risk / a.total * 100)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
