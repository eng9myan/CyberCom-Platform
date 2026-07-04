"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface WorklistTest {
  id: string;
  order_number: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  test_name: string;
  loinc_code: string;
  priority: "STAT" | "urgent" | "routine";
  status: "queued" | "in_progress" | "completed" | "on_hold";
  received_at: string;
  position: number;
}

interface Instrument {
  id: string;
  name: string;
  name_ar: string;
  department: string;
  department_ar: string;
  model: string;
  status: "online" | "offline" | "maintenance";
  color: string;
  tests: WorklistTest[];
}

const MOCK_INSTRUMENTS: Instrument[] = [
  {
    id: "HEMA-01",
    name: "Hematology Analyzer",
    name_ar: "محلل أمراض الدم",
    department: "Hematology",
    department_ar: "أمراض الدم",
    model: "Sysmex XN-3000",
    status: "online",
    color: "#ef4444",
    tests: [
      { id: "h1", order_number: "LO-2026-001", patient_name: "Mohammed Al-Sayed", patient_name_ar: "محمد السيد", mrn: "MRN-004521", test_name: "Complete Blood Count", loinc_code: "58410-2", priority: "STAT", status: "in_progress", received_at: "08:45", position: 1 },
      { id: "h2", order_number: "LO-2026-011", patient_name: "Maryam Al-Khatib", patient_name_ar: "مريم الخطيب", mrn: "MRN-004531", test_name: "CBC with Differential", loinc_code: "57021-8", priority: "STAT", status: "queued", received_at: "08:15", position: 2 },
      { id: "h3", order_number: "LO-2026-025", patient_name: "Rana Barakat", patient_name_ar: "رنا بركات", mrn: "MRN-004545", test_name: "Reticulocyte Count", loinc_code: "17849-1", priority: "routine", status: "queued", received_at: "06:50", position: 3 },
      { id: "h4", order_number: "LO-2026-012", patient_name: "Bilal Shaikh", patient_name_ar: "بلال الشيخ", mrn: "MRN-004532", test_name: "Peripheral Blood Smear", loinc_code: "5905-5", priority: "urgent", status: "in_progress", received_at: "08:20", position: 4 },
      { id: "h5", order_number: "LO-2026-007", patient_name: "Khalid Al-Faris", patient_name_ar: "خالد الفارس", mrn: "MRN-004527", test_name: "Complete Blood Count", loinc_code: "58410-2", priority: "routine", status: "queued", received_at: "10:20", position: 5 },
      { id: "h6", order_number: "LO-2026-016", patient_name: "Fares Al-Mutairi", patient_name_ar: "فارس المطيري", mrn: "MRN-004536", test_name: "CBC with Differential", loinc_code: "57021-8", priority: "STAT", status: "completed", received_at: "07:20", position: 6 },
      { id: "h7", order_number: "LO-2026-021", patient_name: "Joud Al-Harbi", patient_name_ar: "جود الحربي", mrn: "MRN-004541", test_name: "Complete Blood Count", loinc_code: "58410-2", priority: "urgent", status: "completed", received_at: "07:10", position: 7 },
      { id: "h8", order_number: "LO-2026-003", patient_name: "Ahmad Mansouri", patient_name_ar: "أحمد منصوري", mrn: "MRN-004523", test_name: "Erythrocyte Sedimentation Rate", loinc_code: "30341-2", priority: "routine", status: "queued", received_at: "07:30", position: 8 },
    ],
  },
  {
    id: "CHEM-01",
    name: "Chemistry Analyzer",
    name_ar: "محلل الكيمياء الحيوية",
    department: "Clinical Chemistry",
    department_ar: "الكيمياء السريرية",
    model: "Roche Cobas c 702",
    status: "online",
    color: "#3b82f6",
    tests: [
      { id: "c1", order_number: "LO-2026-002", patient_name: "Fatima Al-Zahrawi", patient_name_ar: "فاطمة الزهراوي", mrn: "MRN-004522", test_name: "Comprehensive Metabolic Panel", loinc_code: "24323-8", priority: "urgent", status: "in_progress", received_at: "09:10", position: 1 },
      { id: "c2", order_number: "LO-2026-003", patient_name: "Ahmad Mansouri", patient_name_ar: "أحمد منصوري", mrn: "MRN-004523", test_name: "HbA1c", loinc_code: "4548-4", priority: "routine", status: "completed", received_at: "07:30", position: 2 },
      { id: "c3", order_number: "LO-2026-009", patient_name: "Tariq Mansour", patient_name_ar: "طارق منصور", mrn: "MRN-004529", test_name: "Serum Creatinine + BUN", loinc_code: "2160-0", priority: "urgent", status: "in_progress", received_at: "09:30", position: 3 },
      { id: "c4", order_number: "LO-2026-006", patient_name: "Sara Mahmoud", patient_name_ar: "سارة محمود", mrn: "MRN-004526", test_name: "Prothrombin Time / INR", loinc_code: "5902-2", priority: "urgent", status: "queued", received_at: "10:05", position: 4 },
      { id: "c5", order_number: "LO-2026-014", patient_name: "Nasser Al-Qahtani", patient_name_ar: "ناصر القحطاني", mrn: "MRN-004534", test_name: "Liver Function Tests", loinc_code: "24325-3", priority: "urgent", status: "queued", received_at: "09:50", position: 5 },
      { id: "c6", order_number: "LO-2026-024", patient_name: "Talal Al-Dosari", patient_name_ar: "طلال الدوسري", mrn: "MRN-004544", test_name: "NT-proBNP", loinc_code: "33762-6", priority: "urgent", status: "queued", received_at: "11:30", position: 6 },
      { id: "c7", order_number: "LO-2026-020", patient_name: "Amr Khalil", patient_name_ar: "عمرو خليل", mrn: "MRN-004540", test_name: "D-Dimer", loinc_code: "48066-5", priority: "STAT", status: "in_progress", received_at: "08:55", position: 7 },
      { id: "c8", order_number: "LO-2026-011", patient_name: "Maryam Al-Khatib", patient_name_ar: "مريم الخطيب", mrn: "MRN-004531", test_name: "Troponin I High Sensitivity", loinc_code: "89579-7", priority: "STAT", status: "in_progress", received_at: "08:15", position: 8 },
      { id: "c9", order_number: "LO-2026-013", patient_name: "Rania El-Sayed", patient_name_ar: "رانيا السيد", mrn: "MRN-004533", test_name: "Vitamin D 25-OH", loinc_code: "62292-8", priority: "routine", status: "queued", received_at: "11:00", position: 9 },
      { id: "c10", order_number: "LO-2026-010", patient_name: "Yousif Al-Amin", patient_name_ar: "يوسف الأمين", mrn: "MRN-004530", test_name: "C-Reactive Protein", loinc_code: "1988-5", priority: "routine", status: "queued", received_at: "10:45", position: 10 },
    ],
  },
  {
    id: "MICRO-01",
    name: "Microbiology Station",
    name_ar: "محطة الأحياء الدقيقة",
    department: "Microbiology",
    department_ar: "الأحياء الدقيقة",
    model: "bioMerieux VITEK 2",
    status: "online",
    color: "#8b5cf6",
    tests: [
      { id: "m1", order_number: "LO-2026-005", patient_name: "Omar Hassan", patient_name_ar: "عمر حسن", mrn: "MRN-004525", test_name: "Blood Culture x2", loinc_code: "600-7", priority: "STAT", status: "in_progress", received_at: "08:00", position: 1 },
      { id: "m2", order_number: "LO-2026-018", patient_name: "Samir Boutros", patient_name_ar: "سامر بطرس", mrn: "MRN-004538", test_name: "Urine Culture & Sensitivity", loinc_code: "630-4", priority: "routine", status: "in_progress", received_at: "09:00", position: 2 },
      { id: "m3", order_number: "LO-2026-004", patient_name: "Leila Nouri", patient_name_ar: "ليلى نوري", mrn: "MRN-004524", test_name: "Throat Swab Culture", loinc_code: "625-4", priority: "routine", status: "queued", received_at: "08:00", position: 3 },
      { id: "m4", order_number: "LO-2026-010", patient_name: "Yousif Al-Amin", patient_name_ar: "يوسف الأمين", mrn: "MRN-004530", test_name: "Wound Swab Culture", loinc_code: "9091-0", priority: "routine", status: "queued", received_at: "09:45", position: 4 },
      { id: "m5", order_number: "LO-2026-023", patient_name: "Yasmin Othman", patient_name_ar: "ياسمين عثمان", mrn: "MRN-004543", test_name: "Sputum AFB Smear & Culture", loinc_code: "11545-1", priority: "routine", status: "in_progress", received_at: "08:10", position: 5 },
      { id: "m6", order_number: "LO-2026-016b", patient_name: "Fares Al-Mutairi", patient_name_ar: "فارس المطيري", mrn: "MRN-004536", test_name: "CSF Culture", loinc_code: "625-4", priority: "STAT", status: "in_progress", received_at: "11:00", position: 6 },
      { id: "m7", order_number: "LO-2026-019", patient_name: "Noura Al-Rashidi", patient_name_ar: "نورة الرشيدي", mrn: "MRN-004539", test_name: "Stool Culture", loinc_code: "625-4", priority: "routine", status: "queued", received_at: "06:15", position: 7 },
      { id: "m8", order_number: "LO-2026-019b", patient_name: "Noura Al-Rashidi", patient_name_ar: "نورة الرشيدي", mrn: "MRN-004539", test_name: "Ova & Parasites Exam", loinc_code: "20489-7", priority: "routine", status: "on_hold", received_at: "06:15", position: 8 },
      { id: "m9", order_number: "LO-2026-008b", patient_name: "Hana Ibrahim", patient_name_ar: "هناء إبراهيم", mrn: "MRN-004528", test_name: "MRSA Screen", loinc_code: "41875-3", priority: "urgent", status: "queued", received_at: "10:00", position: 9 },
    ],
  },
];

