"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type ResultType = "lab" | "imaging";
type ResultStatus = "unread" | "read" | "acknowledged";

interface LabResult {
  id: string;
  type: ResultType;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  test_name: string;
  test_name_ar: string;
  value: string;
  unit: string;
  reference_range: string;
  flag: "normal" | "high" | "low" | "critical-high" | "critical-low";
  resulted_at: string;
  status: ResultStatus;
  ordered_by: string;
}

interface TrendEntry {
  date: string;
  value: string;
  flag: string;
}

interface TrendData {
  test: string;
  patient: string;
  unit: string;
  entries: TrendEntry[];
}

const RESULTS: LabResult[] = [
  { id: "RES-001", type: "lab", patient_name: "Ahmad Al-Rashidi", patient_name_ar: "أحمد الراشدي", mrn: "MRN-001", test_name: "HbA1c", test_name_ar: "هيموجلوبين سكري", value: "9.8", unit: "%", reference_range: "< 7.0%", flag: "critical-high", resulted_at: "2026-06-30 07:30", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-002", type: "lab", patient_name: "Ahmad Al-Rashidi", patient_name_ar: "أحمد الراشدي", mrn: "MRN-001", test_name: "Potassium", test_name_ar: "بوتاسيوم", value: "6.2", unit: "mmol/L", reference_range: "3.5–5.0 mmol/L", flag: "critical-high", resulted_at: "2026-06-30 07:31", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-003", type: "lab", patient_name: "Khalid Al-Zahrani", patient_name_ar: "خالد الزهراني", mrn: "MRN-003", test_name: "Troponin I", test_name_ar: "تروبونين I", value: "2.14", unit: "ng/mL", reference_range: "< 0.04 ng/mL", flag: "critical-high", resulted_at: "2026-06-30 08:00", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-004", type: "imaging", patient_name: "Khalid Al-Zahrani", patient_name_ar: "خالد الزهراني", mrn: "MRN-003", test_name: "Chest CT", test_name_ar: "أشعة مقطعية صدر", value: "Bilateral pleural effusion, moderate", unit: "", reference_range: "Normal lung fields", flag: "high", resulted_at: "2026-06-30 09:15", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-005", type: "lab", patient_name: "Omar Al-Qahtani", patient_name_ar: "عمر القحطاني", mrn: "MRN-005", test_name: "Creatinine", test_name_ar: "كرياتينين", value: "3.2", unit: "mg/dL", reference_range: "0.7–1.2 mg/dL", flag: "critical-high", resulted_at: "2026-06-30 08:45", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-006", type: "lab", patient_name: "Omar Al-Qahtani", patient_name_ar: "عمر القحطاني", mrn: "MRN-005", test_name: "eGFR", test_name_ar: "معدل الترشيح الكبيبي", value: "22", unit: "mL/min/1.73m²", reference_range: "> 60", flag: "critical-low", resulted_at: "2026-06-30 08:46", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-007", type: "lab", patient_name: "Fatima Al-Ghamdi", patient_name_ar: "فاطمة الغامدي", mrn: "MRN-004", test_name: "CBC — WBC", test_name_ar: "صورة دم — كريات بيضاء", value: "7.8", unit: "×10³/µL", reference_range: "4.5–11.0 ×10³/µL", flag: "normal", resulted_at: "2026-06-30 09:00", status: "read", ordered_by: "Dr. Hassan" },
  { id: "RES-008", type: "lab", patient_name: "Fatima Al-Ghamdi", patient_name_ar: "فاطمة الغامدي", mrn: "MRN-004", test_name: "FEV1/FVC (Spirometry)", test_name_ar: "قياس وظائف الرئة", value: "68", unit: "%", reference_range: "> 70%", flag: "low", resulted_at: "2026-06-30 09:05", status: "read", ordered_by: "Dr. Hassan" },
  { id: "RES-009", type: "lab", patient_name: "Abdulaziz Al-Dossari", patient_name_ar: "عبدالعزيز الدوسري", mrn: "MRN-007", test_name: "ABG — PaO2", test_name_ar: "ضغط الأكسجين الشرياني", value: "54", unit: "mmHg", reference_range: "75–100 mmHg", flag: "critical-low", resulted_at: "2026-06-30 09:30", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-010", type: "imaging", patient_name: "Majed Al-Otaibi", patient_name_ar: "ماجد العتيبي", mrn: "MRN-009", test_name: "Echocardiogram", test_name_ar: "صدى القلب", value: "LVEF 28% (Severely reduced), Dilated cardiomyopathy", unit: "", reference_range: "LVEF ≥ 55%", flag: "critical-low", resulted_at: "2026-06-30 10:00", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-011", type: "lab", patient_name: "Waleed Al-Subaie", patient_name_ar: "وليد السبيعي", mrn: "MRN-019", test_name: "PSA Total", test_name_ar: "PSA كلي", value: "12.4", unit: "ng/mL", reference_range: "< 4.0 ng/mL", flag: "high", resulted_at: "2026-06-30 10:15", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-012", type: "lab", patient_name: "Hessa Al-Anazi", patient_name_ar: "حصة العنزي", mrn: "MRN-010", test_name: "Ferritin", test_name_ar: "فيريتين", value: "4", unit: "ng/mL", reference_range: "12–150 ng/mL", flag: "critical-low", resulted_at: "2026-06-30 10:30", status: "read", ordered_by: "Dr. Hassan" },
  { id: "RES-013", type: "lab", patient_name: "Mariam Al-Harbi", patient_name_ar: "مريم الحربي", mrn: "MRN-002", test_name: "Total Cholesterol", test_name_ar: "الكوليسترول الكلي", value: "218", unit: "mg/dL", reference_range: "< 200 mg/dL", flag: "high", resulted_at: "2026-06-30 10:45", status: "read", ordered_by: "Dr. Hassan" },
  { id: "RES-014", type: "imaging", patient_name: "Abeer Al-Nasser", patient_name_ar: "عبير الناصر", mrn: "MRN-020", test_name: "Breast MRI", test_name_ar: "رنين مغناطيسي ثدي", value: "No evidence of recurrence. BI-RADS 2", unit: "", reference_range: "BI-RADS 1-2 (Normal/Benign)", flag: "normal", resulted_at: "2026-06-30 11:00", status: "acknowledged", ordered_by: "Dr. Hassan" },
  { id: "RES-015", type: "imaging", patient_name: "Noura Al-Shehri", patient_name_ar: "نورة الشهري", mrn: "MRN-006", test_name: "Thyroid Ultrasound", test_name_ar: "سونار الغدة الدرقية", value: "Multinodular goiter, largest nodule 1.2cm, TI-RADS 3", unit: "", reference_range: "Homogeneous thyroid, TI-RADS 1", flag: "high", resulted_at: "2026-06-30 11:15", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-016", type: "lab", patient_name: "Saud Al-Bishi", patient_name_ar: "سعود البيشي", mrn: "MRN-011", test_name: "INR", test_name_ar: "النسبة الدولية المعيارية", value: "3.8", unit: "", reference_range: "2.0–3.0 (therapeutic)", flag: "high", resulted_at: "2026-06-30 11:30", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-017", type: "lab", patient_name: "Turki Al-Fahad", patient_name_ar: "تركي الفهد", mrn: "MRN-013", test_name: "Fasting Glucose", test_name_ar: "سكر الصيام", value: "186", unit: "mg/dL", reference_range: "70–100 mg/dL", flag: "high", resulted_at: "2026-06-30 11:45", status: "read", ordered_by: "Dr. Hassan" },
  { id: "RES-018", type: "lab", patient_name: "Dalal Al-Subhi", patient_name_ar: "دلال الصبحي", mrn: "MRN-016", test_name: "Anti-dsDNA", test_name_ar: "أجسام مضادة للحمض النووي", value: "1:640", unit: "titer", reference_range: "< 1:10", flag: "critical-high", resulted_at: "2026-06-30 12:00", status: "unread", ordered_by: "Dr. Hassan" },
  { id: "RES-019", type: "lab", patient_name: "Sara Al-Mutairi", patient_name_ar: "سارة المطيري", mrn: "MRN-008", test_name: "CRP (hs)", test_name_ar: "بروتين سي التفاعلي", value: "48.2", unit: "mg/L", reference_range: "< 3.0 mg/L", flag: "high", resulted_at: "2026-06-30 12:15", status: "read", ordered_by: "Dr. Hassan" },
  { id: "RES-020", type: "lab", patient_name: "Manal Al-Sulami", patient_name_ar: "منال السلمي", mrn: "MRN-014", test_name: "DEXA — Lumbar Spine T-score", test_name_ar: "DEXA — نتيجة العمود الفقري", value: "-2.8", unit: "T-score", reference_range: "≥ -1.0", flag: "critical-low", resulted_at: "2026-06-30 12:30", status: "acknowledged", ordered_by: "Dr. Hassan" },
];

const TREND_DATA: TrendData = {
  test: "HbA1c",
  patient: "Ahmad Al-Rashidi (MRN-001)",
  unit: "%",
  entries: [
    { date: "2025-06-30", value: "7.4", flag: "high" },
    { date: "2025-09-30", value: "7.9", flag: "high" },
    { date: "2025-12-31", value: "8.3", flag: "high" },
    { date: "2026-03-31", value: "9.1", flag: "high" },
    { date: "2026-06-30", value: "9.8", flag: "critical-high" },
  ],
};

const FLAG_COLOR: Record<string, string> = { normal: "#22c55e", high: "#f59e0b", low: "#f59e0b", "critical-high": "#ef4444", "critical-low": "#ef4444" };
const FLAG_BG: Record<string, string> = { normal: "rgba(34,197,94,0.1)", high: "rgba(245,158,11,0.1)", low: "rgba(245,158,11,0.1)", "critical-high": "rgba(239,68,68,0.12)", "critical-low": "rgba(239,68,68,0.12)" };

export default function ProviderResults() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [results, setResults] = useState<LabResult[]>(RESULTS);
  const [typeFilter, setTypeFilter] = useState<"all" | ResultType>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const data = await apiFetch<LabResult[]>("/api/v1/provider-portal/results/");
        if (data && Array.isArray(data) && data.length > 0) setResults(data);
      } catch (err) {
        console.warn("Provider results API unavailable, using mock data:", err);
      }
    }
    void fetchResults();
  }, []);

  const unreadCount = results.filter(r => r.status === "unread").length;
  const criticalCount = results.filter(r => r.flag === "critical-high" || r.flag === "critical-low").length;

  const filtered = results.filter(r => {
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchUnread = !showUnreadOnly || r.status === "unread";
    return matchType && matchUnread;
  });

  const acknowledgeResult = (id: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, status: "acknowledged" as ResultStatus } : r));
  };

  const markRead = (id: string) => {
    setResults(prev => prev.map(r => r.id === id && r.status === "unread" ? { ...r, status: "read" as ResultStatus } : r));
  };

  const isCritical = (flag: string) => flag === "critical-high" || flag === "critical-low";

  return (
    <div style={{ padding: "2rem", maxWidth: "1300px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <a href="/provider-portal" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none", display: "inline-block", marginBottom: "0.5rem" }}>
            {lang === "en" ? "← Provider Portal" : "→ بوابة الطبيب"}
          </a>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#22D3EE", margin: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {lang === "en" ? "Results Inbox" : "صندوق النتائج"}
            {unreadCount > 0 && (
              <span style={{ fontSize: "1rem", fontWeight: 700, background: "#ef4444", color: "#fff", borderRadius: "999px", padding: "0.15rem 0.6rem" }}>{unreadCount}</span>
            )}
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {lang === "en" ? "Lab and imaging results — critical values require acknowledgment" : "نتائج المختبر والأشعة — القيم الحرجة تتطلب الإقرار"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => setShowTrend(v => !v)} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid #22D3EE", cursor: "pointer", background: showTrend ? "rgba(34,211,238,0.1)" : "transparent", color: "#22D3EE", fontSize: "0.875rem", fontWeight: 600 }}>
            {lang === "en" ? "Trend View" : "عرض الاتجاه"}
          </button>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: lang === "en" ? "Total Results" : "إجمالي النتائج", value: results.length, color: "#22D3EE" },
          { label: lang === "en" ? "Unread" : "غير مقروءة", value: unreadCount, color: "#f59e0b" },
          { label: lang === "en" ? "Critical" : "حرجة", value: criticalCount, color: "#ef4444" },
          { label: lang === "en" ? "Acknowledged" : "تم الإقرار", value: results.filter(r => r.status === "acknowledged").length, color: "#22c55e" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: c.color, marginTop: "0.25rem" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Trend Table */}
      {showTrend && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600 }}>
            {lang === "en" ? `Trend: ${TREND_DATA.test} — ${TREND_DATA.patient}` : `الاتجاه: ${TREND_DATA.test} — ${TREND_DATA.patient}`}
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 600 }}>{lang === "en" ? "Date" : "التاريخ"}</th>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 600 }}>{lang === "en" ? `Value (${TREND_DATA.unit})` : `القيمة (${TREND_DATA.unit})`}</th>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 600 }}>{lang === "en" ? "Flag" : "التصنيف"}</th>
                <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 600 }}>{lang === "en" ? "Trend" : "الاتجاه"}</th>
              </tr>
            </thead>
            <tbody>
              {TREND_DATA.entries.map((entry, idx) => {
                const prev = idx > 0 ? parseFloat(TREND_DATA.entries[idx - 1]?.value ?? "0") : null;
                const curr = parseFloat(entry.value);
                const arrow = prev === null ? "—" : curr > prev ? "↑" : curr < prev ? "↓" : "→";
                const arrowColor = curr > (prev ?? curr) ? "#ef4444" : curr < (prev ?? curr) ? "#22c55e" : "var(--color-text-muted)";
                return (
                  <tr key={entry.date} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem", fontFamily: "monospace" }}>{entry.date}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: FLAG_COLOR[entry.flag] }}>{entry.value}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, background: FLAG_BG[entry.flag], color: FLAG_COLOR[entry.flag], textTransform: "capitalize" }}>{entry.flag.replace("-", " ")}</span>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "1.125rem", fontWeight: 700, color: arrowColor }}>{arrow}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        {(["all", "lab", "imaging"] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: `1px solid ${typeFilter === t ? "#22D3EE" : "var(--color-border)"}`, background: typeFilter === t ? "rgba(34,211,238,0.1)" : "var(--color-surface)", color: typeFilter === t ? "#22D3EE" : "var(--color-text)", fontSize: "0.875rem", cursor: "pointer", fontWeight: typeFilter === t ? 600 : 400 }}>
            {lang === "en" ? (t === "all" ? "All Types" : t === "lab" ? "Lab" : "Imaging") : t === "all" ? "جميع الأنواع" : t === "lab" ? "مختبر" : "أشعة"}
          </button>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-text)" }}>
          <input type="checkbox" checked={showUnreadOnly} onChange={e => setShowUnreadOnly(e.target.checked)} />
          {lang === "en" ? "Unread only" : "غير مقروءة فقط"}
        </label>
      </div>

      {/* Results Table */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map(r => (
          <div key={r.id} style={{ background: "var(--color-surface)", border: `1px solid ${isCritical(r.flag) ? "#ef4444" : "var(--color-border)"}`, borderRadius: "12px", padding: "1rem 1.25rem", boxShadow: isCritical(r.flag) ? "0 0 0 1px rgba(239,68,68,0.25)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem" }}>
                  {isCritical(r.flag) && (
                    <span style={{ background: "#ef4444", color: "#fff", fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {lang === "en" ? "CRITICAL" : "حرج"}
                    </span>
                  )}
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>{lang === "en" ? r.test_name : r.test_name_ar}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "var(--color-background)", border: "1px solid var(--color-border)" }}>
                    {r.type === "lab" ? (lang === "en" ? "Lab" : "مختبر") : (lang === "en" ? "Imaging" : "أشعة")}
                  </span>
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  {lang === "en" ? r.patient_name : r.patient_name_ar} · {r.mrn} · {r.resulted_at}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: FLAG_COLOR[r.flag] }}>
                    {r.value} <span style={{ fontSize: "0.875rem", fontWeight: 400 }}>{r.unit}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Ref: " : "مرجع: "}{r.reference_range}</div>
                </div>
                <span style={{ padding: "0.25rem 0.625rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, background: FLAG_BG[r.flag], color: FLAG_COLOR[r.flag], textTransform: "capitalize", whiteSpace: "nowrap" }}>
                  {r.flag.replace("-", " ")}
                </span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {r.status === "unread" && (
                    <button onClick={() => markRead(r.id)} style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", cursor: "pointer" }}>
                      {lang === "en" ? "Mark Read" : "تعليم مقروء"}
                    </button>
                  )}
                  {(isCritical(r.flag) && r.status !== "acknowledged") && (
                    <button onClick={() => acknowledgeResult(r.id)} style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                      {lang === "en" ? "Acknowledge" : "إقرار"}
                    </button>
                  )}
                  {r.status === "acknowledged" && (
                    <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 700 }}>{lang === "en" ? "✓ Acknowledged" : "✓ تم الإقرار"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
