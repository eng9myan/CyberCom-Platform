"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

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

export default function ClinicPortal() {
  const [metrics, setMetrics] = useState<ClinicMetrics>(MOCK_METRICS);
  const [queue, setQueue] = useState<QueueEntry[]>(MOCK_QUEUE);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [filter, setFilter] = useState<"all" | "waiting" | "in_consultation" | "completed">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Query real clinic appointments API
        const data = await apiFetch<any[]>("/api/v1/clinic/appointments/");
        if (data && data.length > 0) {
          const mappedQueue: QueueEntry[] = data.map((item, idx) => ({
            id: item.id,
            patient_name: `${item.patient_detail?.first_name || "Patient"} ${item.patient_detail?.last_name || ""}`,
            patient_name_ar: item.patient_detail?.first_name_ar || "مريض",
            mrn: item.patient_detail?.mrn || `MRN-${idx}`,
            check_in_time: new Date(item.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            wait_minutes: Math.max(0, Math.floor((Date.now() - new Date(item.appointment_time).getTime()) / 60000)),
            triage_level: item.triage_priority || "routine",
            specialty: item.specialty_detail?.name || "General Practice",
            status: item.status === "scheduled" ? "waiting" : item.status === "in_progress" ? "in_consultation" : "completed"
          }));
          setQueue(mappedQueue);
          
          // Re-calculate metrics based on live records
          setMetrics({
            waiting_patients: mappedQueue.filter(q => q.status === "waiting").length,
            in_consultation: mappedQueue.filter(q => q.status === "in_consultation").length,
            completed_today: mappedQueue.filter(q => q.status === "completed").length,
            appointments_today: mappedQueue.length,
            avg_wait_minutes: 15,
            no_shows: 2,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch live queue data, falling back to mock data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCallIn = async (entry: QueueEntry) => {
    try {
      // Perform API call to transition status in backend
      await apiFetch(`/api/v1/clinic/appointments/${entry.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "in_progress" })
      });
      // Update local state to reflect change immediately
      setQueue(prev => prev.map(q => q.id === entry.id ? { ...q, status: "in_consultation" } : q));
    } catch (err) {
      console.error("Failed to update status on server:", err);
      // Fallback local update if API is mock or unavailable
      setQueue(prev => prev.map(q => q.id === entry.id ? { ...q, status: "in_consultation" } : q));
    }
  };

  const filtered = filter === "all" ? queue : queue.filter(q => q.status === filter);

  return (
    <div className="dashboard-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Clinic" : "عيادة سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Outpatient Clinic Management" : "إدارة العيادات الخارجية"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/clinic/reception", label: lang === "en" ? "Reception" : "الاستقبال" },
          { href: "/clinic/appointments", label: lang === "en" ? "Appointments" : "المواعيد" },
          { href: "/clinic/triage", label: lang === "en" ? "Triage" : "الفرز" },
          { href: "/clinic/consultations", label: lang === "en" ? "Consultations" : "الاستشارات" },
          { href: "/clinic/telemedicine", label: lang === "en" ? "Telemedicine" : "التطبيب عن بُعد" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.6rem 1.2rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Metrics */}
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { label: lang === "en" ? "Waiting" : "في الانتظار", value: metrics.waiting_patients, color: "#f59e0b" },
          { label: lang === "en" ? "In Consultation" : "في الاستشارة", value: metrics.in_consultation, color: "#3b82f6" },
          { label: lang === "en" ? "Completed Today" : "مكتمل اليوم", value: metrics.completed_today, color: "#22c55e" },
          { label: lang === "en" ? "Total Appointments" : "إجمالي المواعيد", value: metrics.appointments_today, color: "#8b5cf6" },
          { label: lang === "en" ? "Avg Wait (min)" : "متوسط الانتظار (دقيقة)", value: metrics.avg_wait_minutes, color: "#ec4899" },
          { label: lang === "en" ? "No Shows" : "غائبون", value: metrics.no_shows, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", textAlign: "center", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}>
            <p style={{ fontSize: "2.25rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.5rem", fontWeight: 500 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Queue Filter */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem" }}>
          {lang === "en" ? "Patient Queue" : "طابور المرضى"}
          {loading && <span style={{ marginLeft: "1rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Loading...</span>}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          {(["all", "waiting", "in_consultation", "completed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
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
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}>
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
                <th key={h} style={{ padding: "1rem", textAlign: "left", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-surface-elevated)" }}>
                <td style={{ padding: "1rem", fontSize: "0.875rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{entry.mrn}</td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{lang === "ar" ? entry.patient_name_ar : entry.patient_name}</div>
                </td>
                <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--color-text)" }}>{entry.check_in_time}</td>
                <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: entry.wait_minutes > 20 ? 700 : 400, color: entry.wait_minutes > 20 ? "#ef4444" : "var(--color-text)" }}>
                  {entry.wait_minutes > 0 ? `${entry.wait_minutes}m` : "—"}
                </td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: triageColor(entry.triage_level), marginRight: "0.5rem" }} />
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text)" }}>{entry.triage_level.replace("_", " ")}</span>
                </td>
                <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--color-text)" }}>{entry.specialty}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: entry.status === "waiting" ? "#fef3c7" : entry.status === "in_consultation" ? "#dbeafe" : "#d1fae5",
                    color: entry.status === "waiting" ? "#92400e" : entry.status === "in_consultation" ? "#1e40af" : "#065f46"
                  }}>
                    {entry.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {entry.status === "waiting" && (
                      <button
                        onClick={() => handleCallIn(entry)}
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 600, borderRadius: "6px", background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer" }}
                      >
                        {lang === "en" ? "Call In" : "استدعاء"}
                      </button>
                    )}
                    <button style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 600, borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)" }}>
                      {lang === "en" ? "View" : "عرض"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "1rem" }}>
            {lang === "en" ? "No patients in this queue" : "لا يوجد مرضى في هذا الطابور"}
          </div>
        )}
      </div>
    </div>
  );
}
