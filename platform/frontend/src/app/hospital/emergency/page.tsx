"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Interfaces ──────────────────────────────────────────────────────────────

type ESILevel = 1 | 2 | 3 | 4 | 5;
type Disposition = "treat_and_release" | "admit" | "discharge" | "transfer" | "awaiting";
type EDStatus = "awaiting_triage" | "in_triage" | "in_treatment" | "awaiting_results" | "boarding" | "ready_dc";

interface EDPatient {
  id: string;
  mrn: string;
  name: string;
  name_ar: string;
  age: number;
  gender: "M" | "F";
  esi: ESILevel;
  chief_complaint: string;
  chief_complaint_ar: string;
  arrival_time: string;
  wait_minutes: number;
  status: EDStatus;
  disposition: Disposition;
  physician?: string;
  room?: string;
  bp?: string;
  hr?: number;
  spo2?: number;
  temp?: number;
}

interface EDMetrics {
  total_patients: number;
  awaiting_triage: number;
  in_treatment: number;
  boarding: number;
  avg_wait_minutes: number;
  esi1_count: number;
  esi2_count: number;
  esi3_count: number;
  esi4_count: number;
  esi5_count: number;
  treated_last_hour: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PATIENTS: EDPatient[] = [
  { id: "ED001", mrn: "MRN-30001", name: "Fahad Al-Qahtani", name_ar: "فهد القحطاني", age: 58, gender: "M", esi: 1, chief_complaint: "STEMI — Acute chest pain, radiating to left arm, diaphoresis", chief_complaint_ar: "احتشاء عضلة القلب — ألم صدري حاد يمتد للذراع الأيسر", arrival_time: "06:02", wait_minutes: 0, status: "in_treatment", disposition: "admit", physician: "Dr. Khalid Mansour", room: "Resus-1", bp: "90/60", hr: 112, spo2: 94, temp: 37.1 },
  { id: "ED002", mrn: "MRN-30002", name: "Hessa Al-Enezi", name_ar: "حصة العنزي", age: 34, gender: "F", esi: 1, chief_complaint: "Anaphylaxis — generalized urticaria, bronchospasm post-bee sting", chief_complaint_ar: "صدمة تحسسية — شرى عام، تقلص قصبي بعد لسعة نحلة", arrival_time: "07:18", wait_minutes: 0, status: "in_treatment", disposition: "admit", physician: "Dr. Reem Al-Jabri", room: "Resus-2", bp: "80/50", hr: 128, spo2: 91, temp: 37.5 },
  { id: "ED003", mrn: "MRN-30003", name: "Omar Al-Rasheed", name_ar: "عمر الرشيد", age: 72, gender: "M", esi: 2, chief_complaint: "Acute stroke — sudden right-sided weakness, speech slurring, 1.5h onset", chief_complaint_ar: "سكتة دماغية حادة — ضعف الجانب الأيمن، صعوبة نطق، منذ 1.5 ساعة", arrival_time: "06:45", wait_minutes: 5, status: "in_treatment", disposition: "admit", physician: "Dr. Basel Naser", room: "CT-Bay", bp: "178/100", hr: 88, spo2: 97, temp: 36.9 },
  { id: "ED004", mrn: "MRN-30004", name: "Nadia Al-Zahrani", name_ar: "نادية الزهراني", age: 44, gender: "F", esi: 2, chief_complaint: "Hypertensive emergency — BP 220/130, severe headache, visual changes", chief_complaint_ar: "طوارئ ارتفاع الضغط — ضغط 220/130، صداع شديد، تغيرات بصرية", arrival_time: "07:30", wait_minutes: 3, status: "in_treatment", disposition: "admit", physician: "Dr. Khalid Mansour", room: "Bay-3", bp: "220/130", hr: 96, spo2: 99, temp: 36.8 },
  { id: "ED005", mrn: "MRN-30005", name: "Salem Al-Dossari", name_ar: "سالم الدوسري", age: 29, gender: "M", esi: 2, chief_complaint: "Seizure — witnessed tonic-clonic, first episode, post-ictal", chief_complaint_ar: "نوبة صرع — شاهد عليها، أولى، مرحلة ما بعد النوبة", arrival_time: "07:55", wait_minutes: 8, status: "awaiting_results", disposition: "admit", physician: "Dr. Basel Naser", room: "Bay-5", bp: "135/85", hr: 102, spo2: 98, temp: 37.0 },
  { id: "ED006", mrn: "MRN-30006", name: "Asmaa Al-Harbi", name_ar: "أسماء الحربي", age: 63, gender: "F", esi: 2, chief_complaint: "Acute pulmonary edema — severe dyspnea, bilateral crackles, reduced O2", chief_complaint_ar: "وذمة رئوية حادة — ضيق تنفسي شديد، فرقعة ثنائية", arrival_time: "08:10", wait_minutes: 0, status: "in_treatment", disposition: "admit", physician: "Dr. Reem Al-Jabri", room: "Bay-2", bp: "155/95", hr: 118, spo2: 88, temp: 36.7 },
  { id: "ED007", mrn: "MRN-30007", name: "Tariq Bin Salim", name_ar: "طارق بن سالم", age: 47, gender: "M", esi: 3, chief_complaint: "Diabetic ketoacidosis — known T1DM, vomiting x 2 days, blood glucose 28", chief_complaint_ar: "حماض كيتوني سكري — سكري نوع 1، قيء يومين، جلوكوز 28", arrival_time: "07:00", wait_minutes: 22, status: "in_treatment", disposition: "admit", physician: "Dr. Khalid Mansour", room: "Bay-6", bp: "110/70", hr: 108, spo2: 97, temp: 37.2 },
  { id: "ED008", mrn: "MRN-30008", name: "Rania Al-Khatib", name_ar: "رانيا الخطيب", age: 28, gender: "F", esi: 3, chief_complaint: "Appendicitis — RLQ pain, nausea, fever, positive Rovsing's", chief_complaint_ar: "التهاب الزائدة الدودية — ألم ربع سفلي أيمن، غثيان، حمى", arrival_time: "07:40", wait_minutes: 35, status: "awaiting_results", disposition: "admit", physician: "Dr. Tariq Farouk", room: "Bay-8", bp: "120/78", hr: 95, spo2: 99, temp: 38.3 },
  { id: "ED009", mrn: "MRN-30009", name: "Jassim Al-Sulaiti", name_ar: "جاسم السليطي", age: 55, gender: "M", esi: 3, chief_complaint: "Chest pain — atypical, rule out ACS, troponin pending", chief_complaint_ar: "ألم صدري غير نمطي، استبعاد متلازمة تاجية، انتظار تروبونين", arrival_time: "08:00", wait_minutes: 42, status: "awaiting_results", disposition: "awaiting", physician: "Dr. Khalid Mansour", room: "Bay-7", bp: "140/88", hr: 82, spo2: 98, temp: 36.9 },
  { id: "ED010", mrn: "MRN-30010", name: "Mona Al-Sabah", name_ar: "منى الصباح", age: 38, gender: "F", esi: 3, chief_complaint: "Urinary tract infection with fever, possible pyelonephritis", chief_complaint_ar: "التهاب مسالك بولية مع حمى، احتمال التهاب حويضة", arrival_time: "08:25", wait_minutes: 18, status: "in_treatment", disposition: "treat_and_release", physician: "Dr. Lina Qasim", room: "Bay-9", bp: "118/76", hr: 98, spo2: 99, temp: 38.7 },
  { id: "ED011", mrn: "MRN-30011", name: "Turki Al-Mutairi", name_ar: "تركي المطيري", age: 67, gender: "M", esi: 2, chief_complaint: "GI bleed — hematemesis, melena, known peptic ulcer disease", chief_complaint_ar: "نزيف معدي معوي — قيء دموي، براز أسود، قرحة هضمية", arrival_time: "08:45", wait_minutes: 0, status: "in_treatment", disposition: "admit", physician: "Dr. Tariq Farouk", room: "Bay-4", bp: "96/58", hr: 122, spo2: 96, temp: 36.6 },
  { id: "ED012", mrn: "MRN-30012", name: "Wafa Al-Balushi", name_ar: "وفاء البلوشي", age: 22, gender: "F", esi: 4, chief_complaint: "Migraine — recurrent severe headache, photophobia, nausea", chief_complaint_ar: "صداع نصفي — صداع شديد متكرر، رهاب الضوء، غثيان", arrival_time: "09:00", wait_minutes: 65, status: "in_treatment", disposition: "treat_and_release", physician: "Dr. Lina Qasim", room: "Bay-10", bp: "115/72", hr: 78, spo2: 99, temp: 36.8 },
  { id: "ED013", mrn: "MRN-30013", name: "Fahad Al-Ruwaili", name_ar: "فهد الرويلي", age: 33, gender: "M", esi: 3, chief_complaint: "Asthma exacerbation — moderate, PEFR 55%, nebulized treatment underway", chief_complaint_ar: "نوبة ربو متوسطة، ذروة تدفق 55%، علاج استنشاقي جارٍ", arrival_time: "09:10", wait_minutes: 25, status: "in_treatment", disposition: "awaiting", physician: "Dr. Reem Al-Jabri", room: "Bay-11", bp: "128/82", hr: 104, spo2: 93, temp: 37.1 },
  { id: "ED014", mrn: "MRN-30014", name: "Dalal Al-Najdi", name_ar: "دلال النجدي", age: 51, gender: "F", esi: 2, chief_complaint: "Septic shock — fever 39.8, hypotension, altered consciousness, source unknown", chief_complaint_ar: "صدمة إنتانية — حمى 39.8، انخفاض ضغط، اضطراب وعي", arrival_time: "09:20", wait_minutes: 0, status: "in_treatment", disposition: "admit", physician: "Dr. Khalid Mansour", room: "Resus-3", bp: "82/48", hr: 134, spo2: 93, temp: 39.8 },
  { id: "ED015", mrn: "MRN-30015", name: "Hussain Al-Bakr", name_ar: "حسين البكر", age: 41, gender: "M", esi: 3, chief_complaint: "Renal colic — left flank pain, hematuria, stone on ultrasound", chief_complaint_ar: "مغص كلوي — ألم خاصرة يسار، بول دموي، حصى في الصدى", arrival_time: "09:35", wait_minutes: 45, status: "in_treatment", disposition: "treat_and_release", physician: "Dr. Tariq Farouk", room: "Bay-12", bp: "130/84", hr: 88, spo2: 99, temp: 37.0 },
  { id: "ED016", mrn: "MRN-30016", name: "Latifa Al-Mansouri", name_ar: "لطيفة المنصوري", age: 78, gender: "F", esi: 2, chief_complaint: "Fall and hip injury — right hip pain, unable to bear weight, ?NOF", chief_complaint_ar: "سقوط وإصابة ورك — ألم ورك أيمن، عدم القدرة على الوقوف", arrival_time: "09:40", wait_minutes: 12, status: "awaiting_results", disposition: "admit", physician: "Dr. Samer Khalil", room: "Xray-Bay", bp: "145/88", hr: 92, spo2: 97, temp: 36.7 },
  { id: "ED017", mrn: "MRN-30017", name: "Naif Al-Qahtani", name_ar: "نايف القحطاني", age: 19, gender: "M", esi: 4, chief_complaint: "Laceration — 4cm right forearm from glass, requires suturing", chief_complaint_ar: "جرح — 4 سم في الساعد الأيمن من الزجاج، يحتاج خياطة", arrival_time: "09:50", wait_minutes: 80, status: "awaiting_triage", disposition: "treat_and_release" },
  { id: "ED018", mrn: "MRN-30018", name: "Aisha Al-Najjar", name_ar: "عائشة النجار", age: 3, gender: "F", esi: 2, chief_complaint: "Paediatric ingestion — suspected medication ingestion, 3-year-old, drowsy", chief_complaint_ar: "ابتلاع دواء مشتبه به لطفلة 3 سنوات، نعاس", arrival_time: "10:00", wait_minutes: 5, status: "in_triage", disposition: "admit", physician: "Dr. Lina Qasim", room: "Paeds-Bay" },
  { id: "ED019", mrn: "MRN-30019", name: "Walid Al-Ghamdi", name_ar: "وليد الغامدي", age: 45, gender: "M", esi: 2, chief_complaint: "Boarding — admitted to Medical Ward A, awaiting bed", chief_complaint_ar: "انتظار قبول في الجناح الطبي أ", arrival_time: "06:00", wait_minutes: 270, status: "boarding", disposition: "admit", physician: "Dr. Khalid Mansour", room: "Boarding" },
  { id: "ED020", mrn: "MRN-30020", name: "Nura Al-Harbi", name_ar: "نورة الحربي", age: 62, gender: "F", esi: 3, chief_complaint: "Boarding — awaiting surgical ward bed post-admission", chief_complaint_ar: "انتظار سرير في الجناح الجراحي بعد القبول", arrival_time: "05:30", wait_minutes: 295, status: "boarding", disposition: "admit", physician: "Dr. Tariq Farouk", room: "Boarding" },
];

const ESI_COLORS: Record<ESILevel, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: "#1f0808", border: "#dc2626", text: "#fca5a5", label: "ESI-1 Resuscitation" },
  2: { bg: "#1f1008", border: "#f97316", text: "#fdba74", label: "ESI-2 Emergent" },
  3: { bg: "#1c1508", border: "#eab308", text: "#fde047", label: "ESI-3 Urgent" },
  4: { bg: "#082010", border: "#22c55e", text: "#86efac", label: "ESI-4 Less Urgent" },
  5: { bg: "#0a0a1a", border: "#3b82f6", text: "#93c5fd", label: "ESI-5 Non-Urgent" },
};

