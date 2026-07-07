"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Appt { id: string; date: string; time: string; specialty: string; specialty_ar: string; provider: string; location: string; status: "upcoming" | "completed" | "cancelled"; type: "in_person" | "virtual"; }
const MOCK_UPCOMING: Appt[] = [
  { id: "a001", date: "2026-07-08", time: "10:00 AM", specialty: "Cardiology", specialty_ar: "أمراض القلب", provider: "Dr. Ahmed Al-Rashid", location: "Clinic B, Floor 2", status: "upcoming", type: "in_person" },
  { id: "a002", date: "2026-07-15", time: "02:00 PM", specialty: "Endocrinology", specialty_ar: "الغدد الصماء", provider: "Dr. Khalid Al-Nouri", location: "Virtual — Video Call", status: "upcoming", type: "virtual" },
  { id: "a003", date: "2026-07-22", time: "09:30 AM", specialty: "Ophthalmology", specialty_ar: "طب العيون", provider: "Dr. Faisal Al-Anzi", location: "Eye Clinic, Floor 3", status: "upcoming", type: "in_person" },
];
const MOCK_PAST: Appt[] = [
  { id: "p001", date: "2026-06-20", time: "11:00 AM", specialty: "Internal Medicine", specialty_ar: "الباطنية", provider: "Dr. Sarah Johnson", location: "Clinic A, Floor 1", status: "completed", type: "in_person" },
  { id: "p002", date: "2026-06-05", time: "03:00 PM", specialty: "Cardiology", specialty_ar: "أمراض القلب", provider: "Dr. Ahmed Al-Rashid", location: "Virtual", status: "completed", type: "virtual" },
  { id: "p003", date: "2026-05-28", time: "09:00 AM", specialty: "Dermatology", specialty_ar: "الأمراض الجلدية", provider: "Dr. Laila Mahmoud", location: "Clinic C, Floor 2", status: "cancelled", type: "in_person" },
  { id: "p004", date: "2026-05-15", time: "01:00 PM", specialty: "Orthopedics", specialty_ar: "العظام", provider: "Dr. Omar Hassan", location: "Orthopedics Clinic", status: "completed", type: "in_person" },
  { id: "p005", date: "2026-04-30", time: "10:30 AM", specialty: "Internal Medicine", specialty_ar: "الباطنية", provider: "Dr. Sarah Johnson", location: "Clinic A, Floor 1", status: "completed", type: "in_person" },
];
const SPECIALTIES = ["Internal Medicine", "Cardiology", "Endocrinology", "Orthopedics", "Dermatology", "Ophthalmology", "Neurology", "Gynecology"];
const STATUS_COLOR: Record<string, string> = { upcoming: "#22D3EE", completed: "#22c55e", cancelled: "#6b7280" };

export default function PatientAppointmentsPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [upcoming, setUpcoming] = useState<Appt[]>(MOCK_UPCOMING);
  const [past] = useState<Appt[]>(MOCK_PAST);
  const [showBook, setShowBook] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Appt[]>("/api/v1/patient-portal/appointments/").then(d => { if (d && d.length) setUpcoming(d.filter(a => a.status === "upcoming")); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    try { await apiFetch(`/api/v1/patient-portal/appointments/${id}/cancel/`, { method: "POST" }); } catch {}
    setUpcoming(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" as const } : a));
  };

  const inputCls = "w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink";
  const labelCls = "mb-1.5 block text-[13px] font-semibold text-ink/50";

  return (
    <div className="mx-auto max-w-4xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "مواعيدي" : "My Appointments"}</h1>
          <p className="text-sm text-ink/50">{upcoming.filter(a => a.status === "upcoming").length} {isAr ? "موعد قادم" : "upcoming appointment(s)"}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <a href="/patient-portal" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← البوابة" : "← Portal"}</a>
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-bold">{isAr ? "المواعيد القادمة" : "Upcoming Appointments"}</div>
          <button onClick={() => setShowBook(!showBook)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">{isAr ? "+ حجز موعد" : "+ Book Appointment"}</button>
        </div>
        {showBook && (
          <div className="cy-card mb-4 p-5">
            <div className="mb-4 font-bold">{isAr ? "حجز موعد جديد" : "Book New Appointment"}</div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{isAr ? "التخصص" : "Specialty"}</label>
                <select value={specialty} onChange={e => setSpecialty(e.target.value)} className={inputCls}>
                  <option value="">{isAr ? "اختر التخصص" : "Select specialty"}</option>
                  {SPECIALTIES.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{isAr ? "التاريخ المفضل" : "Preferred Date"}</label>
                <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="cy-btn bg-emerald-500 text-white">{isAr ? "إرسال الطلب" : "Request Appointment"}</button>
              <button onClick={() => setShowBook(false)} className="cy-btn cy-btn-ghost">{isAr ? "إلغاء" : "Cancel"}</button>
            </div>
          </div>
        )}
        {upcoming.map(a => (
          <div key={a.id} className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-surface px-5 py-4">
            <div>
              <div className="font-bold">{isAr ? a.specialty_ar : a.specialty}</div>
              <div className="text-sm text-ink/50">{a.provider} · {a.location}</div>
              <div className="mt-1 text-[13px]" style={{ color: "#22D3EE" }}>{a.date} {a.time} {a.type === "virtual" ? "🎥" : "🏥"}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[a.status]}22`, color: STATUS_COLOR[a.status], border: `1px solid ${STATUS_COLOR[a.status]}55` }}>{a.status}</span>
              {a.status === "upcoming" && <button onClick={() => handleCancel(a.id)} className="rounded border border-ink/20 px-2.5 py-1 text-xs text-ink/50 hover:bg-ink/5">{isAr ? "إلغاء" : "Cancel"}</button>}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <div className="mb-3 text-lg font-bold">{isAr ? "المواعيد السابقة" : "Past Appointments"}</div>
        {past.map(a => (
          <div key={a.id} className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-surface px-5 py-4 opacity-70">
            <div>
              <div className="font-semibold">{isAr ? a.specialty_ar : a.specialty}</div>
              <div className="text-sm text-ink/50">{a.provider}</div>
              <div className="mt-1 text-[13px] text-ink/50">{a.date} {a.time}</div>
            </div>
            <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[a.status]}22`, color: STATUS_COLOR[a.status], border: `1px solid ${STATUS_COLOR[a.status]}55` }}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
