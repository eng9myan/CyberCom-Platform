"use client";
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
  const [lang, setLang] = useState<"en" | "ar">("en");
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

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1100, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "فجوات الرعاية" : "Care Gaps"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{filtered.length} {isAr ? "مقياس" : "quality measures"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/population-health" style={s.btn}>{isAr ? "← صحة المجتمع" : "← Population Health"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {categories.map(c => <button key={c} onClick={() => setFilter(c)} style={{ ...s.btn, background: filter === c ? "#22D3EE" : "var(--color-surface)", color: filter === c ? "#000" : "var(--color-text)", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>{c === "all" ? (isAr ? "الكل" : "All") : c}</button>)}
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: "rgba(34,211,238,0.05)" }}>
              <th style={s.th}>{isAr ? "المقياس" : "Measure"}</th>
              <th style={s.th}>{isAr ? "الفئة" : "Category"}</th>
              <th style={s.th}>{isAr ? "المؤهلون" : "Eligible"}</th>
              <th style={s.th}>{isAr ? "معدل الإنجاز" : "Completion Rate"}</th>
              <th style={s.th}>{isAr ? "الأولوية" : "Priority"}</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => {
              const pct = Math.round(g.patients_completed / g.patients_eligible * 100);
              const gap = g.patients_eligible - g.patients_completed;
              return (
                <tr key={g.id}>
                  <td style={s.td}><div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{isAr ? g.measure_ar : g.measure}</div><div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{isAr ? "فجوة" : "Gap"}: {gap.toLocaleString()} {isAr ? "مريض" : "patients"}</div></td>
                  <td style={s.td}>{g.category}</td>
                  <td style={s.td}>{g.patients_eligible.toLocaleString()}</td>
                  <td style={s.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: 8, background: "var(--color-background)", borderRadius: 4 }}><div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} /></div>
                      <span style={{ fontWeight: 700, minWidth: 38, fontSize: "0.82rem" }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={{ background: `${PRI_COLOR[g.priority]}22`, color: PRI_COLOR[g.priority], border: `1px solid ${PRI_COLOR[g.priority]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>{g.priority}</span></td>
                  <td style={s.td}><button style={{ background: "#22D3EE22", color: "#22D3EE", border: "1px solid #22D3EE55", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>{isAr ? "قائمة التواصل" : "Outreach List"}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
