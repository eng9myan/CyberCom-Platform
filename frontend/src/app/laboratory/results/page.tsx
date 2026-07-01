"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface LabResult {
  id: string;
  order_number: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  test_name: string;
  test_name_ar: string;
  loinc_code: string;
  result_value: string;
  unit: string;
  reference_range: string;
  status: "normal" | "abnormal" | "critical";
  resulted_at: string;
  verified_by: string;
  acknowledged: boolean;
}

const MOCK_RESULTS: LabResult[] = [
  { id: "1", order_number: "LO-2026-016", patient_name: "Fares Al-Mutairi", patient_name_ar: "فارس المطيري", mrn: "MRN-004536", test_name: "Serum Potassium", test_name_ar: "بوتاسيوم المصل", loinc_code: "2823-3", result_value: "6.8", unit: "mEq/L", reference_range: "3.5 – 5.0", status: "critical", resulted_at: "08:10", verified_by: "Dr. Nadia Karimi", acknowledged: false },
  { id: "2", order_number: "LO-2026-011", patient_name: "Maryam Al-Khatib", patient_name_ar: "مريم الخطيب", mrn: "MRN-004531", test_name: "Troponin I High Sensitivity", test_name_ar: "تروبونين آي عالي الحساسية", loinc_code: "89579-7", result_value: "892", unit: "ng/L", reference_range: "< 34", status: "critical", resulted_at: "09:05", verified_by: "Dr. Tarek Jaber", acknowledged: true },
  { id: "3", order_number: "LO-2026-020", patient_name: "Amr Khalil", patient_name_ar: "عمرو خليل", mrn: "MRN-004540", test_name: "D-Dimer", test_name_ar: "ديمر د", loinc_code: "48066-5", result_value: "4.2", unit: "mg/L FEU", reference_range: "< 0.5", status: "critical", resulted_at: "09:45", verified_by: "Dr. Ibrahim Yousif", acknowledged: false },
  { id: "4", order_number: "LO-2026-003", patient_name: "Ahmad Mansouri", patient_name_ar: "أحمد منصوري", mrn: "MRN-004523", test_name: "HbA1c", test_name_ar: "الهيموجلوبين الغليكوزيلي", loinc_code: "4548-4", result_value: "9.2", unit: "%", reference_range: "< 5.7", status: "abnormal", resulted_at: "10:00", verified_by: "Dr. Sara Hassan", acknowledged: true },
  { id: "5", order_number: "LO-2026-008", patient_name: "Hana Ibrahim", patient_name_ar: "هناء إبراهيم", mrn: "MRN-004528", test_name: "Urinalysis – WBC", test_name_ar: "كريات بيضاء في البول", loinc_code: "24357-6", result_value: "32", unit: "/hpf", reference_range: "0 – 5", status: "abnormal", resulted_at: "08:50", verified_by: "Dr. Omar Suleiman", acknowledged: false },
  { id: "6", order_number: "LO-2026-007", patient_name: "Khalid Al-Faris", patient_name_ar: "خالد الفارس", mrn: "MRN-004527", test_name: "LDL Cholesterol", test_name_ar: "الكولسترول الضار", loinc_code: "2089-1", result_value: "4.2", unit: "mmol/L", reference_range: "< 2.6", status: "abnormal", resulted_at: "11:15", verified_by: "Dr. Rania Kassem", acknowledged: false },
  { id: "7", order_number: "LO-2026-001", patient_name: "Mohammed Al-Sayed", patient_name_ar: "محمد السيد", mrn: "MRN-004521", test_name: "Hemoglobin", test_name_ar: "هيموجلوبين", loinc_code: "718-7", result_value: "13.8", unit: "g/dL", reference_range: "13.5 – 17.5", status: "normal", resulted_at: "09:30", verified_by: "Dr. Nadia Karimi", acknowledged: true },
  { id: "8", order_number: "LO-2026-002", patient_name: "Fatima Al-Zahrawi", patient_name_ar: "فاطمة الزهراوي", mrn: "MRN-004522", test_name: "Serum Glucose", test_name_ar: "جلوكوز المصل", loinc_code: "2339-0", result_value: "5.4", unit: "mmol/L", reference_range: "3.9 – 6.1", status: "normal", resulted_at: "10:20", verified_by: "Dr. Ibrahim Yousif", acknowledged: true },
  { id: "9", order_number: "LO-2026-009", patient_name: "Tariq Mansour", patient_name_ar: "طارق منصور", mrn: "MRN-004529", test_name: "Serum Creatinine", test_name_ar: "كرياتينين المصل", loinc_code: "2160-0", result_value: "186", unit: "µmol/L", reference_range: "62 – 115", status: "abnormal", resulted_at: "10:45", verified_by: "Dr. Nour Al-Din", acknowledged: false },
  { id: "10", order_number: "LO-2026-012", patient_name: "Bilal Shaikh", patient_name_ar: "بلال الشيخ", mrn: "MRN-004532", test_name: "Serum Ferritin", test_name_ar: "فيريتين", loinc_code: "2276-4", result_value: "8.2", unit: "µg/L", reference_range: "12 – 300", status: "abnormal", resulted_at: "09:10", verified_by: "Dr. Maya Yousef", acknowledged: true },
  { id: "11", order_number: "LO-2026-021", patient_name: "Joud Al-Harbi", patient_name_ar: "جود الحربي", mrn: "MRN-004541", test_name: "Serum Sodium", test_name_ar: "صوديوم المصل", loinc_code: "2951-2", result_value: "128", unit: "mEq/L", reference_range: "136 – 145", status: "critical", resulted_at: "08:00", verified_by: "Dr. Rania Kassem", acknowledged: false },
  { id: "12", order_number: "LO-2026-014", patient_name: "Nasser Al-Qahtani", patient_name_ar: "ناصر القحطاني", mrn: "MRN-004534", test_name: "ALT (Alanine Aminotransferase)", test_name_ar: "ناقلة أمين الألانين", loinc_code: "1742-6", result_value: "312", unit: "U/L", reference_range: "7 – 56", status: "critical", resulted_at: "10:40", verified_by: "Dr. Layla Amin", acknowledged: false },
  { id: "13", order_number: "LO-2026-013", patient_name: "Rania El-Sayed", patient_name_ar: "رانيا السيد", mrn: "MRN-004533", test_name: "Vitamin D 25-OH", test_name_ar: "فيتامين د", loinc_code: "62292-8", result_value: "18", unit: "nmol/L", reference_range: "75 – 200", status: "abnormal", resulted_at: "12:00", verified_by: "Dr. Ziad Khalil", acknowledged: true },
  { id: "14", order_number: "LO-2026-006", patient_name: "Sara Mahmoud", patient_name_ar: "سارة محمود", mrn: "MRN-004526", test_name: "INR", test_name_ar: "النسبة الدولية الطبيعية", loinc_code: "6301-6", result_value: "4.8", unit: "ratio", reference_range: "0.8 – 1.2", status: "critical", resulted_at: "11:20", verified_by: "Dr. Tarek Jaber", acknowledged: true },
  { id: "15", order_number: "LO-2026-004", patient_name: "Leila Nouri", patient_name_ar: "ليلى نوري", mrn: "MRN-004524", test_name: "TSH (Thyroid Stimulating Hormone)", test_name_ar: "هرمون تحفيز الغدة الدرقية", loinc_code: "3016-3", result_value: "0.08", unit: "mIU/L", reference_range: "0.4 – 4.0", status: "abnormal", resulted_at: "11:00", verified_by: "Dr. Khalid Al-Rashid", acknowledged: false },
  { id: "16", order_number: "LO-2026-010", patient_name: "Yousif Al-Amin", patient_name_ar: "يوسف الأمين", mrn: "MRN-004530", test_name: "C-Reactive Protein", test_name_ar: "بروتين سي التفاعلي", loinc_code: "1988-5", result_value: "2.1", unit: "mg/L", reference_range: "< 5.0", status: "normal", resulted_at: "11:45", verified_by: "Dr. Aisha Nouri", acknowledged: true },
  { id: "17", order_number: "LO-2026-017", patient_name: "Layla Hussain", patient_name_ar: "ليلى حسين", mrn: "MRN-004537", test_name: "Blood Group ABO", test_name_ar: "فصيلة الدم ABO", loinc_code: "882-1", result_value: "O Positive", unit: "", reference_range: "N/A", status: "normal", resulted_at: "11:30", verified_by: "Dr. Khalid Al-Rashid", acknowledged: true },
  { id: "18", order_number: "LO-2026-024", patient_name: "Talal Al-Dosari", patient_name_ar: "طلال الدوسري", mrn: "MRN-004544", test_name: "NT-proBNP", test_name_ar: "الببتيد الناتريوريتيكي", loinc_code: "33762-6", result_value: "5840", unit: "pg/mL", reference_range: "< 125", status: "critical", resulted_at: "12:15", verified_by: "Dr. Nour Al-Din", acknowledged: false },
  { id: "19", order_number: "LO-2026-015", patient_name: "Dina Farouk", patient_name_ar: "دينا فاروق", mrn: "MRN-004535", test_name: "Anti-dsDNA Antibody", test_name_ar: "الأجسام المضادة للحمض النووي", loinc_code: "5088-0", result_value: "286", unit: "IU/mL", reference_range: "< 15", status: "critical", resulted_at: "10:30", verified_by: "Dr. Sara Hassan", acknowledged: false },
  { id: "20", order_number: "LO-2026-019", patient_name: "Noura Al-Rashidi", patient_name_ar: "نورة الرشيدي", mrn: "MRN-004539", test_name: "Testosterone Total", test_name_ar: "هرمون التستوستيرون", loinc_code: "2986-8", result_value: "0.4", unit: "nmol/L", reference_range: "0.5 – 2.6 (F)", status: "abnormal", resulted_at: "12:30", verified_by: "Dr. Aisha Mohammed", acknowledged: true },
  { id: "21", order_number: "LO-2026-001b", patient_name: "Mohammed Al-Sayed", patient_name_ar: "محمد السيد", mrn: "MRN-004521", test_name: "WBC Count", test_name_ar: "تعداد كريات الدم البيضاء", loinc_code: "6690-2", result_value: "7.8", unit: "×10⁹/L", reference_range: "4.0 – 11.0", status: "normal", resulted_at: "09:30", verified_by: "Dr. Nadia Karimi", acknowledged: true },
  { id: "22", order_number: "LO-2026-002b", patient_name: "Fatima Al-Zahrawi", patient_name_ar: "فاطمة الزهراوي", mrn: "MRN-004522", test_name: "Serum Albumin", test_name_ar: "ألبومين المصل", loinc_code: "1751-7", result_value: "38", unit: "g/L", reference_range: "35 – 50", status: "normal", resulted_at: "10:20", verified_by: "Dr. Ibrahim Yousif", acknowledged: true },
  { id: "23", order_number: "LO-2026-007b", patient_name: "Khalid Al-Faris", patient_name_ar: "خالد الفارس", mrn: "MRN-004527", test_name: "HDL Cholesterol", test_name_ar: "الكولسترول الجيد", loinc_code: "2085-9", result_value: "0.9", unit: "mmol/L", reference_range: "> 1.0", status: "abnormal", resulted_at: "11:15", verified_by: "Dr. Rania Kassem", acknowledged: false },
  { id: "24", order_number: "LO-2026-022", patient_name: "Hisham Al-Omari", patient_name_ar: "هشام العمري", mrn: "MRN-004542", test_name: "Beta hCG Quantitative", test_name_ar: "هرمون الحمل الكمي", loinc_code: "2118-8", result_value: "45820", unit: "mIU/mL", reference_range: "Varies by GA", status: "normal", resulted_at: "11:00", verified_by: "Dr. Maya Yousef", acknowledged: true },
  { id: "25", order_number: "LO-2026-009b", patient_name: "Tariq Mansour", patient_name_ar: "طارق منصور", mrn: "MRN-004529", test_name: "eGFR", test_name_ar: "معدل الترشيح الكبيبي المقدر", loinc_code: "62238-1", result_value: "28", unit: "mL/min/1.73m²", reference_range: "> 60", status: "critical", resulted_at: "10:45", verified_by: "Dr. Nour Al-Din", acknowledged: false },
  { id: "26", order_number: "LO-2026-016b", patient_name: "Fares Al-Mutairi", patient_name_ar: "فارس المطيري", mrn: "MRN-004536", test_name: "CSF Glucose", test_name_ar: "جلوكوز السائل النخاعي", loinc_code: "2342-4", result_value: "1.8", unit: "mmol/L", reference_range: "2.5 – 4.4", status: "abnormal", resulted_at: "12:00", verified_by: "Dr. Ibrahim Yousif", acknowledged: true },
  { id: "27", order_number: "LO-2026-006b", patient_name: "Sara Mahmoud", patient_name_ar: "سارة محمود", mrn: "MRN-004526", test_name: "aPTT", test_name_ar: "زمن الثرومبوبلاستين الجزئي", loinc_code: "14979-9", result_value: "62", unit: "seconds", reference_range: "25 – 35", status: "abnormal", resulted_at: "11:20", verified_by: "Dr. Tarek Jaber", acknowledged: false },
  { id: "28", order_number: "LO-2026-003b", patient_name: "Ahmad Mansouri", patient_name_ar: "أحمد منصوري", mrn: "MRN-004523", test_name: "Fasting Glucose", test_name_ar: "جلوكوز الصيام", loinc_code: "1558-6", result_value: "11.4", unit: "mmol/L", reference_range: "< 6.1", status: "critical", resulted_at: "10:00", verified_by: "Dr. Sara Hassan", acknowledged: false },
  { id: "29", order_number: "LO-2026-010b", patient_name: "Yousif Al-Amin", patient_name_ar: "يوسف الأمين", mrn: "MRN-004530", test_name: "ESR (Westergren)", test_name_ar: "سرعة الترسيب", loinc_code: "30341-2", result_value: "24", unit: "mm/hr", reference_range: "0 – 20", status: "abnormal", resulted_at: "11:45", verified_by: "Dr. Aisha Nouri", acknowledged: true },
  { id: "30", order_number: "LO-2026-013b", patient_name: "Rania El-Sayed", patient_name_ar: "رانيا السيد", mrn: "MRN-004533", test_name: "PTH (Parathyroid Hormone)", test_name_ar: "هرمون الغدة الجار درقية", loinc_code: "2731-8", result_value: "88", unit: "pg/mL", reference_range: "15 – 65", status: "abnormal", resulted_at: "12:30", verified_by: "Dr. Ziad Khalil", acknowledged: false },
];

