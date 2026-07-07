"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AppointmentRaw {
  id: string;
  patient_detail?: {
    first_name?: string;
    last_name?: string;
    first_name_ar?: string;
    last_name_ar?: string;
    mrn?: string;
  };
  appointment_time?: string;
  scheduled_time?: string;
  specialty_detail?: { name?: string; name_ar?: string };
  provider_detail?: { first_name?: string; last_name?: string };
  status?: string;
  notes?: string;
}

interface Appointment {
  id: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  date: string;
  time: string;
  specialty: string;
  specialty_ar: string;
  provider: string;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  notes: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "APT-001", patient_name: "Ahmed Al-Rashid",    patient_name_ar: "أحمد الراشد",      mrn: "MRN-001234", date: "2026-06-30", time: "08:00", specialty: "Internal Medicine",  specialty_ar: "الباطنية",          provider: "Dr. Samir Haddad",    status: "completed",   notes: "Follow-up on hypertension management" },
  { id: "APT-002", patient_name: "Sara Khalil",         patient_name_ar: "سارة خليل",         mrn: "MRN-001235", date: "2026-06-30", time: "08:30", specialty: "Cardiology",          specialty_ar: "أمراض القلب",       provider: "Dr. Nadia Mansour",   status: "completed",   notes: "Echocardiogram review" },
  { id: "APT-003", patient_name: "Omar Hassan",          patient_name_ar: "عمر حسن",           mrn: "MRN-001236", date: "2026-06-30", time: "09:00", specialty: "General Practice",    specialty_ar: "الطب العام",        provider: "Dr. Tarek Al-Amin",   status: "in_progress", notes: "Annual check-up" },
  { id: "APT-004", patient_name: "Layla Mansour",       patient_name_ar: "ليلى منصور",        mrn: "MRN-001237", date: "2026-06-30", time: "09:30", specialty: "Dermatology",         specialty_ar: "الجلدية",           provider: "Dr. Reem Al-Sayed",   status: "confirmed",   notes: "Skin rash evaluation" },
  { id: "APT-005", patient_name: "Khalid Al-Nouri",     patient_name_ar: "خالد النوري",       mrn: "MRN-001238", date: "2026-06-30", time: "10:00", specialty: "Orthopedics",         specialty_ar: "العظام والمفاصل",   provider: "Dr. Basel Farouk",    status: "confirmed",   notes: "Knee pain — MRI results" },
  { id: "APT-006", patient_name: "Fatima Al-Zahra",     patient_name_ar: "فاطمة الزهراء",     mrn: "MRN-001239", date: "2026-06-30", time: "10:30", specialty: "Obstetrics",          specialty_ar: "التوليد والنساء",   provider: "Dr. Hala Ibrahim",    status: "scheduled",   notes: "28-week antenatal visit" },
  { id: "APT-007", patient_name: "Yousef Al-Harbi",     patient_name_ar: "يوسف الحربي",       mrn: "MRN-001240", date: "2026-06-30", time: "11:00", specialty: "Ophthalmology",       specialty_ar: "طب العيون",         provider: "Dr. Mazen Qassem",    status: "scheduled",   notes: "Vision correction check" },
  { id: "APT-008", patient_name: "Mariam Al-Otaibi",    patient_name_ar: "مريم العتيبي",      mrn: "MRN-001241", date: "2026-06-30", time: "11:30", specialty: "Endocrinology",       specialty_ar: "الغدد الصماء",      provider: "Dr. Samir Haddad",    status: "scheduled",   notes: "Diabetes HbA1c review" },
  { id: "APT-009", patient_name: "Tariq Bin Sultan",    patient_name_ar: "طارق بن سلطان",     mrn: "MRN-001242", date: "2026-06-30", time: "12:00", specialty: "Pulmonology",         specialty_ar: "الرئة والجهاز التنفسي", provider: "Dr. Lina Yousef",  status: "cancelled",   notes: "COPD follow-up — patient no-show" },
  { id: "APT-010", patient_name: "Noor Al-Deen",        patient_name_ar: "نور الدين",         mrn: "MRN-001243", date: "2026-06-30", time: "12:30", specialty: "Neurology",           specialty_ar: "الأعصاب",           provider: "Dr. Karim Nassar",    status: "scheduled",   notes: "Migraine management plan" },
  { id: "APT-011", patient_name: "Hassan Al-Aqrabawi",  patient_name_ar: "حسن العقرباوي",     mrn: "MRN-001244", date: "2026-06-30", time: "13:00", specialty: "Gastroenterology",    specialty_ar: "الجهاز الهضمي",    provider: "Dr. Tarek Al-Amin",   status: "scheduled",   notes: "Colonoscopy results discussion" },
  { id: "APT-012", patient_name: "Rana Al-Shammari",    patient_name_ar: "رنا الشمري",        mrn: "MRN-001245", date: "2026-06-30", time: "13:30", specialty: "Rheumatology",        specialty_ar: "الروماتيزم",        provider: "Dr. Nadia Mansour",   status: "scheduled",   notes: "Rheumatoid arthritis follow-up" },
  { id: "APT-013", patient_name: "Ali Bin Jaber",       patient_name_ar: "علي بن جابر",       mrn: "MRN-001246", date: "2026-06-30", time: "14:00", specialty: "Urology",             specialty_ar: "المسالك البولية",   provider: "Dr. Basel Farouk",    status: "confirmed",   notes: "Kidney stone post-procedure check" },
  { id: "APT-014", patient_name: "Dalal Al-Najjar",     patient_name_ar: "دلال النجار",       mrn: "MRN-001247", date: "2026-06-30", time: "14:30", specialty: "Hematology",          specialty_ar: "أمراض الدم",        provider: "Dr. Mazen Qassem",    status: "scheduled",   notes: "CBC follow-up — anemia workup" },
  { id: "APT-015", patient_name: "Saad Al-Qahtani",     patient_name_ar: "سعد القحطاني",      mrn: "MRN-001248", date: "2026-06-30", time: "15:00", specialty: "Psychiatry",          specialty_ar: "الطب النفسي",       provider: "Dr. Lina Yousef",     status: "confirmed",   notes: "Depression medication review" },
  { id: "APT-016", patient_name: "Noura Al-Mutairi",    patient_name_ar: "نورة المطيري",      mrn: "MRN-001249", date: "2026-06-30", time: "15:30", specialty: "Pediatrics",          specialty_ar: "طب الأطفال",        provider: "Dr. Hala Ibrahim",    status: "scheduled",   notes: "6-month vaccination schedule" },
  { id: "APT-017", patient_name: "Ibrahim Al-Hajri",    patient_name_ar: "إبراهيم الحاجري",   mrn: "MRN-001250", date: "2026-06-30", time: "16:00", specialty: "Cardiology",          specialty_ar: "أمراض القلب",       provider: "Dr. Karim Nassar",    status: "scheduled",   notes: "Holter monitor results" },
  { id: "APT-018", patient_name: "Wafa Al-Barrak",      patient_name_ar: "وفاء البراك",       mrn: "MRN-001251", date: "2026-06-30", time: "16:30", specialty: "Allergy & Immunology", specialty_ar: "الحساسية والمناعة", provider: "Dr. Reem Al-Sayed",  status: "scheduled",   notes: "Allergen panel review" },
  { id: "APT-019", patient_name: "Bilal Al-Suwaidan",   patient_name_ar: "بلال السويدان",     mrn: "MRN-001252", date: "2026-06-30", time: "17:00", specialty: "ENT",                 specialty_ar: "الأنف والأذن والحنجرة", provider: "Dr. Samir Haddad", status: "scheduled", notes: "Sinusitis — endoscopy review" },
  { id: "APT-020", patient_name: "Samira Al-Dosari",    patient_name_ar: "سميرة الدوسري",     mrn: "MRN-001253", date: "2026-06-30", time: "17:30", specialty: "Nephrology",          specialty_ar: "الكلى",             provider: "Dr. Tarek Al-Amin",   status: "cancelled",   notes: "CKD Stage 3 — cancelled by provider" },
];

