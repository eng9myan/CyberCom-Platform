"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Patient {
  mrn: string;
  name: string;
  name_ar: string;
  age: number;
  gender: "M" | "F";
  diagnosis: string;
  diagnosis_ar: string;
  last_visit: string;
  next_appointment: string;
  risk: "low" | "medium" | "high";
}

const PATIENTS: Patient[] = [
  { mrn: "MRN-001", name: "Ahmad Al-Rashidi", name_ar: "أحمد الراشدي", age: 52, gender: "M", diagnosis: "Type 2 Diabetes", diagnosis_ar: "السكري من النوع الثاني", last_visit: "2026-06-10", next_appointment: "2026-07-10", risk: "high" },
  { mrn: "MRN-002", name: "Mariam Al-Harbi", name_ar: "مريم الحربي", age: 38, gender: "F", diagnosis: "Hypertension", diagnosis_ar: "ارتفاع ضغط الدم", last_visit: "2026-06-15", next_appointment: "2026-07-15", risk: "medium" },
  { mrn: "MRN-003", name: "Khalid Al-Zahrani", name_ar: "خالد الزهراني", age: 65, gender: "M", diagnosis: "Coronary Artery Disease", diagnosis_ar: "مرض الشريان التاجي", last_visit: "2026-06-01", next_appointment: "2026-06-30", risk: "high" },
  { mrn: "MRN-004", name: "Fatima Al-Ghamdi", name_ar: "فاطمة الغامدي", age: 29, gender: "F", diagnosis: "Asthma", diagnosis_ar: "الربو", last_visit: "2026-06-20", next_appointment: "2026-08-20", risk: "low" },
  { mrn: "MRN-005", name: "Omar Al-Qahtani", name_ar: "عمر القحطاني", age: 47, gender: "M", diagnosis: "Chronic Kidney Disease", diagnosis_ar: "مرض الكلى المزمن", last_visit: "2026-06-05", next_appointment: "2026-07-05", risk: "high" },
  { mrn: "MRN-006", name: "Noura Al-Shehri", name_ar: "نورة الشهري", age: 34, gender: "F", diagnosis: "Hypothyroidism", diagnosis_ar: "قصور الغدة الدرقية", last_visit: "2026-06-18", next_appointment: "2026-09-18", risk: "low" },
  { mrn: "MRN-007", name: "Abdulaziz Al-Dossari", name_ar: "عبدالعزيز الدوسري", age: 71, gender: "M", diagnosis: "COPD", diagnosis_ar: "مرض الانسداد الرئوي المزمن", last_visit: "2026-06-12", next_appointment: "2026-07-12", risk: "high" },
  { mrn: "MRN-008", name: "Sara Al-Mutairi", name_ar: "سارة المطيري", age: 42, gender: "F", diagnosis: "Rheumatoid Arthritis", diagnosis_ar: "التهاب المفاصل الروماتويدي", last_visit: "2026-06-08", next_appointment: "2026-07-08", risk: "medium" },
  { mrn: "MRN-009", name: "Majed Al-Otaibi", name_ar: "ماجد العتيبي", age: 58, gender: "M", diagnosis: "Heart Failure", diagnosis_ar: "فشل القلب", last_visit: "2026-06-03", next_appointment: "2026-07-03", risk: "high" },
  { mrn: "MRN-010", name: "Hessa Al-Anazi", name_ar: "حصة العنزي", age: 26, gender: "F", diagnosis: "Iron Deficiency Anemia", diagnosis_ar: "فقر الدم بنقص الحديد", last_visit: "2026-06-22", next_appointment: "2026-08-22", risk: "low" },
  { mrn: "MRN-011", name: "Saud Al-Bishi", name_ar: "سعود البيشي", age: 63, gender: "M", diagnosis: "Atrial Fibrillation", diagnosis_ar: "الرجفان الأذيني", last_visit: "2026-06-14", next_appointment: "2026-07-14", risk: "medium" },
  { mrn: "MRN-012", name: "Reem Al-Maliki", name_ar: "ريم المالكي", age: 31, gender: "F", diagnosis: "Migraine", diagnosis_ar: "الصداع النصفي", last_visit: "2026-06-19", next_appointment: "2026-08-19", risk: "low" },
  { mrn: "MRN-013", name: "Turki Al-Fahad", name_ar: "تركي الفهد", age: 55, gender: "M", diagnosis: "Type 2 Diabetes + HTN", diagnosis_ar: "سكري + ضغط دم", last_visit: "2026-06-07", next_appointment: "2026-07-07", risk: "high" },
  { mrn: "MRN-014", name: "Manal Al-Sulami", name_ar: "منال السلمي", age: 44, gender: "F", diagnosis: "Osteoporosis", diagnosis_ar: "هشاشة العظام", last_visit: "2026-06-16", next_appointment: "2026-09-16", risk: "low" },
  { mrn: "MRN-015", name: "Faisal Al-Jabri", name_ar: "فيصل الجابري", age: 67, gender: "M", diagnosis: "Parkinson's Disease", diagnosis_ar: "مرض باركنسون", last_visit: "2026-06-09", next_appointment: "2026-07-09", risk: "high" },
  { mrn: "MRN-016", name: "Dalal Al-Subhi", name_ar: "دلال الصبحي", age: 37, gender: "F", diagnosis: "Lupus (SLE)", diagnosis_ar: "الذئبة الحمامية", last_visit: "2026-06-11", next_appointment: "2026-07-11", risk: "medium" },
  { mrn: "MRN-017", name: "Nasser Al-Ruwaili", name_ar: "ناصر الرويلي", age: 49, gender: "M", diagnosis: "Peptic Ulcer Disease", diagnosis_ar: "قرحة المعدة", last_visit: "2026-06-17", next_appointment: "2026-08-17", risk: "low" },
  { mrn: "MRN-018", name: "Lujain Al-Shamrani", name_ar: "لجين الشمراني", age: 22, gender: "F", diagnosis: "PCOS", diagnosis_ar: "متلازمة المبيض المتعدد الكيسات", last_visit: "2026-06-21", next_appointment: "2026-09-21", risk: "low" },
  { mrn: "MRN-019", name: "Waleed Al-Subaie", name_ar: "وليد السبيعي", age: 60, gender: "M", diagnosis: "Prostate Cancer (Stage II)", diagnosis_ar: "سرطان البروستاتا (مرحلة ثانية)", last_visit: "2026-06-04", next_appointment: "2026-07-04", risk: "high" },
  { mrn: "MRN-020", name: "Abeer Al-Nasser", name_ar: "عبير الناصر", age: 53, gender: "F", diagnosis: "Breast Cancer (Remission)", diagnosis_ar: "سرطان الثدي (هدأة)", last_visit: "2026-06-06", next_appointment: "2026-07-06", risk: "medium" },
];

