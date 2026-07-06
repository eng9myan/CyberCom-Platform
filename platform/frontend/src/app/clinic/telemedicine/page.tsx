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

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1100, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "1rem", marginBottom: "1.5rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem", textAlign: "center" as const },
    nav: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" as const },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "التطبيب عن بُعد" : "Telemedicine Sessions"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{isAr ? "جلسات الطب عن بُعد عبر الفيديو والهاتف والدردشة" : "Virtual consultations via video, phone & chat"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <nav style={s.nav}>
        {[{ href: "/clinic", label: isAr ? "← الرجوع للعيادة" : "← Back to Clinic" }].map(m => (
          <a key={m.href} href={m.href} style={{ ...s.btn, textDecoration: "none" }}>{m.label}</a>
        ))}
      </nav>
      <div style={s.grid}>
        {[
          { label: isAr ? "في الانتظار" : "Pending", value: counts.pending, color: "#f59e0b" },
          { label: isAr ? "جارية" : "In Progress", value: counts.in_progress, color: "#22c55e" },
          { label: isAr ? "مكتملة" : "Completed", value: counts.completed, color: "#22D3EE" },
          { label: isAr ? "ملغاة" : "Cancelled", value: counts.cancelled, color: "#6b7280" },
        ].map(m => (
          <div key={m.label} style={s.card}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["all", "pending", "in_progress", "completed", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...s.btn, background: filter === f ? "#22D3EE" : "var(--color-surface)", color: filter === f ? "#000" : "var(--color-text)", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
            {f === "all" ? (isAr ? "الكل" : "All") : f.replace("_", " ")}
          </button>
        ))}
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: "rgba(34,211,238,0.05)" }}>
              <th style={s.th}>{isAr ? "المريض" : "Patient"}</th>
              <th style={s.th}>{isAr ? "الطبيب" : "Provider"}</th>
              <th style={s.th}>{isAr ? "التخصص" : "Specialty"}</th>
              <th style={s.th}>{isAr ? "المنصة" : "Platform"}</th>
              <th style={s.th}>{isAr ? "الوقت" : "Time"}</th>
              <th style={s.th}>{isAr ? "الحالة" : "Status"}</th>
              <th style={s.th}>{isAr ? "إجراء" : "Action"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sess => (
              <tr key={sess.id}>
                <td style={s.td}><div style={{ fontWeight: 600 }}>{isAr ? sess.patient_ar : sess.patient}</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{sess.mrn}</div></td>
                <td style={s.td}>{sess.provider}</td>
                <td style={s.td}>{sess.specialty}</td>
                <td style={s.td}>{PLATFORM_ICON[sess.platform]} {sess.platform}</td>
                <td style={s.td}>{sess.scheduled_at}{sess.duration_min ? ` (${sess.duration_min}m)` : ""}</td>
                <td style={s.td}><span style={{ background: `${STATUS_COLOR[sess.status]}22`, color: STATUS_COLOR[sess.status], border: `1px solid ${STATUS_COLOR[sess.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{sess.status.replace("_", " ")}</span></td>
                <td style={s.td}>
                  {sess.status === "pending" && <button onClick={() => handleAction(sess.id, "join")} style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, marginRight: 6 }}>{isAr ? "انضمام" : "Join"}</button>}
                  {sess.status === "in_progress" && <button onClick={() => handleAction(sess.id, "end")} style={{ background: "#22D3EE22", color: "#22D3EE", border: "1px solid #22D3EE55", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, marginRight: 6 }}>{isAr ? "إنهاء" : "End"}</button>}
                  {(sess.status === "pending") && <button onClick={() => handleAction(sess.id, "cancel")} style={{ background: "transparent", color: "#6b7280", border: "1px solid #6b728055", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem" }}>{isAr ? "إلغاء" : "Cancel"}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
