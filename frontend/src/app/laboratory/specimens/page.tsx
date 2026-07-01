"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Specimen {
  id: string;
  barcode: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  specimen_type: "blood" | "urine" | "swab" | "tissue" | "csf" | "stool";
  test_requested: string;
  collected_at: string;
  collected_by: string;
  location: string;
  status: "received" | "processing" | "stored" | "rejected" | "disposed";
  rejection_reason?: string;
}

const MOCK_SPECIMENS: Specimen[] = [
  { id: "1", barcode: "SP-2026-88001", patient_name: "Mohammed Al-Sayed", patient_name_ar: "محمد السيد", mrn: "MRN-004521", specimen_type: "blood", test_requested: "CBC + CMP", collected_at: "06:30", collected_by: "Nurse Fatima Khalil", location: "LAB-A-01", status: "processing" },
  { id: "2", barcode: "SP-2026-88002", patient_name: "Fatima Al-Zahrawi", patient_name_ar: "فاطمة الزهراوي", mrn: "MRN-004522", specimen_type: "urine", test_requested: "Urinalysis + Culture", collected_at: "07:00", collected_by: "Nurse Omar Bakr", location: "LAB-B-03", status: "received" },
  { id: "3", barcode: "SP-2026-88003", patient_name: "Ahmad Mansouri", patient_name_ar: "أحمد منصوري", mrn: "MRN-004523", specimen_type: "blood", test_requested: "HbA1c, Lipid Panel", collected_at: "07:15", collected_by: "Nurse Layla Said", location: "LAB-A-02", status: "stored" },
  { id: "4", barcode: "SP-2026-88004", patient_name: "Leila Nouri", patient_name_ar: "ليلى نوري", mrn: "MRN-004524", specimen_type: "swab", test_requested: "Throat Culture", collected_at: "08:00", collected_by: "Nurse Tariq Nour", location: "LAB-C-01", status: "processing" },
  { id: "5", barcode: "SP-2026-88005", patient_name: "Omar Hassan", patient_name_ar: "عمر حسن", mrn: "MRN-004525", specimen_type: "blood", test_requested: "Blood Culture x2", collected_at: "07:45", collected_by: "Dr. Nadia Karimi", location: "LAB-D-02", status: "processing" },
  { id: "6", barcode: "SP-2026-88006", patient_name: "Sara Mahmoud", patient_name_ar: "سارة محمود", mrn: "MRN-004526", specimen_type: "blood", test_requested: "Coagulation Panel", collected_at: "09:10", collected_by: "Nurse Fatima Khalil", location: "LAB-A-03", status: "received" },
  { id: "7", barcode: "SP-2026-88007", patient_name: "Khalid Al-Faris", patient_name_ar: "خالد الفارس", mrn: "MRN-004527", specimen_type: "urine", test_requested: "24-hr Urine Protein", collected_at: "06:00", collected_by: "Patient self-collected", location: "LAB-B-01", status: "received" },
  { id: "8", barcode: "SP-2026-88008", patient_name: "Hana Ibrahim", patient_name_ar: "هناء إبراهيم", mrn: "MRN-004528", specimen_type: "blood", test_requested: "Thyroid Panel", collected_at: "08:30", collected_by: "Nurse Omar Bakr", location: "LAB-A-04", status: "stored" },
  { id: "9", barcode: "SP-2026-88009", patient_name: "Tariq Mansour", patient_name_ar: "طارق منصور", mrn: "MRN-004529", specimen_type: "tissue", test_requested: "Histopathology Biopsy", collected_at: "10:00", collected_by: "Dr. Ziad Khalil", location: "LAB-PATH-01", status: "processing" },
  { id: "10", barcode: "SP-2026-88010", patient_name: "Yousif Al-Amin", patient_name_ar: "يوسف الأمين", mrn: "MRN-004530", specimen_type: "swab", test_requested: "Wound Swab Culture", collected_at: "09:45", collected_by: "Nurse Layla Said", location: "LAB-C-02", status: "received" },
  { id: "11", barcode: "SP-2026-88011", patient_name: "Maryam Al-Khatib", patient_name_ar: "مريم الخطيب", mrn: "MRN-004531", specimen_type: "blood", test_requested: "Troponin STAT", collected_at: "07:50", collected_by: "Dr. Aisha Mohammed", location: "LAB-A-05", status: "processing" },
  { id: "12", barcode: "SP-2026-88012", patient_name: "Bilal Shaikh", patient_name_ar: "بلال الشيخ", mrn: "MRN-004532", specimen_type: "blood", test_requested: "Ferritin, Iron Panel", collected_at: "08:20", collected_by: "Nurse Tariq Nour", location: "LAB-A-06", status: "stored" },
  { id: "13", barcode: "SP-2026-88013", patient_name: "Rania El-Sayed", patient_name_ar: "رانيا السيد", mrn: "MRN-004533", specimen_type: "urine", test_requested: "Pregnancy Test hCG", collected_at: "10:30", collected_by: "Nurse Fatima Khalil", location: "LAB-B-02", status: "received" },
  { id: "14", barcode: "SP-2026-88014", patient_name: "Nasser Al-Qahtani", patient_name_ar: "ناصر القحطاني", mrn: "MRN-004534", specimen_type: "blood", test_requested: "Liver Function Tests", collected_at: "09:00", collected_by: "Nurse Omar Bakr", location: "LAB-A-07", status: "rejected", rejection_reason: "Hemolyzed sample" },
  { id: "15", barcode: "SP-2026-88015", patient_name: "Dina Farouk", patient_name_ar: "دينا فاروق", mrn: "MRN-004535", specimen_type: "blood", test_requested: "ANA, Anti-dsDNA", collected_at: "08:00", collected_by: "Nurse Layla Said", location: "LAB-A-08", status: "processing" },
  { id: "16", barcode: "SP-2026-88016", patient_name: "Fares Al-Mutairi", patient_name_ar: "فارس المطيري", mrn: "MRN-004536", specimen_type: "csf", test_requested: "CSF Analysis & Culture", collected_at: "11:00", collected_by: "Dr. Ibrahim Yousif", location: "LAB-D-01", status: "processing" },
  { id: "17", barcode: "SP-2026-88017", patient_name: "Layla Hussain", patient_name_ar: "ليلى حسين", mrn: "MRN-004537", specimen_type: "blood", test_requested: "Blood Type & Crossmatch", collected_at: "10:15", collected_by: "Nurse Tariq Nour", location: "LAB-BNK-01", status: "received" },
  { id: "18", barcode: "SP-2026-88018", patient_name: "Samir Boutros", patient_name_ar: "سامر بطرس", mrn: "MRN-004538", specimen_type: "urine", test_requested: "Urine Culture", collected_at: "07:30", collected_by: "Patient self-collected", location: "LAB-B-04", status: "stored" },
  { id: "19", barcode: "SP-2026-88019", patient_name: "Noura Al-Rashidi", patient_name_ar: "نورة الرشيدي", mrn: "MRN-004539", specimen_type: "stool", test_requested: "Stool Culture & Ova", collected_at: "06:15", collected_by: "Patient self-collected", location: "LAB-C-03", status: "received" },
  { id: "20", barcode: "SP-2026-88020", patient_name: "Amr Khalil", patient_name_ar: "عمرو خليل", mrn: "MRN-004540", specimen_type: "blood", test_requested: "D-Dimer STAT", collected_at: "08:40", collected_by: "Dr. Nadia Karimi", location: "LAB-A-09", status: "processing" },
];

