"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Claim { id: string; claim_no: string; patient: string; patient_ar: string; payer: string; amount_billed: number; amount_paid: number; date_submitted: string; status: "submitted" | "processing" | "paid" | "rejected" | "appealing"; rejection_reason?: string; }
const MOCK: Claim[] = [
  { id: "c01", claim_no: "CLM-2026-0801", patient: "Fatima Al-Harbi", patient_ar: "فاطمة الحربي", payer: "Bupa Arabia", amount_billed: 4500, amount_paid: 3600, date_submitted: "2026-06-25", status: "paid" },
  { id: "c02", claim_no: "CLM-2026-0802", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", payer: "Tawuniya", amount_billed: 12000, amount_paid: 0, date_submitted: "2026-06-28", status: "processing" },
  { id: "c03", claim_no: "CLM-2026-0803", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", payer: "AXA Gulf", amount_billed: 2800, amount_paid: 0, date_submitted: "2026-06-30", status: "rejected", rejection_reason: "Authorization Required" },
  { id: "c04", claim_no: "CLM-2026-0804", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", payer: "Bupa Arabia", amount_billed: 6200, amount_paid: 4960, date_submitted: "2026-06-20", status: "paid" },
  { id: "c05", claim_no: "CLM-2026-0805", patient: "Nora Al-Qahtani", patient_ar: "نورة القحطاني", payer: "MEDGULF", amount_billed: 3400, amount_paid: 0, date_submitted: "2026-07-01", status: "submitted" },
  { id: "c06", claim_no: "CLM-2026-0806", patient: "Tariq Al-Shammari", patient_ar: "طارق الشمري", payer: "Tawuniya", amount_billed: 8900, amount_paid: 0, date_submitted: "2026-06-22", status: "appealing", rejection_reason: "Service Not Covered" },
  { id: "c07", claim_no: "CLM-2026-0807", patient: "Hessa Al-Mutairi", patient_ar: "حصة المطيري", payer: "AXA Gulf", amount_billed: 1500, amount_paid: 1200, date_submitted: "2026-06-18", status: "paid" },
  { id: "c08", claim_no: "CLM-2026-0808", patient: "Badr Al-Rashidi", patient_ar: "بدر الرشيدي", payer: "Bupa Arabia", amount_billed: 5600, amount_paid: 4480, date_submitted: "2026-06-10", status: "paid" },
  { id: "c09", claim_no: "CLM-2026-0809", patient: "Sara Al-Harbi", patient_ar: "سارة الحربي", payer: "MEDGULF", amount_billed: 22000, amount_paid: 0, date_submitted: "2026-06-29", status: "processing" },
  { id: "c10", claim_no: "CLM-2026-0810", patient: "Khalid Al-Sayed", patient_ar: "خالد السيد", payer: "Tawuniya", amount_billed: 4200, amount_paid: 0, date_submitted: "2026-07-01", status: "submitted" },
  { id: "c11", claim_no: "CLM-2026-0811", patient: "Lujain Al-Anzi", patient_ar: "لجين العنزي", payer: "AXA Gulf", amount_billed: 3100, amount_paid: 0, date_submitted: "2026-06-26", status: "rejected", rejection_reason: "Duplicate Claim" },
  { id: "c12", claim_no: "CLM-2026-0812", patient: "Waleed Al-Bishi", patient_ar: "وليد البيشي", payer: "Bupa Arabia", amount_billed: 7800, amount_paid: 6240, date_submitted: "2026-06-12", status: "paid" },
];
const STATUS_COLOR: Record<string, string> = { submitted: "#22D3EE", processing: "#f59e0b", paid: "#22c55e", rejected: "#ef4444", appealing: "#a78bfa" };

export default function ClaimsPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [claims, setClaims] = useState<Claim[]>(MOCK);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Claim[]>("/api/v1/rcm/claims/").then(d => { if (d && d.length) setClaims(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? claims : claims.filter(c => c.status === filter);
  const totalBilled = claims.reduce((a, c) => a + c.amount_billed, 0);
  const totalPaid = claims.reduce((a, c) => a + c.amount_paid, 0);
  const rejRate = Math.round(claims.filter(c => c.status === "rejected").length / claims.length * 100);

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px,1fr))", gap: "1rem", marginBottom: "1.25rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  const fmt = (n: number) => `SAR ${(n / 1000).toFixed(1)}K`;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "إدارة المطالبات" : "Claims Management"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{claims.length} {isAr ? "مطالبة" : "claims"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/rcm" style={s.btn}>{isAr ? "← دورة الإيرادات" : "← RCM"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.metricGrid}>
        {[
          { label: isAr ? "إجمالي مقدم" : "Total Billed", value: fmt(totalBilled), color: "#22D3EE" },
          { label: isAr ? "إجمالي مدفوع" : "Total Paid", value: fmt(totalPaid), color: "#22c55e" },
          { label: isAr ? "في المعالجة" : "Processing", value: claims.filter(c => c.status === "processing").length, color: "#f59e0b" },
          { label: isAr ? "مرفوضة" : "Rejected", value: claims.filter(c => c.status === "rejected").length, color: "#ef4444" },
          { label: isAr ? "معدل الرفض" : "Rejection Rate", value: `${rejRate}%`, color: "#a78bfa" },
        ].map(m => <div key={m.label} style={s.card}><div style={{ fontSize: "1.6rem", fontWeight: 700, color: m.color }}>{m.value}</div><div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div></div>)}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["all", "submitted", "processing", "paid", "rejected", "appealing"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ ...s.btn, background: filter === f ? "#22D3EE" : "var(--color-surface)", color: filter === f ? "#000" : "var(--color-text)", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>{f === "all" ? (isAr ? "الكل" : "All") : f}</button>)}
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "رقم المطالبة" : "Claim #"}</th><th style={s.th}>{isAr ? "المريض" : "Patient"}</th><th style={s.th}>{isAr ? "الجهة" : "Payer"}</th><th style={s.th}>{isAr ? "مقدم" : "Billed"}</th><th style={s.th}>{isAr ? "مدفوع" : "Paid"}</th><th style={s.th}>{isAr ? "التاريخ" : "Date"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th><th style={s.th}></th></tr></thead>
          <tbody>{filtered.map(c => <tr key={c.id}><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{c.claim_no}</td><td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? c.patient_ar : c.patient}</div></td><td style={s.td}>{c.payer}</td><td style={{ ...s.td, fontFamily: "monospace" }}>SAR {c.amount_billed.toLocaleString()}</td><td style={{ ...s.td, fontFamily: "monospace", color: "#22c55e", fontWeight: c.amount_paid > 0 ? 700 : 400 }}>{c.amount_paid > 0 ? `SAR ${c.amount_paid.toLocaleString()}` : "—"}</td><td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{c.date_submitted}</td><td style={s.td}><div><span style={{ background: `${STATUS_COLOR[c.status]}22`, color: STATUS_COLOR[c.status], border: `1px solid ${STATUS_COLOR[c.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{c.status}</span>{c.rejection_reason && <div style={{ fontSize: "0.7rem", color: "#fca5a5", marginTop: 2 }}>{c.rejection_reason}</div>}</div></td><td style={s.td}>{(c.status === "rejected") && <button style={{ background: "#a78bfa22", color: "#a78bfa", border: "1px solid #a78bfa55", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>{isAr ? "استئناف" : "Appeal"}</button>}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
