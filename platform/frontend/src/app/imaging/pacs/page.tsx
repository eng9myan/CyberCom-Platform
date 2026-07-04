"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Study { id: string; accession: string; patient: string; patient_ar: string; mrn: string; modality: string; body_part: string; study_date: string; series: number; images: number; status: "available" | "pending_report" | "reported" | "archived"; }
const MOCK: Study[] = [
  { id: "s001", accession: "RAD-2026-0701", patient: "Fatima Al-Harbi", patient_ar: "فاطمة الحربي", mrn: "MRN-002145", modality: "CT", body_part: "Chest", study_date: "2026-07-01", series: 4, images: 312, status: "pending_report" },
  { id: "s002", accession: "RAD-2026-0702", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", mrn: "MRN-002146", modality: "MRI", body_part: "Brain", study_date: "2026-07-01", series: 6, images: 180, status: "reported" },
  { id: "s003", accession: "RAD-2026-0703", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", mrn: "MRN-002147", modality: "X-Ray", body_part: "Chest PA", study_date: "2026-07-01", series: 2, images: 2, status: "reported" },
  { id: "s004", accession: "RAD-2026-0704", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", mrn: "MRN-002148", modality: "Ultrasound", body_part: "Abdomen", study_date: "2026-07-01", series: 1, images: 45, status: "pending_report" },
  { id: "s005", accession: "RAD-2026-0705", patient: "Nora Al-Qahtani", patient_ar: "نورة القحطاني", mrn: "MRN-002149", modality: "CT", body_part: "Abdomen & Pelvis", study_date: "2026-06-30", series: 5, images: 480, status: "reported" },
  { id: "s006", accession: "RAD-2026-0706", patient: "Tariq Al-Shammari", patient_ar: "طارق الشمري", mrn: "MRN-002150", modality: "MRI", body_part: "Lumbar Spine", study_date: "2026-06-30", series: 8, images: 240, status: "reported" },
  { id: "s007", accession: "RAD-2026-0707", patient: "Hessa Al-Mutairi", patient_ar: "حصة المطيري", mrn: "MRN-002151", modality: "PET-CT", body_part: "Whole Body", study_date: "2026-06-29", series: 3, images: 520, status: "archived" },
  { id: "s008", accession: "RAD-2026-0708", patient: "Badr Al-Rashidi", patient_ar: "بدر الرشيدي", mrn: "MRN-002152", modality: "X-Ray", body_part: "Right Knee", study_date: "2026-07-01", series: 2, images: 4, status: "available" },
  { id: "s009", accession: "RAD-2026-0709", patient: "Sara Al-Harbi", patient_ar: "سارة الحربي", mrn: "MRN-002153", modality: "Mammogram", body_part: "Bilateral", study_date: "2026-06-30", series: 4, images: 8, status: "pending_report" },
  { id: "s010", accession: "RAD-2026-0710", patient: "Khalid Al-Sayed", patient_ar: "خالد السيد", mrn: "MRN-002154", modality: "CT", body_part: "Head", study_date: "2026-07-01", series: 3, images: 280, status: "pending_report" },
  { id: "s011", accession: "RAD-2026-0711", patient: "Lujain Al-Anzi", patient_ar: "لجين العنزي", mrn: "MRN-002155", modality: "MRI", body_part: "Knee", study_date: "2026-06-29", series: 5, images: 160, status: "reported" },
  { id: "s012", accession: "RAD-2026-0712", patient: "Waleed Al-Bishi", patient_ar: "وليد البيشي", mrn: "MRN-002156", modality: "Ultrasound", body_part: "Thyroid", study_date: "2026-07-01", series: 1, images: 30, status: "available" },
  { id: "s013", accession: "RAD-2026-0713", patient: "Mona Al-Harbi", patient_ar: "منى الحربي", mrn: "MRN-002157", modality: "Fluoroscopy", body_part: "Upper GI", study_date: "2026-06-28", series: 2, images: 120, status: "archived" },
  { id: "s014", accession: "RAD-2026-0714", patient: "Faris Al-Ghamdi", patient_ar: "فارس الغامدي", mrn: "MRN-002158", modality: "CT", body_part: "Coronary CTA", study_date: "2026-07-01", series: 4, images: 350, status: "pending_report" },
  { id: "s015", accession: "RAD-2026-0715", patient: "Afnan Al-Otaibi", patient_ar: "أفنان العتيبي", mrn: "MRN-002159", modality: "MRI", body_part: "Pelvis", study_date: "2026-06-30", series: 7, images: 210, status: "reported" },
];
const STATUS_COLOR: Record<string, string> = { available: "#22D3EE", pending_report: "#f59e0b", reported: "#22c55e", archived: "#6b7280" };
const MOD_COLORS: Record<string, string> = { CT: "#a78bfa", MRI: "#22D3EE", "X-Ray": "#22c55e", Ultrasound: "#60a5fa", Mammogram: "#f472b6", "PET-CT": "#fb923c", Fluoroscopy: "#facc15" };

export default function PACSPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [studies, setStudies] = useState<Study[]>(MOCK);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Study[]>("/api/v1/imaging/pacs/studies/").then(d => { if (d && d.length) setStudies(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = studies.filter(s => !search || s.accession.includes(search) || s.patient.toLowerCase().includes(search.toLowerCase()) || s.mrn.includes(search) || s.modality.toLowerCase().includes(search.toLowerCase()));

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
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
          <h1 style={s.h1}>{isAr ? "نظام أرشفة الصور الطبية (PACS)" : "PACS — Imaging Study Browser"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{isAr ? "عارض DICOM — OHIF Viewer متكامل" : "DICOM viewer — integrates with OHIF Viewer"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/imaging" style={s.btn}>{isAr ? "← الأشعة" : "← Imaging"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={{ marginBottom: "1.25rem" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث باسم المريض، الرقم، أو الطريقة..." : "Search by patient, accession, MRN, modality..."} style={{ width: "100%", maxWidth: 480, padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.9rem" }} />
      </div>
      <div style={{ background: "rgba(22,211,238,0.06)", border: "1px solid rgba(22,211,238,0.2)", borderRadius: 6, padding: "0.6rem 1rem", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#a5f3fc" }}>
        ℹ {isAr ? "انقر على 'فتح' لعرض الدراسة في OHIF DICOM Viewer" : "Click 'Open' to view study in OHIF DICOM Viewer (opens in new tab)"}
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: "rgba(34,211,238,0.05)" }}>
              <th style={s.th}>{isAr ? "رقم الوصول" : "Accession"}</th>
              <th style={s.th}>{isAr ? "المريض" : "Patient"}</th>
              <th style={s.th}>{isAr ? "الطريقة" : "Modality"}</th>
              <th style={s.th}>{isAr ? "العضو" : "Body Part"}</th>
              <th style={s.th}>{isAr ? "التاريخ" : "Date"}</th>
              <th style={s.th}>{isAr ? "سلاسل / صور" : "Series/Images"}</th>
              <th style={s.th}>{isAr ? "الحالة" : "Status"}</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(study => (
              <tr key={study.id}>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{study.accession}</td>
                <td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? study.patient_ar : study.patient}</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{study.mrn}</div></td>
                <td style={s.td}><span style={{ background: `${MOD_COLORS[study.modality] ?? "#6b7280"}22`, color: MOD_COLORS[study.modality] ?? "#6b7280", border: `1px solid ${MOD_COLORS[study.modality] ?? "#6b7280"}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.78rem", fontWeight: 700 }}>{study.modality}</span></td>
                <td style={s.td}>{study.body_part}</td>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{study.study_date}</td>
                <td style={s.td}>{study.series} / {study.images}</td>
                <td style={s.td}><span style={{ background: `${STATUS_COLOR[study.status]}22`, color: STATUS_COLOR[study.status], border: `1px solid ${STATUS_COLOR[study.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{study.status.replace("_", " ")}</span></td>
                <td style={s.td}><button style={{ background: "#22D3EE22", color: "#22D3EE", border: "1px solid #22D3EE55", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>{isAr ? "فتح" : "Open"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
