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

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1000, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    tabRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" as const, marginBottom: "1.5rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem 1.25rem", marginBottom: "0.75rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "سجلي الطبي" : "My Medical Records"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{isAr ? "ملخص صحتي — FHIR R4 متوافق" : "Health summary — FHIR R4 compliant"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/patient-portal" style={s.btn}>{isAr ? "← البوابة" : "← Portal"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.tabRow}>
        {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{ ...s.btn, background: tab === t.key ? "#22D3EE" : "var(--color-surface)", color: tab === t.key ? "#000" : "var(--color-text)" }}>{t.label}</button>)}
      </div>
      {tab === "conditions" && <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}><table style={s.table}><thead><tr><th style={s.th}>ICD-11</th><th style={s.th}>{isAr ? "التشخيص" : "Diagnosis"}</th><th style={s.th}>{isAr ? "البداية" : "Onset"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th></tr></thead><tbody>{records.conditions.map(c => <tr key={c.icd11}><td style={{ ...s.td, fontFamily: "monospace", color: "#a78bfa" }}>{c.icd11}</td><td style={s.td}>{isAr ? c.name_ar : c.name}</td><td style={s.td}>{c.onset}</td><td style={s.td}><span style={{ color: c.status === "Active" ? "#22c55e" : "#6b7280", fontWeight: 600 }}>{c.status}</span></td></tr>)}</tbody></table></div>}
      {tab === "medications" && <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}><table style={s.table}><thead><tr><th style={s.th}>{isAr ? "الدواء" : "Medication"}</th><th style={s.th}>{isAr ? "الجرعة" : "Dose"}</th><th style={s.th}>{isAr ? "التكرار" : "Frequency"}</th><th style={s.th}>{isAr ? "الطبيب" : "Prescriber"}</th></tr></thead><tbody>{records.medications.map(m => <tr key={m.name}><td style={{ ...s.td, fontWeight: 600 }}>{isAr ? m.name_ar : m.name}</td><td style={s.td}>{m.dose}</td><td style={s.td}>{m.frequency}</td><td style={s.td}>{m.prescriber}</td></tr>)}</tbody></table></div>}
      {tab === "allergies" && <div>{records.allergies.map(a => <div key={a.substance} style={{ ...s.card, borderLeft: `4px solid ${SEV_COLOR[a.severity]}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 700 }}>{isAr ? a.substance_ar : a.substance}</div><div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{a.reaction}</div></div><span style={{ background: `${SEV_COLOR[a.severity]}22`, color: SEV_COLOR[a.severity], border: `1px solid ${SEV_COLOR[a.severity]}55`, borderRadius: 4, padding: "2px 10px", fontWeight: 700, fontSize: "0.8rem", alignSelf: "center" }}>{a.severity}</span></div></div>)}</div>}
      {tab === "immunizations" && <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}><table style={s.table}><thead><tr><th style={s.th}>{isAr ? "اللقاح" : "Vaccine"}</th><th style={s.th}>{isAr ? "التاريخ" : "Date"}</th><th style={s.th}>{isAr ? "الجرعة" : "Dose"}</th></tr></thead><tbody>{records.immunizations.map(i => <tr key={i.vaccine}><td style={{ ...s.td, fontWeight: 600 }}>{isAr ? i.vaccine_ar : i.vaccine}</td><td style={{ ...s.td, fontFamily: "monospace" }}>{i.date}</td><td style={s.td}>{i.dose}</td></tr>)}</tbody></table></div>}
      {tab === "vitals" && <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}><table style={s.table}><thead><tr><th style={s.th}>{isAr ? "التاريخ" : "Date"}</th><th style={s.th}>{isAr ? "ض.الدم" : "BP"}</th><th style={s.th}>{isAr ? "نبض" : "HR"}</th><th style={s.th}>{isAr ? "حرارة" : "Temp"}</th><th style={s.th}>SpO₂</th><th style={s.th}>{isAr ? "وزن" : "Weight"}</th></tr></thead><tbody>{records.vitals.map(v => <tr key={v.date}><td style={{ ...s.td, fontFamily: "monospace" }}>{v.date}</td><td style={s.td}>{v.bp}</td><td style={s.td}>{v.hr} bpm</td><td style={s.td}>{v.temp}°C</td><td style={s.td}>{v.spo2}%</td><td style={s.td}>{v.weight} kg</td></tr>)}</tbody></table></div>}
    </div>
  );
}
