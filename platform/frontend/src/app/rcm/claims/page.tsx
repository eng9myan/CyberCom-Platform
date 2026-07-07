"use client";

import { usePreferences } from "@/contexts/preferences";
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
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
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

  const fmt = (n: number) => `SAR ${(n / 1000).toFixed(1)}K`;

  return (
    <div style={{ direction: isAr ? "rtl" : "ltr" }} className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "إدارة المطالبات" : "Claims Management"}</h1>
          <p className="mt-1 text-sm text-ink/50">{claims.length} {isAr ? "مطالبة" : "claims"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/40">●</span>}
          <a href="/rcm" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← دورة الإيرادات" : "← RCM"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: isAr ? "إجمالي مقدم" : "Total Billed", value: fmt(totalBilled), color: "#22D3EE" },
          { label: isAr ? "إجمالي مدفوع" : "Total Paid", value: fmt(totalPaid), color: "#22c55e" },
          { label: isAr ? "في المعالجة" : "Processing", value: claims.filter(c => c.status === "processing").length, color: "#f59e0b" },
          { label: isAr ? "مرفوضة" : "Rejected", value: claims.filter(c => c.status === "rejected").length, color: "#ef4444" },
          { label: isAr ? "معدل الرفض" : "Rejection Rate", value: `${rejRate}%`, color: "#a78bfa" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4">
            <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="mt-1 text-xs text-ink/50">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {["all", "submitted", "processing", "paid", "rejected", "appealing"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold border ${filter === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink"}`}
          >
            {f === "all" ? (isAr ? "الكل" : "All") : f}
          </button>
        ))}
      </div>

      <div className="cy-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5">
                {[isAr ? "رقم المطالبة" : "Claim #", isAr ? "المريض" : "Patient", isAr ? "الجهة" : "Payer", isAr ? "مقدم" : "Billed", isAr ? "مدفوع" : "Paid", isAr ? "التاريخ" : "Date", isAr ? "الحالة" : "Status", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs">{c.claim_no}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">{isAr ? c.patient_ar : c.patient}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm">{c.payer}</td>
                  <td className="border-b border-ink/10 px-4 py-3 font-mono text-sm">SAR {c.amount_billed.toLocaleString()}</td>
                  <td className={`border-b border-ink/10 px-4 py-3 font-mono text-sm text-emerald-400 ${c.amount_paid > 0 ? "font-bold" : ""}`}>{c.amount_paid > 0 ? `SAR ${c.amount_paid.toLocaleString()}` : "—"}</td>
                  <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs">{c.date_submitted}</td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[c.status]}22`, color: STATUS_COLOR[c.status], border: `1px solid ${STATUS_COLOR[c.status]}55` }}>{c.status}</span>
                    {c.rejection_reason && <div className="mt-0.5 text-[11px] text-red-300">{c.rejection_reason}</div>}
                  </td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    {c.status === "rejected" && (
                      <button className="rounded px-2.5 py-1 text-xs font-semibold" style={{ background: "#a78bfa22", color: "#a78bfa", border: "1px solid #a78bfa55" }}>
                        {isAr ? "استئناف" : "Appeal"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
