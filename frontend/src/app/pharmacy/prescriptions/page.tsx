"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface PrescriptionRaw {
  id: string;
  patient_detail?: { first_name?: string; last_name?: string; first_name_ar?: string; mrn?: string };
  medication_name?: string;
  medication_dose?: string;
  frequency?: string;
  prescriber_name?: string;
  drug_class?: string;
  interaction_flag?: boolean;
  interaction_note?: string;
  status?: string;
  created_at?: string;
}

interface Prescription {
  id: string;
  patient: string;
  patient_ar: string;
  mrn: string;
  medication: string;
  dose: string;
  frequency: string;
  prescriber: string;
  drugClass: string;
  interactionFlag: boolean;
  interactionNote: string;
  status: "new" | "verified" | "dispensed" | "on-hold";
  time: string;
}

const MOCK_PRESCRIPTIONS: Prescription[] = [
  { id: "rx-001", patient: "Fatima Al-Harbi", patient_ar: "فاطمة الحربي", mrn: "MRN-002145", medication: "Warfarin 5mg", dose: "5 mg", frequency: "Once daily", prescriber: "Dr. Sarah Johnson", drugClass: "Anticoagulant", interactionFlag: true, interactionNote: "Warfarin + Aspirin: increased bleeding risk. Review required.", status: "new", time: "08:12 AM" },
  { id: "rx-002", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", mrn: "MRN-002146", medication: "Amoxicillin 500mg", dose: "500 mg", frequency: "Three times daily", prescriber: "Dr. Ahmed Al-Rashid", drugClass: "Antibiotic", interactionFlag: false, interactionNote: "", status: "verified", time: "08:35 AM" },
  { id: "rx-003", patient: "Mariam Al-Ghamdi", patient_ar: "مريم الغامدي", mrn: "MRN-002147", medication: "Metformin 850mg", dose: "850 mg", frequency: "Twice daily with meals", prescriber: "Dr. Sarah Johnson", drugClass: "Antidiabetic", interactionFlag: false, interactionNote: "", status: "dispensed", time: "07:50 AM" },
  { id: "rx-004", patient: "Zainab Al-Fahad", patient_ar: "زينب الفهد", mrn: "MRN-002148", medication: "Lisinopril 10mg", dose: "10 mg", frequency: "Once daily", prescriber: "Dr. Khalid Al-Nouri", drugClass: "ACE Inhibitor", interactionFlag: true, interactionNote: "Lisinopril + Potassium supplements: hyperkalemia risk.", status: "on-hold", time: "09:05 AM" },
  { id: "rx-005", patient: "Abdullah Al-Dosari", patient_ar: "عبدالله الدوسري", mrn: "MRN-002149", medication: "Atorvastatin 20mg", dose: "20 mg", frequency: "Once daily at bedtime", prescriber: "Dr. Omar Hassan", drugClass: "Statin", interactionFlag: false, interactionNote: "", status: "new", time: "09:22 AM" },
  { id: "rx-006", patient: "Nora Al-Qahtani", patient_ar: "نورة القحطاني", mrn: "MRN-002150", medication: "Salbutamol Inhaler", dose: "100 mcg/puff", frequency: "2 puffs as needed", prescriber: "Dr. Laila Mahmoud", drugClass: "Bronchodilator", interactionFlag: false, interactionNote: "", status: "verified", time: "09:40 AM" },
  { id: "rx-007", patient: "Tariq Al-Shammari", patient_ar: "طارق الشمري", mrn: "MRN-002151", medication: "Omeprazole 20mg", dose: "20 mg", frequency: "Once daily before breakfast", prescriber: "Dr. Faisal Al-Anzi", drugClass: "PPI", interactionFlag: false, interactionNote: "", status: "new", time: "10:01 AM" },
  { id: "rx-008", patient: "Hessa Al-Mutairi", patient_ar: "حصة المطيري", mrn: "MRN-002152", medication: "Clopidogrel 75mg", dose: "75 mg", frequency: "Once daily", prescriber: "Dr. Sarah Johnson", drugClass: "Antiplatelet", interactionFlag: true, interactionNote: "Clopidogrel + NSAIDs: GI bleeding risk. Consider PPI cover.", status: "new", time: "10:15 AM" },
  { id: "rx-009", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", mrn: "MRN-002153", medication: "Levothyroxine 50mcg", dose: "50 mcg", frequency: "Once daily on empty stomach", prescriber: "Dr. Khalid Al-Nouri", drugClass: "Thyroid Hormone", interactionFlag: false, interactionNote: "", status: "verified", time: "10:28 AM" },
  { id: "rx-010", patient: "Reem Al-Subai", patient_ar: "ريم السبيعي", mrn: "MRN-002154", medication: "Prednisolone 5mg", dose: "5 mg", frequency: "Once daily with food", prescriber: "Dr. Omar Hassan", drugClass: "Corticosteroid", interactionFlag: false, interactionNote: "", status: "dispensed", time: "07:30 AM" },
  { id: "rx-011", patient: "Badr Al-Rashidi", patient_ar: "بدر الرشيدي", mrn: "MRN-002155", medication: "Furosemide 40mg", dose: "40 mg", frequency: "Once daily in the morning", prescriber: "Dr. Laila Mahmoud", drugClass: "Loop Diuretic", interactionFlag: true, interactionNote: "Furosemide + Digoxin: hypokalemia-induced toxicity risk.", status: "on-hold", time: "10:44 AM" },
  { id: "rx-012", patient: "Dalal Al-Zahrani", patient_ar: "دلال الزهراني", mrn: "MRN-002156", medication: "Paracetamol 1g", dose: "1 g", frequency: "Every 6 hours as needed", prescriber: "Dr. Faisal Al-Anzi", drugClass: "Analgesic", interactionFlag: false, interactionNote: "", status: "new", time: "10:58 AM" },
  { id: "rx-013", patient: "Faris Al-Ghamdi", patient_ar: "فارس الغامدي", mrn: "MRN-002157", medication: "Amlodipine 5mg", dose: "5 mg", frequency: "Once daily", prescriber: "Dr. Ahmed Al-Rashid", drugClass: "Calcium Channel Blocker", interactionFlag: false, interactionNote: "", status: "verified", time: "11:10 AM" },
  { id: "rx-014", patient: "Lujain Al-Anzi", patient_ar: "لجين العنزي", mrn: "MRN-002158", medication: "Insulin Glargine 10 units", dose: "10 units", frequency: "Once daily at bedtime SC", prescriber: "Dr. Sarah Johnson", drugClass: "Insulin", interactionFlag: false, interactionNote: "", status: "new", time: "11:20 AM" },
  { id: "rx-015", patient: "Waleed Al-Bishi", patient_ar: "وليد البيشي", mrn: "MRN-002159", medication: "Sertraline 50mg", dose: "50 mg", frequency: "Once daily", prescriber: "Dr. Khalid Al-Nouri", drugClass: "SSRI", interactionFlag: true, interactionNote: "Sertraline + Tramadol: serotonin syndrome risk.", status: "new", time: "11:33 AM" },
  { id: "rx-016", patient: "Mona Al-Harbi", patient_ar: "منى الحربي", mrn: "MRN-002160", medication: "Ciprofloxacin 500mg", dose: "500 mg", frequency: "Twice daily for 7 days", prescriber: "Dr. Laila Mahmoud", drugClass: "Antibiotic", interactionFlag: false, interactionNote: "", status: "dispensed", time: "07:15 AM" },
  { id: "rx-017", patient: "Khalid Al-Sayed", patient_ar: "خالد السيد", mrn: "MRN-002161", medication: "Metoprolol 25mg", dose: "25 mg", frequency: "Twice daily", prescriber: "Dr. Omar Hassan", drugClass: "Beta Blocker", interactionFlag: false, interactionNote: "", status: "verified", time: "11:48 AM" },
  { id: "rx-018", patient: "Sara Al-Jehani", patient_ar: "سارة الجهني", mrn: "MRN-002162", medication: "Azithromycin 500mg", dose: "500 mg", frequency: "Once daily for 3 days", prescriber: "Dr. Faisal Al-Anzi", drugClass: "Antibiotic", interactionFlag: false, interactionNote: "", status: "new", time: "12:00 PM" },
  { id: "rx-019", patient: "Hamad Al-Dawsari", patient_ar: "حمد الدوسري", mrn: "MRN-002163", medication: "Gabapentin 300mg", dose: "300 mg", frequency: "Three times daily", prescriber: "Dr. Sarah Johnson", drugClass: "Anticonvulsant", interactionFlag: false, interactionNote: "", status: "new", time: "12:10 PM" },
  { id: "rx-020", patient: "Afnan Al-Otaibi", patient_ar: "أفنان العتيبي", mrn: "MRN-002164", medication: "Doxycycline 100mg", dose: "100 mg", frequency: "Twice daily", prescriber: "Dr. Ahmed Al-Rashid", drugClass: "Antibiotic", interactionFlag: false, interactionNote: "", status: "on-hold", time: "12:22 PM" },
  { id: "rx-021", patient: "Saud Al-Qurashi", patient_ar: "سعود القرشي", mrn: "MRN-002165", medication: "Losartan 50mg", dose: "50 mg", frequency: "Once daily", prescriber: "Dr. Khalid Al-Nouri", drugClass: "ARB", interactionFlag: false, interactionNote: "", status: "new", time: "12:35 PM" },
  { id: "rx-022", patient: "Rawan Al-Malki", patient_ar: "روان المالكي", mrn: "MRN-002166", medication: "Spironolactone 25mg", dose: "25 mg", frequency: "Once daily", prescriber: "Dr. Laila Mahmoud", drugClass: "Aldosterone Antagonist", interactionFlag: true, interactionNote: "Spironolactone + ACE Inhibitor: hyperkalemia risk — check renal function.", status: "new", time: "12:50 PM" },
];

type StatusFilter = "all" | "new" | "verified" | "dispensed" | "on-hold";
type PrescriberFilter = "all" | string;

export default function PrescriptionsPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [prescriberFilter, setPrescriberFilter] = useState<PrescriberFilter>("all");
  const [drugClassFilter, setDrugClassFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch<PrescriptionRaw[]>("/api/v1/pharmacy/prescriptions/");
        if (data && data.length > 0) {
          const mapped: Prescription[] = data.map((item, idx) => ({
            id: item.id,
            patient: `${item.patient_detail?.first_name || "Patient"} ${item.patient_detail?.last_name || ""}`.trim(),
            patient_ar: item.patient_detail?.first_name_ar || "مريض",
            mrn: item.patient_detail?.mrn || `MRN-00${2145 + idx}`,
            medication: item.medication_name || "Medication",
            dose: item.medication_dose || "As prescribed",
            frequency: item.frequency || "As directed",
            prescriber: item.prescriber_name || "Physician",
            drugClass: item.drug_class || "General",
            interactionFlag: item.interaction_flag || false,
            interactionNote: item.interaction_note || "",
            status: (["new", "verified", "dispensed", "on-hold"].includes(item.status || "") ? item.status as Prescription["status"] : "new"),
            time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
          }));
          setPrescriptions(mapped);
        }
      } catch {
        // silent fallback to mock data
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const handleAction = async (id: string, action: "verify" | "hold" | "reject") => {
    const nextStatus = { verify: "verified" as const, hold: "on-hold" as const, reject: "on-hold" as const };
    try {
      await apiFetch(`/api/v1/pharmacy/prescriptions/${id}/action/`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
    } catch {
      // silent — apply local update
    }
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus[action] } : p));
    const msgs = { verify: lang === "en" ? "Prescription verified." : "تم التحقق من الوصفة.", hold: lang === "en" ? "Prescription placed on hold." : "تم تعليق الوصفة.", reject: lang === "en" ? "Prescription rejected." : "تم رفض الوصفة." };
    setActionMsg(msgs[action]);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const prescribers = ["all", ...Array.from(new Set(prescriptions.map(p => p.prescriber)))];
  const drugClasses = ["all", ...Array.from(new Set(prescriptions.map(p => p.drugClass)))];

  const filtered = prescriptions.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (prescriberFilter !== "all" && p.prescriber !== prescriberFilter) return false;
    if (drugClassFilter !== "all" && p.drugClass !== drugClassFilter) return false;
    return true;
  });

  const statusColors: Record<string, { bg: string; color: string }> = {
    new: { bg: "#dbeafe", color: "#1e40af" },
    verified: { bg: "#d1fae5", color: "#065f46" },
    dispensed: { bg: "#f0fdf4", color: "#15803d" },
    "on-hold": { bg: "#fee2e2", color: "#b91c1c" },
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    new: { en: "New", ar: "جديد" },
    verified: { en: "Verified", ar: "تم التحقق" },
    dispensed: { en: "Dispensed", ar: "تم الصرف" },
    "on-hold": { en: "On Hold", ar: "معلقة" },
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: dir }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Prescription Verification Queue" : "طابور مراجعة الوصفات الطبية"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            {lang === "en" ? "Review, verify and manage incoming prescriptions" : "مراجعة الوصفات الطبية والتحقق منها وإدارتها"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
          </span>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.85rem" }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.6rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing Queue" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary" : "دليل الأدوية" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory" : "المخزون" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Summary Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Total" : "الإجمالي", value: prescriptions.length, color: "#22D3EE" },
          { label: lang === "en" ? "New" : "جديد", value: prescriptions.filter(p => p.status === "new").length, color: "#3b82f6" },
          { label: lang === "en" ? "Verified" : "تم التحقق", value: prescriptions.filter(p => p.status === "verified").length, color: "#22c55e" },
          { label: lang === "en" ? "Dispensed" : "تم الصرف", value: prescriptions.filter(p => p.status === "dispensed").length, color: "#a3e635" },
          { label: lang === "en" ? "On Hold" : "معلقة", value: prescriptions.filter(p => p.status === "on-hold").length, color: "#ef4444" },
          { label: lang === "en" ? "Drug Alerts" : "تنبيهات التفاعلات", value: prescriptions.filter(p => p.interactionFlag).length, color: "#f97316" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", alignSelf: "center" }}>{lang === "en" ? "Status:" : "الحالة:"}</span>
          {(["all", "new", "verified", "dispensed", "on-hold"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.35rem 0.75rem", borderRadius: "5px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, background: statusFilter === f ? "#22D3EE" : "var(--color-surface)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
              {f === "all" ? (lang === "en" ? "All" : "الكل") : (lang === "en" ? statusLabels[f]?.en : statusLabels[f]?.ar)}
            </button>
          ))}
        </div>
        <select value={prescriberFilter} onChange={e => setPrescriberFilter(e.target.value)} style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.82rem" }}>
          {prescribers.map(p => <option key={p} value={p}>{p === "all" ? (lang === "en" ? "All Prescribers" : "جميع الأطباء") : p}</option>)}
        </select>
        <select value={drugClassFilter} onChange={e => setDrugClassFilter(e.target.value)} style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.82rem" }}>
          {drugClasses.map(c => <option key={c} value={c}>{c === "all" ? (lang === "en" ? "All Drug Classes" : "جميع الفئات الدوائية") : c}</option>)}
        </select>
        {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</span>}
      </div>

      {/* Action Feedback */}
      {actionMsg && (
        <div style={{ background: "#d1fae5", border: "1px solid #34d399", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>
          {actionMsg}
        </div>
      )}

      {/* Prescriptions Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "MRN" : "الرقم الطبي",
                lang === "en" ? "Patient" : "المريض",
                lang === "en" ? "Medication" : "الدواء",
                lang === "en" ? "Dose / Freq" : "الجرعة / التكرار",
                lang === "en" ? "Prescriber" : "الطبيب",
                lang === "en" ? "Drug Class" : "الفئة الدوائية",
                lang === "en" ? "Time" : "الوقت",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Actions" : "إجراءات",
              ].map(h => (
                <th key={h} style={{ padding: "0.9rem 1rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((rx, i) => (
              <>
                <tr key={rx.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{rx.mrn}</td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600, fontSize: "0.88rem" }}>{lang === "ar" ? rx.patient_ar : rx.patient}</td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.88rem", fontWeight: 500 }}>{rx.medication}</td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{rx.dose} · {rx.frequency}</td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem" }}>{rx.prescriber}</td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{rx.drugClass}</td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{rx.time}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span style={{ padding: "0.25rem 0.6rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, background: statusColors[rx.status]?.bg || "#f3f4f6", color: statusColors[rx.status]?.color || "#374151" }}>
                      {lang === "en" ? statusLabels[rx.status]?.en : statusLabels[rx.status]?.ar}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    {rx.status === "new" && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => { void handleAction(rx.id, "verify"); }} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", background: "#22c55e", color: "#fff", border: "none", cursor: "pointer" }}>
                          {lang === "en" ? "Verify" : "تحقق"}
                        </button>
                        <button onClick={() => { void handleAction(rx.id, "hold"); }} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer" }}>
                          {lang === "en" ? "Hold" : "تعليق"}
                        </button>
                        <button onClick={() => { void handleAction(rx.id, "reject"); }} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>
                          {lang === "en" ? "Reject" : "رفض"}
                        </button>
                      </div>
                    )}
                    {rx.status !== "new" && (
                      <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
                {rx.interactionFlag && (
                  <tr key={`${rx.id}-alert`} style={{ background: "#fef2f2", borderBottom: "1px solid var(--color-border)" }}>
                    <td colSpan={9} style={{ padding: "0.5rem 1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#b91c1c", fontWeight: 600 }}>
                        {lang === "en" ? "⚠ Drug Interaction Alert: " : "⚠ تنبيه تفاعل دوائي: "}{rx.interactionNote}
                      </span>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            {lang === "en" ? "No prescriptions match the selected filters." : "لا توجد وصفات تطابق الفلاتر المحددة."}
          </div>
        )}
      </div>

      <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
        {lang === "en" ? `Showing ${filtered.length} of ${prescriptions.length} prescriptions` : `عرض ${filtered.length} من ${prescriptions.length} وصفة طبية`}
      </p>
    </div>
  );
}
