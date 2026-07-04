"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface ORCase { id: string; room: string; procedure: string; procedure_ar: string; patient: string; patient_ar: string; surgeon: string; anesthesiologist: string; start_time: string; duration_min: number; status: "scheduled" | "in_progress" | "completed" | "delayed" | "cancelled"; }
interface ORRoom { id: string; name: string; status: "available" | "in_use" | "cleaning" | "blocked"; next_case?: string; }
const MOCK_CASES: ORCase[] = [
  { id: "or-001", room: "OR-1", procedure: "Laparoscopic Cholecystectomy", procedure_ar: "استئصال المرارة بالمنظار", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", surgeon: "Dr. Faisal Al-Anzi", anesthesiologist: "Dr. Rania Al-Sayed", start_time: "07:30", duration_min: 75, status: "completed" },
  { id: "or-002", room: "OR-2", procedure: "Total Knee Replacement", procedure_ar: "استبدال مفصل الركبة الكامل", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", surgeon: "Dr. Omar Hassan", anesthesiologist: "Dr. Khalid Al-Nouri", start_time: "09:00", duration_min: 120, status: "in_progress" },
  { id: "or-003", room: "OR-3", procedure: "Appendectomy", procedure_ar: "استئصال الزائدة الدودية", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", surgeon: "Dr. Faisal Al-Anzi", anesthesiologist: "Dr. Rania Al-Sayed", start_time: "10:30", duration_min: 60, status: "scheduled" },
  { id: "or-004", room: "OR-4", procedure: "Coronary Artery Bypass Graft", procedure_ar: "جراحة القلب المفتوح", patient: "Nasser Al-Qahtani", patient_ar: "ناصر القحطاني", surgeon: "Dr. Ahmed Al-Rashid", anesthesiologist: "Dr. Khalid Al-Nouri", start_time: "08:00", duration_min: 240, status: "in_progress" },
  { id: "or-005", room: "OR-5", procedure: "Hernia Repair", procedure_ar: "إصلاح الفتق", patient: "Tariq Al-Shammari", patient_ar: "طارق الشمري", surgeon: "Dr. Omar Hassan", anesthesiologist: "Dr. Rania Al-Sayed", start_time: "13:00", duration_min: 90, status: "delayed" },
  { id: "or-006", room: "OR-1", procedure: "Mastectomy", procedure_ar: "استئصال الثدي", patient: "Hessa Al-Mutairi", patient_ar: "حصة المطيري", surgeon: "Dr. Sarah Johnson", anesthesiologist: "Dr. Khalid Al-Nouri", start_time: "13:00", duration_min: 150, status: "scheduled" },
  { id: "or-007", room: "OR-6", procedure: "Cataract Surgery", procedure_ar: "جراحة إعتام عدسة العين", patient: "Badr Al-Rashidi", patient_ar: "بدر الرشيدي", surgeon: "Dr. Faisal Al-Anzi", anesthesiologist: "Dr. Rania Al-Sayed", start_time: "11:00", duration_min: 45, status: "scheduled" },
  { id: "or-008", room: "OR-3", procedure: "Hip Replacement", procedure_ar: "استبدال مفصل الورك", patient: "Sara Al-Harbi", patient_ar: "سارة الحربي", surgeon: "Dr. Omar Hassan", anesthesiologist: "Dr. Khalid Al-Nouri", start_time: "14:00", duration_min: 130, status: "cancelled" },
  { id: "or-009", room: "OR-7", procedure: "Thyroidectomy", procedure_ar: "استئصال الغدة الدرقية", patient: "Reem Al-Malki", patient_ar: "ريم المالكي", surgeon: "Dr. Sarah Johnson", anesthesiologist: "Dr. Rania Al-Sayed", start_time: "08:30", duration_min: 100, status: "completed" },
];
const MOCK_ROOMS: ORRoom[] = [
  { id: "or-1", name: "OR-1", status: "in_use", next_case: "Laparoscopic Chol. (13:00)" },
  { id: "or-2", name: "OR-2", status: "in_use" },
  { id: "or-3", name: "OR-3", status: "cleaning" },
  { id: "or-4", name: "OR-4", status: "in_use" },
  { id: "or-5", name: "OR-5", status: "blocked" },
  { id: "or-6", name: "OR-6", status: "available", next_case: "Cataract (11:00)" },
  { id: "or-7", name: "OR-7", status: "available" },
  { id: "or-8", name: "OR-8", status: "available" },
];
const STATUS_COLOR: Record<string, string> = { scheduled: "#22D3EE", in_progress: "#22c55e", completed: "#6b7280", delayed: "#f59e0b", cancelled: "#ef4444" };
const ROOM_COLOR: Record<string, string> = { available: "#22c55e", in_use: "#ef4444", cleaning: "#f59e0b", blocked: "#6b7280" };

export default function ORPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [cases, setCases] = useState<ORCase[]>(MOCK_CASES);
  const [rooms] = useState<ORRoom[]>(MOCK_ROOMS);
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<ORCase[]>("/api/v1/hospital/or/schedule/").then(d => { if (d && d.length) setCases(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    roomGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "جدول غرف العمليات" : "Operating Room Schedule"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{cases.length} {isAr ? "حالة اليوم" : "cases today"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/hospital" style={s.btn}>{isAr ? "← المستشفى" : "← Hospital"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      <div style={{ marginBottom: "0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>{isAr ? "حالة غرف العمليات" : "OR Room Status"}</div>
      <div style={s.roomGrid}>
        {rooms.map(room => (
          <div key={room.id} style={{ background: `${ROOM_COLOR[room.status]}18`, border: `2px solid ${ROOM_COLOR[room.status]}55`, borderRadius: 8, padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>{room.name}</div>
            <div style={{ color: ROOM_COLOR[room.status], fontWeight: 600, fontSize: "0.78rem", marginTop: 4 }}>{room.status.replace("_", " ").toUpperCase()}</div>
            {room.next_case && <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 4 }}>{room.next_case}</div>}
          </div>
        ))}
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: "rgba(34,211,238,0.05)" }}>
              <th style={s.th}>{isAr ? "الغرفة" : "Room"}</th>
              <th style={s.th}>{isAr ? "الإجراء" : "Procedure"}</th>
              <th style={s.th}>{isAr ? "المريض" : "Patient"}</th>
              <th style={s.th}>{isAr ? "الجراح" : "Surgeon"}</th>
              <th style={s.th}>{isAr ? "المخدر" : "Anesthesia"}</th>
              <th style={s.th}>{isAr ? "البداية" : "Start"}</th>
              <th style={s.th}>{isAr ? "المدة" : "Duration"}</th>
              <th style={s.th}>{isAr ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => (
              <tr key={c.id}>
                <td style={{ ...s.td, fontWeight: 700, color: "#22D3EE" }}>{c.room}</td>
                <td style={s.td}><div>{isAr ? c.procedure_ar : c.procedure}</div></td>
                <td style={s.td}>{isAr ? c.patient_ar : c.patient}</td>
                <td style={s.td}>{c.surgeon}</td>
                <td style={s.td}>{c.anesthesiologist}</td>
                <td style={{ ...s.td, fontFamily: "monospace" }}>{c.start_time}</td>
                <td style={s.td}>{c.duration_min} {isAr ? "د" : "min"}</td>
                <td style={s.td}><span style={{ background: `${STATUS_COLOR[c.status]}22`, color: STATUS_COLOR[c.status], border: `1px solid ${STATUS_COLOR[c.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
