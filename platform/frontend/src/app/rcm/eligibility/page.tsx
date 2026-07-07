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

  const inputCls = "rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink";

  return (
    <div style={{ direction: isAr ? "rtl" : "ltr" }} className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "التحقق من التغطية التأمينية" : "Insurance Eligibility Verification"}</h1>
          <p className="mt-1 text-sm text-ink/50">{results.filter(r => r.status === "active").length} {isAr ? "تغطية نشطة" : "active coverages"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/40">●</span>}
          <a href="/rcm" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← دورة الإيرادات" : "← RCM"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      <div className="cy-card mb-6 p-5">
        <div className="mb-3 text-lg font-bold">{isAr ? "التحقق الفوري من التغطية" : "Real-Time Eligibility Check"}</div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink/50">{isAr ? "رقم المريض (MRN)" : "Patient MRN"}</label>
            <input value={checkMrn} onChange={e => setCheckMrn(e.target.value)} placeholder="MRN-002145" className={`${inputCls} w-[180px]`} />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink/50">{isAr ? "شركة التأمين" : "Payer"}</label>
            <select value={checkPayer} onChange={e => setCheckPayer(e.target.value)} className={inputCls}>
              {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={handleCheck} disabled={checking} className="cy-btn cy-btn-primary disabled:opacity-50">
            {checking ? (isAr ? "جاري التحقق..." : "Checking...") : (isAr ? "تحقق الآن" : "Verify Now")}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث باسم المريض أو الرقم..." : "Search patient or MRN..."} className={`${inputCls} w-full max-w-[380px]`} />
      </div>

      <div className="cy-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5">
                {[isAr ? "المريض" : "Patient", isAr ? "الجهة / الخطة" : "Payer / Plan", isAr ? "رقم العضوية" : "Member ID", isAr ? "الرسوم الثابتة" : "Copay", isAr ? "قابل للخصم" : "Deductible", isAr ? "شبكة داخلية" : "In-Network", isAr ? "الحالة" : "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <div className="text-sm font-semibold">{isAr ? r.patient_ar : r.patient}</div>
                    <div className="text-xs text-ink/50">{r.mrn}</div>
                  </td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <div className="text-sm font-semibold">{r.payer}</div>
                    <div className="text-xs text-ink/50">{r.plan}</div>
                  </td>
                  <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs">{r.member_id}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm">SAR {r.copay}</td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <div className="text-sm">SAR {r.deductible_met.toLocaleString()} / {r.deductible.toLocaleString()}</div>
                    <div className="mt-1 h-1 rounded bg-ink/10">
                      <div className="h-full rounded bg-brand-400" style={{ width: r.deductible > 0 ? `${Math.min(r.deductible_met / r.deductible * 100, 100)}%` : "100%" }} />
                    </div>
                  </td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm">
                    {r.in_network ? <span className="font-bold text-emerald-400">✓ {isAr ? "نعم" : "Yes"}</span> : <span className="text-red-400">✗ {isAr ? "لا" : "No"}</span>}
                  </td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[r.status]}22`, color: STATUS_COLOR[r.status], border: `1px solid ${STATUS_COLOR[r.status]}55` }}>{r.status}</span>
                    <div className="mt-0.5 text-[11px] text-ink/50">{r.verified_on}</div>
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
