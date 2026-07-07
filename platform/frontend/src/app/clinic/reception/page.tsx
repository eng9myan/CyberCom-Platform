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

  const fieldLabelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50";
  const fieldInputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink";

  return (
    <div dir={dir} className="mx-auto max-w-6xl">

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/clinic" className="text-sm text-ink/50 hover:text-ink">
            {lang === "en" ? "← Clinic" : "العيادة ←"}
          </a>
          <h1 className="mt-1 font-heading text-3xl font-bold">
            {lang === "en" ? "Reception Desk" : "مكتب الاستقبال"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Patient check-in, queue management, and walk-ins" : "تسجيل وصول المرضى وإدارة الطابور"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-sm text-ink/50">{lang === "en" ? "Syncing..." : "جارٍ التزامن..."}</span>}
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Sibling nav */}
      <nav className="mb-8 flex flex-wrap gap-2.5">
        {[
          { href: "/clinic/appointments",  label: lang === "en" ? "Appointments"  : "المواعيد" },
          { href: "/clinic/triage",        label: lang === "en" ? "Triage"        : "الفرز" },
          { href: "/clinic/consultations", label: lang === "en" ? "Consultations" : "الاستشارات" },
          { href: "/clinic/telemedicine",  label: lang === "en" ? "Telemedicine"  : "التطبيب عن بُعد" },
        ].map(n => (
          <a key={n.href} href={n.href} className="rounded-md border border-ink/10 bg-surface px-4 py-2 text-xs font-semibold hover:bg-ink/5">
            {n.label}
          </a>
        ))}
      </nav>

      {/* Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: lang === "en" ? "Waiting Now"        : "في الانتظار",         value: metrics.waiting_now,       color: "#f59e0b" },
          { label: lang === "en" ? "Checked In Today"   : "المسجّلون اليوم",    value: metrics.checked_in_today,  color: "#22D3EE" },
          { label: lang === "en" ? "Walk-ins Today"     : "بدون موعد",           value: metrics.walk_ins_today,    color: "#8b5cf6" },
          { label: lang === "en" ? "Appointments Today" : "مواعيد اليوم",        value: metrics.appointments_today, color: "#3b82f6" },
          { label: lang === "en" ? "Avg Wait (min)"     : "متوسط الانتظار (د)", value: metrics.avg_wait_min,      color: "#ec4899" },
          { label: lang === "en" ? "No-shows"           : "غائبون",              value: metrics.no_shows,          color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="cy-card p-5 text-center">
            <p className="text-3xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs font-medium text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-[1fr_360px] items-start gap-6">

        {/* LEFT — Queue table */}
        <div>
          {actionMsg && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400">
              {actionMsg}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {lang === "en" ? "Waiting Queue" : "طابور الانتظار"}
            </h2>
            <div className="flex gap-2">
              {(["all", "waiting", "checked_in", "called", "in_consultation"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold border ${filterStatus === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink hover:bg-ink/5"}`}
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

          <div className="cy-card overflow-hidden p-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ink/10">
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
                    <th key={h} className={`px-3.5 py-3 text-xs font-bold uppercase tracking-wide text-ink/50 ${lang === "ar" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const vtb = visitTypeBadge(p.visit_type, lang);
                  const stb = statusBadge(p.status, lang);
                  return (
                    <tr key={p.id} className="border-b border-ink/5">
                      <td className="px-3.5 py-3 text-sm font-bold text-brand-400">{p.check_in_time}</td>
                      <td className="px-3.5 py-3">
                        <div className="text-sm font-semibold">{lang === "ar" ? p.patient_name_ar : p.patient_name}</div>
                        <div className="text-xs text-ink/50">{p.phone}</div>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[13px] text-ink/50">{p.mrn}</td>
                      <td className="px-3.5 py-3">
                        <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: vtb.bg, color: vtb.color }}>{vtb.label}</span>
                      </td>
                      <td className="px-3.5 py-3 text-sm">{p.specialty}</td>
                      <td className={`px-3.5 py-3 text-sm ${p.wait_minutes > 20 ? "font-bold text-red-400" : ""}`}>
                        {p.wait_minutes > 0 ? `${p.wait_minutes}m` : "—"}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: stb.bg, color: stb.color }}>{stb.label}</span>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex gap-1.5">
                          {p.status === "waiting" && (
                            <button onClick={() => { void handleCall(p); }} className="cy-btn cy-btn-primary !min-h-0 whitespace-nowrap !py-1.5 !px-2.5 text-xs">
                              {lang === "en" ? "Call" : "استدعاء"}
                            </button>
                          )}
                          <button className="cy-btn cy-btn-ghost !min-h-0 whitespace-nowrap !py-1.5 !px-2.5 text-xs">
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
              <div className="p-10 text-center text-sm text-ink/40">
                {lang === "en" ? "No patients in queue." : "لا يوجد مرضى في الطابور."}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Check-in form */}
        <div className="cy-card sticky top-4 p-6">
          <h2 className="mb-5 text-lg font-bold text-brand-400">
            {lang === "en" ? "Quick Check-in" : "تسجيل الوصول السريع"}
          </h2>

          {checkInMsg && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400">
              {checkInMsg}
            </div>
          )}

          {/* MRN lookup */}
          <div className="mb-4">
            <label className={fieldLabelCls}>
              {lang === "en" ? "Patient MRN" : "الرقم الطبي"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mrnInput}
                onChange={e => { setMrnInput(e.target.value); setMrnLookupResult(""); }}
                placeholder={lang === "en" ? "e.g. MRN-001234" : "مثال: MRN-001234"}
                className={`flex-1 ${fieldInputCls}`}
              />
              <button onClick={handleMrnLookup} className="cy-btn cy-btn-primary !min-h-0 whitespace-nowrap !py-2 !px-3 text-xs">
                {lang === "en" ? "Lookup" : "بحث"}
              </button>
            </div>
            {mrnLookupResult && (
              <p className={`mt-2 text-xs font-semibold ${mrnLookupResult.includes("No") || mrnLookupResult.includes("لم") ? "text-red-400" : "text-emerald-400"}`}>
                {mrnLookupResult}
              </p>
            )}
          </div>

          {/* Appointment ID */}
          <div className="mb-4">
            <label className={fieldLabelCls}>
              {lang === "en" ? "Appointment ID (optional)" : "رقم الموعد (اختياري)"}
            </label>
            <input
              type="text"
              value={aptIdInput}
              onChange={e => setAptIdInput(e.target.value)}
              placeholder={lang === "en" ? "e.g. APT-001" : "مثال: APT-001"}
              className={fieldInputCls}
            />
          </div>

          {/* Visit type */}
          <div className="mb-4">
            <label className={fieldLabelCls}>
              {lang === "en" ? "Visit Type" : "نوع الزيارة"}
            </label>
            <div className="flex gap-2">
              {(["appointment", "walk_in"] as const).map(vt => (
                <button
                  key={vt}
                  onClick={() => setVisitTypeInput(vt)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-sm font-bold ${visitTypeInput === vt ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink"}`}
                >
                  {vt === "appointment" ? (lang === "en" ? "Appointment" : "موعد") : (lang === "en" ? "Walk-in" : "بدون موعد")}
                </button>
              ))}
            </div>
          </div>

          {/* Specialty */}
          <div className="mb-6">
            <label className={fieldLabelCls}>
              {lang === "en" ? "Specialty" : "التخصص"}
            </label>
            <select value={specialtyInput} onChange={e => setSpecialtyInput(e.target.value)} className={fieldInputCls}>
              {["General Practice", "Internal Medicine", "Cardiology", "Dermatology", "Orthopedics", "Obstetrics", "Ophthalmology", "Endocrinology", "Pulmonology", "Neurology", "Gastroenterology", "Pediatrics", "ENT", "Psychiatry"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button onClick={() => { void handleCheckIn(); }} className="cy-btn cy-btn-primary w-full">
            {lang === "en" ? "Check In Patient" : "تسجيل وصول المريض"}
          </button>

          <div className="mt-5 rounded-lg border border-ink/10 bg-surface-overlay p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
              {lang === "en" ? "Queue Summary" : "ملخص الطابور"}
            </p>
            {(["waiting", "checked_in", "called", "in_consultation"] as const).map(st => {
              const count = patients.filter(p => p.status === st).length;
              const stb = statusBadge(st, lang);
              return (
                <div key={st} className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: stb.color }}>{stb.label}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-ink/50">
        CyMed Clinic · {lang === "en" ? "Reception Desk" : "مكتب الاستقبال"} · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
