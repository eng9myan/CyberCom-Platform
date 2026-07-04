"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface LabResult { id: string; test: string; test_ar: string; loinc: string; date: string; result: string; unit: string; ref_range: string; flag: "normal" | "abnormal" | "critical"; }
interface ImagingReport { id: string; modality: string; body_part: string; body_part_ar: string; date: string; radiologist: string; impression: string; impression_ar: string; }
const MOCK_LAB: LabResult[] = [
  { id: "l01", test: "HbA1c", test_ar: "الهيموجلوبين الغليكوزيلاتي", loinc: "4548-4", date: "2026-06-20", result: "7.4", unit: "%", ref_range: "<7.0", flag: "abnormal" },
  { id: "l02", test: "Fasting Glucose", test_ar: "سكر الصيام", loinc: "14771-0", date: "2026-06-20", result: "5.8", unit: "mmol/L", ref_range: "3.9-6.1", flag: "normal" },
  { id: "l03", test: "Total Cholesterol", test_ar: "الكوليسترول الكلي", loinc: "2093-3", date: "2026-06-20", result: "4.9", unit: "mmol/L", ref_range: "<5.2", flag: "normal" },
  { id: "l04", test: "LDL Cholesterol", test_ar: "الكوليسترول الضار", loinc: "2089-1", date: "2026-06-20", result: "3.1", unit: "mmol/L", ref_range: "<3.0", flag: "abnormal" },
  { id: "l05", test: "Potassium", test_ar: "البوتاسيوم", loinc: "2823-3", date: "2026-06-20", result: "5.8", unit: "mmol/L", ref_range: "3.5-5.1", flag: "critical" },
  { id: "l06", test: "Creatinine", test_ar: "الكرياتينين", loinc: "2160-0", date: "2026-06-20", result: "85", unit: "μmol/L", ref_range: "53-106", flag: "normal" },
  { id: "l07", test: "TSH", test_ar: "هرمون الغدة الدرقية", loinc: "3016-3", date: "2026-06-20", result: "1.8", unit: "mIU/L", ref_range: "0.4-4.0", flag: "normal" },
  { id: "l08", test: "Hemoglobin", test_ar: "الهيموجلوبين", loinc: "718-7", date: "2026-05-15", result: "10.8", unit: "g/dL", ref_range: "12.0-16.0", flag: "abnormal" },
  { id: "l09", test: "Vitamin D (25-OH)", test_ar: "فيتامين د", loinc: "1989-3", date: "2026-05-15", result: "22", unit: "nmol/L", ref_range: "50-200", flag: "critical" },
  { id: "l10", test: "ALT", test_ar: "إنزيم ALT", loinc: "1742-6", date: "2026-04-01", result: "28", unit: "U/L", ref_range: "7-56", flag: "normal" },
];
const MOCK_IMAGING: ImagingReport[] = [
  { id: "i01", modality: "MRI", body_part: "Brain", body_part_ar: "الدماغ", date: "2026-07-01", radiologist: "Dr. Laila Mahmoud", impression: "Normal MRI brain. No acute pathology identified.", impression_ar: "فحص MRI طبيعي للدماغ. لا توجد تغيرات حادة." },
  { id: "i02", modality: "X-Ray", body_part: "Chest PA", body_part_ar: "صدر", date: "2026-07-01", radiologist: "Dr. Faisal Al-Anzi", impression: "Normal chest radiograph. Lungs clear bilaterally.", impression_ar: "صورة صدر طبيعية. الرئتان صافيتان." },
  { id: "i03", modality: "Ultrasound", body_part: "Abdomen", body_part_ar: "البطن", date: "2026-07-01", radiologist: "Dr. Faisal Al-Anzi", impression: "Gallbladder sludge. No acute intra-abdominal pathology.", impression_ar: "حمأة في المرارة. لا توجد حالة طارئة في البطن." },
  { id: "i04", modality: "CT", body_part: "Chest", body_part_ar: "الصدر", date: "2026-06-15", radiologist: "Dr. Laila Mahmoud", impression: "No pulmonary embolism. No pleural effusion. Mild ground-glass opacity RLL — likely resolving infection.", impression_ar: "لا يوجد انسداد رئوي. تعتيم خفيف في الفص الأيمن السفلي — يرجح أنه التهاب بدأ بالتحسن." },
  { id: "i05", modality: "Mammogram", body_part: "Bilateral Breast", body_part_ar: "الثدي الثنائي", date: "2026-06-30", radiologist: "Dr. Laila Mahmoud", impression: "BI-RADS 2. Benign findings. Routine screening in 1 year recommended.", impression_ar: "BI-RADS 2. نتائج حميدة. يُوصى بفحص روتيني بعد سنة." },
];
const FLAG_COLOR: Record<string, string> = { normal: "#22c55e", abnormal: "#f59e0b", critical: "#ef4444" };

