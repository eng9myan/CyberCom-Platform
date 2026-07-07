"use client";

import { usePreferences } from "@/contexts/preferences";
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
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
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

  const thCls = `px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`;
  const tdCls = "border-b border-ink/10 px-4 py-3 text-sm";

  return (
    <div className="mx-auto max-w-5xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "نتائجي" : "My Results"}</h1>
          <p className="text-sm text-ink/50">{isAr ? "نتائج المختبر والأشعة" : "Lab & imaging results"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <a href="/patient-portal" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← البوابة" : "← Portal"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      {labs.some(l => l.flag === "critical") && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          ⚠ {isAr ? "نتائج حرجة — تم إبلاغ فريق الرعاية الصحية مباشرة. يُرجى التواصل مع طبيبك." : "Critical results detected — your care team has been notified directly. Please contact your physician."}
        </div>
      )}
      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("lab")} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === "lab" ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}>{isAr ? "نتائج المختبر" : "Lab Results"} ({labs.length})</button>
        <button onClick={() => setTab("imaging")} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === "imaging" ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}>{isAr ? "تقارير الأشعة" : "Imaging Reports"} ({imaging.length})</button>
      </div>
      {tab === "lab" && (
        <div className="cy-card overflow-hidden p-0">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-ink/10"><th className={thCls}>{isAr ? "الاختبار" : "Test"}</th><th className={thCls}>LOINC</th><th className={thCls}>{isAr ? "التاريخ" : "Date"}</th><th className={thCls}>{isAr ? "النتيجة" : "Result"}</th><th className={thCls}>{isAr ? "المرجع" : "Ref. Range"}</th><th className={thCls}>{isAr ? "تصنيف" : "Flag"}</th></tr></thead>
            <tbody>{labs.map(l => (
              <tr key={l.id} className={l.flag === "critical" ? "bg-red-500/[0.04]" : ""}>
                <td className={tdCls}><div className="font-semibold">{isAr ? l.test_ar : l.test}</div></td>
                <td className={`${tdCls} font-mono text-xs text-ink/50`}>{l.loinc}</td>
                <td className={`${tdCls} font-mono text-[13px]`}>{l.date}</td>
                <td className={`${tdCls} font-bold`} style={{ color: FLAG_COLOR[l.flag] }}>{l.result} {l.unit}</td>
                <td className={`${tdCls} text-[13px] text-ink/50`}>{l.ref_range}</td>
                <td className={tdCls}><span className="rounded px-2 py-0.5 text-xs font-bold" style={{ background: `${FLAG_COLOR[l.flag]}22`, color: FLAG_COLOR[l.flag], border: `1px solid ${FLAG_COLOR[l.flag]}55` }}>{l.flag}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {tab === "imaging" && (
        <div>
          {imaging.map(r => (
            <div key={r.id} className="cy-card mb-3 p-5">
              <div className="mb-2 flex justify-between">
                <div>
                  <span className="font-bold">{r.modality} — {isAr ? r.body_part_ar : r.body_part}</span>
                  <div className="text-[13px] text-ink/50">{r.date} · {r.radiologist}</div>
                </div>
              </div>
              <div className="rounded-lg border border-ink/10 bg-surface-overlay p-3 text-sm">
                <div className="mb-1 text-xs font-bold" style={{ color: "#22D3EE" }}>{isAr ? "الانطباع" : "Impression"}</div>
                {isAr ? r.impression_ar : r.impression}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
