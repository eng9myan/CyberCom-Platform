"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Condition { icd11: string; name: string; name_ar: string; onset: string; status: string; }
interface Medication { name: string; name_ar: string; dose: string; frequency: string; prescriber: string; }
interface Allergy { substance: string; substance_ar: string; reaction: string; severity: "mild" | "moderate" | "severe"; }
interface Immunization { vaccine: string; vaccine_ar: string; date: string; dose: string; }
interface Vital { date: string; bp: string; hr: number; temp: number; spo2: number; weight: number; }
interface Records { conditions: Condition[]; medications: Medication[]; allergies: Allergy[]; immunizations: Immunization[]; vitals: Vital[]; }

const MOCK: Records = {
  conditions: [
    { icd11: "5A11", name: "Type 2 Diabetes Mellitus", name_ar: "السكري من النوع الثاني", onset: "2018-03", status: "Active" },
    { icd11: "BA00", name: "Essential Hypertension", name_ar: "ارتفاع ضغط الدم الأساسي", onset: "2020-06", status: "Active" },
    { icd11: "CA22.0", name: "Hypothyroidism", name_ar: "قصور الغدة الدرقية", onset: "2021-11", status: "Active" },
    { icd11: "DA90", name: "Peptic Ulcer", name_ar: "القرحة الهضمية", onset: "2019-02", status: "Resolved" },
  ],
  medications: [
    { name: "Metformin 850mg", name_ar: "ميتفورمين 850 مجم", dose: "850 mg", frequency: "Twice daily with meals", prescriber: "Dr. Khalid Al-Nouri" },
    { name: "Lisinopril 10mg", name_ar: "ليسينوبريل 10 مجم", dose: "10 mg", frequency: "Once daily", prescriber: "Dr. Sarah Johnson" },
    { name: "Levothyroxine 50mcg", name_ar: "ليفوثيروكسين 50 ميكروجرام", dose: "50 mcg", frequency: "Once daily on empty stomach", prescriber: "Dr. Khalid Al-Nouri" },
    { name: "Atorvastatin 20mg", name_ar: "أتورفاستاتين 20 مجم", dose: "20 mg", frequency: "Once daily at bedtime", prescriber: "Dr. Sarah Johnson" },
    { name: "Aspirin 81mg", name_ar: "أسبرين 81 مجم", dose: "81 mg", frequency: "Once daily", prescriber: "Dr. Sarah Johnson" },
  ],
  allergies: [
    { substance: "Penicillin", substance_ar: "البنسلين", reaction: "Anaphylaxis", severity: "severe" },
    { substance: "Sulfonamides", substance_ar: "السلفوناميدات", reaction: "Rash", severity: "moderate" },
    { substance: "Ibuprofen", substance_ar: "إيبوبروفين", reaction: "GI upset", severity: "mild" },
  ],
  immunizations: [
    { vaccine: "COVID-19 (Pfizer BNT162b2)", vaccine_ar: "كوفيد-19 (فايزر)", date: "2025-10-01", dose: "Booster" },
    { vaccine: "Influenza", vaccine_ar: "الإنفلونزا الموسمية", date: "2025-09-15", dose: "Annual" },
    { vaccine: "Hepatitis B", vaccine_ar: "التهاب الكبد ب", date: "2024-03-10", dose: "3rd dose" },
    { vaccine: "Tetanus (Td)", vaccine_ar: "الكزاز", date: "2022-06-20", dose: "Booster" },
  ],
  vitals: [
    { date: "2026-06-20", bp: "128/82", hr: 74, temp: 36.7, spo2: 98, weight: 82 },
    { date: "2026-05-15", bp: "134/88", hr: 78, temp: 36.6, spo2: 97, weight: 83 },
    { date: "2026-04-01", bp: "140/92", hr: 82, temp: 36.5, spo2: 96, weight: 84 },
    { date: "2026-02-18", bp: "138/90", hr: 80, temp: 36.8, spo2: 98, weight: 83 },
  ],
};
const SEV_COLOR: Record<string, string> = { severe: "#ef4444", moderate: "#f59e0b", mild: "#22c55e" };