const RISK_COLORS: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const RISK_BG: Record<string, string> = { high: "rgba(239,68,68,0.12)", medium: "rgba(245,158,11,0.12)", low: "rgba(34,197,94,0.12)" };

export default function ProviderPatients() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchPatients() {
      try {
        const data = await apiFetch<Patient[]>("/api/v1/provider-portal/patients/");
        if (data && Array.isArray(data) && data.length > 0) setPatients(data);
      } catch (err) {
        console.warn("Provider patients API unavailable, using mock data:", err);
      }
    }
    void fetchPatients();
  }, []);

  const filtered = patients.filter(p => {
    const matchRisk = riskFilter === "all" || p.risk === riskFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch = !term || p.name.toLowerCase().includes(term) || p.name_ar.includes(term) || p.mrn.toLowerCase().includes(term) || p.diagnosis.toLowerCase().includes(term);
    return matchRisk && matchSearch;
  });

  const riskCount = (level: string) => patients.filter(p => p.risk === level).length;

  const t = {
    title: lang === "en" ? "My Patient Panel" : "قائمة مرضاي",
    subtitle: lang === "en" ? "Active panel — patient list & quick actions" : "اللوحة النشطة — قائمة المرضى والإجراءات السريعة",
    back: lang === "en" ? "← Provider Portal" : "→ بوابة الطبيب",
    total: lang === "en" ? "Total Patients" : "إجمالي المرضى",
    highRisk: lang === "en" ? "High Risk" : "خطر عالٍ",
    medRisk: lang === "en" ? "Medium Risk" : "خطر متوسط",
    lowRisk: lang === "en" ? "Low Risk" : "خطر منخفض",
    search: lang === "en" ? "Search by name, MRN, or diagnosis…" : "ابحث بالاسم أو رقم السجل أو التشخيص…",
    all: lang === "en" ? "All" : "الكل",
    high: lang === "en" ? "High Risk" : "عالي",
    medium: lang === "en" ? "Medium Risk" : "متوسط",
    low: lang === "en" ? "Low Risk" : "منخفض",
    mrn: "MRN",
    name: lang === "en" ? "Name" : "الاسم",
    age: lang === "en" ? "Age" : "العمر",
    gender: lang === "en" ? "Gender" : "الجنس",
    diagnosis: lang === "en" ? "Diagnosis" : "التشخيص",
    lastVisit: lang === "en" ? "Last Visit" : "آخر زيارة",
    nextAppt: lang === "en" ? "Next Appt" : "الموعد القادم",
    risk: lang === "en" ? "Risk" : "المخاطرة",
    actions: lang === "en" ? "Actions" : "الإجراءات",
    viewRecord: lang === "en" ? "View" : "عرض",
    schedule: lang === "en" ? "Schedule" : "موعد",
    message: lang === "en" ? "Message" : "رسالة",
    noResults: lang === "en" ? "No patients match the current filters." : "لا يوجد مرضى يطابقون الفلتر الحالي.",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1300px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <a href="/provider-portal" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none", display: "inline-block", marginBottom: "0.5rem" }}>{t.back}</a>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>{t.title}</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500, whiteSpace: "nowrap" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: t.total, value: patients.length, color: "#22D3EE" },
          { label: t.highRisk, value: riskCount("high"), color: "#ef4444" },
          { label: t.medRisk, value: riskCount("medium"), color: "#f59e0b" },
          { label: t.lowRisk, value: riskCount("low"), color: "#22c55e" },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", fontWeight: 500 }}>{card.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: card.color, marginTop: "0.25rem" }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder={t.search}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: "240px", padding: "0.625rem 1rem", border: "1px solid var(--color-border)", borderRadius: "8px", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", outline: "none" }}
        />
        {["all", "high", "medium", "low"].map(level => (
          <button key={level} onClick={() => setRiskFilter(level)} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: `1px solid ${riskFilter === level ? "#22D3EE" : "var(--color-border)"}`, background: riskFilter === level ? "rgba(34,211,238,0.1)" : "var(--color-surface)", color: riskFilter === level ? "#22D3EE" : "var(--color-text)", fontSize: "0.875rem", cursor: "pointer", fontWeight: riskFilter === level ? 600 : 400 }}>
            {level === "all" ? t.all : level === "high" ? t.high : level === "medium" ? t.medium : t.low}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(34,211,238,0.05)", borderBottom: "1px solid var(--color-border)" }}>
                {[t.mrn, t.name, t.age, t.gender, t.diagnosis, t.lastVisit, t.nextAppt, t.risk, t.actions].map(h => (
                  <th key={h} style={{ padding: "0.875rem 1rem", textAlign: lang === "ar" ? "right" : "left", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>{t.noResults}</td></tr>
              ) : filtered.map(p => (
                <tr key={p.mrn} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.875rem 1rem", fontFamily: "monospace", color: "#22D3EE", fontWeight: 600 }}>{p.mrn}</td>
                  <td style={{ padding: "0.875rem 1rem", fontWeight: 600 }}>{lang === "en" ? p.name : p.name_ar}</td>
                  <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)" }}>{p.age}</td>
                  <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)" }}>{lang === "en" ? p.gender : p.gender === "M" ? "ذكر" : "أنثى"}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>{lang === "en" ? p.diagnosis : p.diagnosis_ar}</td>
                  <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)" }}>{p.last_visit}</td>
                  <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)" }}>{p.next_appointment}</td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, background: RISK_BG[p.risk], color: RISK_COLORS[p.risk], textTransform: "uppercase" }}>
                      {lang === "en" ? p.risk : p.risk === "high" ? "عالٍ" : p.risk === "medium" ? "متوسط" : "منخفض"}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {[t.viewRecord, t.schedule, t.message].map(action => (
                        <button key={action} style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
          {lang === "en" ? `Showing ${filtered.length} of ${patients.length} patients` : `عرض ${filtered.length} من أصل ${patients.length} مريض`}
        </div>
      </div>
    </div>
  );
}
