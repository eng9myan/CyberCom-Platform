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

  return (
    <div style={{ direction: isAr ? "rtl" : "ltr" }} className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "إدارة الرفض والاستئناف" : "Denial Management & Appeals"}</h1>
          <p className="mt-1 text-sm text-ink/50">{denials.length} {isAr ? "مطالبة مرفوضة" : "denials"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/40">●</span>}
          <a href="/rcm" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← دورة الإيرادات" : "← RCM"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      {urgent.length > 0 && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          ⚠ {urgent.length} {isAr ? "مطالبة تنتهي مهلتها خلال 7 أيام — استئناف فوري مطلوب" : "denial(s) with deadline ≤7 days — immediate action required"}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: isAr ? "مبالغ في خطر" : "At Risk Amount", value: `SAR ${(totalAtRisk / 1000).toFixed(0)}K`, color: "#ef4444" },
          { label: isAr ? "جديدة" : "New", value: denials.filter(d => d.status === "new").length, color: "#f59e0b" },
          { label: isAr ? "في الاستئناف" : "In Appeal", value: denials.filter(d => d.status === "in_appeal").length, color: "#22D3EE" },
          { label: isAr ? "فائزة" : "Won", value: denials.filter(d => d.status === "won").length, color: "#22c55e" },
          { label: isAr ? "خاسرة" : "Lost", value: denials.filter(d => d.status === "lost").length, color: "#6b7280" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4">
            <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="mt-1 text-xs text-ink/50">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {["all", "new", "in_appeal", "won", "lost", "write_off"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold border ${filter === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink"}`}
          >
            {f === "all" ? (isAr ? "الكل" : "All") : f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="cy-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5">
                {[isAr ? "المطالبة" : "Claim", isAr ? "المريض" : "Patient", isAr ? "الجهة" : "Payer", isAr ? "المبلغ" : "Amount", isAr ? "سبب الرفض" : "Denial Reason", isAr ? "أيام متبقية" : "Days Left", isAr ? "الحالة" : "Status", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className={d.days_to_deadline > 0 && d.days_to_deadline <= 7 ? "bg-red-500/5" : ""}>
                  <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs">{d.claim_no}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm">{isAr ? d.patient_ar : d.patient}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm">{d.payer}</td>
                  <td className="border-b border-ink/10 px-4 py-3 font-mono text-sm font-semibold">SAR {d.amount.toLocaleString()}</td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <div className="text-sm">{d.denial_reason}</div>
                    <div className="font-mono text-[11px] text-ink/50">{d.denial_code}</div>
                  </td>
                  <td className={`border-b border-ink/10 px-4 py-3 text-sm font-bold ${d.days_to_deadline <= 7 && d.days_to_deadline > 0 ? "text-red-400" : "text-ink"}`}>{d.days_to_deadline > 0 ? `${d.days_to_deadline}d` : "—"}</td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[d.status]}22`, color: STATUS_COLOR[d.status], border: `1px solid ${STATUS_COLOR[d.status]}55` }}>{d.status.replace("_", " ")}</span>
                  </td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    {d.status === "new" && (
                      <button onClick={() => handleAppeal(d.id)} className="rounded px-2.5 py-1 text-xs font-semibold" style={{ background: "#22D3EE22", color: "#22D3EE", border: "1px solid #22D3EE55" }}>
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
