"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Session { id: string; patient: string; patient_ar: string; mrn: string; provider: string; specialty: string; platform: "video" | "phone" | "chat"; status: "pending" | "in_progress" | "completed" | "cancelled"; scheduled_at: string; duration_min: number | null; }
const MOCK: Session[] = [
  { id: "tm-001", patient: "Fatima Al-Harbi", patient_ar: "فاطمة الحربي", mrn: "MRN-002145", provider: "Dr. Sarah Johnson", specialty: "Internal Medicine", platform: "video", status: "in_progress", scheduled_at: "09:00 AM", duration_min: 18 },
  { id: "tm-002", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", mrn: "MRN-002146", provider: "Dr. Ahmed Al-Rashid", specialty: "Cardiology", platform: "video", status: "pending", scheduled_at: "09:30 AM", duration_min: null },
  { id: "tm-003", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", mrn: "MRN-002147", provider: "Dr. Khalid Al-Nouri", specialty: "Endocrinology", platform: "phone", status: "completed", scheduled_at: "08:00 AM", duration_min: 12 },
  { id: "tm-004", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", mrn: "MRN-002148", provider: "Dr. Laila Mahmoud", specialty: "Dermatology", platform: "chat", status: "pending", scheduled_at: "10:00 AM", duration_min: null },
  { id: "tm-005", patient: "Nora Al-Qahtani", patient_ar: "نورة القحطاني", mrn: "MRN-002149", provider: "Dr. Sarah Johnson", specialty: "Internal Medicine", platform: "video", status: "pending", scheduled_at: "10:30 AM", duration_min: null },
  { id: "tm-006", patient: "Tariq Al-Shammari", patient_ar: "طارق الشمري", mrn: "MRN-002150", provider: "Dr. Omar Hassan", specialty: "Orthopedics", platform: "video", status: "cancelled", scheduled_at: "08:30 AM", duration_min: null },
  { id: "tm-007", patient: "Hessa Al-Mutairi", patient_ar: "حصة المطيري", mrn: "MRN-002151", provider: "Dr. Faisal Al-Anzi", specialty: "Pulmonology", platform: "video", status: "completed", scheduled_at: "07:30 AM", duration_min: 22 },
  { id: "tm-008", patient: "Badr Al-Rashidi", patient_ar: "بدر الرشيدي", mrn: "MRN-002152", provider: "Dr. Ahmed Al-Rashid", specialty: "Cardiology", platform: "phone", status: "pending", scheduled_at: "11:00 AM", duration_min: null },
];
const STATUS_COLOR: Record<string, string> = { pending: "#f59e0b", in_progress: "#22c55e", completed: "#22D3EE", cancelled: "#6b7280" };
const PLATFORM_ICON: Record<string, string> = { video: "🎥", phone: "📞", chat: "💬" };

export default function TelemedicinePage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [sessions, setSessions] = useState<Session[]>(MOCK);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Session[]>("/api/v1/clinic/telemedicine/sessions/").then(d => { if (d && d.length) setSessions(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: "join" | "end" | "cancel") => {
    const next = { join: "in_progress" as const, end: "completed" as const, cancel: "cancelled" as const };
    try { await apiFetch(`/api/v1/clinic/telemedicine/sessions/${id}/`, { method: "PATCH", body: JSON.stringify({ status: next[action] }) }); } catch {}
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: next[action] } : s));
  };

  const counts = { pending: sessions.filter(s => s.status === "pending").length, in_progress: sessions.filter(s => s.status === "in_progress").length, completed: sessions.filter(s => s.status === "completed").length, cancelled: sessions.filter(s => s.status === "cancelled").length };
  const filtered = filter === "all" ? sessions : sessions.filter(s => s.status === filter);
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div dir={dir} className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between border-b-2 border-brand-400/30 pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-400">{isAr ? "التطبيب عن بُعد" : "Telemedicine Sessions"}</h1>
          <p className="mt-1 text-sm text-ink/50">{isAr ? "جلسات الطب عن بُعد عبر الفيديو والهاتف والدردشة" : "Virtual consultations via video, phone & chat"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <nav className="mb-6 flex flex-wrap gap-2">
        <a href="/clinic" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm no-underline">{isAr ? "← الرجوع للعيادة" : "← Back to Clinic"}</a>
      </nav>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: isAr ? "في الانتظار" : "Pending", value: counts.pending, color: "#f59e0b" },
          { label: isAr ? "جارية" : "In Progress", value: counts.in_progress, color: "#22c55e" },
          { label: isAr ? "مكتملة" : "Completed", value: counts.completed, color: "#22D3EE" },
          { label: isAr ? "ملغاة" : "Cancelled", value: counts.cancelled, color: "#6b7280" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="mt-1 text-xs text-ink/50">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {["all", "pending", "in_progress", "completed", "cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold border ${filter === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink hover:bg-ink/5"}`}
          >
            {f === "all" ? (isAr ? "الكل" : "All") : f.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="cy-card overflow-auto p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              {[
                isAr ? "المريض" : "Patient",
                isAr ? "الطبيب" : "Provider",
                isAr ? "التخصص" : "Specialty",
                isAr ? "المنصة" : "Platform",
                isAr ? "الوقت" : "Time",
                isAr ? "الحالة" : "Status",
                isAr ? "إجراء" : "Action",
              ].map(h => (
                <th key={h} className={`px-4 py-3.5 text-xs font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(sess => (
              <tr key={sess.id} className="border-b border-ink/5">
                <td className="px-4 py-3 text-sm">
                  <div className="font-semibold">{isAr ? sess.patient_ar : sess.patient}</div>
                  <div className="text-xs text-ink/50">{sess.mrn}</div>
                </td>
                <td className="px-4 py-3 text-sm">{sess.provider}</td>
                <td className="px-4 py-3 text-sm">{sess.specialty}</td>
                <td className="px-4 py-3 text-sm">{PLATFORM_ICON[sess.platform]} {sess.platform}</td>
                <td className="px-4 py-3 text-sm">{sess.scheduled_at}{sess.duration_min ? ` (${sess.duration_min}m)` : ""}</td>
                <td className="px-4 py-3">
                  <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[sess.status]}22`, color: STATUS_COLOR[sess.status], border: `1px solid ${STATUS_COLOR[sess.status]}55` }}>
                    {sess.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {sess.status === "pending" && (
                      <button onClick={() => handleAction(sess.id, "join")} className="rounded px-2.5 py-1 text-xs font-semibold" style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55" }}>
                        {isAr ? "انضمام" : "Join"}
                      </button>
                    )}
                    {sess.status === "in_progress" && (
                      <button onClick={() => handleAction(sess.id, "end")} className="rounded px-2.5 py-1 text-xs font-semibold" style={{ background: "#22D3EE22", color: "#22D3EE", border: "1px solid #22D3EE55" }}>
                        {isAr ? "إنهاء" : "End"}
                      </button>
                    )}
                    {sess.status === "pending" && (
                      <button onClick={() => handleAction(sess.id, "cancel")} className="rounded px-2.5 py-1 text-xs" style={{ background: "transparent", color: "#6b7280", border: "1px solid #6b728055" }}>
                        {isAr ? "إلغاء" : "Cancel"}
                      </button>
                    )}
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
