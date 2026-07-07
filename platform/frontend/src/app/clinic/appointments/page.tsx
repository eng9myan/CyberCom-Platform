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

function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "scheduled":   return { bg: "#e0f2fe", text: "#0369a1" };
    case "confirmed":   return { bg: "#d1fae5", text: "#065f46" };
    case "in_progress": return { bg: "#dbeafe", text: "#1e40af" };
    case "completed":   return { bg: "#f0fdf4", text: "#166534" };
    case "cancelled":   return { bg: "#fee2e2", text: "#991b1b" };
    default:            return { bg: "#f3f4f6", text: "#374151" };
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

  return (
    <div dir={dir} style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto", fontFamily: "system-ui, sans-serif", color: "var(--color-text)", background: "var(--color-background)", minHeight: "100vh" }}>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <a href="/clinic" style={{ color: "var(--color-text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
              {lang === "en" ? "← Clinic" : "العيادة ←"}
            </a>
          </div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Appointment Scheduling" : "جدولة المواعيد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            {lang === "en" ? "Manage clinic appointments for today" : "إدارة مواعيد العيادة لليوم"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {loading && <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>⏳ {lang === "en" ? "Syncing..." : "جارٍ التزامن..."}</span>}
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Sibling navigation */}
      <nav style={{ display: "flex", gap: "0.625rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/clinic/reception",     label: lang === "en" ? "Reception"     : "الاستقبال" },
          { href: "/clinic/triage",        label: lang === "en" ? "Triage"        : "الفرز" },
          { href: "/clinic/consultations", label: lang === "en" ? "Consultations" : "الاستشارات" },
          { href: "/clinic/telemedicine",  label: lang === "en" ? "Telemedicine"  : "التطبيب عن بُعد" },
        ].map(n => (
          <a key={n.href} href={n.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
            {n.label}
          </a>
        ))}
      </nav>

      {/* Action feedback */}
      {actionMsg && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem 1.25rem", borderRadius: "8px", background: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.9rem" }}>
          {actionMsg}
        </div>
      )}

      {/* Metrics cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Total"       : "الإجمالي",    value: metrics.total,       color: "#22D3EE" },
          { label: lang === "en" ? "Scheduled"   : "مجدول",       value: metrics.scheduled,   color: "#0ea5e9" },
          { label: lang === "en" ? "Confirmed"   : "مؤكد",        value: metrics.confirmed,   color: "#22c55e" },
          { label: lang === "en" ? "In Progress" : "جارٍ",         value: metrics.in_progress, color: "#3b82f6" },
          { label: lang === "en" ? "Completed"   : "مكتمل",       value: metrics.completed,   color: "#8b5cf6" },
          { label: lang === "en" ? "Cancelled"   : "ملغي",        value: metrics.cancelled,   color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.35rem", fontWeight: 500 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
            {lang === "en" ? "DATE" : "التاريخ"}
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
            {lang === "en" ? "STATUS" : "الحالة"}
          </label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem" }}
          >
            {["all", "scheduled", "confirmed", "in_progress", "completed", "cancelled"].map(s => (
              <option key={s} value={s}>{s === "all" ? (lang === "en" ? "All Statuses" : "كل الحالات") : statusLabel(s, lang)}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
            {lang === "en" ? "SPECIALTY" : "التخصص"}
          </label>
          <select
            value={filterSpecialty}
            onChange={e => setFilterSpecialty(e.target.value)}
            style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem", maxWidth: "220px" }}
          >
            {SPECIALTIES.map(s => (
              <option key={s} value={s}>{s === "All" ? (lang === "en" ? "All Specialties" : "كل التخصصات") : s}</option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "0.875rem", alignSelf: "flex-end", paddingBottom: "0.4rem" }}>
          {lang === "en" ? `Showing ${filtered.length} of ${appointments.length}` : `عرض ${filtered.length} من ${appointments.length}`}
        </div>
      </div>

      {/* Appointments table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-surface)", borderBottom: "2px solid var(--color-border)" }}>
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
                <th key={h} style={{ padding: "0.875rem 1rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((apt, i) => {
              const sc = statusColor(apt.status);
              return (
                <tr key={apt.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgb(var(--color-ink-rgb) / 0.02)" }}>
                  <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#22D3EE", fontSize: "0.9rem", whiteSpace: "nowrap" }}>{apt.time}</td>
                  <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{apt.mrn}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem" }}>
                      {lang === "ar" ? apt.patient_name_ar : apt.patient_name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>{apt.id}</div>
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--color-text)" }}>
                    {lang === "ar" ? apt.specialty_ar : apt.specialty}
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--color-text)" }}>{apt.provider}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ padding: "0.3rem 0.7rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: sc.bg, color: sc.text, whiteSpace: "nowrap" }}>
                      {statusLabel(apt.status, lang)}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)", maxWidth: "200px" }}>
                    <span title={apt.notes} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{apt.notes}</span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "nowrap" }}>
                      {apt.status === "scheduled" && (
                        <button
                          onClick={() => { void handleAction(apt, "confirm"); }}
                          style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", background: "#22c55e", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          {lang === "en" ? "Confirm" : "تأكيد"}
                        </button>
                      )}
                      {(apt.status === "scheduled" || apt.status === "confirmed") && (
                        <>
                          <button
                            onClick={() => { void handleAction(apt, "reschedule"); }}
                            style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            {lang === "en" ? "Reschedule" : "إعادة جدولة"}
                          </button>
                          <button
                            onClick={() => { void handleAction(apt, "cancel"); }}
                            style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            {lang === "en" ? "Cancel" : "إلغاء"}
                          </button>
                        </>
                      )}
                      <button
                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)", whiteSpace: "nowrap" }}
                      >
                        {lang === "en" ? "View" : "عرض"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            {lang === "en" ? "No appointments match the selected filters." : "لا توجد مواعيد تطابق عوامل التصفية المحددة."}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "center" }}>
        CyMed Clinic · {lang === "en" ? "Appointment Management" : "إدارة المواعيد"} · {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}