function priorityColor(p: string) {
  if (p === "STAT") return "#ef4444";
  if (p === "urgent") return "#f59e0b";
  return "#6366f1";
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    queued: "#6b7280",
    in_progress: "#f59e0b",
    completed: "#22c55e",
    on_hold: "#ef4444",
  };
  return map[s] || "#6b7280";
}

function instrumentStatusColor(s: string) {
  if (s === "online") return "#22c55e";
  if (s === "maintenance") return "#f59e0b";
  return "#ef4444";
}

export default function LabWorklistsPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [instruments, setInstruments] = useState<Instrument[]>(MOCK_INSTRUMENTS);
  const [activeInstrument, setActiveInstrument] = useState<string>("HEMA-01");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Instrument[]>("/api/v1/lab/worklists/");
        if (Array.isArray(data) && data.length > 0) setInstruments(data);
      } catch {
        // silently fall back to mock data
      }
    }
    void load();
  }, []);

  const current = instruments.find(i => i.id === activeInstrument) ?? instruments[0];
  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/laboratory" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>
            {t("← Laboratory", "← المختبر")}
          </a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE", marginTop: "0.25rem" }}>
            {t("Analyzer Worklists", "قوائم عمل الأجهزة")}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Pending tests per instrument and department", "الفحوصات المعلقة لكل جهاز وقسم")}
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
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/laboratory/worklists" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/laboratory/worklists" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/laboratory/worklists" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Instrument Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {instruments.map(inst => (
          <button
            key={inst.id}
            onClick={() => setActiveInstrument(inst.id)}
            style={{ padding: "1.25rem", borderRadius: "10px", background: activeInstrument === inst.id ? inst.color + "22" : "var(--color-surface)", border: `2px solid ${activeInstrument === inst.id ? inst.color : "var(--color-border)"}`, cursor: "pointer", textAlign: lang === "ar" ? "right" : "left", transition: "all 0.15s" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: inst.color }}>{lang === "ar" ? inst.name_ar : inst.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{inst.model}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{lang === "ar" ? inst.department_ar : inst.department}</div>
              </div>
              <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600, background: instrumentStatusColor(inst.status) + "22", color: instrumentStatusColor(inst.status) }}>
                {inst.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.875rem" }}>
              {[
                { label: t("Total", "الكل"), value: inst.tests.length, color: inst.color },
                { label: t("In Progress", "قيد التنفيذ"), value: inst.tests.filter(t2 => t2.status === "in_progress").length, color: "#f59e0b" },
                { label: t("Queued", "في الانتظار"), value: inst.tests.filter(t2 => t2.status === "queued").length, color: "#6b7280" },
                { label: t("Done", "منجزة"), value: inst.tests.filter(t2 => t2.status === "completed").length, color: "#22c55e" },
              ].map(m => (
                <div key={m.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Active Worklist */}
      {current && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              <span style={{ color: current.color }}>{lang === "ar" ? current.name_ar : current.name}</span>
              {" — "}{t("Worklist", "قائمة العمل")}
            </h2>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{current.tests.length} {t("tests", "فحوصات")}</span>
          </div>

          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  {["#", t("Order #", "رقم الطلب"), t("Patient", "المريض"), t("Test", "الفحص"), t("LOINC", "LOINC"), t("Priority", "الأولوية"), t("Received", "وقت الاستلام"), t("Status", "الحالة")].map(h => (
                    <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.tests.map((test, i) => (
                  <tr key={test.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-background)", opacity: test.status === "completed" ? 0.6 : 1 }}>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{test.position}</td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "#22D3EE" }}>{test.order_number}</td>
                    <td style={{ padding: "0.75rem 0.875rem" }}>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{lang === "ar" ? test.patient_name_ar : test.patient_name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{test.mrn}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.85rem" }}>{test.test_name}</td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{test.loinc_code}</td>
                    <td style={{ padding: "0.75rem 0.875rem" }}>
                      <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: priorityColor(test.priority) + "22", color: priorityColor(test.priority), border: `1px solid ${priorityColor(test.priority)}` }}>
                        {test.priority}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{test.received_at}</td>
                    <td style={{ padding: "0.75rem 0.875rem" }}>
                      <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: statusColor(test.status) + "22", color: statusColor(test.status) }}>
                        {test.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
