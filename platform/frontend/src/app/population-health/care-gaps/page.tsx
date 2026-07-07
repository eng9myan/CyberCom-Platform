"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface CareGap { id: string; measure: string; measure_ar: string; category: string; patients_eligible: number; patients_completed: number; priority: "high" | "medium" | "low"; last_updated: string; }
const MOCK: CareGap[] = [
  { id: "cg-01", measure: "Diabetic HbA1c Control (<7%)", measure_ar: "السيطرة على HbA1c لمرضى السكري (<7%)", category: "Diabetes", patients_eligible: 1980, patients_completed: 1386, priority: "high", last_updated: "2026-06-30" },
  { id: "cg-02", measure: "Blood Pressure Control (<130/80)", measure_ar: "السيطرة على ضغط الدم (<130/80)", category: "Hypertension", patients_eligible: 2640, patients_completed: 1452, priority: "high", last_updated: "2026-06-30" },
  { id: "cg-03", measure: "Breast Cancer Screening (Mammogram)", measure_ar: "فحص سرطان الثدي", category: "Preventive Care", patients_eligible: 1100, patients_completed: 638, priority: "high", last_updated: "2026-06-25" },
  { id: "cg-04", measure: "Colorectal Cancer Screening", measure_ar: "فحص سرطان القولون", category: "Preventive Care", patients_eligible: 1800, patients_completed: 900, priority: "high", last_updated: "2026-06-20" },
  { id: "cg-05", measure: "Annual Eye Exam (Diabetics)", measure_ar: "الفحص السنوي للعيون (مرضى السكري)", category: "Diabetes", patients_eligible: 1980, patients_completed: 1188, priority: "medium", last_updated: "2026-06-28" },
  { id: "cg-06", measure: "Statin Therapy (CAD/Diabetes)", measure_ar: "علاج الستاتين", category: "Cardiology", patients_eligible: 1240, patients_completed: 868, priority: "medium", last_updated: "2026-06-15" },
  { id: "cg-07", measure: "Flu Vaccination (Annual)", measure_ar: "لقاح الإنفلونزا السنوي", category: "Immunization", patients_eligible: 11000, patients_completed: 7150, priority: "medium", last_updated: "2026-06-01" },
  { id: "cg-08", measure: "COPD Spirometry Assessment", measure_ar: "قياس التنفس لمرضى الانسداد الرئوي", category: "Respiratory", patients_eligible: 990, patients_completed: 495, priority: "medium", last_updated: "2026-05-30" },
  { id: "cg-09", measure: "Depression Screening (PHQ-9)", measure_ar: "فحص الاكتئاب", category: "Mental Health", patients_eligible: 880, patients_completed: 352, priority: "medium", last_updated: "2026-05-20" },
  { id: "cg-10", measure: "Cervical Cancer Screening (Pap)", measure_ar: "فحص عنق الرحم", category: "Preventive Care", patients_eligible: 900, patients_completed: 540, priority: "low", last_updated: "2026-05-15" },
  { id: "cg-11", measure: "Pneumococcal Vaccination (65+)", measure_ar: "تطعيم المكورات الرئوية (65+)", category: "Immunization", patients_eligible: 680, patients_completed: 476, priority: "low", last_updated: "2026-04-01" },
  { id: "cg-12", measure: "Bone Density Scan (Women 65+)", measure_ar: "فحص كثافة العظام للنساء (65+)", category: "Preventive Care", patients_eligible: 420, patients_completed: 168, priority: "low", last_updated: "2026-03-15" },
];
const PRI_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

export default function CareGapsPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [gaps, setGaps] = useState<CareGap[]>(MOCK);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<CareGap[]>("/api/v1/population-health/care-gaps/").then(d => { if (d && d.length) setGaps(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(gaps.map(g => g.category)))];
  const filtered = filter === "all" ? gaps : gaps.filter(g => g.category === filter);

  return (
    <div className="mx-auto max-w-5xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "فجوات الرعاية" : "Care Gaps"}</h1>
          <p className="text-sm text-ink/50">{filtered.length} {isAr ? "مقياس" : "quality measures"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <a href="/population-health" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← صحة المجتمع" : "← Population Health"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${filter === c ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}
          >
            {c === "all" ? (isAr ? "الكل" : "All") : c}
          </button>
        ))}
      </div>
      <div className="cy-card overflow-hidden p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المقياس" : "Measure"}</th>
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "الفئة" : "Category"}</th>
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المؤهلون" : "Eligible"}</th>
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "معدل الإنجاز" : "Completion Rate"}</th>
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "الأولوية" : "Priority"}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => {
              const pct = Math.round(g.patients_completed / g.patients_eligible * 100);
              const gap = g.patients_eligible - g.patients_completed;
              return (
                <tr key={g.id} className="border-b border-ink/10">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold">{isAr ? g.measure_ar : g.measure}</div>
                    <div className="text-[11px] text-ink/50">{isAr ? "فجوة" : "Gap"}: {gap.toLocaleString()} {isAr ? "مريض" : "patients"}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{g.category}</td>
                  <td className="px-4 py-3 text-sm">{g.patients_eligible.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded bg-ink/[0.06]">
                        <div className="h-full rounded" style={{ width: `${pct}%`, background: pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span className="min-w-[38px] text-[13px] font-bold">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ background: `${PRI_COLOR[g.priority]}22`, color: PRI_COLOR[g.priority], border: `1px solid ${PRI_COLOR[g.priority]}55` }}>{g.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="rounded px-2.5 py-1 text-xs font-semibold" style={{ background: "#22D3EE22", color: "#22D3EE", border: "1px solid #22D3EE55" }}>{isAr ? "قائمة التواصل" : "Outreach List"}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
