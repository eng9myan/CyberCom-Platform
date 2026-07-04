"use client";
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
  const [lang, setLang] = useState<"en" | "ar">("en");
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

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 900, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    sectionTitle: { fontSize: "1rem", fontWeight: 700, color: "#22D3EE", marginBottom: "0.75rem" },
    apptCard: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem 1.25rem", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: "0.75rem" },
    input: { padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem", width: "100%" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "مواعيدي" : "My Appointments"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{upcoming.filter(a => a.status === "upcoming").length} {isAr ? "موعد قادم" : "upcoming appointment(s)"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/patient-portal" style={s.btn}>{isAr ? "← البوابة" : "← Portal"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={s.sectionTitle}>{isAr ? "المواعيد القادمة" : "Upcoming Appointments"}</div>
          <button onClick={() => setShowBook(!showBook)} style={{ background: "#22D3EE", color: "#000", border: "none", borderRadius: 6, padding: "0.4rem 1rem", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}>{isAr ? "+ حجز موعد" : "+ Book Appointment"}</button>
        </div>
        {showBook && (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, marginBottom: "1rem" }}>{isAr ? "حجز موعد جديد" : "Book New Appointment"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div><label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>{isAr ? "التخصص" : "Specialty"}</label><select value={specialty} onChange={e => setSpecialty(e.target.value)} style={s.input}><option value="">{isAr ? "اختر التخصص" : "Select specialty"}</option>{SPECIALTIES.map(sp => <option key={sp} value={sp}>{sp}</option>)}</select></div>
              <div><label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>{isAr ? "التاريخ المفضل" : "Preferred Date"}</label><input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} style={s.input} /></div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55", borderRadius: 6, padding: "0.4rem 1.25rem", cursor: "pointer", fontWeight: 600 }}>{isAr ? "إرسال الطلب" : "Request Appointment"}</button>
              <button onClick={() => setShowBook(false)} style={{ background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: 6, padding: "0.4rem 1rem", cursor: "pointer" }}>{isAr ? "إلغاء" : "Cancel"}</button>
            </div>
          </div>
        )}
        {upcoming.map(a => (
          <div key={a.id} style={s.apptCard}>
            <div>
              <div style={{ fontWeight: 700 }}>{isAr ? a.specialty_ar : a.specialty}</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{a.provider} · {a.location}</div>
              <div style={{ fontSize: "0.8rem", color: "#22D3EE", marginTop: 4 }}>{a.date} {a.time} {a.type === "virtual" ? "🎥" : "🏥"}</div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span style={{ background: `${STATUS_COLOR[a.status]}22`, color: STATUS_COLOR[a.status], border: `1px solid ${STATUS_COLOR[a.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{a.status}</span>
              {a.status === "upcoming" && <button onClick={() => handleCancel(a.id)} style={{ background: "transparent", color: "#6b7280", border: "1px solid #6b728055", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem" }}>{isAr ? "إلغاء" : "Cancel"}</button>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: "1rem" }}><div style={s.sectionTitle}>{isAr ? "المواعيد السابقة" : "Past Appointments"}</div>
        {past.map(a => (
          <div key={a.id} style={{ ...s.apptCard, opacity: 0.7 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{isAr ? a.specialty_ar : a.specialty}</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{a.provider}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{a.date} {a.time}</div>
            </div>
            <span style={{ background: `${STATUS_COLOR[a.status]}22`, color: STATUS_COLOR[a.status], border: `1px solid ${STATUS_COLOR[a.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
