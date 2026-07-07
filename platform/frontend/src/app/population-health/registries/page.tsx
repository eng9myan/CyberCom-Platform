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

  return (
    <div className="mx-auto max-w-5xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "سجلات المرضى المزمنين" : "Disease Registries"}</h1>
          <p className="text-sm text-ink/50">{registries.length} {isAr ? "سجل نشط" : "active registries"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <a href="/population-health" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← صحة المجتمع" : "← Population Health"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {registries.map(r => {
          const isSelected = selected?.id === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setSelected(isSelected ? null : r)}
              className={`cursor-pointer rounded-xl border p-5 transition ${isSelected ? "border-brand-400 bg-brand-500/[0.06]" : "border-ink/10 bg-surface"}`}
            >
              <div className="mb-1 text-base font-bold">{isAr ? r.name_ar : r.name}</div>
              <div className="mb-3 text-[13px] text-ink/50">{r.description}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-surface-overlay p-2 text-center">
                  <div className="font-bold">{r.patients.toLocaleString()}</div>
                  <div className="text-[11px] text-ink/50">{isAr ? "مريض" : "Patients"}</div>
                </div>
                <div className="rounded-lg bg-surface-overlay p-2 text-center">
                  <div className="font-bold text-red-400">{r.high_risk.toLocaleString()}</div>
                  <div className="text-[11px] text-ink/50">{isAr ? "مخاطر عالية" : "High Risk"}</div>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-ink/50">{r.key_metric}</span>
                <span className="font-bold">{r.key_value}</span>
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="cy-card overflow-hidden p-0">
          <div className="border-b border-ink/10 p-4 text-base font-bold">{isAr ? selected.name_ar : selected.name} — {isAr ? "قائمة المرضى" : "Patient List"}</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ink/10">
                <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المريض" : "Patient"}</th>
                <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "العمر" : "Age"}</th>
                <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "المخاطرة" : "Risk"}</th>
                <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "آخر زيارة" : "Last Visit"}</th>
                <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{isAr ? "الإجراء التالي" : "Next Action"}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PATIENTS.map(p => (
                <tr key={p.id} className="border-b border-ink/10">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{isAr ? p.name_ar : p.name}</div>
                    <div className="text-xs text-ink/50">{p.mrn}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.age}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ background: `${RISK_COLOR[p.risk]}22`, color: RISK_COLOR[p.risk], border: `1px solid ${RISK_COLOR[p.risk]}55` }}>{p.risk}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px]">{p.last_visit}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[13px] ${p.risk === "high" ? "text-red-300" : "text-ink"}`}>{p.next_action}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
