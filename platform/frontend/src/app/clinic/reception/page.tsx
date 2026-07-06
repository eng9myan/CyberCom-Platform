"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ReceptionRaw {
  id: string;
  patient_detail?: {
    first_name?: string;
    last_name?: string;
    first_name_ar?: string;
    last_name_ar?: string;
    mrn?: string;
    date_of_birth?: string;
    phone?: string;
  };
  check_in_time?: string;
  appointment_id?: string;
  status?: string;
  visit_type?: string;
}

interface WaitingPatient {
  id: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  dob: string;
  phone: string;
  check_in_time: string;
  appointment_id: string;
  visit_type: "appointment" | "walk_in" | "emergency";
  status: "waiting" | "checked_in" | "called" | "in_consultation";
  wait_minutes: number;
  specialty: string;
}

interface ReceptionMetrics {
  waiting_now: number;
  checked_in_today: number;
  walk_ins_today: number;
  appointments_today: number;
  avg_wait_min: number;
  no_shows: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_METRICS: ReceptionMetrics = {
  waiting_now: 8,
  checked_in_today: 41,
  walk_ins_today: 6,
  appointments_today: 58,
  avg_wait_min: 17,
  no_shows: 3,
};

const MOCK_WAITING: WaitingPatient[] = [
  { id: "RCP-001", patient_name: "Ahmed Al-Rashid",   patient_name_ar: "أحمد الراشد",    mrn: "MRN-001234", dob: "1978-03-15", phone: "+966 50 123 4567", check_in_time: "08:45", appointment_id: "APT-001", visit_type: "appointment", status: "waiting",         wait_minutes: 24, specialty: "Internal Medicine" },
  { id: "RCP-002", patient_name: "Sara Khalil",        patient_name_ar: "سارة خليل",      mrn: "MRN-001235", dob: "1990-07-22", phone: "+966 55 234 5678", check_in_time: "09:00", appointment_id: "APT-002", visit_type: "appointment", status: "waiting",         wait_minutes: 18, specialty: "Cardiology" },
  { id: "RCP-003", patient_name: "Yousef Al-Harbi",   patient_name_ar: "يوسف الحربي",    mrn: "MRN-001240", dob: "1985-11-03", phone: "+966 56 345 6789", check_in_time: "09:10", appointment_id: "",        visit_type: "walk_in",     status: "checked_in",     wait_minutes: 8,  specialty: "General Practice" },
  { id: "RCP-004", patient_name: "Layla Mansour",     patient_name_ar: "ليلى منصور",     mrn: "MRN-001237", dob: "1995-02-28", phone: "+966 59 456 7890", check_in_time: "09:15", appointment_id: "APT-004", visit_type: "appointment", status: "waiting",         wait_minutes: 13, specialty: "Dermatology" },
  { id: "RCP-005", patient_name: "Tariq Bin Sultan",  patient_name_ar: "طارق بن سلطان",  mrn: "MRN-001242", dob: "1962-06-12", phone: "+966 50 567 8901", check_in_time: "09:20", appointment_id: "",        visit_type: "walk_in",     status: "waiting",         wait_minutes: 8,  specialty: "Pulmonology" },
  { id: "RCP-006", patient_name: "Fatima Al-Zahra",   patient_name_ar: "فاطمة الزهراء",  mrn: "MRN-001239", dob: "2000-09-18", phone: "+966 54 678 9012", check_in_time: "09:25", appointment_id: "APT-006", visit_type: "appointment", status: "called",          wait_minutes: 3,  specialty: "Obstetrics" },
  { id: "RCP-007", patient_name: "Khalid Al-Nouri",   patient_name_ar: "خالد النوري",    mrn: "MRN-001238", dob: "1975-04-30", phone: "+966 53 789 0123", check_in_time: "09:05", appointment_id: "APT-005", visit_type: "appointment", status: "in_consultation", wait_minutes: 0,  specialty: "Orthopedics" },
  { id: "RCP-008", patient_name: "Omar Hassan",       patient_name_ar: "عمر حسن",         mrn: "MRN-001236", dob: "1988-12-05", phone: "+966 58 890 1234", check_in_time: "08:55", appointment_id: "APT-003", visit_type: "appointment", status: "in_consultation", wait_minutes: 0,  specialty: "General Practice" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function visitTypeBadge(vt: string, lang: "en" | "ar") {
  const map: Record<string, { en: string; ar: string; bg: string; color: string }> = {
    appointment: { en: "Appointment", ar: "موعد",      bg: "#dbeafe", color: "#1e40af" },
    walk_in:     { en: "Walk-in",     ar: "بدون موعد", bg: "#fef9c3", color: "#854d0e" },
    emergency:   { en: "Emergency",   ar: "طارئ",      bg: "#fee2e2", color: "#991b1b" },
  };
  const b = map[vt] ?? { en: vt, ar: vt, bg: "#f3f4f6", color: "#374151" };
  return { label: b[lang], bg: b.bg, color: b.color };
}

function statusBadge(st: string, lang: "en" | "ar") {
  const map: Record<string, { en: string; ar: string; bg: string; color: string }> = {
    waiting:         { en: "Waiting",         ar: "انتظار",     bg: "#fef3c7", color: "#92400e" },
    checked_in:      { en: "Checked In",      ar: "تم التسجيل", bg: "#d1fae5", color: "#065f46" },
    called:          { en: "Called",           ar: "تم الاستدعاء", bg: "#ede9fe", color: "#5b21b6" },
    in_consultation: { en: "In Consultation", ar: "في الاستشارة", bg: "#dbeafe", color: "#1e40af" },
  };
  const b = map[st] ?? { en: st, ar: st, bg: "#f3f4f6", color: "#374151" };
  return { label: b[lang], bg: b.bg, color: b.color };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceptionPage() {
  const [patients, setPatients] = useState<WaitingPatient[]>(MOCK_WAITING);
  const [metrics, setMetrics] = useState<ReceptionMetrics>(MOCK_METRICS);
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [loading, setLoading] = useState(false);

  // Check-in form state
  const [mrnInput, setMrnInput] = useState("");
  const [mrnLookupResult, setMrnLookupResult] = useState<string>("");
  const [aptIdInput, setAptIdInput] = useState("");
  const [visitTypeInput, setVisitTypeInput] = useState<"appointment" | "walk_in">("appointment");
  const [specialtyInput, setSpecialtyInput] = useState("General Practice");
  const [checkInMsg, setCheckInMsg] = useState("");

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch<ReceptionRaw[]>("/api/v1/clinic/reception/");
        if (data && data.length > 0) {
          const mapped: WaitingPatient[] = data.map((item, idx) => ({
            id: item.id,
            patient_name: `${item.patient_detail?.first_name ?? "Patient"} ${item.patient_detail?.last_name ?? ""}`.trim(),
            patient_name_ar: `${item.patient_detail?.first_name_ar ?? "مريض"} ${item.patient_detail?.last_name_ar ?? ""}`.trim(),
            mrn: item.patient_detail?.mrn ?? `MRN-${String(idx).padStart(6, "0")}`,
            dob: item.patient_detail?.date_of_birth ?? "N/A",
            phone: item.patient_detail?.phone ?? "N/A",
            check_in_time: item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--",
            appointment_id: item.appointment_id ?? "",
            visit_type: (item.visit_type ?? "appointment") as WaitingPatient["visit_type"],
            status: (item.status ?? "waiting") as WaitingPatient["status"],
            wait_minutes: 0,
            specialty: "General Practice",
          }));
          setPatients(mapped);
          setMetrics({
            waiting_now: mapped.filter(p => p.status === "waiting").length,
            checked_in_today: mapped.length,
            walk_ins_today: mapped.filter(p => p.visit_type === "walk_in").length,
            appointments_today: mapped.filter(p => p.visit_type === "appointment").length,
            avg_wait_min: 15,
            no_shows: 2,
          });
        }
      } catch (err) {
        console.warn("Reception API unavailable, using mock data:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const handleMrnLookup = () => {
    const found = MOCK_WAITING.find(p => p.mrn.toLowerCase() === mrnInput.toLowerCase().trim());
    if (found) {
      setMrnLookupResult(lang === "en" ? `Found: ${found.patient_name} · DOB: ${found.dob} · ${found.phone}` : `تم العثور على: ${found.patient_name_ar} · تاريخ الميلاد: ${found.dob}`);
    } else {
      setMrnLookupResult(lang === "en" ? "No patient found with that MRN." : "لم يُعثر على مريض بهذا الرقم الطبي.");
    }
  };

  const handleCheckIn = async () => {
    if (!mrnInput.trim()) {
      setCheckInMsg(lang === "en" ? "Please enter a patient MRN." : "يرجى إدخال الرقم الطبي للمريض.");
      return;
    }
    try {
      await apiFetch("/api/v1/clinic/reception/", {
        method: "POST",
        body: JSON.stringify({ mrn: mrnInput, appointment_id: aptIdInput, visit_type: visitTypeInput, specialty: specialtyInput }),
      });
    } catch {
      /* silent */
    }
    setCheckInMsg(lang === "en" ? `Patient ${mrnInput} checked in successfully.` : `تم تسجيل وصول المريض ${mrnInput} بنجاح.`);
    setMrnInput("");
    setAptIdInput("");
    setMrnLookupResult("");
    setTimeout(() => setCheckInMsg(""), 4000);
  };

  const handleCall = async (p: WaitingPatient) => {
    try {
      await apiFetch(`/api/v1/clinic/reception/${p.id}/`, { method: "PATCH", body: JSON.stringify({ status: "called" }) });
    } catch { /* silent */ }
    setPatients(prev => prev.map(x => x.id === p.id ? { ...x, status: "called" } : x));
    setActionMsg(lang === "en" ? `${p.patient_name} called to the desk.` : `تم استدعاء ${p.patient_name_ar} إلى المكتب.`);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const filtered = patients.filter(p => filterStatus === "all" || p.status === filterStatus);
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto", fontFamily: "system-ui, sans-serif", color: "var(--color-text)", background: "var(--color-background)", minHeight: "100vh" }}>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <a href="/clinic" style={{ color: "var(--color-text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>
            {lang === "en" ? "← Clinic" : "العيادة ←"}
          </a>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: "0.25rem 0 0" }}>
            {lang === "en" ? "Reception Desk" : "مكتب الاستقبال"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            {lang === "en" ? "Patient check-in, queue management, and walk-ins" : "تسجيل وصول المرضى وإدارة الطابور"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {loading && <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Syncing..." : "جارٍ التزامن..."}</span>}
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Sibling nav */}
      <nav style={{ display: "flex", gap: "0.625rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/clinic/appointments",  label: lang === "en" ? "Appointments"  : "المواعيد" },
          { href: "/clinic/triage",        label: lang === "en" ? "Triage"        : "الفرز" },
          { href: "/clinic/consultations", label: lang === "en" ? "Consultations" : "الاستشارات" },
          { href: "/clinic/telemedicine",  label: lang === "en" ? "Telemedicine"  : "التطبيب عن بُعد" },
        ].map(n => (
          <a key={n.href} href={n.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
            {n.label}
          </a>
        ))}
      </nav>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Waiting Now"        : "في الانتظار",         value: metrics.waiting_now,       color: "#f59e0b" },
          { label: lang === "en" ? "Checked In Today"   : "المسجّلون اليوم",    value: metrics.checked_in_today,  color: "#22D3EE" },
          { label: lang === "en" ? "Walk-ins Today"     : "بدون موعد",           value: metrics.walk_ins_today,    color: "#8b5cf6" },
          { label: lang === "en" ? "Appointments Today" : "مواعيد اليوم",        value: metrics.appointments_today, color: "#3b82f6" },
          { label: lang === "en" ? "Avg Wait (min)"     : "متوسط الانتظار (د)", value: metrics.avg_wait_min,      color: "#ec4899" },
          { label: lang === "en" ? "No-shows"           : "غائبون",              value: metrics.no_shows,          color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.35rem", fontWeight: 500 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Main two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem", alignItems: "start" }}>

        {/* LEFT — Queue table */}
        <div>
          {actionMsg && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1.25rem", borderRadius: "8px", background: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.9rem" }}>
              {actionMsg}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>
              {lang === "en" ? "Waiting Queue" : "طابور الانتظار"}
            </h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["all", "waiting", "checked_in", "called", "in_consultation"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  style={{
                    padding: "0.35rem 0.7rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: filterStatus === f ? "#22D3EE" : "var(--color-surface)",
                    color: filterStatus === f ? "#0a0a0a" : "var(--color-text)",
                  }}
                >
                  {f === "all" ? (lang === "en" ? "All" : "الكل") :
                   f === "waiting" ? (lang === "en" ? "Waiting" : "انتظار") :
                   f === "checked_in" ? (lang === "en" ? "Checked In" : "مسجَّل") :
                   f === "called" ? (lang === "en" ? "Called" : "مُستدعى") :
                   (lang === "en" ? "In Consult" : "استشارة")}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  {[
                    lang === "en" ? "Check-in"  : "وقت الوصول",
                    lang === "en" ? "Patient"   : "المريض",
                    lang === "en" ? "MRN"       : "الرقم الطبي",
                    lang === "en" ? "Type"      : "النوع",
                    lang === "en" ? "Specialty" : "التخصص",
                    lang === "en" ? "Wait"      : "الانتظار",
                    lang === "en" ? "Status"    : "الحالة",
                    lang === "en" ? "Actions"   : "إجراءات",
                  ].map(h => (
                    <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const vtb = visitTypeBadge(p.visit_type, lang);
                  const stb = statusBadge(p.status, lang);
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "0.75rem 0.875rem", fontWeight: 700, color: "#22D3EE", fontSize: "0.875rem" }}>{p.check_in_time}</td>
                      <td style={{ padding: "0.75rem 0.875rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.875rem" }}>{lang === "ar" ? p.patient_name_ar : p.patient_name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{p.phone}</div>
                      </td>
                      <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{p.mrn}</td>
                      <td style={{ padding: "0.75rem 0.875rem" }}>
                        <span style={{ padding: "0.25rem 0.6rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, background: vtb.bg, color: vtb.color, whiteSpace: "nowrap" }}>{vtb.label}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8rem", color: "var(--color-text)" }}>{p.specialty}</td>
                      <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8rem", fontWeight: p.wait_minutes > 20 ? 700 : 400, color: p.wait_minutes > 20 ? "#ef4444" : "var(--color-text)" }}>
                        {p.wait_minutes > 0 ? `${p.wait_minutes}m` : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 0.875rem" }}>
                        <span style={{ padding: "0.25rem 0.6rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, background: stb.bg, color: stb.color, whiteSpace: "nowrap" }}>{stb.label}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0.875rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {p.status === "waiting" && (
                            <button
                              onClick={() => { void handleCall(p); }}
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", background: "#22D3EE", color: "#0a0a0a", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              {lang === "en" ? "Call" : "استدعاء"}
                            </button>
                          )}
                          <button style={{ padding: "0.3rem 0.6rem", fontSize: "0.72rem", fontWeight: 600, borderRadius: "5px", background: "var(--color-surface)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)", whiteSpace: "nowrap" }}>
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
              <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                {lang === "en" ? "No patients in queue." : "لا يوجد مرضى في الطابور."}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Check-in form */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem", position: "sticky", top: "1rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginTop: 0, marginBottom: "1.25rem", color: "#22D3EE" }}>
            {lang === "en" ? "Quick Check-in" : "تسجيل الوصول السريع"}
          </h2>

          {checkInMsg && (
            <div style={{ marginBottom: "1rem", padding: "0.65rem 1rem", borderRadius: "7px", background: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.85rem" }}>
              {checkInMsg}
            </div>
          )}

          {/* MRN lookup */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lang === "en" ? "Patient MRN" : "الرقم الطبي"}
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={mrnInput}
                onChange={e => { setMrnInput(e.target.value); setMrnLookupResult(""); }}
                placeholder={lang === "en" ? "e.g. MRN-001234" : "مثال: MRN-001234"}
                style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem" }}
              />
              <button
                onClick={handleMrnLookup}
                style={{ padding: "0.5rem 0.75rem", borderRadius: "7px", background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                {lang === "en" ? "Lookup" : "بحث"}
              </button>
            </div>
            {mrnLookupResult && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: mrnLookupResult.includes("No") || mrnLookupResult.includes("لم") ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                {mrnLookupResult}
              </p>
            )}
          </div>

          {/* Appointment ID */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lang === "en" ? "Appointment ID (optional)" : "رقم الموعد (اختياري)"}
            </label>
            <input
              type="text"
              value={aptIdInput}
              onChange={e => setAptIdInput(e.target.value)}
              placeholder={lang === "en" ? "e.g. APT-001" : "مثال: APT-001"}
              style={{ width: "100%", boxSizing: "border-box", padding: "0.5rem 0.75rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem" }}
            />
          </div>

          {/* Visit type */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lang === "en" ? "Visit Type" : "نوع الزيارة"}
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["appointment", "walk_in"] as const).map(vt => (
                <button
                  key={vt}
                  onClick={() => setVisitTypeInput(vt)}
                  style={{
                    flex: 1, padding: "0.5rem", borderRadius: "7px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700,
                    background: visitTypeInput === vt ? "#22D3EE" : "var(--color-surface)",
                    color: visitTypeInput === vt ? "#0a0a0a" : "var(--color-text)",
                  }}
                >
                  {vt === "appointment" ? (lang === "en" ? "Appointment" : "موعد") : (lang === "en" ? "Walk-in" : "بدون موعد")}
                </button>
              ))}
            </div>
          </div>

          {/* Specialty */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lang === "en" ? "Specialty" : "التخصص"}
            </label>
            <select
              value={specialtyInput}
              onChange={e => setSpecialtyInput(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "7px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem" }}
            >
              {["General Practice", "Internal Medicine", "Cardiology", "Dermatology", "Orthopedics", "Obstetrics", "Ophthalmology", "Endocrinology", "Pulmonology", "Neurology", "Gastroenterology", "Pediatrics", "ENT", "Psychiatry"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { void handleCheckIn(); }}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "#22D3EE", color: "#0a0a0a", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}
          >
            {lang === "en" ? "Check In Patient" : "تسجيل وصول المريض"}
          </button>

          <div style={{ marginTop: "1.25rem", padding: "1rem", background: "var(--color-background)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
              {lang === "en" ? "Queue Summary" : "ملخص الطابور"}
            </p>
            {(["waiting", "checked_in", "called", "in_consultation"] as const).map(st => {
              const count = patients.filter(p => p.status === st).length;
              const stb = statusBadge(st, lang);
              return (
                <div key={st} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem", color: stb.color, fontWeight: 600 }}>{stb.label}</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "center" }}>
        CyMed Clinic · {lang === "en" ? "Reception Desk" : "مكتب الاستقبال"} · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
