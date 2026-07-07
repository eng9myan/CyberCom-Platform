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
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === "en" ? "CyMed Imaging" : "تصوير سايمد"}
          </h1>
          <p className="text-sm text-ink/50">
            {lang === "en" ? "Radiology & Medical Imaging" : "الأشعة والتصوير الطبي"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {[
          { href: "/imaging/orders", label: lang === "en" ? "Orders" : "الطلبات" },
          { href: "/imaging/scheduling", label: lang === "en" ? "Scheduling" : "الجدولة" },
          { href: "/imaging/reports", label: lang === "en" ? "Reporting" : "التقارير" },
          { href: "/imaging/pacs", label: lang === "en" ? "PACS Viewer" : "عارض PACS" },
        ].map(item => (
          <a key={item.href} href={item.href} className="rounded-md border border-ink/10 bg-surface px-4 py-1.5 text-sm font-medium text-ink hover:bg-ink/5">
            {item.label}
          </a>
        ))}
      </nav>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
        {[
          { label: lang === "en" ? "Studies Today" : "دراسات اليوم", value: METRICS.studies_today, color: "#6366f1" },
          { label: lang === "en" ? "Pending Report" : "انتظار تقرير", value: METRICS.pending_report, color: "#f59e0b" },
          { label: lang === "en" ? "In Progress" : "قيد التنفيذ", value: METRICS.in_progress, color: "#3b82f6" },
          { label: lang === "en" ? "Completed" : "مكتمل", value: METRICS.completed, color: "#22c55e" },
          { label: lang === "en" ? "Avg TAT (hrs)" : "متوسط الوقت", value: METRICS.avg_report_tat_hours, color: "#8b5cf6" },
          { label: lang === "en" ? "Teleradiology" : "تشعيع عن بُعد", value: METRICS.teleradiology_pending, color: "#ec4899" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Modality Utilization */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
        {Object.entries(METRICS.modality_utilization).map(([mod, pct]) => (
          <div key={mod} className="cy-card p-4 text-center">
            <div className="text-xl font-bold" style={{ color: MODALITY_COLORS[mod] }}>{pct}%</div>
            <div className="my-2 h-1.5 rounded-full bg-ink/10">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: MODALITY_COLORS[mod] }} />
            </div>
            <div className="text-sm font-semibold" style={{ color: MODALITY_COLORS[mod] }}>{mod}</div>
            <div className="text-xs text-ink/50">{lang === "en" ? "Utilization" : "الاستخدام"}</div>
          </div>
        ))}
      </div>

      {/* Studies Table */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{lang === "en" ? "Worklist" : "قائمة العمل"}</h2>
        <div className="flex gap-1">
          {["all", "CT", "MRI", "XR", "US"].map(f => (
            <button key={f} onClick={() => setModalityFilter(f)} className="rounded-md border border-ink/10 px-2.5 py-1 text-sm" style={{ background: modalityFilter === f ? (MODALITY_COLORS[f] || "#22D3EE") : "transparent", color: modalityFilter === f ? "#fff" : undefined }}>
              {f === "all" ? (lang === "en" ? "All" : "الكل") : f}
            </button>
          ))}
        </div>
      </div>

      <div className="cy-card overflow-hidden p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              {["Accession", "Patient", "Study", "Modality", "Priority", "Time", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((study) => (
              <tr key={study.id} className="border-b border-ink/10">
                <td className="px-4 py-3 font-mono text-xs text-brand-400">{study.accession_number}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium">{lang === "ar" ? study.patient_name_ar : study.patient_name}</div>
                  <div className="text-xs text-ink/50">{study.mrn}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{study.study_description}</div>
                  <div className="text-xs text-ink/50">{study.ordered_by}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded px-2.5 py-1 text-sm font-bold" style={{ background: MODALITY_COLORS[study.modality] + "22", color: MODALITY_COLORS[study.modality] }}>
                    {study.modality}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold" style={{ color: study.priority === "stat" ? "#ef4444" : study.priority === "urgent" ? "#f59e0b" : "#22c55e" }}>
                    {study.priority.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{study.scheduled_time}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: statusColor(study.status) + "22", color: statusColor(study.status) }}>
                    {study.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {study.status === "images_available" && (
                      <button className="rounded-md bg-violet-500 px-2.5 py-1 text-xs font-semibold text-white">
                        {lang === "en" ? "Report" : "تقرير"}
                      </button>
                    )}
                    <button className="rounded-md border border-ink/10 bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
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
