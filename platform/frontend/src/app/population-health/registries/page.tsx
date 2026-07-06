"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Registry { id: string; name: string; name_ar: string; description: string; patients: number; high_risk: number; last_updated: string; key_metric: string; key_value: string; }
interface RegPatient { id: string; name: string; name_ar: string; mrn: string; age: number; risk: "low" | "medium" | "high"; last_visit: string; next_action: string; }
const MOCK_REGISTRIES: Registry[] = [
  { id: "r-dm", name: "Diabetes Registry", name_ar: "سجل مرضى السكري", description: "Type 1 & Type 2 Diabetes patients requiring structured follow-up.", patients: 1980, high_risk: 396, last_updated: "2026-06-30", key_metric: "Avg HbA1c", key_value: "7.9%" },
  { id: "r-htn", name: "Hypertension Registry", name_ar: "سجل مرضى ارتفاع الضغط", description: "Essential & secondary hypertension patients on active treatment.", patients: 2640, high_risk: 528, last_updated: "2026-06-30", key_metric: "BP Control Rate", key_value: "55%" },
  { id: "r-asthma", name: "Asthma / COPD Registry", name_ar: "سجل الربو والانسداد الرئوي", description: "Patients with chronic respiratory conditions requiring monitoring.", patients: 990, high_risk: 198, last_updated: "2026-06-28", key_metric: "ER Visits/yr", key_value: "0.8" },
  { id: "r-onco", name: "Oncology Registry", name_ar: "سجل مرضى الأورام", description: "Active cancer patients and survivors under surveillance.", patients: 320, high_risk: 192, last_updated: "2026-06-25", key_metric: "5-yr Survival", key_value: "68%" },
];
const MOCK_PATIENTS: RegPatient[] = [
  { id: "p1", name: "Fatima Al-Harbi", name_ar: "فاطمة الحربي", mrn: "MRN-002145", age: 52, risk: "high", last_visit: "2026-06-20", next_action: "HbA1c overdue — contact patient" },
  { id: "p2", name: "Yousef Al-Otaibi", name_ar: "يوسف العتيبي", mrn: "MRN-002146", age: 61, risk: "medium", last_visit: "2026-05-15", next_action: "Annual eye exam due" },
  { id: "p3", name: "Mariam Al-Ghamdi", name_ar: "مريم الغامدي", mrn: "MRN-002147", age: 45, risk: "low", last_visit: "2026-06-01", next_action: "Next review in 3 months" },
  { id: "p4", name: "Ibrahim Al-Harthy", name_ar: "إبراهيم الحارثي", mrn: "MRN-002148", age: 68, risk: "high", last_visit: "2026-04-10", next_action: "Missed 2 appointments — urgent outreach" },
  { id: "p5", name: "Nora Al-Qahtani", name_ar: "نورة القحطاني", mrn: "MRN-002149", age: 39, risk: "medium", last_visit: "2026-06-15", next_action: "Medication refill needed" },
];
const RISK_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

export default function RegistriesPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [registries, setRegistries] = useState<Registry[]>(MOCK_REGISTRIES);
  const [selected, setSelected] = useState<Registry | null>(null);
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Registry[]>("/api/v1/population-health/registries/").then(d => { if (d && d.length) setRegistries(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1100, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: "1rem", marginBottom: "2rem" },
    regCard: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1.25rem", cursor: "pointer" as const, transition: "border-color 0.2s" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "سجلات المرضى المزمنين" : "Disease Registries"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{registries.length} {isAr ? "سجل نشط" : "active registries"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/population-health" style={s.btn}>{isAr ? "← صحة المجتمع" : "← Population Health"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.grid}>
        {registries.map(r => (
          <div key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)} style={{ ...s.regCard, borderColor: selected?.id === r.id ? "#22D3EE" : "var(--color-border)", background: selected?.id === r.id ? "rgba(34,211,238,0.06)" : "var(--color-surface)" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#22D3EE", marginBottom: 4 }}>{isAr ? r.name_ar : r.name}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>{r.description}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div style={{ textAlign: "center", padding: "0.5rem", background: "var(--color-background)", borderRadius: 6 }}>
                <div style={{ fontWeight: 700, color: "#22D3EE" }}>{r.patients.toLocaleString()}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{isAr ? "مريض" : "Patients"}</div>
              </div>
              <div style={{ textAlign: "center", padding: "0.5rem", background: "var(--color-background)", borderRadius: 6 }}>
                <div style={{ fontWeight: 700, color: "#ef4444" }}>{r.high_risk.toLocaleString()}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{isAr ? "مخاطر عالية" : "High Risk"}</div>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{r.key_metric}</span>
              <span style={{ fontWeight: 700, color: "#22D3EE" }}>{r.key_value}</span>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)", fontWeight: 700, color: "#22D3EE" }}>{isAr ? selected.name_ar : selected.name} — {isAr ? "قائمة المرضى" : "Patient List"}</div>
          <table style={s.table}>
            <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "المريض" : "Patient"}</th><th style={s.th}>{isAr ? "العمر" : "Age"}</th><th style={s.th}>{isAr ? "المخاطرة" : "Risk"}</th><th style={s.th}>{isAr ? "آخر زيارة" : "Last Visit"}</th><th style={s.th}>{isAr ? "الإجراء التالي" : "Next Action"}</th></tr></thead>
            <tbody>{MOCK_PATIENTS.map(p => <tr key={p.id}><td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? p.name_ar : p.name}</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{p.mrn}</div></td><td style={s.td}>{p.age}</td><td style={s.td}><span style={{ background: `${RISK_COLOR[p.risk]}22`, color: RISK_COLOR[p.risk], border: `1px solid ${RISK_COLOR[p.risk]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>{p.risk}</span></td><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.82rem" }}>{p.last_visit}</td><td style={s.td}><span style={{ fontSize: "0.82rem", color: p.risk === "high" ? "#fca5a5" : "var(--color-text)" }}>{p.next_action}</span></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