const SPECIMEN_TYPE_COLORS: Record<string, string> = {
  blood: "#ef4444",
  urine: "#f59e0b",
  swab: "#8b5cf6",
  tissue: "#14b8a6",
  csf: "#3b82f6",
  stool: "#6b7280",
};

function statusColor(s: string) {
  const map: Record<string, string> = {
    received: "#3b82f6",
    processing: "#f59e0b",
    stored: "#22c55e",
    rejected: "#ef4444",
    disposed: "#6b7280",
  };
  return map[s] || "#6b7280";
}

export default function LabSpecimensPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [specimens, setSpecimens] = useState<Specimen[]>(MOCK_SPECIMENS);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [scanResult, setScanResult] = useState<Specimen | null>(null);
  const [scanMode, setScanMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Specimen[]>("/api/v1/lab/specimens/");
        if (Array.isArray(data) && data.length > 0) setSpecimens(data);
      } catch {
        // silently fall back to mock data
      }
    }
    void load();
  }, []);

  const filtered = specimens.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (typeFilter !== "all" && s.specimen_type !== typeFilter) return false;
    return true;
  });

  function handleBarcodeScan() {
    const found = specimens.find(s => s.barcode === barcodeInput.trim());
    if (found) {
      setScanResult(found);
    } else {
      // Simulate receiving a new specimen
      const newSpecimen: Specimen = {
        id: String(specimens.length + 1),
        barcode: barcodeInput.trim() || `SP-2026-SIM-${Date.now()}`,
        patient_name: "Simulated Patient",
        patient_name_ar: "مريض محاكاة",
        mrn: "MRN-SIM-001",
        specimen_type: "blood",
        test_requested: "Simulated Test",
        collected_at: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        collected_by: "System Scan",
        location: "LAB-INTAKE",
        status: "received",
      };
      setSpecimens(prev => [newSpecimen, ...prev]);
      setScanResult(newSpecimen);
    }
    setBarcodeInput("");
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
            {t("Specimen Tracking & Accessioning", "تتبع العينات والاستقبال")}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Receive, track, and manage laboratory specimens", "استلام وتتبع وإدارة العينات المخبرية")}
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
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/laboratory/specimens" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/laboratory/specimens" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/laboratory/specimens" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("Total Specimens", "إجمالي العينات"), value: specimens.length, color: "#6366f1" },
          { label: t("Received", "مستلمة"), value: specimens.filter(s => s.status === "received").length, color: "#3b82f6" },
          { label: t("Processing", "قيد المعالجة"), value: specimens.filter(s => s.status === "processing").length, color: "#f59e0b" },
          { label: t("Stored", "مخزنة"), value: specimens.filter(s => s.status === "stored").length, color: "#22c55e" },
          { label: t("Rejected", "مرفوضة"), value: specimens.filter(s => s.status === "rejected").length, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Barcode Scan Panel */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{t("Specimen Receive / Barcode Scan", "استلام العينة / مسح الباركود")}</h2>
          <button onClick={() => setScanMode(m => !m)} style={{ padding: "0.3rem 0.8rem", borderRadius: "4px", border: "1px solid #22D3EE", cursor: "pointer", background: scanMode ? "#22D3EE" : "transparent", color: scanMode ? "#000" : "#22D3EE", fontSize: "0.8rem" }}>
            {scanMode ? t("Close Scanner", "إغلاق الماسح") : t("Open Scanner", "فتح الماسح")}
          </button>
        </div>
        {scanMode && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>{t("Scan or enter barcode", "امسح أو أدخل الباركود")}</label>
              <input
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleBarcodeScan()}
                placeholder="SP-2026-XXXXX"
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.875rem", boxSizing: "border-box" }}
              />
            </div>
            <button onClick={handleBarcodeScan} style={{ padding: "0.5rem 1.25rem", borderRadius: "6px", background: "#22D3EE", color: "#000", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
              {t("Receive Specimen", "استلام العينة")}
            </button>
          </div>
        )}
        {scanResult && (
          <div style={{ marginTop: "1rem", background: "#22c55e11", border: "1px solid #22c55e", borderRadius: "8px", padding: "0.875rem" }}>
            <div style={{ fontWeight: 600, color: "#22c55e", marginBottom: "0.5rem" }}>{t("Specimen Located / Received", "تم تحديد / استلام العينة")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", fontSize: "0.8rem" }}>
              <div><span style={{ color: "var(--color-text-muted)" }}>{t("Barcode: ", "الباركود: ")}</span><strong>{scanResult.barcode}</strong></div>
              <div><span style={{ color: "var(--color-text-muted)" }}>{t("Patient: ", "المريض: ")}</span><strong>{lang === "ar" ? scanResult.patient_name_ar : scanResult.patient_name}</strong></div>
              <div><span style={{ color: "var(--color-text-muted)" }}>{t("Type: ", "النوع: ")}</span><strong>{scanResult.specimen_type}</strong></div>
              <div><span style={{ color: "var(--color-text-muted)" }}>{t("Status: ", "الحالة: ")}</span><strong style={{ color: statusColor(scanResult.status) }}>{scanResult.status}</strong></div>
            </div>
            <button onClick={() => setScanResult(null)} style={{ marginTop: "0.5rem", padding: "0.2rem 0.6rem", fontSize: "0.75rem", borderRadius: "4px", background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer" }}>
              {t("Dismiss", "إغلاق")}
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginRight: "0.5rem" }}>{t("Status:", "الحالة:")}</span>
          {["all", "received", "processing", "stored", "rejected"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{ marginRight: "0.25rem", padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", background: statusFilter === f ? "#22D3EE" : "var(--color-surface)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
              {f === "all" ? t("All", "الكل") : f}
            </button>
          ))}
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginRight: "0.5rem" }}>{t("Type:", "النوع:")}</span>
          {["all", "blood", "urine", "swab", "tissue", "csf", "stool"].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{ marginRight: "0.25rem", padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", background: typeFilter === f ? (SPECIMEN_TYPE_COLORS[f] || "#22D3EE") : "var(--color-surface)", color: typeFilter === f ? "#fff" : "var(--color-text)" }}>
              {f === "all" ? t("All", "الكل") : f}
            </button>
          ))}
        </div>
      </div>

      {/* Specimens Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[t("Barcode", "الباركود"), t("Patient", "المريض"), t("Type", "النوع"), t("Test Requested", "الفحص المطلوب"), t("Collected At", "وقت الجمع"), t("Collected By", "جُمعت بواسطة"), t("Location", "الموقع"), t("Status", "الحالة")].map(h => (
                <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "var(--color-background)" }}>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "#22D3EE" }}>{s.barcode}</td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{lang === "ar" ? s.patient_name_ar : s.patient_name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{s.mrn}</div>
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: (SPECIMEN_TYPE_COLORS[s.specimen_type] || "#6b7280") + "22", color: SPECIMEN_TYPE_COLORS[s.specimen_type] || "#6b7280" }}>
                    {s.specimen_type}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem" }}>{s.test_requested}</td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{s.collected_at}</td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{s.collected_by}</td>
                <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{s.location}</td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: statusColor(s.status) + "22", color: statusColor(s.status) }}>
                    {s.status}
                  </span>
                  {s.rejection_reason && (
                    <div style={{ fontSize: "0.68rem", color: "#ef4444", marginTop: "0.2rem" }}>{s.rejection_reason}</div>
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
