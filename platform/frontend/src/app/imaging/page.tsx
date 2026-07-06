"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

interface ImagingStudy {
  id: string;
  accession_number: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  modality: "CT" | "MRI" | "XR" | "US" | "NM" | "PET";
  study_description: string;
  ordered_by: string;
  priority: "routine" | "urgent" | "stat";
  status: "ordered" | "scheduled" | "in_progress" | "images_available" | "reported" | "verified";
  scheduled_time: string;
  radiologist?: string;
}

interface ImagingMetrics {
  studies_today: number;
  pending_report: number;
  in_progress: number;
  completed: number;
  modality_utilization: Record<string, number>;
  avg_report_tat_hours: number;
  teleradiology_pending: number;
}

const METRICS: ImagingMetrics = {
  studies_today: 84,
  pending_report: 18,
  in_progress: 7,
  completed: 59,
  modality_utilization: { CT: 82, MRI: 91, XR: 65, US: 74 },
  avg_report_tat_hours: 3.2,
  teleradiology_pending: 4,
};

const STUDIES: ImagingStudy[] = [
  { id: "1", accession_number: "ACC-2026-4401", patient_name: "Khaled Al-Faris", patient_name_ar: "خالد الفارس", mrn: "MRN-007812", modality: "CT", study_description: "CT Brain without Contrast", ordered_by: "Dr. Rania Kassem", priority: "stat", status: "in_progress", scheduled_time: "09:30" },
  { id: "2", accession_number: "ACC-2026-4402", patient_name: "Hana Ibrahim", patient_name_ar: "هناء إبراهيم", mrn: "MRN-007813", modality: "MRI", study_description: "MRI Lumbar Spine with Contrast", ordered_by: "Dr. Omar Suleiman", priority: "routine", status: "scheduled", scheduled_time: "10:15", radiologist: "Dr. Layla Amin" },
  { id: "3", accession_number: "ACC-2026-4403", patient_name: "Tariq Mansour", patient_name_ar: "طارق منصور", mrn: "MRN-007814", modality: "XR", study_description: "Chest X-Ray PA & Lateral", ordered_by: "Dr. Aisha Nouri", priority: "urgent", status: "images_available", scheduled_time: "08:45", radiologist: "Dr. Ziad Khalil" },
  { id: "4", accession_number: "ACC-2026-4404", patient_name: "Sara Mahmoud", patient_name_ar: "سارة محمود", mrn: "MRN-007815", modality: "US", study_description: "Abdomen Ultrasound Complete", ordered_by: "Dr. Hassan Al-Rashid", priority: "routine", status: "reported", scheduled_time: "08:00", radiologist: "Dr. Maya Yousef" },
  { id: "5", accession_number: "ACC-2026-4405", patient_name: "Yousif Al-Amin", patient_name_ar: "يوسف الأمين", mrn: "MRN-007816", modality: "CT", study_description: "CT Chest Pulmonary Embolism Protocol", ordered_by: "Dr. Nadia Al-Sayed", priority: "stat", status: "ordered", scheduled_time: "10:00" },
];

const MODALITY_COLORS: Record<string, string> = { CT: "#3b82f6", MRI: "#8b5cf6", XR: "#22c55e", US: "#f59e0b", NM: "#ec4899", PET: "#14b8a6" };

function statusColor(s: string) {
  const map: Record<string, string> = {
    ordered: "#6b7280", scheduled: "#3b82f6", in_progress: "#f59e0b",
    images_available: "#8b5cf6", reported: "#14b8a6", verified: "#22c55e",
  };
  return map[s] || "#6b7280";
}

export default function ImagingPortal() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [modalityFilter, setModalityFilter] = useState<string>("all");

  const filtered = modalityFilter === "all" ? STUDIES : STUDIES.filter(s => s.modality === modalityFilter);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Imaging" : "تصوير سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {lang === "en" ? "Radiology & Medical Imaging" : "الأشعة والتصوير الطبي"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/imaging/orders", label: lang === "en" ? "Orders" : "الطلبات" },
          { href: "/imaging/scheduling", label: lang === "en" ? "Scheduling" : "الجدولة" },
          { href: "/imaging/reports", label: lang === "en" ? "Reporting" : "التقارير" },
          { href: "/imaging/pacs", label: lang === "en" ? "PACS Viewer" : "عارض PACS" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Metrics */}
      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: lang === "en" ? "Studies Today" : "دراسات اليوم", value: METRICS.studies_today, color: "#6366f1" },
          { label: lang === "en" ? "Pending Report" : "انتظار تقرير", value: METRICS.pending_report, color: "#f59e0b" },
          { label: lang === "en" ? "In Progress" : "قيد التنفيذ", value: METRICS.in_progress, color: "#3b82f6" },
          { label: lang === "en" ? "Completed" : "مكتمل", value: METRICS.completed, color: "#22c55e" },
          { label: lang === "en" ? "Avg TAT (hrs)" : "متوسط الوقت", value: METRICS.avg_report_tat_hours, color: "#8b5cf6" },
          { label: lang === "en" ? "Teleradiology" : "تشعيع عن بُعد", value: METRICS.teleradiology_pending, color: "#ec4899" },
        ].map(m => (
          <div key={m.label} className="glass-card" style={{ textAlign: "center", padding: "1rem" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Modality Utilization */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {Object.entries(METRICS.modality_utilization).map(([mod, pct]) => (
          <div key={mod} className="glass-card" style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: MODALITY_COLORS[mod] }}>{pct}%</div>
            <div style={{ height: "6px", background: "var(--color-border)", borderRadius: "3px", margin: "0.5rem 0" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: MODALITY_COLORS[mod], borderRadius: "3px" }} />
            </div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: MODALITY_COLORS[mod] }}>{mod}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Utilization" : "الاستخدام"}</div>
          </div>
        ))}
      </div>

      {/* Studies Table */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{lang === "en" ? "Worklist" : "قائمة العمل"}</h2>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {["all", "CT", "MRI", "XR", "US"].map(f => (
            <button key={f} onClick={() => setModalityFilter(f)} style={{ padding: "0.3rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.8rem", background: modalityFilter === f ? (MODALITY_COLORS[f] || "var(--color-primary)") : "var(--color-surface)", color: modalityFilter === f ? "#fff" : "var(--color-text)" }}>
              {f === "all" ? (lang === "en" ? "All" : "الكل") : f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ overflowX: "auto", padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-elevated)", borderBottom: "2px solid var(--color-border)" }}>
              {["Accession", "Patient", "Study", "Modality", "Priority", "Time", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((study, i) => (
              <tr key={study.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-surface)" }}>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", fontFamily: "monospace", color: "var(--color-primary)" }}>{study.accession_number}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{lang === "ar" ? study.patient_name_ar : study.patient_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{study.mrn}</div>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ fontSize: "0.85rem" }}>{study.study_description}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{study.ordered_by}</div>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, background: MODALITY_COLORS[study.modality] + "22", color: MODALITY_COLORS[study.modality] }}>
                    {study.modality}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: study.priority === "stat" ? "#ef4444" : study.priority === "urgent" ? "#f59e0b" : "#22c55e" }}>
                    {study.priority.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>{study.scheduled_time}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: statusColor(study.status) + "22", color: statusColor(study.status) }}>
                    {study.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    {study.status === "images_available" && (
                      <button style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px", background: "#8b5cf6", color: "#fff", border: "none", cursor: "pointer" }}>
                        {lang === "en" ? "Report" : "تقرير"}
                      </button>
                    )}
                    <button style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)" }}>
                      {lang === "en" ? "View" : "عرض"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
