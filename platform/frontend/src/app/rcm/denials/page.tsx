"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Denial { id: string; claim_no: string; patient: string; patient_ar: string; payer: string; amount: number; denial_reason: string; denial_code: string; days_to_deadline: number; status: "new" | "in_appeal" | "won" | "lost" | "write_off"; }
const MOCK: Denial[] = [
  { id: "d01", claim_no: "CLM-2026-0803", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", payer: "AXA Gulf", amount: 2800, denial_reason: "Authorization Required", denial_code: "CO-197", days_to_deadline: 18, status: "in_appeal" },
  { id: "d02", claim_no: "CLM-2026-0811", patient: "Lujain Al-Anzi", patient_ar: "لجين العنزي", payer: "AXA Gulf", amount: 3100, denial_reason: "Duplicate Claim", denial_code: "CO-18", days_to_deadline: 25, status: "new" },
  { id: "d03", claim_no: "CLM-2026-0815", patient: "Faris Al-Ghamdi", patient_ar: "فارس الغامدي", payer: "Tawuniya", amount: 9500, denial_reason: "Medical Necessity Not Established", denial_code: "CO-50", days_to_deadline: 8, status: "in_appeal" },
  { id: "d04", claim_no: "CLM-2026-0816", patient: "Afnan Al-Otaibi", patient_ar: "أفنان العتيبي", payer: "Bupa Arabia", amount: 4200, denial_reason: "Service Not Covered", denial_code: "CO-96", days_to_deadline: 2, status: "new" },
  { id: "d05", claim_no: "CLM-2026-0817", patient: "Rawan Al-Malki", patient_ar: "روان المالكي", payer: "MEDGULF", amount: 1800, denial_reason: "Incorrect Coding", denial_code: "CO-4", days_to_deadline: 30, status: "won" },
  { id: "d06", claim_no: "CLM-2026-0818", patient: "Hamad Al-Dawsari", patient_ar: "حمد الدوسري", payer: "AXA Gulf", amount: 6700, denial_reason: "Non-Participating Provider", denial_code: "CO-242", days_to_deadline: 0, status: "lost" },
  { id: "d07", claim_no: "CLM-2026-0819", patient: "Saud Al-Qurashi", patient_ar: "سعود القرشي", payer: "Tawuniya", amount: 2100, denial_reason: "Timely Filing", denial_code: "CO-29", days_to_deadline: 0, status: "write_off" },
  { id: "d08", claim_no: "CLM-2026-0820", patient: "Dalal Al-Zahrani", patient_ar: "دلال الزهراني", payer: "Bupa Arabia", amount: 5500, denial_reason: "Authorization Required", denial_code: "CO-197", days_to_deadline: 14, status: "new" },
  { id: "d09", claim_no: "CLM-2026-0821", patient: "Mona Al-Harbi", patient_ar: "منى الحربي", payer: "MEDGULF", amount: 3800, denial_reason: "Benefit Exhausted", denial_code: "CO-119", days_to_deadline: 20, status: "in_appeal" },
  { id: "d10", claim_no: "CLM-2026-0822", patient: "Nasser Al-Ghamdi", patient_ar: "ناصر الغامدي", payer: "AXA Gulf", amount: 14500, denial_reason: "Medical Necessity Not Established", denial_code: "CO-50", days_to_deadline: 5, status: "new" },
  { id: "d11", claim_no: "CLM-2026-0823", patient: "Reem Al-Malki", patient_ar: "ريم المالكي", payer: "Tawuniya", amount: 2200, denial_reason: "Duplicate Claim", denial_code: "CO-18", days_to_deadline: 22, status: "won" },
  { id: "d12", claim_no: "CLM-2026-0824", patient: "Badr Al-Rashidi", patient_ar: "بدر الرشيدي", payer: "Bupa Arabia", amount: 7800, denial_reason: "Incorrect Coding", denial_code: "CO-4", days_to_deadline: 12, status: "in_appeal" },
];
const STATUS_COLOR: Record<string, string> = { new: "#f59e0b", in_appeal: "#22D3EE", won: "#22c55e", lost: "#ef4444", write_off: "#6b7280" };
const REASON_GROUPS: Record<string, number> = {};
MOCK.forEach(d => { REASON_GROUPS[d.denial_reason] = (REASON_GROUPS[d.denial_reason] ?? 0) + 1; });

export default function DenialsPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [denials, setDenials] = useState<Denial[]>(MOCK);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Denial[]>("/api/v1/rcm/denials/").then(d => { if (d && d.length) setDenials(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAppeal = async (id: string) => {
    try { await apiFetch(`/api/v1/rcm/denials/${id}/appeal/`, { method: "POST" }); } catch {}
    setDenials(prev => prev.map(d => d.id === id ? { ...d, status: "in_appeal" as const } : d));
  };

  const filtered = filter === "all" ? denials : denials.filter(d => d.status === filter);
  const totalAtRisk = denials.filter(d => ["new", "in_appeal"].includes(d.status)).reduce((a, d) => a + d.amount, 0);
  const urgent = denials.filter(d => d.days_to_deadline > 0 && d.days_to_deadline <= 7 && ["new", "in_appeal"].includes(d.status));

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "1rem", marginBottom: "1.25rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "إدارة الرفض والاستئناف" : "Denial Management & Appeals"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{denials.length} {isAr ? "مطالبة مرفوضة" : "denials"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/rcm" style={s.btn}>{isAr ? "← دورة الإيرادات" : "← RCM"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      {urgent.length > 0 && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#fca5a5", fontSize: "0.875rem" }}>⚠ {urgent.length} {isAr ? "مطالبة تنتهي مهلتها خلال 7 أيام — استئناف فوري مطلوب" : "denial(s) with deadline ≤7 days — immediate action required"}</div>}
      <div style={s.metricGrid}>
        {[
          { label: isAr ? "مبالغ في خطر" : "At Risk Amount", value: `SAR ${(totalAtRisk / 1000).toFixed(0)}K`, color: "#ef4444" },
          { label: isAr ? "جديدة" : "New", value: denials.filter(d => d.status === "new").length, color: "#f59e0b" },
          { label: isAr ? "في الاستئناف" : "In Appeal", value: denials.filter(d => d.status === "in_appeal").length, color: "#22D3EE" },
          { label: isAr ? "فائزة" : "Won", value: denials.filter(d => d.status === "won").length, color: "#22c55e" },
          { label: isAr ? "خاسرة" : "Lost", value: denials.filter(d => d.status === "lost").length, color: "#6b7280" },
        ].map(m => <div key={m.label} style={s.card}><div style={{ fontSize: "1.6rem", fontWeight: 700, color: m.color }}>{m.value}</div><div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div></div>)}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["all", "new", "in_appeal", "won", "lost", "write_off"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ ...s.btn, background: filter === f ? "#22D3EE" : "var(--color-surface)", color: filter === f ? "#000" : "var(--color-text)", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>{f === "all" ? (isAr ? "الكل" : "All") : f.replace("_", " ")}</button>)}
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "المطالبة" : "Claim"}</th><th style={s.th}>{isAr ? "المريض" : "Patient"}</th><th style={s.th}>{isAr ? "الجهة" : "Payer"}</th><th style={s.th}>{isAr ? "المبلغ" : "Amount"}</th><th style={s.th}>{isAr ? "سبب الرفض" : "Denial Reason"}</th><th style={s.th}>{isAr ? "أيام متبقية" : "Days Left"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th><th style={s.th}></th></tr></thead>
          <tbody>{filtered.map(d => <tr key={d.id} style={{ background: d.days_to_deadline > 0 && d.days_to_deadline <= 7 ? "rgba(239,68,68,0.04)" : "transparent" }}><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{d.claim_no}</td><td style={s.td}>{isAr ? d.patient_ar : d.patient}</td><td style={s.td}>{d.payer}</td><td style={{ ...s.td, fontFamily: "monospace", fontWeight: 600 }}>SAR {d.amount.toLocaleString()}</td><td style={s.td}><div>{d.denial_reason}</div><div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{d.denial_code}</div></td><td style={{ ...s.td, fontWeight: 700, color: d.days_to_deadline <= 7 && d.days_to_deadline > 0 ? "#ef4444" : "var(--color-text)" }}>{d.days_to_deadline > 0 ? `${d.days_to_deadline}d` : "—"}</td><td style={s.td}><span style={{ background: `${STATUS_COLOR[d.status]}22`, color: STATUS_COLOR[d.status], border: `1px solid ${STATUS_COLOR[d.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{d.status.replace("_", " ")}</span></td><td style={s.td}>{d.status === "new" && <button onClick={() => handleAppeal(d.id)} style={{ background: "#22D3EE22", color: "#22D3EE", border: "1px solid #22D3EE55", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>{isAr ? "استئناف" : "Appeal"}</button>}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