const SPECIALTIES = ["All", "Internal Medicine", "Cardiology", "General Practice", "Dermatology", "Orthopedics", "Obstetrics", "Ophthalmology", "Endocrinology", "Pulmonology", "Neurology", "Gastroenterology", "Rheumatology", "Urology", "Hematology", "Psychiatry", "Pediatrics", "Allergy & Immunology", "ENT", "Nephrology"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status) {
    case "scheduled":   return "bg-sky-500/15 text-sky-300";
    case "confirmed":   return "bg-emerald-500/15 text-emerald-300";
    case "in_progress": return "bg-blue-500/15 text-blue-300";
    case "completed":   return "bg-emerald-500/10 text-emerald-400";
    case "cancelled":   return "bg-red-500/15 text-red-300";
    default:            return "bg-ink/10 text-ink/60";
  }
}

function statusLabel(status: string, lang: "en" | "ar"): string {
  const map: Record<string, { en: string; ar: string }> = {
    scheduled:   { en: "Scheduled",   ar: "مجدول"     },
    confirmed:   { en: "Confirmed",   ar: "مؤكد"      },
    in_progress: { en: "In Progress", ar: "جارٍ"       },
    completed:   { en: "Completed",   ar: "مكتمل"     },
    cancelled:   { en: "Cancelled",   ar: "ملغي"      },
  };
  return map[status]?.[lang] ?? status;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("All");
  const [filterDate, setFilterDate] = useState<string>("2026-06-30");
  const [actionMsg, setActionMsg] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch<AppointmentRaw[]>("/api/v1/clinic/appointments/");
        if (data && data.length > 0) {
          const mapped: Appointment[] = data.map((item, idx) => {
            const dt = item.appointment_time || item.scheduled_time || "";
            const d = dt ? new Date(dt) : new Date();
            return {
              id: item.id,
              patient_name: `${item.patient_detail?.first_name ?? "Patient"} ${item.patient_detail?.last_name ?? ""}`.trim(),
              patient_name_ar: `${item.patient_detail?.first_name_ar ?? "مريض"} ${item.patient_detail?.last_name_ar ?? ""}`.trim(),
              mrn: item.patient_detail?.mrn ?? `MRN-${String(idx).padStart(6, "0")}`,
              date: d.toISOString().slice(0, 10),
              time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              specialty: item.specialty_detail?.name ?? "General Practice",
              specialty_ar: item.specialty_detail?.name_ar ?? "الطب العام",
              provider: `Dr. ${item.provider_detail?.first_name ?? ""} ${item.provider_detail?.last_name ?? ""}`.trim(),
              status: (item.status ?? "scheduled") as Appointment["status"],
              notes: item.notes ?? "",
            };
          });
          setAppointments(mapped);
        }
      } catch (err) {
        console.warn("Appointments API unavailable, using mock data:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const handleAction = async (apt: Appointment, action: "confirm" | "cancel" | "reschedule") => {
    const newStatus = action === "confirm" ? "confirmed" : action === "cancel" ? "cancelled" : "scheduled";
    try {
      await apiFetch(`/api/v1/clinic/appointments/${apt.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      /* silent — apply locally */
    }
    setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: newStatus as Appointment["status"] } : a));
    setActionMsg(lang === "en" ? `Appointment ${apt.id} ${action}ed.` : `تم تحديث الموعد ${apt.id}.`);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const filtered = appointments.filter(a => {
    const matchStatus    = filterStatus === "all" || a.status === filterStatus;
    const matchSpecialty = filterSpecialty === "All" || a.specialty === filterSpecialty;
    const matchDate      = !filterDate || a.date === filterDate;
    return matchStatus && matchSpecialty && matchDate;
  });

  const metrics = {
    total:       appointments.length,
    scheduled:   appointments.filter(a => a.status === "scheduled").length,
    confirmed:   appointments.filter(a => a.status === "confirmed").length,
    in_progress: appointments.filter(a => a.status === "in_progress").length,
    completed:   appointments.filter(a => a.status === "completed").length,
    cancelled:   appointments.filter(a => a.status === "cancelled").length,
  };

  const dir = lang === "ar" ? "rtl" : "ltr";
  const inputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink";
  const labelCls = "mb-1.5 block text-[13px] font-semibold text-ink/50";

  return (
    <div dir={dir} className="mx-auto max-w-5xl">

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/clinic" className="text-sm text-ink/50 hover:text-ink">
            {lang === "en" ? "← Clinic" : "العيادة ←"}
          </a>
          <h1 className="mt-1 font-heading text-2xl font-bold">
            {lang === "en" ? "Appointment Scheduling" : "جدولة المواعيد"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Manage clinic appointments for today" : "إدارة مواعيد العيادة لليوم"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {loading && <span className="text-sm text-ink/50">{lang === "en" ? "Syncing..." : "جارٍ التزامن..."}</span>}
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Sibling navigation */}
      <nav className="mb-8 flex flex-wrap gap-2.5">
        {[
          { href: "/clinic/reception",     label: lang === "en" ? "Reception"     : "الاستقبال" },
          { href: "/clinic/triage",        label: lang === "en" ? "Triage"        : "الفرز" },
          { href: "/clinic/consultations", label: lang === "en" ? "Consultations" : "الاستشارات" },
          { href: "/clinic/telemedicine",  label: lang === "en" ? "Telemedicine"  : "التطبيب عن بُعد" },
        ].map(n => (
          <a key={n.href} href={n.href} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
            {n.label}
          </a>
        ))}
      </nav>

      {/* Action feedback */}
      {actionMsg && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400">
          {actionMsg}
        </div>
      )}

      {/* Metrics cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {[
          { label: lang === "en" ? "Total"       : "الإجمالي",    value: metrics.total,       color: "#22D3EE" },
          { label: lang === "en" ? "Scheduled"   : "مجدول",       value: metrics.scheduled,   color: "#0ea5e9" },
          { label: lang === "en" ? "Confirmed"   : "مؤكد",        value: metrics.confirmed,   color: "#22c55e" },
          { label: lang === "en" ? "In Progress" : "جارٍ",         value: metrics.in_progress, color: "#3b82f6" },
          { label: lang === "en" ? "Completed"   : "مكتمل",       value: metrics.completed,   color: "#8b5cf6" },
          { label: lang === "en" ? "Cancelled"   : "ملغي",        value: metrics.cancelled,   color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs font-medium text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-ink/10 bg-surface p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink/50">
            {lang === "en" ? "DATE" : "التاريخ"}
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="rounded-md border border-ink/10 bg-surface px-3 py-1.5 text-sm text-ink"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink/50">
            {lang === "en" ? "STATUS" : "الحالة"}
          </label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-md border border-ink/10 bg-surface px-3 py-1.5 text-sm text-ink"
          >
            {["all", "scheduled", "confirmed", "in_progress", "completed", "cancelled"].map(s => (
              <option key={s} value={s}>{s === "all" ? (lang === "en" ? "All Statuses" : "كل الحالات") : statusLabel(s, lang)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink/50">
            {lang === "en" ? "SPECIALTY" : "التخصص"}
          </label>
          <select
            value={filterSpecialty}
            onChange={e => setFilterSpecialty(e.target.value)}
            className="max-w-[220px] rounded-md border border-ink/10 bg-surface px-3 py-1.5 text-sm text-ink"
          >
            {SPECIALTIES.map(s => (
              <option key={s} value={s}>{s === "All" ? (lang === "en" ? "All Specialties" : "كل التخصصات") : s}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto self-end pb-1.5 text-sm text-ink/50">
          {lang === "en" ? `Showing ${filtered.length} of ${appointments.length}` : `عرض ${filtered.length} من ${appointments.length}`}
        </div>
      </div>

      {/* Appointments table */}
      <div className="cy-card overflow-auto p-0">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              {[
                lang === "en" ? "Time"      : "الوقت",
                lang === "en" ? "MRN"       : "الرقم الطبي",
                lang === "en" ? "Patient"   : "المريض",
                lang === "en" ? "Specialty" : "التخصص",
                lang === "en" ? "Provider"  : "الطبيب",
                lang === "en" ? "Status"    : "الحالة",
                lang === "en" ? "Notes"     : "ملاحظات",
                lang === "en" ? "Actions"   : "إجراءات",
              ].map(h => (
                <th key={h} className={`px-4 py-3.5 text-xs font-semibold text-ink/50 ${lang === "ar" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(apt => (
              <tr key={apt.id} className="border-b border-ink/5">
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-brand-400">{apt.time}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-ink/50">{apt.mrn}</td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-semibold">
                    {lang === "ar" ? apt.patient_name_ar : apt.patient_name}
                  </div>
                  <div className="mt-0.5 text-xs text-ink/50">{apt.id}</div>
                </td>
                <td className="px-4 py-3.5 text-sm">
                  {lang === "ar" ? apt.specialty_ar : apt.specialty}
                </td>
                <td className="px-4 py-3.5 text-sm">{apt.provider}</td>
                <td className="px-4 py-3.5">
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${statusColor(apt.status)}`}>
                    {statusLabel(apt.status, lang)}
                  </span>
                </td>
                <td className="max-w-[200px] px-4 py-3.5 text-xs text-ink/50">
                  <span title={apt.notes} className="block truncate">{apt.notes}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-nowrap gap-1.5">
                    {apt.status === "scheduled" && (
                      <button
                        onClick={() => { void handleAction(apt, "confirm"); }}
                        className="whitespace-nowrap rounded-md bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white"
                      >
                        {lang === "en" ? "Confirm" : "تأكيد"}
                      </button>
                    )}
                    {(apt.status === "scheduled" || apt.status === "confirmed") && (
                      <>
                        <button
                          onClick={() => { void handleAction(apt, "reschedule"); }}
                          className="whitespace-nowrap rounded-md bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          {lang === "en" ? "Reschedule" : "إعادة جدولة"}
                        </button>
                        <button
                          onClick={() => { void handleAction(apt, "cancel"); }}
                          className="whitespace-nowrap rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          {lang === "en" ? "Cancel" : "إلغاء"}
                        </button>
                      </>
                    )}
                    <button className="cy-btn cy-btn-ghost !min-h-0 whitespace-nowrap !py-1.5 !px-2.5 text-xs">
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
            {lang === "en" ? "No appointments match the selected filters." : "لا توجد مواعيد تطابق عوامل التصفية المحددة."}
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-ink/40">
        CyMed Clinic · {lang === "en" ? "Appointment Management" : "إدارة المواعيد"} · {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}
