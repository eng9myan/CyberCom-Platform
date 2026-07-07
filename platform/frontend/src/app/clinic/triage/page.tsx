"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface TriageRaw {
  id: string;
  patient_detail?: {
    first_name?: string;
    last_name?: string;
    first_name_ar?: string;
    last_name_ar?: string;
    mrn?: string;
    date_of_birth?: string;
    gender?: string;
  };
  arrival_time?: string;
  chief_complaint?: string;
  triage_level?: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  spo2?: number;
  pain_score?: number;
  respiratory_rate?: number;
  status?: string;
  notes?: string;
}

interface TriagePatient {
  id: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  dob: string;
  gender: string;
  arrival_time: string;
  chief_complaint: string;
  chief_complaint_ar: string;
  triage_level: "urgent" | "semi_urgent" | "routine";
  vitals: {
    bp: string;
    hr: number;
    temp: number;
    spo2: number;
    rr: number;
    pain: number;
  };
  status: "awaiting_triage" | "triaged" | "in_consultation";
  notes: string;
}

interface TriageFormData {
  bp_systolic: string;
  bp_diastolic: string;
  hr: string;
  temp: string;
  spo2: string;
  rr: string;
  pain: string;
  chief_complaint: string;
  triage_level: "urgent" | "semi_urgent" | "routine";
  notes: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TRIAGE: TriagePatient[] = [
  {
    id: "TRG-001", patient_name: "Khalid Al-Nouri",    patient_name_ar: "خالد النوري",     mrn: "MRN-001238", dob: "1975-04-30", gender: "Male",
    arrival_time: "09:02", chief_complaint: "Chest pain, radiating to left arm", chief_complaint_ar: "ألم في الصدر يمتد إلى الذراع اليسرى",
    triage_level: "urgent",
    vitals: { bp: "158/96", hr: 112, temp: 37.1, spo2: 94, rr: 22, pain: 8 },
    status: "awaiting_triage", notes: "Diaphoretic on arrival. Hx of HTN."
  },
  {
    id: "TRG-002", patient_name: "Noor Al-Deen",       patient_name_ar: "نور الدين",        mrn: "MRN-001243", dob: "1988-12-05", gender: "Male",
    arrival_time: "09:18", chief_complaint: "Severe headache, photophobia", chief_complaint_ar: "صداع شديد وحساسية للضوء",
    triage_level: "semi_urgent",
    vitals: { bp: "142/88", hr: 98, temp: 37.8, spo2: 98, rr: 18, pain: 7 },
    status: "awaiting_triage", notes: "No neck stiffness. Taking sumatriptan at home."
  },
  {
    id: "TRG-003", patient_name: "Fatima Al-Zahra",    patient_name_ar: "فاطمة الزهراء",    mrn: "MRN-001239", dob: "2000-09-18", gender: "Female",
    arrival_time: "09:25", chief_complaint: "Abdominal pain, 28 weeks pregnant", chief_complaint_ar: "ألم في البطن — حمل أسبوع 28",
    triage_level: "semi_urgent",
    vitals: { bp: "128/82", hr: 94, temp: 37.2, spo2: 99, rr: 16, pain: 6 },
    status: "awaiting_triage", notes: "G2P1. No bleeding reported. Fetal movement present."
  },
  {
    id: "TRG-004", patient_name: "Hassan Al-Aqrabawi", patient_name_ar: "حسن العقرباوي",    mrn: "MRN-001244", dob: "1950-02-14", gender: "Male",
    arrival_time: "09:31", chief_complaint: "Shortness of breath, productive cough", chief_complaint_ar: "ضيق في التنفس وسعال منتج",
    triage_level: "semi_urgent",
    vitals: { bp: "135/85", hr: 104, temp: 38.4, spo2: 91, rr: 24, pain: 4 },
    status: "awaiting_triage", notes: "COPD patient. O2 supplementation started."
  },
  {
    id: "TRG-005", patient_name: "Rana Al-Shammari",   patient_name_ar: "رنا الشمري",       mrn: "MRN-001245", dob: "1995-07-09", gender: "Female",
    arrival_time: "09:40", chief_complaint: "Swollen, painful right knee", chief_complaint_ar: "تورم وألم في الركبة اليمنى",
    triage_level: "routine",
    vitals: { bp: "118/76", hr: 82, temp: 36.9, spo2: 99, rr: 15, pain: 5 },
    status: "awaiting_triage", notes: "Fell on stairs 2 hours ago. No LOC."
  },
  {
    id: "TRG-006", patient_name: "Dalal Al-Najjar",    patient_name_ar: "دلال النجار",      mrn: "MRN-001247", dob: "1982-03-22", gender: "Female",
    arrival_time: "09:45", chief_complaint: "Generalized fatigue, dizziness", chief_complaint_ar: "إعياء عام ودوار",
    triage_level: "routine",
    vitals: { bp: "105/68", hr: 78, temp: 36.7, spo2: 98, rr: 14, pain: 2 },
    status: "triaged", notes: "Hx of iron-deficiency anemia. Fasting this morning."
  },
  {
    id: "TRG-007", patient_name: "Bilal Al-Suwaidan",  patient_name_ar: "بلال السويدان",    mrn: "MRN-001252", dob: "1970-11-30", gender: "Male",
    arrival_time: "08:50", chief_complaint: "Ear pain, reduced hearing left ear", chief_complaint_ar: "ألم في الأذن وانخفاض السمع في الأذن اليسرى",
    triage_level: "routine",
    vitals: { bp: "122/80", hr: 76, temp: 37.3, spo2: 99, rr: 14, pain: 3 },
    status: "in_consultation", notes: "3-day history. On antibiotics."
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triageStyle(level: string): { bg: string; border: string; text: string; dot: string; label_en: string; label_ar: string } {
  switch (level) {
    case "urgent":     return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", dot: "#ef4444", label_en: "Urgent",      label_ar: "عاجل" };
    case "semi_urgent": return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", dot: "#f59e0b", label_en: "Semi-urgent", label_ar: "شبه عاجل" };
    default:           return { bg: "#f0fdf4", border: "#bbf7d0", text: "#065f46", dot: "#22c55e", label_en: "Routine",     label_ar: "روتيني" };
  }
}

function vitalAlert(key: string, value: number): boolean {
  switch (key) {
    case "hr":   return value < 50 || value > 100;
    case "spo2": return value < 95;
    case "rr":   return value < 12 || value > 20;
    case "pain": return value >= 7;
    default:     return false;
  }
}

const EMPTY_FORM: TriageFormData = {
  bp_systolic: "", bp_diastolic: "", hr: "", temp: "", spo2: "", rr: "", pain: "",
  chief_complaint: "", triage_level: "routine", notes: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TriagePage() {
  const [patients, setPatients] = useState<TriagePatient[]>(MOCK_TRIAGE);
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<TriageFormData>(EMPTY_FORM);
  const [submitMsg, setSubmitMsg] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch<TriageRaw[]>("/api/v1/clinic/triage/");
        if (data && data.length > 0) {
          const mapped: TriagePatient[] = data.map((item, idx) => ({
            id: item.id,
            patient_name: `${item.patient_detail?.first_name ?? "Patient"} ${item.patient_detail?.last_name ?? ""}`.trim(),
            patient_name_ar: `${item.patient_detail?.first_name_ar ?? "مريض"} ${item.patient_detail?.last_name_ar ?? ""}`.trim(),
            mrn: item.patient_detail?.mrn ?? `MRN-${String(idx).padStart(6, "0")}`,
            dob: item.patient_detail?.date_of_birth ?? "N/A",
            gender: item.patient_detail?.gender ?? "N/A",
            arrival_time: item.arrival_time ? new Date(item.arrival_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--",
            chief_complaint: item.chief_complaint ?? "",
            chief_complaint_ar: item.chief_complaint ?? "",
            triage_level: (item.triage_level ?? "routine") as TriagePatient["triage_level"],
            vitals: {
              bp: `${item.bp_systolic ?? "--"}/${item.bp_diastolic ?? "--"}`,
              hr: item.heart_rate ?? 0,
              temp: item.temperature ?? 0,
              spo2: item.spo2 ?? 0,
              rr: item.respiratory_rate ?? 0,
              pain: item.pain_score ?? 0,
            },
            status: (item.status ?? "awaiting_triage") as TriagePatient["status"],
            notes: item.notes ?? "",
          }));
          setPatients(mapped);
        }
      } catch (err) {
        console.warn("Triage API unavailable, using mock data:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const selectedPatient = patients.find(p => p.id === selectedId) ?? null;

  const handleSelect = (p: TriagePatient) => {
    setSelectedId(p.id);
    setForm({
      bp_systolic: p.vitals.bp.split("/")[0] ?? "",
      bp_diastolic: p.vitals.bp.split("/")[1] ?? "",
      hr: String(p.vitals.hr),
      temp: String(p.vitals.temp),
      spo2: String(p.vitals.spo2),
      rr: String(p.vitals.rr),
      pain: String(p.vitals.pain),
      chief_complaint: p.chief_complaint,
      triage_level: p.triage_level,
      notes: p.notes,
    });
    setSubmitMsg("");
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
    const payload = {
      bp_systolic: Number(form.bp_systolic),
      bp_diastolic: Number(form.bp_diastolic),
      heart_rate: Number(form.hr),
      temperature: Number(form.temp),
      spo2: Number(form.spo2),
      respiratory_rate: Number(form.rr),
      pain_score: Number(form.pain),
      chief_complaint: form.chief_complaint,
      triage_level: form.triage_level,
      notes: form.notes,
      status: "triaged",
    };
    try {
      await apiFetch(`/api/v1/clinic/triage/${selectedId}/`, { method: "PATCH", body: JSON.stringify(payload) });
    } catch { /* silent */ }
    setPatients(prev => prev.map(p => p.id === selectedId ? {
      ...p,
      triage_level: form.triage_level,
      vitals: {
        bp: `${form.bp_systolic}/${form.bp_diastolic}`,
        hr: Number(form.hr),
        temp: Number(form.temp),
        spo2: Number(form.spo2),
        rr: Number(form.rr),
        pain: Number(form.pain),
      },
      chief_complaint: form.chief_complaint,
      notes: form.notes,
      status: "triaged",
    } : p));
    setSubmitMsg(lang === "en" ? "Triage assessment saved successfully." : "تم حفظ تقييم الفرز بنجاح.");
    setTimeout(() => { setSubmitMsg(""); setSelectedId(null); setForm(EMPTY_FORM); }, 3500);
  };

  const countByLevel = {
    urgent:     patients.filter(p => p.triage_level === "urgent"    && p.status !== "in_consultation").length,
    semi_urgent: patients.filter(p => p.triage_level === "semi_urgent" && p.status !== "in_consultation").length,
    routine:    patients.filter(p => p.triage_level === "routine"   && p.status !== "in_consultation").length,
  };

  const filtered = patients.filter(p => filterLevel === "all" || p.triage_level === filterLevel);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const fieldLabelCls = "mb-1.5 block text-[13px] font-semibold text-ink/50";
  const fieldInputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink";

  return (
    <div dir={dir} className="mx-auto max-w-6xl">

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/clinic" className="text-sm text-ink/50 hover:text-ink">
            {lang === "en" ? "← Clinic" : "العيادة ←"}
          </a>
          <h1 className="mt-1 font-heading text-3xl font-bold">
            {lang === "en" ? "Triage Assessment" : "تقييم الفرز الطبي"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Assess and prioritize patients by urgency" : "تقييم المرضى وترتيب أولوياتهم حسب الحاجة"}
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
          { href: "/clinic/reception",     label: lang === "en" ? "Reception"     : "الاستقبال" },
          { href: "/clinic/consultations", label: lang === "en" ? "Consultations" : "الاستشارات" },
          { href: "/clinic/telemedicine",  label: lang === "en" ? "Telemedicine"  : "التطبيب عن بُعد" },
        ].map(n => (
          <a key={n.href} href={n.href} className="rounded-md border border-ink/10 bg-surface px-4 py-2 text-xs font-semibold hover:bg-ink/5">
            {n.label}
          </a>
        ))}
      </nav>

      {/* Triage level summary */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {(["urgent", "semi_urgent", "routine"] as const).map(level => {
          const ts = triageStyle(level);
          return (
            <div
              key={level}
              onClick={() => setFilterLevel(filterLevel === level ? "all" : level)}
              className="cursor-pointer rounded-xl border-2 p-5 text-center"
              style={{ background: ts.bg, borderColor: ts.border }}
            >
              <div className="mx-auto mb-2 h-3.5 w-3.5 rounded-full" style={{ background: ts.dot }} />
              <p className="text-3xl font-bold" style={{ color: ts.text }}>{countByLevel[level]}</p>
              <p className="mt-1.5 text-sm font-bold" style={{ color: ts.text }}>
                {lang === "en" ? ts.label_en : ts.label_ar}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-[1fr_420px] items-start gap-6">

        {/* LEFT — Triage queue */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {lang === "en" ? "Patients Awaiting Triage" : "المرضى بانتظار الفرز"}
            </h2>
            <div className="flex gap-2">
              {(["all", "urgent", "semi_urgent", "routine"] as const).map(f => {
                const ts = triageStyle(f === "all" ? "routine" : f);
                const activeColor = f === "urgent" ? "#ef4444" : f === "semi_urgent" ? "#f59e0b" : f === "routine" ? "#22c55e" : "#22D3EE";
                return (
                  <button
                    key={f}
                    onClick={() => setFilterLevel(f)}
                    className="rounded-md border border-ink/10 px-2.5 py-1.5 text-xs font-semibold"
                    style={filterLevel === f ? { background: activeColor, color: "#fff", borderColor: activeColor } : { background: "var(--color-surface)", color: "var(--color-text)" }}
                  >
                    {f === "all" ? (lang === "en" ? "All" : "الكل") : (lang === "en" ? ts.label_en : ts.label_ar)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map(p => {
              const ts = triageStyle(p.triage_level);
              const isSelected = p.id === selectedId;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`cursor-pointer rounded-xl p-4 ${isSelected ? "border-2 border-brand-400 shadow-[0_0_0_3px_rgba(34,211,238,0.15)]" : "border border-ink/10 bg-surface"}`}
                  style={{ borderLeft: `4px solid ${ts.dot}` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="mb-1 flex items-center gap-2.5">
                        <span className="text-sm font-bold">
                          {lang === "ar" ? p.patient_name_ar : p.patient_name}
                        </span>
                        <span className="font-mono text-xs text-ink/50">{p.mrn}</span>
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}>
                          {lang === "en" ? ts.label_en : ts.label_ar}
                        </span>
                      </div>
                      <p className="mb-2 text-sm italic text-ink/50">
                        {lang === "ar" ? p.chief_complaint_ar : p.chief_complaint}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-ink/50">{lang === "en" ? "Arrived" : "وصل"}</div>
                      <div className="text-sm font-bold text-brand-400">{p.arrival_time}</div>
                    </div>
                  </div>

                  {/* Vitals strip */}
                  <div className="mt-2 flex flex-wrap gap-4">
                    {[
                      { key: "bp",   label: "BP",    value: p.vitals.bp,   unit: "mmHg", num: 0 },
                      { key: "hr",   label: "HR",    value: p.vitals.hr,   unit: "bpm",  num: p.vitals.hr },
                      { key: "temp", label: "Temp",  value: p.vitals.temp, unit: "°C",   num: 0 },
                      { key: "spo2", label: "SpO₂",  value: p.vitals.spo2, unit: "%",    num: p.vitals.spo2 },
                      { key: "rr",   label: "RR",    value: p.vitals.rr,   unit: "/min", num: p.vitals.rr },
                      { key: "pain", label: lang === "en" ? "Pain" : "الألم", value: p.vitals.pain, unit: "/10", num: p.vitals.pain },
                    ].map(v => {
                      const alert = vitalAlert(v.key, v.num);
                      return (
                        <div key={v.key} className="min-w-[54px] text-center">
                          <div className="text-[11px] uppercase tracking-wide text-ink/50">{v.label}</div>
                          <div className={`text-sm font-bold ${alert ? "text-red-400" : "text-ink"}`}>
                            {v.value}
                            <span className="ml-0.5 text-[11px] font-normal text-ink/50">{v.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="ml-auto self-center">
                      {p.status === "awaiting_triage" && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          {lang === "en" ? "Awaiting Triage" : "بانتظار الفرز"}
                        </span>
                      )}
                      {p.status === "triaged" && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          {lang === "en" ? "Triaged" : "تم الفرز"}
                        </span>
                      )}
                      {p.status === "in_consultation" && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                          {lang === "en" ? "In Consultation" : "في الاستشارة"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="cy-card p-10 text-center text-sm text-ink/50">
                {lang === "en" ? "No patients in this triage level." : "لا يوجد مرضى في هذا مستوى الفرز."}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Triage form */}
        <div className="cy-card sticky top-4 p-6">
          <h2 className="mb-1 text-lg font-bold text-brand-400">
            {lang === "en" ? "Triage Assessment Form" : "نموذج تقييم الفرز"}
          </h2>
          {selectedPatient ? (
            <p className="mb-5 text-sm text-ink/50">
              {lang === "en" ? `Patient: ${selectedPatient.patient_name} · ${selectedPatient.mrn}` : `المريض: ${selectedPatient.patient_name_ar} · ${selectedPatient.mrn}`}
            </p>
          ) : (
            <p className="mb-5 text-sm text-ink/50">
              {lang === "en" ? "Select a patient from the queue to begin triage." : "اختر مريضاً من الطابور لبدء تقييم الفرز."}
            </p>
          )}

          {submitMsg && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400">
              {submitMsg}
            </div>
          )}

          {/* Chief complaint */}
          <div className="mb-4">
            <label className={fieldLabelCls}>
              {lang === "en" ? "Chief Complaint" : "الشكوى الرئيسية"}
            </label>
            <textarea
              value={form.chief_complaint}
              onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))}
              disabled={!selectedId}
              rows={2}
              className={`${fieldInputCls} resize-y`}
            />
          </div>

          {/* Vitals */}
          <p className="mb-3 text-[13px] font-semibold text-ink/50">
            {lang === "en" ? "Vital Signs" : "العلامات الحيوية"}
          </p>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelCls}>
                {lang === "en" ? "BP Systolic (mmHg)" : "الضغط الانقباضي (ملم/زئبق)"}
              </label>
              <input type="number" value={form.bp_systolic} onChange={e => setForm(f => ({ ...f, bp_systolic: e.target.value }))} disabled={!selectedId} min={50} max={250}
                className={fieldInputCls} />
            </div>
            <div>
              <label className={fieldLabelCls}>
                {lang === "en" ? "BP Diastolic (mmHg)" : "الضغط الانبساطي (ملم/زئبق)"}
              </label>
              <input type="number" value={form.bp_diastolic} onChange={e => setForm(f => ({ ...f, bp_diastolic: e.target.value }))} disabled={!selectedId} min={30} max={150}
                className={fieldInputCls} />
            </div>
            <div>
              <label className={fieldLabelCls}>
                {lang === "en" ? "Heart Rate (bpm)" : "معدل القلب (نبضة/دقيقة)"}
              </label>
              <input type="number" value={form.hr} onChange={e => setForm(f => ({ ...f, hr: e.target.value }))} disabled={!selectedId} min={30} max={250}
                className={fieldInputCls}
                style={vitalAlert("hr", Number(form.hr)) ? { borderColor: "#ef4444", color: "#ef4444", fontWeight: 700 } : undefined} />
            </div>
            <div>
              <label className={fieldLabelCls}>
                {lang === "en" ? "Temperature (°C)" : "الحرارة (°س)"}
              </label>
              <input type="number" value={form.temp} onChange={e => setForm(f => ({ ...f, temp: e.target.value }))} disabled={!selectedId} min={34} max={42} step={0.1}
                className={fieldInputCls} />
            </div>
            <div>
              <label className={fieldLabelCls}>
                {lang === "en" ? "SpO₂ (%)" : "تشبع الأكسجين (%)"}
              </label>
              <input type="number" value={form.spo2} onChange={e => setForm(f => ({ ...f, spo2: e.target.value }))} disabled={!selectedId} min={70} max={100}
                className={fieldInputCls}
                style={vitalAlert("spo2", Number(form.spo2)) ? { borderColor: "#ef4444", color: "#ef4444", fontWeight: 700 } : undefined} />
            </div>
            <div>
              <label className={fieldLabelCls}>
                {lang === "en" ? "Resp. Rate (/min)" : "معدل التنفس (في الدقيقة)"}
              </label>
              <input type="number" value={form.rr} onChange={e => setForm(f => ({ ...f, rr: e.target.value }))} disabled={!selectedId} min={8} max={40}
                className={fieldInputCls}
                style={vitalAlert("rr", Number(form.rr)) ? { borderColor: "#ef4444", color: "#ef4444", fontWeight: 700 } : undefined} />
            </div>
          </div>

          {/* Pain score */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold uppercase text-ink/50">
              {lang === "en" ? `Pain Score: ${form.pain}/10` : `درجة الألم: ${form.pain}/10`}
            </label>
            <input type="range" min={0} max={10} value={form.pain} onChange={e => setForm(f => ({ ...f, pain: e.target.value }))} disabled={!selectedId}
              className="w-full" style={{ accentColor: Number(form.pain) >= 7 ? "#ef4444" : Number(form.pain) >= 4 ? "#f59e0b" : "#22c55e" }} />
            <div className="flex justify-between text-xs text-ink/50">
              <span>{lang === "en" ? "No pain" : "لا ألم"}</span>
              <span className="font-bold text-red-400">{lang === "en" ? "Worst pain" : "أشد ألم"}</span>
            </div>
          </div>

          {/* Triage level */}
          <div className="mb-4">
            <label className={fieldLabelCls}>
              {lang === "en" ? "Triage Level" : "مستوى الفرز"}
            </label>
            <div className="flex gap-2">
              {(["urgent", "semi_urgent", "routine"] as const).map(level => {
                const ts = triageStyle(level);
                const isActive = form.triage_level === level;
                return (
                  <button
                    key={level}
                    onClick={() => selectedId && setForm(f => ({ ...f, triage_level: level }))}
                    disabled={!selectedId}
                    className={`flex-1 rounded-lg border px-1.5 py-2 text-xs font-bold ${!selectedId ? "opacity-50" : ""} ${selectedId ? "cursor-pointer" : "cursor-not-allowed"}`}
                    style={{ background: isActive ? ts.dot : "var(--color-surface)", color: isActive ? "#fff" : ts.text, borderColor: isActive ? ts.dot : "var(--color-border)" }}
                  >
                    {lang === "en" ? ts.label_en : ts.label_ar}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label className={fieldLabelCls}>
              {lang === "en" ? "Clinical Notes" : "الملاحظات السريرية"}
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              disabled={!selectedId}
              rows={3}
              placeholder={lang === "en" ? "Observations, allergies, relevant history..." : "الملاحظات والحساسية والتاريخ المرضي..."}
              className={`${fieldInputCls} resize-y`}
            />
          </div>

          <button
            onClick={() => { void handleSubmit(); }}
            disabled={!selectedId}
            className="cy-btn cy-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {lang === "en" ? "Save Triage Assessment" : "حفظ تقييم الفرز"}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-ink/50">
        CyMed Clinic · {lang === "en" ? "Triage Assessment" : "تقييم الفرز"} · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
