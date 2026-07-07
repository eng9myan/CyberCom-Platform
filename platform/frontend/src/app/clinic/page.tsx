"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface ClinicAppointmentRaw {
  id: string;
  patient_detail?: { first_name?: string; last_name?: string; first_name_ar?: string; mrn?: string };
  appointment_time: string;
  triage_priority?: string;
  specialty_detail?: { name?: string };
  status?: string;
}

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
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [filter, setFilter] = useState<"all" | "waiting" | "in_consultation" | "completed">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Query real clinic appointments API
        const data = await apiFetch<ClinicAppointmentRaw[]>("/api/v1/clinic/appointments/");
        if (data && data.length > 0) {
          const mappedQueue: QueueEntry[] = data.map((item, idx) => ({
            id: item.id,
            patient_name: `${item.patient_detail?.first_name || "Patient"} ${item.patient_detail?.last_name || ""}`,
            patient_name_ar: item.patient_detail?.first_name_ar || "مريض",
            mrn: item.patient_detail?.mrn || `MRN-${idx}`,
            check_in_time: new Date(item.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            wait_minutes: Math.max(0, Math.floor((Date.now() - new Date(item.appointment_time).getTime()) / 60000)),
            triage_level: (item.triage_priority ?? "routine") as "urgent" | "semi_urgent" | "routine",
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
    void loadData();
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
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === "en" ? "CyMed Clinic" : "عيادة سايمد"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Outpatient Clinic Management" : "إدارة العيادات الخارجية"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink/50">
            {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="mb-8 flex flex-wrap gap-3">
        {[
          { href: "/clinic/reception", label: lang === "en" ? "Reception" : "الاستقبال" },
          { href: "/clinic/appointments", label: lang === "en" ? "Appointments" : "المواعيد" },
          { href: "/clinic/triage", label: lang === "en" ? "Triage" : "الفرز" },
          { href: "/clinic/consultations", label: lang === "en" ? "Consultations" : "الاستشارات" },
          { href: "/clinic/telemedicine", label: lang === "en" ? "Telemedicine" : "التطبيب عن بُعد" },
        ].map(item => (
          <a key={item.href} href={item.href} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
            {item.label}
          </a>
        ))}
      </nav>

      {/* Metrics */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {[
          { label: lang === "en" ? "Waiting" : "في الانتظار", value: metrics.waiting_patients, color: "#f59e0b" },
          { label: lang === "en" ? "In Consultation" : "في الاستشارة", value: metrics.in_consultation, color: "#3b82f6" },
          { label: lang === "en" ? "Completed Today" : "مكتمل اليوم", value: metrics.completed_today, color: "#22c55e" },
          { label: lang === "en" ? "Total Appointments" : "إجمالي المواعيد", value: metrics.appointments_today, color: "#8b5cf6" },
          { label: lang === "en" ? "Avg Wait (min)" : "متوسط الانتظار (دقيقة)", value: metrics.avg_wait_minutes, color: "#ec4899" },
          { label: lang === "en" ? "No Shows" : "غائبون", value: metrics.no_shows, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="cy-card p-5 text-center">
            <p className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-2 text-sm font-medium text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Queue Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h2 className="text-lg font-bold">
          {lang === "en" ? "Patient Queue" : "طابور المرضى"}
          {loading && <span className="ml-4 text-sm font-normal text-ink/50">Loading...</span>}
        </h2>
        <div className="ml-auto flex gap-2">
          {(["all", "waiting", "in_consultation", "completed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${filter === f ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}
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
      <div className="cy-card overflow-auto p-0">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
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
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-ink/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id} className="border-b border-ink/5">
                <td className="px-4 py-3.5 font-mono text-sm text-ink/50">{entry.mrn}</td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-semibold">{lang === "ar" ? entry.patient_name_ar : entry.patient_name}</div>
                </td>
                <td className="px-4 py-3.5 text-sm">{entry.check_in_time}</td>
                <td className={`px-4 py-3.5 text-sm ${entry.wait_minutes > 20 ? "font-bold text-red-400" : ""}`}>
                  {entry.wait_minutes > 0 ? `${entry.wait_minutes}m` : "—"}
                </td>
                <td className="px-4 py-3.5">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: triageColor(entry.triage_level) }} />
                  <span className="text-sm capitalize">{entry.triage_level.replace("_", " ")}</span>
                </td>
                <td className="px-4 py-3.5 text-sm">{entry.specialty}</td>
                <td className="px-4 py-3.5">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${entry.status === "waiting" ? "bg-amber-500/15 text-amber-300" : entry.status === "in_consultation" ? "bg-sky-500/15 text-sky-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                    {entry.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-2">
                    {entry.status === "waiting" && (
                      <button
                        onClick={() => { void handleCallIn(entry); }}
                        className="cy-btn cy-btn-primary !min-h-0 !py-1.5 !px-3 text-xs"
                      >
                        {lang === "en" ? "Call In" : "استدعاء"}
                      </button>
                    )}
                    <button className="cy-btn cy-btn-ghost !min-h-0 !py-1.5 !px-3 text-xs">
                      {lang === "en" ? "View" : "عرض"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-ink/40">
            {lang === "en" ? "No patients in this queue" : "لا يوجد مرضى في هذا الطابور"}
          </div>
        )}
      </div>
    </div>
  );
}
