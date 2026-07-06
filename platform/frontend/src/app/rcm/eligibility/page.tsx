"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface EligibilityResult { id: string; patient: string; patient_ar: string; mrn: string; payer: string; plan: string; member_id: string; copay: number; deductible: number; deductible_met: number; out_of_pocket_max: number; out_of_pocket_met: number; in_network: boolean; status: "active" | "inactive" | "pending" | "terminated"; verified_on: string; }
const MOCK: EligibilityResult[] = [
  { id: "e01", patient: "Fatima Al-Harbi", patient_ar: "فاطمة الحربي", mrn: "MRN-002145", payer: "Bupa Arabia", plan: "Elite Plus", member_id: "BUP-445221", copay: 50, deductible: 1000, deductible_met: 650, out_of_pocket_max: 5000, out_of_pocket_met: 1200, in_network: true, status: "active", verified_on: "2026-07-01" },
  { id: "e02", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", mrn: "MRN-002146", payer: "Tawuniya", plan: "Corporate Gold", member_id: "TWN-332891", copay: 30, deductible: 500, deductible_met: 500, out_of_pocket_max: 3000, out_of_pocket_met: 800, in_network: true, status: "active", verified_on: "2026-07-01" },
  { id: "e03", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", mrn: "MRN-002147", payer: "AXA Gulf", plan: "Silver", member_id: "AXA-119033", copay: 80, deductible: 2000, deductible_met: 200, out_of_pocket_max: 8000, out_of_pocket_met: 300, in_network: false, status: "active", verified_on: "2026-06-30" },
  { id: "e04", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", mrn: "MRN-002148", payer: "MEDGULF", plan: "Premium", member_id: "MEG-887221", copay: 0, deductible: 0, deductible_met: 0, out_of_pocket_max: 10000, out_of_pocket_met: 2100, in_network: true, status: "inactive", verified_on: "2026-06-29" },
  { id: "e05", patient: "Nora Al-Qahtani", patient_ar: "نورة القحطاني", mrn: "MRN-002149", payer: "Bupa Arabia", plan: "Essential", member_id: "BUP-778992", copay: 100, deductible: 3000, deductible_met: 0, out_of_pocket_max: 12000, out_of_pocket_met: 0, in_network: true, status: "pending", verified_on: "2026-07-01" },
  { id: "e06", patient: "Tariq Al-Shammari", patient_ar: "طارق الشمري", mrn: "MRN-002150", payer: "Tawuniya", plan: "Corporate Gold", member_id: "TWN-449821", copay: 30, deductible: 500, deductible_met: 500, out_of_pocket_max: 3000, out_of_pocket_met: 2100, in_network: true, status: "active", verified_on: "2026-06-28" },
  { id: "e07", patient: "Hessa Al-Mutairi", patient_ar: "حصة المطيري", mrn: "MRN-002151", payer: "AXA Gulf", plan: "Gold", member_id: "AXA-223419", copay: 50, deductible: 1500, deductible_met: 1500, out_of_pocket_max: 6000, out_of_pocket_met: 3200, in_network: true, status: "active", verified_on: "2026-07-01" },
  { id: "e08", patient: "Badr Al-Rashidi", patient_ar: "بدر الرشيدي", mrn: "MRN-002152", payer: "Bupa Arabia", plan: "Elite Plus", member_id: "BUP-991144", copay: 50, deductible: 1000, deductible_met: 320, out_of_pocket_max: 5000, out_of_pocket_met: 620, in_network: true, status: "terminated", verified_on: "2026-06-20" },
  { id: "e09", patient: "Sara Al-Harbi", patient_ar: "سارة الحربي", mrn: "MRN-002153", payer: "MEDGULF", plan: "Premium", member_id: "MEG-662233", copay: 0, deductible: 0, deductible_met: 0, out_of_pocket_max: 10000, out_of_pocket_met: 0, in_network: true, status: "active", verified_on: "2026-07-01" },
  { id: "e10", patient: "Khalid Al-Sayed", patient_ar: "خالد السيد", mrn: "MRN-002154", payer: "Tawuniya", plan: "Basic", member_id: "TWN-553301", copay: 120, deductible: 5000, deductible_met: 800, out_of_pocket_max: 20000, out_of_pocket_met: 900, in_network: true, status: "active", verified_on: "2026-07-01" },
];
const STATUS_COLOR: Record<string, string> = { active: "#22c55e", inactive: "#f59e0b", pending: "#22D3EE", terminated: "#ef4444" };
const PAYERS = ["Bupa Arabia", "Tawuniya", "AXA Gulf", "MEDGULF"];

export default function EligibilityPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [results, setResults] = useState<EligibilityResult[]>(MOCK);
  const [search, setSearch] = useState("");
  const [checkMrn, setCheckMrn] = useState("");
  const [checkPayer, setCheckPayer] = useState("Bupa Arabia");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<EligibilityResult[]>("/api/v1/rcm/eligibility/checks/").then(d => { if (d && d.length) setResults(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCheck = async () => {
    if (!checkMrn) return;
    setChecking(true);
    try { await apiFetch("/api/v1/rcm/eligibility/verify/", { method: "POST", body: JSON.stringify({ mrn: checkMrn, payer: checkPayer }) }); } catch {}
    setTimeout(() => setChecking(false), 1200);
  };

  const filtered = results.filter(r => !search || r.patient.toLowerCase().includes(search.toLowerCase()) || r.mrn.includes(search));

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
    input: { padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "التحقق من التغطية التأمينية" : "Insurance Eligibility Verification"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{results.filter(r => r.status === "active").length} {isAr ? "تغطية نشطة" : "active coverages"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/rcm" style={s.btn}>{isAr ? "← دورة الإيرادات" : "← RCM"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>{isAr ? "التحقق الفوري من التغطية" : "Real-Time Eligibility Check"}</div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 4 }}>{isAr ? "رقم المريض (MRN)" : "Patient MRN"}</label><input value={checkMrn} onChange={e => setCheckMrn(e.target.value)} placeholder="MRN-002145" style={{ ...s.input, width: 180 }} /></div>
          <div><label style={{ display: "block", fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 4 }}>{isAr ? "شركة التأمين" : "Payer"}</label><select value={checkPayer} onChange={e => setCheckPayer(e.target.value)} style={s.input}>{PAYERS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <button onClick={handleCheck} disabled={checking} style={{ background: "#22D3EE", color: "#000", border: "none", borderRadius: 6, padding: "0.5rem 1.5rem", cursor: checking ? "not-allowed" : "pointer", fontWeight: 700 }}>{checking ? (isAr ? "جاري التحقق..." : "Checking...") : (isAr ? "تحقق الآن" : "Verify Now")}</button>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}><input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث باسم المريض أو الرقم..." : "Search patient or MRN..."} style={{ ...s.input, width: "100%", maxWidth: 380 }} /></div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "المريض" : "Patient"}</th><th style={s.th}>{isAr ? "الجهة / الخطة" : "Payer / Plan"}</th><th style={s.th}>{isAr ? "رقم العضوية" : "Member ID"}</th><th style={s.th}>{isAr ? "الرسوم الثابتة" : "Copay"}</th><th style={s.th}>{isAr ? "قابل للخصم" : "Deductible"}</th><th style={s.th}>{isAr ? "شبكة داخلية" : "In-Network"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th></tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id}>
              <td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? r.patient_ar : r.patient}</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{r.mrn}</div></td>
              <td style={s.td}><div style={{ fontWeight: 600 }}>{r.payer}</div><div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{r.plan}</div></td>
              <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{r.member_id}</td>
              <td style={s.td}>SAR {r.copay}</td>
              <td style={s.td}><div style={{ fontSize: "0.82rem" }}>SAR {r.deductible_met.toLocaleString()} / {r.deductible.toLocaleString()}</div><div style={{ height: 4, background: "var(--color-background)", borderRadius: 2, marginTop: 4 }}><div style={{ width: r.deductible > 0 ? `${Math.min(r.deductible_met / r.deductible * 100, 100)}%` : "100%", height: "100%", background: "#22D3EE", borderRadius: 2 }} /></div></td>
              <td style={s.td}>{r.in_network ? <span style={{ color: "#22c55e", fontWeight: 700 }}>✓ {isAr ? "نعم" : "Yes"}</span> : <span style={{ color: "#ef4444" }}>✗ {isAr ? "لا" : "No"}</span>}</td>
              <td style={s.td}><div><span style={{ background: `${STATUS_COLOR[r.status]}22`, color: STATUS_COLOR[r.status], border: `1px solid ${STATUS_COLOR[r.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{r.status}</span><div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 2 }}>{r.verified_on}</div></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
