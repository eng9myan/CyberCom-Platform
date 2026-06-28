"use client";

import { useState, useEffect } from "react";

interface ClinicMetrics {
  waiting_patients: number;
  in_consultation: number;
  completed_today: number;
  appointments_today: number;
  avg_wait_minutes: number;
  no_shows: number;
}

interface QueueEntry {
  id: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  check_in_time: string;
  wait_minutes: number;
  triage_level: "urgent" | "semi_urgent" | "routine";
  specialty: string;
  status: "waiting" | "in_consultation" | "completed";
}

const MOCK_METRICS: ClinicMetrics = {
  waiting_patients: 12,
  in_consultation: 5,
  completed_today: 34,
  appointments_today: 58,
  avg_wait_minutes: 18,
  no_shows: 3,
};

const MOCK_QUEUE: QueueEntry[] = [
  { id: "1", patient_name: "Ahmed Al-Rashid", patient_name_ar: "أحمد الراشد", mrn: "MRN-001234", check_in_time: "09:15", wait_minutes: 23, triage_level: "urgent", specialty: "Internal Medicine", status: "waiting" },
  { id: "2", patient_name: "Sara Khalil", patient_name_ar: "سارة خليل", mrn: "MRN-001235", check_in_time: "09:20", wait_minutes: 18, triage_level: "semi_urgent", specialty: "Cardiology", status: "waiting" },
  { id: "3", patient_name: "Omar Hassan", patient_name_ar: "عمر حسن", mrn: "MRN-001236", check_in_time: "09:05", wait_minutes: 5, triage_level: "routine", specialty: "General Practice", status: "in_consultation" },
  { id: "4", patient_name: "Layla Mansour", patient_name_ar: "ليلى منصور", mrn: "MRN-001237", check_in_time: "09:30", wait_minutes: 8, triage_level: "semi_urgent", specialty: "Dermatology", status: "waiting" },
  { id: "5", patient_name: "Khalid Al-Nouri", patient_name_ar: "خالد النوري", mrn: "MRN-001238", check_in_time: "08:45", wait_minutes: 0, triage_level: "routine", specialty: "Orthopedics", status: "completed" },
];

function triageColor(level: string) {
  if (level === "urgent") return "#ef4444";
  if (level === "semi_urgent") return "#f59e0b";
  return "#22c55e";
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    waiting: "background:#fef3c7;color:#92400e;",
    in_consultation: "background:#dbeafe;color:#1e40af;",
    completed: "background:#d1fae5;color:#065f46;",
  };
  return styles[status] || "";
}

export default function ClinicPortal() {
  const [metrics, setMetrics] = useState<ClinicMetrics>(MOCK_METRICS);
  const [queue, setQueue] = useState<QueueEntry[]>(MOCK_QUEUE);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [filter, setFilter] = useState<"all" | "waiting" | "in_consultation" | "completed">("all");

  const filtered = filter === "all" ? queue : queue.filter(q => q.status === filter);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Clinic" : "عيادة سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {lang === "en" ? "Outpatient Clinic Management" : "إدارة العيادات الخارجية"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/clinic/reception", label: lang === "en" ? "Reception" : "الاستقبال" },
          { href: "/clinic/appointments", label: lang === "en" ? "Appointments" : "المواعيد" },
          { href: "/clinic/triage", label: lang === "en" ? "Triage" : "الفرز" },
          { href: "/clinic/consultations", label: lang === "en" ? "Consultations" : "الاستشارات" },
          { href: "/clinic/telemedicine", label: lang === "en" ? "Telemedicine" : "التطبيب عن بُعد" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Metrics */}
      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: lang === "en" ? "Waiting" : "في الانتظار", value: metrics.waiting_patients, color: "#f59e0b" },
          { label: lang === "en" ? "In Consultation" : "في الاستشارة", value: metrics.in_consultation, color: "#3b82f6" },
          { label: lang === "en" ? "Completed Today" : "مكتمل اليوم", value: metrics.completed_today, color: "#22c55e" },
          { label: lang === "en" ? "Total Appointments" : "إجمالي المواعيد", value: metrics.appointments_today, color: "#8b5cf6" },
          { label: lang === "en" ? "Avg Wait (min)" : "متوسط الانتظار (دقيقة)", value: metrics.avg_wait_minutes, color: "#ec4899" },
          { label: lang === "en" ? "No Shows" : "غائبون", value: metrics.no_shows, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="glass-card" style={{ textAlign: "center", padding: "1.25rem" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Queue Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: "1rem" }}>{lang === "en" ? "Patient Queue" : "طابور المرضى"}</span>
        <div style={{ display: "flex", gap: "0.25rem", marginLeft: "auto" }}>
          {(["all", "waiting", "in_consultation", "completed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                fontSize: "0.8rem",
                background: filter === f ? "var(--color-primary)" : "var(--color-surface)",
                color: filter === f ? "#fff" : "var(--color-text)",
              }}
            >
              {f === "all" ? (lang === "en" ? "All" : "الكل") :
               f === "waiting" ? (lang === "en" ? "Waiting" : "انتظار") :
               f === "in_consultation" ? (lang === "en" ? "In Consult" : "استشارة") :
               (lang === "en" ? "Done" : "مكتمل")}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <div className="glass-card" style={{ overflowX: "auto", padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-elevated)", borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "MRN" : "الرقم الطبي",
                lang === "en" ? "Patient" : "المريض",
                lang === "en" ? "Check-In" : "وقت الوصول",
                lang === "en" ? "Wait" : "الانتظار",
                lang === "en" ? "Triage" : "الفرز",
                lang === "en" ? "Specialty" : "التخصص",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Actions" : "إجراءات",
              ].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-surface)" }}>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontFamily: "monospace" }}>{entry.mrn}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ fontWeight: 500 }}>{lang === "ar" ? entry.patient_name_ar : entry.patient_name}</div>
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>{entry.check_in_time}</td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: entry.wait_minutes > 20 ? 700 : 400, color: entry.wait_minutes > 20 ? "#ef4444" : "inherit" }}>
                  {entry.wait_minutes > 0 ? `${entry.wait_minutes}m` : "—"}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: triageColor(entry.triage_level), marginRight: "0.5rem" }} />
                  <span style={{ fontSize: "0.8rem" }}>{entry.triage_level.replace("_", " ")}</span>
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>{entry.specialty}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, ...Object.fromEntries((statusBadge(entry.status).split(";").filter(Boolean).map(s => s.split(":")))) }}>
                    {entry.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {entry.status === "waiting" && (
                      <button style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", borderRadius: "4px", background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer" }}>
                        {lang === "en" ? "Call In" : "استدعاء"}
                      </button>
                    )}
                    <button style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", borderRadius: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)" }}>
                      {lang === "en" ? "View" : "عرض"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            {lang === "en" ? "No patients in this queue" : "لا يوجد مرضى في هذا الطابور"}
          </div>
        )}
      </div>
    </div>
  );
}
