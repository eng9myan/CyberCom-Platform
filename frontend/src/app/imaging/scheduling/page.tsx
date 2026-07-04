"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Slot { id: string; time: string; room: string; modality: string; patient: string | null; patient_ar: string | null; procedure: string | null; duration_min: number; }
const MOCK: Slot[] = [
  { id: "sl-01", time: "07:00", room: "CT-1", modality: "CT", patient: "Fatima Al-Harbi", patient_ar: "فاطمة الحربي", procedure: "Chest CT", duration_min: 30 },
  { id: "sl-02", time: "07:30", room: "CT-1", modality: "CT", patient: null, patient_ar: null, procedure: null, duration_min: 30 },
  { id: "sl-03", time: "08:00", room: "CT-1", modality: "CT", patient: "Khalid Al-Sayed", patient_ar: "خالد السيد", procedure: "Head CT", duration_min: 30 },
  { id: "sl-04", time: "08:30", room: "CT-1", modality: "CT", patient: "Faris Al-Ghamdi", patient_ar: "فارس الغامدي", procedure: "Coronary CTA", duration_min: 60 },
  { id: "sl-05", time: "07:00", room: "MRI-1", modality: "MRI", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", procedure: "Brain MRI", duration_min: 45 },
  { id: "sl-06", time: "07:45", room: "MRI-1", modality: "MRI", patient: null, patient_ar: null, procedure: null, duration_min: 45 },
  { id: "sl-07", time: "08:30", room: "MRI-1", modality: "MRI", patient: "Afnan Al-Otaibi", patient_ar: "أفنان العتيبي", procedure: "Pelvic MRI", duration_min: 60 },
  { id: "sl-08", time: "07:00", room: "XR-1", modality: "X-Ray", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", procedure: "Chest PA/Lat", duration_min: 15 },
  { id: "sl-09", time: "07:15", room: "XR-1", modality: "X-Ray", patient: "Badr Al-Rashidi", patient_ar: "بدر الرشيدي", procedure: "Right Knee AP/Lat", duration_min: 15 },
  { id: "sl-10", time: "07:30", room: "XR-1", modality: "X-Ray", patient: null, patient_ar: null, procedure: null, duration_min: 15 },
  { id: "sl-11", time: "07:45", room: "XR-1", modality: "X-Ray", patient: "Nora Al-Qahtani", patient_ar: "نورة القحطاني", procedure: "Spine AP/Lat", duration_min: 15 },
  { id: "sl-12", time: "07:00", room: "US-1", modality: "Ultrasound", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", procedure: "Abdominal US", duration_min: 30 },
  { id: "sl-13", time: "07:30", room: "US-1", modality: "Ultrasound", patient: "Waleed Al-Bishi", patient_ar: "وليد البيشي", procedure: "Thyroid US", duration_min: 30 },
  { id: "sl-14", time: "08:00", room: "US-1", modality: "Ultrasound", patient: null, patient_ar: null, procedure: null, duration_min: 30 },
  { id: "sl-15", time: "07:00", room: "MAMM-1", modality: "Mammogram", patient: "Sara Al-Harbi", patient_ar: "سارة الحربي", procedure: "Screening Mammogram", duration_min: 30 },
];
const MOD_COLOR: Record<string, string> = { CT: "#a78bfa", MRI: "#22D3EE", "X-Ray": "#22c55e", Ultrasound: "#60a5fa", Mammogram: "#f472b6" };
const ROOMS = Array.from(new Set(MOCK.map(s => s.room)));

export default function ImagingSchedulingPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [slots, setSlots] = useState<Slot[]>(MOCK);
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<Slot[]>("/api/v1/imaging/scheduling/slots/").then(d => { if (d && d.length) setSlots(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const booked = slots.filter(s => s.patient).length;
  const available = slots.filter(s => !s.patient).length;

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "1rem", marginBottom: "1.5rem" },
    metricCard: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "جدولة الأشعة" : "Imaging Scheduling"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{isAr ? "جدول اليوم لجميع الطرائق" : "Today's schedule across all modalities"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/imaging" style={s.btn}>{isAr ? "← الأشعة" : "← Imaging"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.metricGrid}>
        {[
          { label: isAr ? "إجمالي الفتحات" : "Total Slots", value: slots.length, color: "#22D3EE" },
          { label: isAr ? "محجوزة" : "Booked", value: booked, color: "#f59e0b" },
          { label: isAr ? "متاحة" : "Available", value: available, color: "#22c55e" },
          { label: isAr ? "الغرف" : "Rooms", value: ROOMS.length, color: "#a78bfa" },
        ].map(m => (
          <div key={m.label} style={s.metricCard}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {ROOMS.map(room => {
          const roomSlots = slots.filter(sl => sl.room === room);
          const mod = roomSlots[0]?.modality ?? "Unknown";
          return (
            <div key={room} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: `${MOD_COLOR[mod] ?? "#6b7280"}18`, padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ color: MOD_COLOR[mod] ?? "#6b7280", fontWeight: 700 }}>{room}</span>
                <span style={{ background: `${MOD_COLOR[mod] ?? "#6b7280"}22`, color: MOD_COLOR[mod] ?? "#6b7280", border: `1px solid ${MOD_COLOR[mod] ?? "#6b7280"}55`, borderRadius: 4, padding: "1px 8px", fontSize: "0.75rem", fontWeight: 700 }}>{mod}</span>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{roomSlots.filter(sl => sl.patient).length}/{roomSlots.length} {isAr ? "محجوز" : "booked"}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.75rem" }}>
                {roomSlots.map(sl => (
                  <div key={sl.id} style={{ background: sl.patient ? `${MOD_COLOR[mod] ?? "#6b7280"}15` : "transparent", border: `1px solid ${sl.patient ? MOD_COLOR[mod] ?? "#6b7280" : "var(--color-border)"}55`, borderRadius: 6, padding: "0.5rem 0.75rem", minWidth: 160, opacity: sl.patient ? 1 : 0.6 }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#22D3EE" }}>{sl.time}</div>
                    {sl.patient ? (<><div style={{ fontWeight: 600, fontSize: "0.82rem", marginTop: 2 }}>{isAr ? sl.patient_ar : sl.patient}</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{sl.procedure}</div></>) : (<div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: 2 }}>{isAr ? "متاح" : "Available"} ({sl.duration_min}min)</div>)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