function statusColor(s: string) {
  if (s === "critical") return "#ef4444";
  if (s === "abnormal") return "#f59e0b";
  return "#22c55e";
}

export default function LabResultsPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [results, setResults] = useState<LabResult[]>(MOCK_RESULTS);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<LabResult[]>("/api/v1/lab/results/");
        if (Array.isArray(data) && data.length > 0) setResults(data);
      } catch {
        // silently fall back to mock data
      }
    }
    void load();
  }, []);

  const filtered = statusFilter === "all" ? results : results.filter(r => r.status === statusFilter);
  const unacknowledgedCritical = results.filter(r => r.status === "critical" && !r.acknowledged);

  function handleAcknowledge(id: string) {
    setResults(prev => prev.map(r => r.id === id ? { ...r, acknowledged: true } : r));
  }

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/laboratory" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>
            {t("← Laboratory", "← المختبر")}
          </a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE", marginTop: "0.25rem" }}>
            {t("Lab Results Review", "مراجعة نتائج المختبر")}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Review results with critical value flagging and acknowledgment", "مراجعة النتائج مع تمييز القيم الحرجة والإقرار بها")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/laboratory", label: t("Overview", "نظرة عامة") },
          { href: "/laboratory/orders", label: t("Orders", "الطلبات") },
          { href: "/laboratory/specimens", label: t("Specimens", "العينات") },
          { href: "/laboratory/worklists", label: t("Worklists", "قوائم العمل") },
          { href: "/laboratory/results", label: t("Results", "النتائج") },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/laboratory/results" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/laboratory/results" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/laboratory/results" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Critical Alert Banner */}
      {unacknowledgedCritical.length > 0 && (
        <div style={{ background: "#fef2f222", border: "2px solid #ef4444", borderRadius: "10px", padding: "0.875rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "1.25rem" }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.9rem" }}>
              {unacknowledgedCritical.length} {t("Unacknowledged Critical Value(s)", "قيمة حرجة غير مُقرّ بها")}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
              {t("Critical results require immediate physician acknowledgment.", "تتطلب النتائج الحرجة إقرارًا فوريًا من الطبيب.")}
            </div>
          </div>
          <button onClick={() => setStatusFilter("critical")} style={{ marginLeft: "auto", padding: "0.35rem 0.875rem", borderRadius: "6px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            {t("View Critical", "عرض الحرجة")}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("Total Results", "إجمالي النتائج"), value: results.length, color: "#6366f1" },
          { label: t("Normal", "طبيعية"), value: results.filter(r => r.status === "normal").length, color: "#22c55e" },
          { label: t("Abnormal", "غير طبيعية"), value: results.filter(r => r.status === "abnormal").length, color: "#f59e0b" },
          { label: t("Critical", "حرجة"), value: results.filter(r => r.status === "critical").length, color: "#ef4444" },
          { label: t("Unacknowledged", "غير مُقرّ بها"), value: unacknowledgedCritical.length, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem" }}>
        {["all", "critical", "abnormal", "normal"].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.35rem 0.875rem", borderRadius: "6px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500, background: statusFilter === f ? statusColor(f === "all" ? "normal" : f) : "var(--color-surface)", color: statusFilter === f ? (f === "normal" || f === "all" ? "#fff" : "#fff") : "var(--color-text)" }}>
            {f === "all" ? t("All Results", "جميع النتائج") : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "critical" && ` (${results.filter(r => r.status === "critical").length})`}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-muted)", alignSelf: "center" }}>
          {filtered.length} {t("results", "نتائج")}
        </span>
      </div>

      {/* Results Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[t("Order #", "رقم الطلب"), t("Patient", "المريض"), t("Test / LOINC", "الفحص / LOINC"), t("Result", "النتيجة"), t("Unit", "الوحدة"), t("Reference Range", "النطاق المرجعي"), t("Status", "الحالة"), t("Verified By", "تحقق بواسطة"), t("Time", "الوقت"), t("Actions", "الإجراءات")].map(h => (
                <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={r.id}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  background: r.status === "critical" && !r.acknowledged
                    ? "#ef444408"
                    : i % 2 === 0 ? "transparent" : "var(--color-background)",
                  borderLeft: r.status === "critical" ? "3px solid #ef4444" : r.status === "abnormal" ? "3px solid #f59e0b" : "3px solid transparent",
                }}
              >
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "#22D3EE", whiteSpace: "nowrap" }}>{r.order_number}</td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{lang === "ar" ? r.patient_name_ar : r.patient_name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{r.mrn}</div>
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ fontSize: "0.85rem" }}>{lang === "ar" ? r.test_name_ar : r.test_name}</div>
                  <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{r.loinc_code}</div>
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: statusColor(r.status) }}>
                    {r.result_value}
                  </span>
                  {r.status === "critical" && <span style={{ marginLeft: "0.4rem", fontSize: "0.8rem" }}>⚠</span>}
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{r.unit}</td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{r.reference_range}</td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: statusColor(r.status) + "22", color: statusColor(r.status), border: r.status === "critical" ? `1px solid ${statusColor(r.status)}` : "none" }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{r.verified_by}</td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{r.resulted_at}</td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  {r.status === "critical" && !r.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(r.id)}
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem", borderRadius: "4px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                    >
                      {t("Acknowledge", "إقرار")}
                    </button>
                  )}
                  {r.status === "critical" && r.acknowledged && (
                    <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600 }}>✓ {t("Acknowledged", "مُقرّ به")}</span>
                  )}
                  {r.status !== "critical" && (
                    <button style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem", borderRadius: "4px", background: "var(--color-background)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)" }}>
                      {t("View", "عرض")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