export default function PatientRecordsPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [records, setRecords] = useState<Records>(MOCK);
  const [tab, setTab] = useState<"conditions" | "medications" | "allergies" | "immunizations" | "vitals">("conditions");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Records>("/api/v1/patient-portal/medical-records/summary/").then(d => { if (d) setRecords(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const TABS = [
    { key: "conditions" as const, label: isAr ? "التشخيصات" : "Conditions" },
    { key: "medications" as const, label: isAr ? "الأدوية" : "Medications" },
    { key: "allergies" as const, label: isAr ? "الحساسية" : "Allergies" },
    { key: "immunizations" as const, label: isAr ? "التطعيمات" : "Immunizations" },
    { key: "vitals" as const, label: isAr ? "العلامات الحيوية" : "Vital Signs" },
  ];

  const thCls = `px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`;
  const tdCls = "border-b border-ink/10 px-4 py-3 text-sm";

  return (
    <div className="mx-auto max-w-5xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "سجلي الطبي" : "My Medical Records"}</h1>
          <p className="text-sm text-ink/50">{isAr ? "ملخص صحتي — FHIR R4 متوافق" : "Health summary — FHIR R4 compliant"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <a href="/patient-portal" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← البوابة" : "← Portal"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === t.key ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "conditions" && (
        <div className="cy-card overflow-hidden p-0">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-ink/10"><th className={thCls}>ICD-11</th><th className={thCls}>{isAr ? "التشخيص" : "Diagnosis"}</th><th className={thCls}>{isAr ? "البداية" : "Onset"}</th><th className={thCls}>{isAr ? "الحالة" : "Status"}</th></tr></thead>
            <tbody>{records.conditions.map(c => (
              <tr key={c.icd11}>
                <td className={`${tdCls} font-mono text-violet-400`}>{c.icd11}</td>
                <td className={tdCls}>{isAr ? c.name_ar : c.name}</td>
                <td className={tdCls}>{c.onset}</td>
                <td className={tdCls}><span className={`font-semibold ${c.status === "Active" ? "text-emerald-400" : "text-ink/50"}`}>{c.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "medications" && (
        <div className="cy-card overflow-hidden p-0">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-ink/10"><th className={thCls}>{isAr ? "الدواء" : "Medication"}</th><th className={thCls}>{isAr ? "الجرعة" : "Dose"}</th><th className={thCls}>{isAr ? "التكرار" : "Frequency"}</th><th className={thCls}>{isAr ? "الطبيب" : "Prescriber"}</th></tr></thead>
            <tbody>{records.medications.map(m => (
              <tr key={m.name}>
                <td className={`${tdCls} font-semibold`}>{isAr ? m.name_ar : m.name}</td>
                <td className={tdCls}>{m.dose}</td>
                <td className={tdCls}>{m.frequency}</td>
                <td className={tdCls}>{m.prescriber}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "allergies" && (
        <div>
          {records.allergies.map(a => (
            <div key={a.substance} className="cy-card mb-3 p-0" style={{ borderLeft: `4px solid ${SEV_COLOR[a.severity]}` }}>
              <div className="flex items-center justify-between p-5">
                <div>
                  <div className="font-bold">{isAr ? a.substance_ar : a.substance}</div>
                  <div className="text-sm text-ink/50">{a.reaction}</div>
                </div>
                <span className="rounded px-2.5 py-0.5 text-[13px] font-bold" style={{ background: `${SEV_COLOR[a.severity]}22`, color: SEV_COLOR[a.severity], border: `1px solid ${SEV_COLOR[a.severity]}55` }}>{a.severity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "immunizations" && (
        <div className="cy-card overflow-hidden p-0">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-ink/10"><th className={thCls}>{isAr ? "اللقاح" : "Vaccine"}</th><th className={thCls}>{isAr ? "التاريخ" : "Date"}</th><th className={thCls}>{isAr ? "الجرعة" : "Dose"}</th></tr></thead>
            <tbody>{records.immunizations.map(i => (
              <tr key={i.vaccine}>
                <td className={`${tdCls} font-semibold`}>{isAr ? i.vaccine_ar : i.vaccine}</td>
                <td className={`${tdCls} font-mono`}>{i.date}</td>
                <td className={tdCls}>{i.dose}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "vitals" && (
        <div className="cy-card overflow-hidden p-0">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-ink/10"><th className={thCls}>{isAr ? "التاريخ" : "Date"}</th><th className={thCls}>{isAr ? "ض.الدم" : "BP"}</th><th className={thCls}>{isAr ? "نبض" : "HR"}</th><th className={thCls}>{isAr ? "حرارة" : "Temp"}</th><th className={thCls}>SpO₂</th><th className={thCls}>{isAr ? "وزن" : "Weight"}</th></tr></thead>
            <tbody>{records.vitals.map(v => (
              <tr key={v.date}>
                <td className={`${tdCls} font-mono`}>{v.date}</td>
                <td className={tdCls}>{v.bp}</td>
                <td className={tdCls}>{v.hr} bpm</td>
                <td className={tdCls}>{v.temp}°C</td>
                <td className={tdCls}>{v.spo2}%</td>
                <td className={tdCls}>{v.weight} kg</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
