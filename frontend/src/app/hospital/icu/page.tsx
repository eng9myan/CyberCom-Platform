"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface ICUPatient { id: string; bed: string; patient: string; patient_ar: string; mrn: string; diagnosis: string; diagnosis_ar: string; days_icu: number; ventilated: boolean; apache2: number; attending: string; alerts: string[]; status: "stable" | "critical" | "improving"; }
const MOCK: ICUPatient[] = [
  { id: "icu-001", bed: "ICU-01", patient: "Mohammad Al-Qahtani", patient_ar: "محمد القحطاني", mrn: "MRN-001001", diagnosis: "Acute Respiratory Distress Syndrome", diagnosis_ar: "متلازمة الضائقة التنفسية الحادة", days_icu: 4, ventilated: true, apache2: 28, attending: "Dr. Rania Al-Sayed", alerts: ["FiO2 >0.6 — refractory hypoxemia"], status: "critical" },
  { id: "icu-002", bed: "ICU-02", patient: "Fatima Al-Zahrani", patient_ar: "فاطمة الزهراني", mrn: "MRN-001002", diagnosis: "Septic Shock", diagnosis_ar: "صدمة إنتانية", days_icu: 2, ventilated: true, apache2: 22, attending: "Dr. Khalid Al-Nouri", alerts: ["Norepinephrine >0.3 mcg/kg/min"], status: "critical" },
  { id: "icu-003", bed: "ICU-03", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", mrn: "MRN-001003", diagnosis: "Acute Myocardial Infarction", diagnosis_ar: "احتشاء عضلة القلب الحاد", days_icu: 1, ventilated: false, apache2: 16, attending: "Dr. Ahmed Al-Rashid", alerts: [], status: "stable" },
  { id: "icu-004", bed: "ICU-04", patient: "Aisha Al-Mutairi", patient_ar: "عائشة المطيري", mrn: "MRN-001004", diagnosis: "Post-Cardiac Arrest", diagnosis_ar: "ما بعد السكتة القلبية", days_icu: 3, ventilated: true, apache2: 32, attending: "Dr. Rania Al-Sayed", alerts: ["Therapeutic hypothermia protocol active", "EEG monitoring required"], status: "critical" },
  { id: "icu-005", bed: "ICU-05", patient: "Tariq Al-Dosari", patient_ar: "طارق الدوسري", mrn: "MRN-001005", diagnosis: "Acute Kidney Injury", diagnosis_ar: "الفشل الكلوي الحاد", days_icu: 5, ventilated: false, apache2: 18, attending: "Dr. Khalid Al-Nouri", alerts: ["CRRT initiated — monitor electrolytes q6h"], status: "improving" },
  { id: "icu-006", bed: "ICU-06", patient: "Mariam Al-Shammari", patient_ar: "مريم الشمري", mrn: "MRN-001006", diagnosis: "Diabetic Ketoacidosis", diagnosis_ar: "الحماض الكيتوني السكري", days_icu: 1, ventilated: false, apache2: 14, attending: "Dr. Ahmed Al-Rashid", alerts: [], status: "improving" },
  { id: "icu-007", bed: "ICU-07", patient: "Nasser Al-Ghamdi", patient_ar: "ناصر الغامدي", mrn: "MRN-001007", diagnosis: "Traumatic Brain Injury", diagnosis_ar: "إصابة دماغية رضحية", days_icu: 7, ventilated: true, apache2: 26, attending: "Dr. Rania Al-Sayed", alerts: ["ICP >20 mmHg — mannitol administered"], status: "critical" },
  { id: "icu-008", bed: "ICU-08", patient: "Sara Al-Harbi", patient_ar: "سارة الحربي", mrn: "MRN-001008", diagnosis: "Pulmonary Embolism", diagnosis_ar: "الانصمام الرئوي", days_icu: 2, ventilated: false, apache2: 12, attending: "Dr. Khalid Al-Nouri", alerts: [], status: "stable" },
];
const STATUS_COLOR: Record<string, string> = { critical: "#ef4444", stable: "#22c55e", improving: "#22D3EE" };

export default function ICUPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [patients, setPatients] = useState<ICUPatient[]>(MOCK);
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<ICUPatient[]>("/api/v1/hospital/icu/patients/").then(d => { if (d && d.length) setPatients(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const ventCount = patients.filter(p => p.ventilated).length;
  const critCount = patients.filter(p => p.status === "critical").length;
  const avgApache = Math.round(patients.reduce((a, p) => a + p.apache2, 0) / patients.length);
  const avgLOS = Math.round(patients.reduce((a, p) => a + p.days_icu, 0) / patients.length);

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "1rem", marginBottom: "1.5rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem", verticalAlign: "top" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "وحدة العناية المركزة" : "Intensive Care Unit"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{patients.length} {isAr ? "مريض" : "patients"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/hospital" style={{ ...s.btn, textDecoration: "none" }}>{isAr ? "← المستشفى" : "← Hospital"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.grid}>
        {[
          { label: isAr ? "إجمالي المرضى" : "Total Patients", value: patients.length, color: "#22D3EE" },
          { label: isAr ? "حالة حرجة" : "Critical", value: critCount, color: "#ef4444" },
          { label: isAr ? "على التنفس الصناعي" : "Ventilated", value: ventCount, color: "#f59e0b" },
          { label: isAr ? "متوسط APACHE II" : "Avg APACHE II", value: avgApache, color: "#a78bfa" },
          { label: isAr ? "متوسط الإقامة (أيام)" : "Avg LOS (days)", value: avgLOS, color: "#22c55e" },
        ].map(m => (
          <div key={m.label} style={s.card}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: "rgba(34,211,238,0.05)" }}>
              <th style={s.th}>{isAr ? "السرير" : "Bed"}</th>
              <th style={s.th}>{isAr ? "المريض" : "Patient"}</th>
              <th style={s.th}>{isAr ? "التشخيص" : "Diagnosis"}</th>
              <th style={s.th}>{isAr ? "الأيام" : "Days"}</th>
              <th style={s.th}>{isAr ? "تنفس صناعي" : "Vent"}</th>
              <th style={s.th}>APACHE II</th>
              <th style={s.th}>{isAr ? "الطبيب" : "Attending"}</th>
              <th style={s.th}>{isAr ? "الحالة / تنبيهات" : "Status / Alerts"}</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id} style={{ background: p.status === "critical" ? "rgba(239,68,68,0.04)" : "transparent" }}>
                <td style={{ ...s.td, fontWeight: 700, color: "#22D3EE" }}>{p.bed}</td>
                <td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? p.patient_ar : p.patient}</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{p.mrn}</div></td>
                <td style={s.td}><div style={{ fontSize: "0.85rem" }}>{isAr ? p.diagnosis_ar : p.diagnosis}</div></td>
                <td style={s.td}>{p.days_icu}</td>
                <td style={s.td}>{p.ventilated ? <span style={{ color: "#f59e0b", fontWeight: 700 }}>YES</span> : <span style={{ color: "var(--color-text-muted)" }}>No</span>}</td>
                <td style={{ ...s.td, fontWeight: 700, color: p.apache2 >= 25 ? "#ef4444" : p.apache2 >= 15 ? "#f59e0b" : "#22c55e" }}>{p.apache2}</td>
                <td style={s.td}>{p.attending}</td>
                <td style={s.td}>
                  <span style={{ background: `${STATUS_COLOR[p.status]}22`, color: STATUS_COLOR[p.status], border: `1px solid ${STATUS_COLOR[p.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600, display: "inline-block", marginBottom: p.alerts.length ? 6 : 0 }}>{p.status}</span>
                  {p.alerts.map((a, i) => <div key={i} style={{ fontSize: "0.72rem", color: "#fbbf24", marginTop: 2 }}>⚠ {a}</div>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
