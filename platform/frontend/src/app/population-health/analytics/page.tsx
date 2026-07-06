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

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    sectionTitle: { fontSize: "1.05rem", fontWeight: 700, color: "#22D3EE", marginBottom: "1rem" },
    twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1.25rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.6rem 0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.82rem" },
    td: { padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "تحليلات صحة المجتمع" : "Population Health Analytics"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{isAr ? `مجموع المجتمع: ${totalPop.toLocaleString()} مريض` : `Total population: ${totalPop.toLocaleString()} patients`}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/population-health" style={s.btn}>{isAr ? "← صحة المجتمع" : "← Population Health"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      <div style={s.twoCol}>
        <div style={s.card}>
          <div style={s.sectionTitle}>{isAr ? "انتشار الأمراض المزمنة" : "Chronic Disease Prevalence"}</div>
          <table style={s.table}>
            <thead><tr><th style={s.th}>{isAr ? "الحالة" : "Condition"}</th><th style={s.th}>{isAr ? "العدد" : "Count"}</th><th style={s.th}>%</th><th style={s.th}>{isAr ? "اتجاه" : "Trend"}</th></tr></thead>
            <tbody>{prevalence.map(p => (
              <tr key={p.condition}>
                <td style={s.td}>{isAr ? p.condition_ar : p.condition}</td>
                <td style={s.td}>{p.count.toLocaleString()}</td>
                <td style={s.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: `${p.pct * 3}px`, height: 8, background: "#22D3EE44", borderRadius: 4, position: "relative" as const }}>
                      <div style={{ width: `${p.pct * 3}px`, height: 8, background: "#22D3EE", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{p.pct}%</span>
                  </div>
                </td>
                <td style={{ ...s.td, color: TREND_COLOR[p.trend], fontWeight: 700 }}>{TREND_ICON[p.trend]}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={s.card}>
          <div style={s.sectionTitle}>{isAr ? "توزيع مستوى المخاطر" : "Risk Score Distribution"}</div>
          {risk.map(r => (
            <div key={r.label} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{isAr ? r.label_ar : r.label}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: r.color }}>{r.count.toLocaleString()} ({Math.round(r.count / totalPop * 100)}%)</span>
              </div>
              <div style={{ height: 16, background: "var(--color-background)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ width: `${(r.count / totalPop) * 100}%`, height: "100%", background: r.color, borderRadius: 8 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: "1.5rem" }}>
            <div style={s.sectionTitle}>{isAr ? "المخاطرة حسب الفئة العمرية" : "High Risk by Age Group"}</div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>{isAr ? "العمر" : "Age"}</th><th style={s.th}>{isAr ? "المجموع" : "Total"}</th><th style={s.th}>{isAr ? "مخاطر مرتفعة" : "High Risk"}</th><th style={s.th}>%</th></tr></thead>
              <tbody>{MOCK_AGE.map(a => <tr key={a.age}><td style={s.td}>{a.age}</td><td style={s.td}>{a.total.toLocaleString()}</td><td style={{ ...s.td, color: "#f59e0b", fontWeight: 600 }}>{a.high_risk}</td><td style={s.td}>{Math.round(a.high_risk / a.total * 100)}%</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
