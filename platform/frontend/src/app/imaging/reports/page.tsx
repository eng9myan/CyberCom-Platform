"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Report { id: string; accession: string; patient: string; patient_ar: string; mrn: string; modality: string; body_part: string; radiologist: string; status: "awaiting" | "draft" | "signed"; technique: string; findings: string; impression: string; created_at: string; }
const MOCK: Report[] = [
  { id: "r001", accession: "RAD-2026-0702", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", mrn: "MRN-002146", modality: "MRI", body_part: "Brain", radiologist: "Dr. Laila Mahmoud", status: "signed", technique: "MRI brain with and without contrast (3T). Axial T1, T2, FLAIR, DWI sequences obtained.", findings: "No acute intracranial hemorrhage. No diffusion restriction. No enhancing lesion identified. Ventricles are normal in size. Midline structures are intact. No mass effect.", impression: "Normal MRI brain. No acute pathology identified.", created_at: "2026-07-01 10:30" },
  { id: "r002", accession: "RAD-2026-0703", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", mrn: "MRN-002147", modality: "X-Ray", body_part: "Chest PA", radiologist: "Dr. Faisal Al-Anzi", status: "signed", technique: "PA and lateral chest radiograph.", findings: "Lungs are clear bilaterally. No pleural effusion. No pneumothorax. Cardiac silhouette is within normal limits. Mediastinal contours are normal.", impression: "Normal chest radiograph.", created_at: "2026-07-01 09:15" },
  { id: "r003", accession: "RAD-2026-0701", patient: "Fatima Al-Harbi", patient_ar: "فاطمة الحربي", mrn: "MRN-002145", modality: "CT", body_part: "Chest", radiologist: "Dr. Laila Mahmoud", status: "awaiting", technique: "", findings: "", impression: "", created_at: "2026-07-01 08:00" },
  { id: "r004", accession: "RAD-2026-0704", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", mrn: "MRN-002148", modality: "Ultrasound", body_part: "Abdomen", radiologist: "Dr. Faisal Al-Anzi", status: "draft", technique: "Ultrasound examination of the abdomen performed with curvilinear probe.", findings: "Liver: normal size and echogenicity. No focal hepatic lesion. Gallbladder: distended, contains echogenic material — possible sludge. CBD: not dilated (4mm). Pancreas: partially visualized, appears normal. Spleen: normal. Kidneys: bilateral kidneys unremarkable.", impression: "Gallbladder sludge. No acute intra-abdominal pathology. Clinical correlation recommended.", created_at: "2026-07-01 11:00" },
  { id: "r005", accession: "RAD-2026-0709", patient: "Sara Al-Harbi", patient_ar: "سارة الحربي", mrn: "MRN-002153", modality: "Mammogram", body_part: "Bilateral", radiologist: "Dr. Laila Mahmoud", status: "awaiting", technique: "", findings: "", impression: "", created_at: "2026-06-30 14:00" },
  { id: "r006", accession: "RAD-2026-0710", patient: "Khalid Al-Sayed", patient_ar: "خالد السيد", mrn: "MRN-002154", modality: "CT", body_part: "Head", radiologist: "Dr. Faisal Al-Anzi", status: "awaiting", technique: "", findings: "", impression: "", created_at: "2026-07-01 13:30" },
  { id: "r007", accession: "RAD-2026-0714", patient: "Faris Al-Ghamdi", patient_ar: "فارس الغامدي", mrn: "MRN-002158", modality: "CT", body_part: "Coronary CTA", radiologist: "Dr. Laila Mahmoud", status: "draft", technique: "Prospective ECG-gated CT coronary angiography. IV contrast administered.", findings: "Left main: patent. LAD: mild non-obstructive plaque at proximal segment (30% stenosis). LCx: no significant stenosis. RCA: mild calcification at mid-RCA, non-obstructive. Calcium score: 42 (moderate risk).", impression: "Mild non-obstructive coronary artery disease. LAD mild plaque. Calcium score 42. Clinical cardiology follow-up recommended.", created_at: "2026-07-01 10:00" },
  { id: "r008", accession: "RAD-2026-0706", patient: "Tariq Al-Shammari", patient_ar: "طارق الشمري", mrn: "MRN-002150", modality: "MRI", body_part: "Lumbar Spine", radiologist: "Dr. Faisal Al-Anzi", status: "signed", technique: "MRI lumbar spine without contrast. T1, T2, STIR sagittal and axial sequences.", findings: "L4-L5: disc herniation, left paracentral, causing moderate left lateral recess narrowing with nerve root compression. L5-S1: disc desiccation with mild posterior bulge. No cord signal abnormality. Conus medullaris terminates normally at L1.", impression: "L4-L5 left paracentral disc herniation with left nerve root compression. Recommend neurosurgery referral.", created_at: "2026-06-30 15:00" },
];
const STATUS_COLOR: Record<string, string> = { awaiting: "#f59e0b", draft: "#22D3EE", signed: "#22c55e" };

export default function ImagingReportsPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [reports, setReports] = useState<Report[]>(MOCK);
  const [selected, setSelected] = useState<Report | null>(null);
  const [editFindings, setEditFindings] = useState("");
  const [editImpression, setEditImpression] = useState("");
  const [editTechnique, setEditTechnique] = useState("");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Report[]>("/api/v1/imaging/reporting/reports/").then(d => { if (d && d.length) setReports(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSelect = (r: Report) => { setSelected(r); setEditTechnique(r.technique); setEditFindings(r.findings); setEditImpression(r.impression); };
  const handleSave = (sign: boolean) => {
    if (!selected) return;
    const updated = { ...selected, technique: editTechnique, findings: editFindings, impression: editImpression, status: (sign ? "signed" : "draft") as Report["status"] };
    setReports(prev => prev.map(r => r.id === selected.id ? updated : r));
    setSelected(updated);
    apiFetch(`/api/v1/imaging/reporting/reports/${selected.id}/`, { method: "PATCH", body: JSON.stringify(updated) }).catch(() => {});
  };

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1400, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    split: { display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "1.5rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" },
    listItem: { padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)", cursor: "pointer" as const },
    textarea: { width: "100%", background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", padding: "0.6rem", fontSize: "0.875rem", resize: "vertical" as const, fontFamily: "inherit", minHeight: 90 },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "إعداد تقارير الأشعة" : "Radiology Reporting Workspace"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{reports.filter(r => r.status === "awaiting").length} {isAr ? "بانتظار التقرير" : "awaiting report"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/imaging" style={s.btn}>{isAr ? "← الأشعة" : "← Imaging"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.split}>
        <div style={s.card}>
          {reports.map(r => (
            <div key={r.id} onClick={() => handleSelect(r)} style={{ ...s.listItem, background: selected?.id === r.id ? "rgba(34,211,238,0.08)" : "transparent", borderLeft: selected?.id === r.id ? "3px solid #22D3EE" : "3px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{isAr ? r.patient_ar : r.patient}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{r.modality} · {r.body_part} · {r.created_at}</div>
                </div>
                <span style={{ background: `${STATUS_COLOR[r.status]}22`, color: STATUS_COLOR[r.status], border: `1px solid ${STATUS_COLOR[r.status]}55`, borderRadius: 4, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 600, whiteSpace: "nowrap" }}>{r.status}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: 2 }}>{r.accession} · {r.radiologist}</div>
            </div>
          ))}
        </div>
        <div style={s.card}>
          {!selected ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>{isAr ? "اختر دراسة من القائمة" : "Select a study to begin reporting"}</div>
          ) : (
            <div style={{ padding: "1.25rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>{isAr ? selected.patient_ar : selected.patient} — {selected.body_part}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{selected.accession} · {selected.modality} · {selected.radiologist}</div>
              </div>
              {[{ label: isAr ? "الأسلوب" : "Technique", value: editTechnique, setter: setEditTechnique, rows: 3 }, { label: isAr ? "النتائج" : "Findings", value: editFindings, setter: setEditFindings, rows: 6 }, { label: isAr ? "الانطباع" : "Impression", value: editImpression, setter: setEditImpression, rows: 4 }].map(field => (
                <div key={field.label} style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "0.82rem", marginBottom: "0.4rem", color: "#22D3EE" }}>{field.label}</label>
                  <textarea rows={field.rows} style={s.textarea} value={field.value} onChange={e => field.setter(e.target.value)} placeholder={selected.status === "signed" ? (isAr ? "التقرير موقع" : "Report signed — read only") : ""} readOnly={selected.status === "signed"} />
                </div>
              ))}
              {selected.status !== "signed" && (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => handleSave(false)} style={{ background: "#22D3EE22", color: "#22D3EE", border: "1px solid #22D3EE55", borderRadius: 6, padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 600 }}>{isAr ? "حفظ كمسودة" : "Save Draft"}</button>
                  <button onClick={() => handleSave(true)} style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55", borderRadius: 6, padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 600 }}>{isAr ? "توقيع ونشر" : "Sign & Publish"}</button>
                </div>
              )}
              {selected.status === "signed" && <div style={{ color: "#22c55e", fontWeight: 600, fontSize: "0.875rem" }}>✓ {isAr ? "التقرير موقع" : "Report signed"}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