const STATUS_LABELS: Record<EDStatus, { en: string; ar: string; color: string }> = {
  awaiting_triage:   { en: "Awaiting Triage",   ar: "انتظار الفرز",      color: "#f59e0b" },
  in_triage:         { en: "In Triage",          ar: "قيد الفرز",         color: "#f97316" },
  in_treatment:      { en: "In Treatment",       ar: "تحت العلاج",        color: "#22D3EE" },
  awaiting_results:  { en: "Awaiting Results",   ar: "انتظار النتائج",    color: "#6366f1" },
  boarding:          { en: "Boarding",           ar: "انتظار سرير",       color: "#ef4444" },
  ready_dc:          { en: "Ready DC",           ar: "جاهز للخروج",       color: "#22c55e" },
};

const DISPOSITION_LABELS: Record<Disposition, { en: string; ar: string }> = {
  treat_and_release: { en: "Treat & Release", ar: "علاج وخروج" },
  admit:             { en: "Admit",            ar: "قبول" },
  discharge:         { en: "Discharge",        ar: "خروج" },
  transfer:          { en: "Transfer",         ar: "نقل" },
  awaiting:          { en: "Awaiting",         ar: "انتظار قرار" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmergencyPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [patients, setPatients] = useState<EDPatient[]>(MOCK_PATIENTS);
  const [loading, setLoading] = useState(false);
  const [filterESI, setFilterESI] = useState<ESILevel | "all">("all");
  const [filterStatus, setFilterStatus] = useState<EDStatus | "all">("all");
  const [selectedPatient, setSelectedPatient] = useState<EDPatient | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await apiFetch<EDPatient[]>("/api/v1/hospital/emergency/patients/");
        if (data && data.length > 0) setPatients(data);
      } catch {
        // silently use mock data
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  const metrics: EDMetrics = {
    total_patients: patients.length,
    awaiting_triage: patients.filter(p => p.status === "awaiting_triage" || p.status === "in_triage").length,
    in_treatment: patients.filter(p => p.status === "in_treatment" || p.status === "awaiting_results").length,
    boarding: patients.filter(p => p.status === "boarding").length,
    avg_wait_minutes: Math.round(patients.reduce((sum, p) => sum + p.wait_minutes, 0) / patients.length),
    esi1_count: patients.filter(p => p.esi === 1).length,
    esi2_count: patients.filter(p => p.esi === 2).length,
    esi3_count: patients.filter(p => p.esi === 3).length,
    esi4_count: patients.filter(p => p.esi === 4).length,
    esi5_count: patients.filter(p => p.esi === 5).length,
    treated_last_hour: 7,
  };

  let filtered = patients;
  if (filterESI !== "all") filtered = filtered.filter(p => p.esi === filterESI);
  if (filterStatus !== "all") filtered = filtered.filter(p => p.status === filterStatus);

  return (
    <div dir={dir} style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Emergency Department" : "قسم الطوارئ"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Live patient census, triage, and disposition tracking" : "جرد المرضى الفوري والفرز وتتبع الوجهة"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {metrics.boarding > 0 && (
            <div style={{ background: "#1f0a0a", border: "2px solid #ef4444", borderRadius: "8px", padding: "0.4rem 0.875rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444" }}>⚠ {metrics.boarding} {lang === "en" ? "Boarding" : "انتظار"}</span>
            </div>
          )}
          {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Syncing...</span>}
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <a href="/hospital" style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid #22D3EE", color: "#22D3EE", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
          ← {lang === "en" ? "Hospital Portal" : "بوابة المستشفى"}
        </a>
        {[
          { href: "/hospital/adt", label: lang === "en" ? "ADT" : "القبول والخروج" },
          { href: "/hospital/beds", label: lang === "en" ? "Bed Management" : "إدارة الأسرة" },
          { href: "/hospital/icu", label: lang === "en" ? "ICU" : "العناية المركزة" },
          { href: "/hospital/operating-room", label: lang === "en" ? "Operating Room" : "غرفة العمليات" },
          { href: "/hospital/command-center", label: lang === "en" ? "Command Center" : "مركز القيادة" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Total Patients" : "إجمالي المرضى", value: metrics.total_patients, color: "#22D3EE" },
          { label: lang === "en" ? "Awaiting Triage" : "انتظار الفرز", value: metrics.awaiting_triage, color: "#f59e0b" },
          { label: lang === "en" ? "In Treatment" : "تحت العلاج", value: metrics.in_treatment, color: "#22c55e" },
          { label: lang === "en" ? "Boarding" : "انتظار سرير", value: metrics.boarding, color: "#ef4444" },
          { label: lang === "en" ? "Avg Wait (min)" : "متوسط الانتظار (دقيقة)", value: metrics.avg_wait_minutes, color: "#6366f1" },
          { label: lang === "en" ? "Treated/Hour" : "علاج/الساعة", value: metrics.treated_last_hour, color: "#22c55e" },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--color-surface)", border: `1px solid ${card.color}44`, borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.25rem", fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* ESI Level Summary */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "1rem" }}>
          {lang === "en" ? "ESI Triage Level Distribution" : "توزيع مستويات الفرز"}
        </h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {([1, 2, 3, 4, 5] as ESILevel[]).map(level => {
            const esi = ESI_COLORS[level];
            const count = [metrics.esi1_count, metrics.esi2_count, metrics.esi3_count, metrics.esi4_count, metrics.esi5_count][level - 1];
            return (
              <div key={level} style={{ background: esi.bg, border: `2px solid ${esi.border}`, borderRadius: "10px", padding: "0.75rem 1.25rem", textAlign: "center", minWidth: "110px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: esi.text }}>{count}</div>
                <div style={{ fontSize: "0.7rem", color: esi.text, opacity: 0.85, fontWeight: 600, marginTop: "2px" }}>
                  {lang === "en" ? esi.label : `مستوى ${level}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)", alignSelf: "center" }}>ESI:</span>
          {(["all", 1, 2, 3, 4, 5] as (ESILevel | "all")[]).map(e => (
            <button key={e} onClick={() => setFilterESI(e)} style={{ padding: "0.3rem 0.75rem", borderRadius: "20px", border: filterESI === e ? "2px solid #22D3EE" : "1px solid var(--color-border)", background: filterESI === e ? "#22D3EE22" : "var(--color-surface)", color: filterESI === e ? "#22D3EE" : "var(--color-text-muted)", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
              {e === "all" ? (lang === "en" ? "All" : "الكل") : `ESI ${e}`}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)", alignSelf: "center" }}>{lang === "en" ? "Status:" : "الحالة:"}</span>
          {(["all", "awaiting_triage", "in_treatment", "boarding"] as (EDStatus | "all")[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "0.3rem 0.75rem", borderRadius: "20px", border: filterStatus === s ? "2px solid #22D3EE" : "1px solid var(--color-border)", background: filterStatus === s ? "#22D3EE22" : "var(--color-surface)", color: filterStatus === s ? "#22D3EE" : "var(--color-text-muted)", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
              {s === "all" ? (lang === "en" ? "All" : "الكل") : STATUS_LABELS[s]?.[lang] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "950px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "ESI" : "المستوى",
                lang === "en" ? "Patient" : "المريض",
                lang === "en" ? "Age/Sex" : "العمر/الجنس",
                lang === "en" ? "Chief Complaint" : "الشكوى الرئيسية",
                lang === "en" ? "Arrival" : "الوصول",
                lang === "en" ? "Wait" : "الانتظار",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Room" : "الغرفة",
                lang === "en" ? "Vitals" : "العلامات الحيوية",
                lang === "en" ? "Disposition" : "الوجهة",
              ].map(h => (
                <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const esi = ESI_COLORS[p.esi];
              const stl = STATUS_LABELS[p.status];
              const disp = DISPOSITION_LABELS[p.disposition];
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPatient(selectedPatient?.id === p.id ? null : p)}
                  style={{ borderBottom: "1px solid var(--color-border)", background: selectedPatient?.id === p.id ? "#22D3EE11" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", cursor: "pointer" }}
                >
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ background: esi.bg, border: `2px solid ${esi.border}`, borderRadius: "6px", padding: "0.2rem 0.5rem", textAlign: "center", display: "inline-block", minWidth: "44px" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: esi.text }}>ESI {p.esi}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.875rem" }}>{lang === "ar" ? p.name_ar : p.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{p.mrn}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--color-text)", whiteSpace: "nowrap" }}>
                    {p.age}y {p.gender === "M" ? (lang === "en" ? "M" : "ذ") : (lang === "en" ? "F" : "أ")}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)", maxWidth: "220px" }}>
                    {lang === "ar" ? p.chief_complaint_ar : p.chief_complaint}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--color-text)", whiteSpace: "nowrap" }}>{p.arrival_time}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 700, color: p.wait_minutes > 120 ? "#ef4444" : p.wait_minutes > 60 ? "#f59e0b" : "#22c55e", whiteSpace: "nowrap" }}>
                    {p.wait_minutes > 0 ? `${p.wait_minutes}m` : "<1m"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, background: stl.color + "22", color: stl.color, whiteSpace: "nowrap" }}>
                      {stl[lang]}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#22D3EE", fontWeight: 600 }}>{p.room ?? "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {p.bp ? (
                      <div>
                        <div>BP: <span style={{ color: p.hr && p.hr > 110 ? "#f59e0b" : "var(--color-text)" }}>{p.bp}</span></div>
                        <div>HR: <span style={{ color: p.hr && p.hr > 110 ? "#f59e0b" : "var(--color-text)" }}>{p.hr}</span></div>
                        {p.spo2 && <div>SpO2: <span style={{ color: p.spo2 < 94 ? "#ef4444" : "var(--color-text)" }}>{p.spo2}%</span></div>}
                      </div>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {disp[lang]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Patient Detail Panel */}
      {selectedPatient && (
        <div style={{ marginTop: "1.5rem", background: "var(--color-surface)", border: `2px solid ${ESI_COLORS[selectedPatient.esi].border}`, borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)", margin: "0 0 0.25rem 0" }}>
                {lang === "ar" ? selectedPatient.name_ar : selectedPatient.name} — {selectedPatient.mrn}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>
                {lang === "ar" ? selectedPatient.chief_complaint_ar : selectedPatient.chief_complaint}
              </p>
            </div>
            <button onClick={() => setSelectedPatient(null)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.5rem", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            {selectedPatient.bp && [
              { label: "BP", value: selectedPatient.bp },
              { label: "HR", value: `${selectedPatient.hr} bpm` },
              { label: "SpO2", value: `${selectedPatient.spo2}%` },
              { label: lang === "en" ? "Temp" : "الحرارة", value: `${selectedPatient.temp}°C` },
              { label: lang === "en" ? "Room" : "الغرفة", value: selectedPatient.room ?? "—" },
              { label: lang === "en" ? "Physician" : "الطبيب", value: selectedPatient.physician ?? "—" },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>{item.label}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <a href="/hospital/adt" style={{ padding: "0.5rem 1.25rem", background: "#22D3EE", color: "#0f172a", borderRadius: "8px", fontWeight: 700, fontSize: "0.83rem", textDecoration: "none" }}>
              {lang === "en" ? "Admit to Ward" : "قبول في الجناح"}
            </a>
            <a href="/hospital/beds" style={{ padding: "0.5rem 1.25rem", background: "rgba(34,211,238,0.12)", border: "1px solid #22D3EE", color: "#22D3EE", borderRadius: "8px", fontWeight: 700, fontSize: "0.83rem", textDecoration: "none" }}>
              {lang === "en" ? "Find Bed" : "البحث عن سرير"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
