"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ADTTransaction {
  id: string;
  type: "admit" | "discharge" | "transfer";
  patient_id: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  ward: string;
  ward_ar: string;
  bed: string;
  reason: string;
  reason_ar: string;
  physician: string;
  timestamp: string;
  status: "completed" | "pending" | "in_progress";
}

interface Ward {
  id: string;
  name: string;
  name_ar: string;
  available_beds: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: ADTTransaction[] = [
  { id: "ADT001", type: "admit", patient_id: "P1001", patient_name: "Ahmad Al-Rashidi", patient_name_ar: "أحمد الراشدي", mrn: "MRN-10042", ward: "Medical Ward A", ward_ar: "جناح طبي أ", bed: "A-14", reason: "Acute chest pain, rule out MI", reason_ar: "ألم صدري حاد، استبعاد احتشاء", physician: "Dr. Khalid Mansour", timestamp: "2026-06-30 06:15", status: "completed" },
  { id: "ADT002", type: "admit", patient_id: "P1002", patient_name: "Fatima Al-Zahra", patient_name_ar: "فاطمة الزهراء", mrn: "MRN-10089", ward: "Maternity Ward", ward_ar: "جناح الولادة", bed: "M-03", reason: "Labor — 39 weeks gestation", reason_ar: "مخاض - 39 أسبوعاً", physician: "Dr. Nour Al-Hassan", timestamp: "2026-06-30 06:42", status: "completed" },
  { id: "ADT003", type: "admit", patient_id: "P1003", patient_name: "Mohammed Al-Sayed", patient_name_ar: "محمد السيد", mrn: "MRN-10103", ward: "Surgical Ward B", ward_ar: "جناح جراحي ب", bed: "B-07", reason: "Post-op appendectomy observation", reason_ar: "مراقبة ما بعد استئصال الزائدة", physician: "Dr. Tariq Farouk", timestamp: "2026-06-30 07:00", status: "completed" },
  { id: "ADT004", type: "admit", patient_id: "P1004", patient_name: "Sara Al-Mukhtar", patient_name_ar: "سارة المختار", mrn: "MRN-10114", ward: "Pediatrics", ward_ar: "طب الأطفال", bed: "PD-11", reason: "Febrile seizure, 4 years old", reason_ar: "نوبة حمى، 4 سنوات", physician: "Dr. Lina Qasim", timestamp: "2026-06-30 07:25", status: "completed" },
  { id: "ADT005", type: "admit", patient_id: "P1005", patient_name: "Omar Al-Farsi", patient_name_ar: "عمر الفارسي", mrn: "MRN-10128", ward: "ICU", ward_ar: "وحدة العناية المركزة", bed: "ICU-02", reason: "Severe sepsis, respiratory failure", reason_ar: "إنتان شديد، فشل تنفسي", physician: "Dr. Reem Al-Jabri", timestamp: "2026-06-30 07:50", status: "completed" },
  { id: "ADT006", type: "admit", patient_id: "P1006", patient_name: "Hanan Al-Otaibi", patient_name_ar: "حنان العتيبي", mrn: "MRN-10135", ward: "Oncology", ward_ar: "الأورام", bed: "ONC-06", reason: "Chemotherapy cycle admission", reason_ar: "دخول دورة العلاج الكيميائي", physician: "Dr. Basel Naser", timestamp: "2026-06-30 08:10", status: "completed" },
  { id: "ADT007", type: "admit", patient_id: "P1007", patient_name: "Yousef Al-Harbi", patient_name_ar: "يوسف الحربي", mrn: "MRN-10147", ward: "Orthopedics", ward_ar: "العظام", bed: "ORT-09", reason: "Right hip fracture pre-op", reason_ar: "كسر في الورك الأيمن قبل الجراحة", physician: "Dr. Samer Khalil", timestamp: "2026-06-30 08:30", status: "in_progress" },
  { id: "ADT008", type: "admit", patient_id: "P1008", patient_name: "Noura Al-Ghamdi", patient_name_ar: "نورة الغامدي", mrn: "MRN-10162", ward: "Medical Ward A", ward_ar: "جناح طبي أ", bed: "A-21", reason: "Diabetic ketoacidosis", reason_ar: "الحماض الكيتوني السكري", physician: "Dr. Khalid Mansour", timestamp: "2026-06-30 09:05", status: "pending" },
  { id: "ADT009", type: "discharge", patient_id: "P0891", patient_name: "Ibrahim Al-Shammari", patient_name_ar: "إبراهيم الشمري", mrn: "MRN-09812", ward: "Medical Ward A", ward_ar: "جناح طبي أ", bed: "A-05", reason: "Resolved pneumonia, clinically stable", reason_ar: "التهاب رئوي محلول، مستقر سريرياً", physician: "Dr. Khalid Mansour", timestamp: "2026-06-30 08:00", status: "completed" },
  { id: "ADT010", type: "discharge", patient_id: "P0904", patient_name: "Maryam Al-Balushi", patient_name_ar: "مريم البلوشي", mrn: "MRN-09956", ward: "Maternity Ward", ward_ar: "جناح الولادة", bed: "M-07", reason: "Normal delivery, mother and baby well", reason_ar: "ولادة طبيعية، الأم والطفل بخير", physician: "Dr. Nour Al-Hassan", timestamp: "2026-06-30 09:30", status: "completed" },
  { id: "ADT011", type: "discharge", patient_id: "P0917", patient_name: "Khalid Al-Dosari", patient_name_ar: "خالد الدوسري", mrn: "MRN-10001", ward: "Surgical Ward B", ward_ar: "جناح جراحي ب", bed: "B-12", reason: "Post-cholecystectomy, day 2", reason_ar: "بعد استئصال المرارة، اليوم الثاني", physician: "Dr. Tariq Farouk", timestamp: "2026-06-30 10:00", status: "pending" },
  { id: "ADT012", type: "discharge", patient_id: "P0923", patient_name: "Aisha Al-Madani", patient_name_ar: "عائشة المدني", mrn: "MRN-10015", ward: "Pediatrics", ward_ar: "طب الأطفال", bed: "PD-04", reason: "Asthma exacerbation resolved", reason_ar: "نوبة ربو محلولة", physician: "Dr. Lina Qasim", timestamp: "2026-06-30 10:30", status: "in_progress" },
  { id: "ADT013", type: "transfer", patient_id: "P0888", patient_name: "Tariq Al-Zahrani", patient_name_ar: "طارق الزهراني", mrn: "MRN-09788", ward: "ICU", ward_ar: "وحدة العناية المركزة", bed: "ICU-07", reason: "Condition improved, step-down to Medical", reason_ar: "تحسن الحالة، نقل إلى الجناح الطبي", physician: "Dr. Reem Al-Jabri", timestamp: "2026-06-30 07:15", status: "completed" },
  { id: "ADT014", type: "transfer", patient_id: "P0899", patient_name: "Rania Al-Oteibi", patient_name_ar: "رانيا العتيبي", mrn: "MRN-09845", ward: "Emergency Obs", ward_ar: "طوارئ المراقبة", bed: "EMG-03", reason: "Admitted to cardiology ward from ED", reason_ar: "نقل من الطوارئ إلى قسم القلب", physician: "Dr. Basel Naser", timestamp: "2026-06-30 08:45", status: "completed" },
  { id: "ADT015", type: "transfer", patient_id: "P0912", patient_name: "Salem Al-Shehri", patient_name_ar: "سالم الشهري", mrn: "MRN-09901", ward: "Surgical Ward B", ward_ar: "جناح جراحي ب", bed: "B-18", reason: "Post-op deterioration, upgrade to ICU", reason_ar: "تدهور ما بعد الجراحة، نقل للعناية المركزة", physician: "Dr. Tariq Farouk", timestamp: "2026-06-30 09:50", status: "in_progress" },
];

const MOCK_WARDS: Ward[] = [
  { id: "W01", name: "Medical Ward A", name_ar: "جناح طبي أ", available_beds: 3 },
  { id: "W02", name: "Surgical Ward B", name_ar: "جناح جراحي ب", available_beds: 8 },
  { id: "W03", name: "ICU", name_ar: "وحدة العناية المركزة", available_beds: 6 },
  { id: "W04", name: "Maternity Ward", name_ar: "جناح الولادة", available_beds: 8 },
  { id: "W05", name: "Pediatrics", name_ar: "طب الأطفال", available_beds: 10 },
  { id: "W06", name: "Emergency Obs", name_ar: "طوارئ المراقبة", available_beds: 2 },
  { id: "W07", name: "Orthopedics", name_ar: "العظام", available_beds: 7 },
  { id: "W08", name: "Oncology", name_ar: "الأورام", available_beds: 5 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeColor(type: ADTTransaction["type"]) {
  if (type === "admit") return "#22D3EE";
  if (type === "discharge") return "#22c55e";
  return "#f59e0b";
}

function typeLabel(type: ADTTransaction["type"], lang: "en" | "ar") {
  if (lang === "en") {
    return type === "admit" ? "Admit" : type === "discharge" ? "Discharge" : "Transfer";
  }
  return type === "admit" ? "قبول" : type === "discharge" ? "خروج" : "نقل";
}

function statusColor(status: ADTTransaction["status"]) {
  if (status === "completed") return "#22c55e";
  if (status === "in_progress") return "#f59e0b";
  return "#6366f1";
}

function statusLabel(status: ADTTransaction["status"], lang: "en" | "ar") {
  if (lang === "en") {
    return status === "completed" ? "Completed" : status === "in_progress" ? "In Progress" : "Pending";
  }
  return status === "completed" ? "مكتمل" : status === "in_progress" ? "جارٍ" : "معلق";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ADTPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [transactions, setTransactions] = useState<ADTTransaction[]>(MOCK_TRANSACTIONS);
  const [wards, setWards] = useState<Ward[]>(MOCK_WARDS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"log" | "admit" | "discharge" | "transfer">("log");
  const [filterType, setFilterType] = useState<"all" | "admit" | "discharge" | "transfer">("all");

  // Form states
  const [admitForm, setAdmitForm] = useState({ patientSearch: "", ward: "", bed: "", reason: "", physician: "" });
  const [dischargeForm, setDischargeForm] = useState({ mrn: "", dischargeType: "routine", followUp: "", notes: "" });
  const [transferForm, setTransferForm] = useState({ mrn: "", fromWard: "", fromBed: "", toWard: "", toBed: "", reason: "" });
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await apiFetch<ADTTransaction[]>("/api/v1/hospital/adt/");
        if (data && data.length > 0) setTransactions(data);
        const wardData = await apiFetch<Ward[]>("/api/v1/hospital/beds/wards/");
        if (wardData && wardData.length > 0) setWards(wardData);
      } catch {
        // silently use mock data
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, []);

  const filtered = filterType === "all" ? transactions : transactions.filter(t => t.type === filterType);

  const admitCount = transactions.filter(t => t.type === "admit").length;
  const dischargeCount = transactions.filter(t => t.type === "discharge").length;
  const transferCount = transactions.filter(t => t.type === "transfer").length;

  const dir = lang === "ar" ? "rtl" : "ltr";

  function handleFormSubmit(action: string) {
    setFormSuccess(lang === "en" ? `${action} request submitted successfully.` : `تم إرسال طلب ${action} بنجاح.`);
    setTimeout(() => setFormSuccess(null), 3000);
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1rem",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: "var(--color-background)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    color: "var(--color-text)",
    fontSize: "0.875rem",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--color-text-muted)",
    marginBottom: "0.375rem",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "0.625rem 1.5rem",
    background: "#22D3EE",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.875rem",
    cursor: "pointer",
  };

  return (
    <div dir={dir} style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Admit / Discharge / Transfer" : "القبول / الخروج / النقل"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Manage all patient movement transactions" : "إدارة جميع حركات المرضى"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Syncing...</span>}
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>


      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Admissions Today" : "قبول اليوم", value: admitCount, color: "#22D3EE" },
          { label: lang === "en" ? "Discharges Today" : "خروج اليوم", value: dischargeCount, color: "#22c55e" },
          { label: lang === "en" ? "Transfers Today" : "نقل اليوم", value: transferCount, color: "#f59e0b" },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--color-surface)", border: `1px solid ${card.color}44`, borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.25rem", fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--color-border)", paddingBottom: "0" }}>
        {(["log", "admit", "discharge", "transfer"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFormSuccess(null); }}
            style={{
              padding: "0.625rem 1.25rem",
              border: "none",
              borderBottom: activeTab === tab ? "3px solid #22D3EE" : "3px solid transparent",
              background: "transparent",
              color: activeTab === tab ? "#22D3EE" : "var(--color-text-muted)",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              marginBottom: "-2px",
            }}
          >
            {tab === "log" ? (lang === "en" ? "ADT Log" : "سجل الحركات") :
             tab === "admit" ? (lang === "en" ? "New Admission" : "قبول جديد") :
             tab === "discharge" ? (lang === "en" ? "Discharge" : "خروج") :
             (lang === "en" ? "Transfer" : "نقل")}
          </button>
        ))}
      </div>

      {/* Success Banner */}
      {formSuccess && (
        <div style={{ background: "#052e16", border: "1px solid #22c55e", borderRadius: "8px", padding: "0.875rem 1.25rem", marginBottom: "1rem", color: "#22c55e", fontWeight: 600, fontSize: "0.875rem" }}>
          {formSuccess}
        </div>
      )}

      {/* ADT Log */}
      {activeTab === "log" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {(["all", "admit", "discharge", "transfer"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "20px",
                  border: filterType === f ? "2px solid #22D3EE" : "1px solid var(--color-border)",
                  background: filterType === f ? "#22D3EE22" : "var(--color-surface)",
                  color: filterType === f ? "#22D3EE" : "var(--color-text-muted)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                {f === "all" ? (lang === "en" ? "All" : "الكل") :
                 f === "admit" ? (lang === "en" ? "Admissions" : "قبول") :
                 f === "discharge" ? (lang === "en" ? "Discharges" : "خروج") :
                 (lang === "en" ? "Transfers" : "نقل")}
              </button>
            ))}
          </div>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  {[
                    lang === "en" ? "Transaction" : "المعاملة",
                    lang === "en" ? "Type" : "النوع",
                    lang === "en" ? "Patient" : "المريض",
                    lang === "en" ? "MRN" : "رقم السجل",
                    lang === "en" ? "Ward / Bed" : "الجناح / السرير",
                    lang === "en" ? "Reason" : "السبب",
                    lang === "en" ? "Physician" : "الطبيب",
                    lang === "en" ? "Time" : "الوقت",
                    lang === "en" ? "Status" : "الحالة",
                  ].map(h => (
                    <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{tx.id}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: typeColor(tx.type) + "22", color: typeColor(tx.type) }}>
                        {typeLabel(tx.type, lang)}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "var(--color-text)", fontSize: "0.875rem" }}>
                      {lang === "ar" ? tx.patient_name_ar : tx.patient_name}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{tx.mrn}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--color-text)" }}>
                      {lang === "ar" ? tx.ward_ar : tx.ward} / <span style={{ color: "#22D3EE", fontWeight: 600 }}>{tx.bed}</span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)", maxWidth: "200px" }}>
                      {lang === "ar" ? tx.reason_ar : tx.reason}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text)" }}>{tx.physician}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{tx.timestamp}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ padding: "0.25rem 0.625rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: statusColor(tx.status) + "22", color: statusColor(tx.status) }}>
                        {statusLabel(tx.status, lang)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admit Form */}
      {activeTab === "admit" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#22D3EE", marginBottom: "1.5rem" }}>
            {lang === "en" ? "New Patient Admission" : "قبول مريض جديد"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Patient Search (Name / MRN / ID)" : "بحث عن المريض (الاسم / الرقم)"}</label>
              <input
                style={inputStyle}
                placeholder={lang === "en" ? "Type patient name or MRN..." : "اكتب اسم المريض أو رقم السجل..."}
                value={admitForm.patientSearch}
                onChange={e => setAdmitForm({ ...admitForm, patientSearch: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Attending Physician" : "الطبيب المعالج"}</label>
              <input
                style={inputStyle}
                placeholder={lang === "en" ? "Dr. Name" : "اسم الطبيب"}
                value={admitForm.physician}
                onChange={e => setAdmitForm({ ...admitForm, physician: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Ward Selection" : "اختيار الجناح"}</label>
              <select
                style={inputStyle}
                value={admitForm.ward}
                onChange={e => setAdmitForm({ ...admitForm, ward: e.target.value })}
              >
                <option value="">{lang === "en" ? "Select ward..." : "اختر الجناح..."}</option>
                {wards.map(w => (
                  <option key={w.id} value={w.id}>
                    {lang === "ar" ? w.name_ar : w.name} ({lang === "en" ? `${w.available_beds} available` : `${w.available_beds} متاح`})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Bed Assignment" : "تعيين السرير"}</label>
              <input
                style={inputStyle}
                placeholder={lang === "en" ? "e.g. A-14" : "مثال: أ-14"}
                value={admitForm.bed}
                onChange={e => setAdmitForm({ ...admitForm, bed: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Admission Reason / Diagnosis" : "سبب القبول / التشخيص"}</label>
              <textarea
                style={{ ...inputStyle, height: "90px", resize: "vertical" }}
                placeholder={lang === "en" ? "Enter chief complaint or diagnosis..." : "أدخل الشكوى الرئيسية أو التشخيص..."}
                value={admitForm.reason}
                onChange={e => setAdmitForm({ ...admitForm, reason: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button style={btnPrimary} onClick={() => handleFormSubmit(lang === "en" ? "Admission" : "قبول")}>
              {lang === "en" ? "Submit Admission" : "إرسال طلب القبول"}
            </button>
            <button
              style={{ ...btnPrimary, background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              onClick={() => setAdmitForm({ patientSearch: "", ward: "", bed: "", reason: "", physician: "" })}
            >
              {lang === "en" ? "Clear" : "مسح"}
            </button>
          </div>
        </div>
      )}

      {/* Discharge Form */}
      {activeTab === "discharge" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#22c55e", marginBottom: "1.5rem" }}>
            {lang === "en" ? "Patient Discharge" : "خروج المريض"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Patient MRN / Name" : "رقم سجل المريض / الاسم"}</label>
              <input
                style={inputStyle}
                placeholder={lang === "en" ? "Search by MRN or name..." : "ابحث برقم السجل أو الاسم..."}
                value={dischargeForm.mrn}
                onChange={e => setDischargeForm({ ...dischargeForm, mrn: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Discharge Type" : "نوع الخروج"}</label>
              <select
                style={inputStyle}
                value={dischargeForm.dischargeType}
                onChange={e => setDischargeForm({ ...dischargeForm, dischargeType: e.target.value })}
              >
                <option value="routine">{lang === "en" ? "Routine Discharge" : "خروج اعتيادي"}</option>
                <option value="against_advice">{lang === "en" ? "Against Medical Advice" : "ضد النصيحة الطبية"}</option>
                <option value="transfer_external">{lang === "en" ? "Transfer to Another Facility" : "نقل لمنشأة أخرى"}</option>
                <option value="death">{lang === "en" ? "Death" : "وفاة"}</option>
                <option value="home_health">{lang === "en" ? "Home Healthcare" : "رعاية صحية منزلية"}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "Follow-up Appointment" : "موعد المتابعة"}</label>
              <input
                type="date"
                style={inputStyle}
                value={dischargeForm.followUp}
                onChange={e => setDischargeForm({ ...dischargeForm, followUp: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Discharge Notes / Instructions" : "ملاحظات الخروج / التعليمات"}</label>
              <textarea
                style={{ ...inputStyle, height: "90px", resize: "vertical" }}
                placeholder={lang === "en" ? "Clinical summary and discharge instructions..." : "الملخص السريري وتعليمات الخروج..."}
                value={dischargeForm.notes}
                onChange={e => setDischargeForm({ ...dischargeForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button style={{ ...btnPrimary, background: "#22c55e" }} onClick={() => handleFormSubmit(lang === "en" ? "Discharge" : "خروج")}>
              {lang === "en" ? "Process Discharge" : "تنفيذ الخروج"}
            </button>
            <button
              style={{ ...btnPrimary, background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              onClick={() => setDischargeForm({ mrn: "", dischargeType: "routine", followUp: "", notes: "" })}
            >
              {lang === "en" ? "Clear" : "مسح"}
            </button>
          </div>
        </div>
      )}

      {/* Transfer Form */}
      {activeTab === "transfer" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b", marginBottom: "1.5rem" }}>
            {lang === "en" ? "Patient Transfer" : "نقل المريض"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Patient MRN / Name" : "رقم سجل المريض / الاسم"}</label>
              <input
                style={inputStyle}
                placeholder={lang === "en" ? "Search by MRN or name..." : "ابحث برقم السجل أو الاسم..."}
                value={transferForm.mrn}
                onChange={e => setTransferForm({ ...transferForm, mrn: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "From Ward" : "من الجناح"}</label>
              <select
                style={inputStyle}
                value={transferForm.fromWard}
                onChange={e => setTransferForm({ ...transferForm, fromWard: e.target.value })}
              >
                <option value="">{lang === "en" ? "Select ward..." : "اختر الجناح..."}</option>
                {wards.map(w => (
                  <option key={w.id} value={w.id}>{lang === "ar" ? w.name_ar : w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "From Bed" : "من السرير"}</label>
              <input
                style={inputStyle}
                placeholder={lang === "en" ? "Current bed, e.g. A-14" : "السرير الحالي، مثال: أ-14"}
                value={transferForm.fromBed}
                onChange={e => setTransferForm({ ...transferForm, fromBed: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "To Ward" : "إلى الجناح"}</label>
              <select
                style={inputStyle}
                value={transferForm.toWard}
                onChange={e => setTransferForm({ ...transferForm, toWard: e.target.value })}
              >
                <option value="">{lang === "en" ? "Select ward..." : "اختر الجناح..."}</option>
                {wards.map(w => (
                  <option key={w.id} value={w.id}>
                    {lang === "ar" ? w.name_ar : w.name} ({lang === "en" ? `${w.available_beds} available` : `${w.available_beds} متاح`})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{lang === "en" ? "To Bed" : "إلى السرير"}</label>
              <input
                style={inputStyle}
                placeholder={lang === "en" ? "Target bed, e.g. B-07" : "السرير المستهدف، مثال: ب-7"}
                value={transferForm.toBed}
                onChange={e => setTransferForm({ ...transferForm, toBed: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{lang === "en" ? "Transfer Reason / Clinical Justification" : "سبب النقل / المبرر السريري"}</label>
              <textarea
                style={{ ...inputStyle, height: "90px", resize: "vertical" }}
                placeholder={lang === "en" ? "Reason for patient transfer..." : "سبب نقل المريض..."}
                value={transferForm.reason}
                onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button style={{ ...btnPrimary, background: "#f59e0b" }} onClick={() => handleFormSubmit(lang === "en" ? "Transfer" : "نقل")}>
              {lang === "en" ? "Initiate Transfer" : "بدء النقل"}
            </button>
            <button
              style={{ ...btnPrimary, background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              onClick={() => setTransferForm({ mrn: "", fromWard: "", fromBed: "", toWard: "", toBed: "", reason: "" })}
            >
              {lang === "en" ? "Clear" : "مسح"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