export default function PatientResultsPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [labs, setLabs] = useState<LabResult[]>(MOCK_LAB);
  const [imaging, setImaging] = useState<ImagingReport[]>(MOCK_IMAGING);
  const [tab, setTab] = useState<"lab" | "imaging">("lab");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<LabResult[]>("/api/v1/patient-portal/lab-results/"),
      apiFetch<ImagingReport[]>("/api/v1/patient-portal/imaging-results/"),
    ]).then(([l, i]) => { if (l && l.length) setLabs(l); if (i && i.length) setImaging(i); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1000, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "نتائجي" : "My Results"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{isAr ? "نتائج المختبر والأشعة" : "Lab & imaging results"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/patient-portal" style={s.btn}>{isAr ? "← البوابة" : "← Portal"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      {labs.some(l => l.flag === "critical") && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#fca5a5", fontSize: "0.875rem" }}>
          ⚠ {isAr ? "نتائج حرجة — تم إبلاغ فريق الرعاية الصحية مباشرة. يُرجى التواصل مع طبيبك." : "Critical results detected — your care team has been notified directly. Please contact your physician."}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button onClick={() => setTab("lab")} style={{ ...s.btn, background: tab === "lab" ? "#22D3EE" : "var(--color-surface)", color: tab === "lab" ? "#000" : "var(--color-text)" }}>{isAr ? "نتائج المختبر" : "Lab Results"} ({labs.length})</button>
        <button onClick={() => setTab("imaging")} style={{ ...s.btn, background: tab === "imaging" ? "#22D3EE" : "var(--color-surface)", color: tab === "imaging" ? "#000" : "var(--color-text)" }}>{isAr ? "تقارير الأشعة" : "Imaging Reports"} ({imaging.length})</button>
      </div>
      {tab === "lab" && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
          <table style={s.table}>
            <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "الاختبار" : "Test"}</th><th style={s.th}>LOINC</th><th style={s.th}>{isAr ? "التاريخ" : "Date"}</th><th style={s.th}>{isAr ? "النتيجة" : "Result"}</th><th style={s.th}>{isAr ? "المرجع" : "Ref. Range"}</th><th style={s.th}>{isAr ? "تصنيف" : "Flag"}</th></tr></thead>
            <tbody>{labs.map(l => (
              <tr key={l.id} style={{ background: l.flag === "critical" ? "rgba(239,68,68,0.04)" : "transparent" }}>
                <td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? l.test_ar : l.test}</div></td>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{l.loinc}</td>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{l.date}</td>
                <td style={{ ...s.td, fontWeight: 700, color: FLAG_COLOR[l.flag] }}>{l.result} {l.unit}</td>
                <td style={{ ...s.td, color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{l.ref_range}</td>
                <td style={s.td}><span style={{ background: `${FLAG_COLOR[l.flag]}22`, color: FLAG_COLOR[l.flag], border: `1px solid ${FLAG_COLOR[l.flag]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>{l.flag}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {tab === "imaging" && (
        <div>
          {imaging.map(r => (
            <div key={r.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1.25rem", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{r.modality} — {isAr ? r.body_part_ar : r.body_part}</span>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{r.date} · {r.radiologist}</div>
                </div>
              </div>
              <div style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", borderRadius: 6, padding: "0.75rem", fontSize: "0.875rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#22D3EE", marginBottom: 4 }}>{isAr ? "الانطباع" : "Impression"}</div>
                {isAr ? r.impression_ar : r.impression}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
