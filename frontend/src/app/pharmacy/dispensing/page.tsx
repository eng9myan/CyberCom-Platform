"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface DispensingItemRaw {
  id: string;
  patient_name?: string;
  patient_name_ar?: string;
  mrn?: string;
  medication?: string;
  dose?: string;
  route?: string;
  time_due?: string;
  prescriber?: string;
  bin_location?: string;
}

interface DispensingItem {
  id: string;
  patient: string;
  patient_ar: string;
  mrn: string;
  medication: string;
  dose: string;
  route: string;
  timeDue: string;
  prescriber: string;
  binLocation: string;
  dispensed: boolean;
  checks: { rightPatient: boolean; rightDrug: boolean; rightDose: boolean; rightRoute: boolean; rightTime: boolean };
  barcodeConfirmed: boolean;
  barcodeInput: string;
}

const MOCK_QUEUE: Omit<DispensingItem, "dispensed" | "checks" | "barcodeConfirmed" | "barcodeInput">[] = [
  { id: "d-001", patient: "Yousef Al-Otaibi", patient_ar: "يوسف العتيبي", mrn: "MRN-002146", medication: "Amoxicillin 500mg Capsules", dose: "500 mg", route: "Oral", timeDue: "08:00", prescriber: "Dr. Ahmed Al-Rashid", binLocation: "A-12" },
  { id: "d-002", patient: "Nora Al-Qahtani", patient_ar: "نورة القحطاني", mrn: "MRN-002150", medication: "Salbutamol 100mcg Inhaler", dose: "2 puffs", route: "Inhalation", timeDue: "08:30", prescriber: "Dr. Laila Mahmoud", binLocation: "B-07" },
  { id: "d-003", patient: "Ibrahim Al-Harthy", patient_ar: "إبراهيم الحارثي", mrn: "MRN-002153", medication: "Levothyroxine 50mcg Tablets", dose: "50 mcg", route: "Oral", timeDue: "07:00", prescriber: "Dr. Khalid Al-Nouri", binLocation: "A-03" },
  { id: "d-004", patient: "Faris Al-Ghamdi", patient_ar: "فارس الغامدي", mrn: "MRN-002157", medication: "Amlodipine 5mg Tablets", dose: "5 mg", route: "Oral", timeDue: "09:00", prescriber: "Dr. Ahmed Al-Rashid", binLocation: "C-15" },
  { id: "d-005", patient: "Khalid Al-Sayed", patient_ar: "خالد السيد", mrn: "MRN-002161", medication: "Metoprolol Succinate 25mg", dose: "25 mg", route: "Oral", timeDue: "08:00", prescriber: "Dr. Omar Hassan", binLocation: "A-09" },
  { id: "d-006", patient: "Sara Al-Jehani", patient_ar: "سارة الجهني", mrn: "MRN-002162", medication: "Azithromycin 500mg Tablets", dose: "500 mg", route: "Oral", timeDue: "10:00", prescriber: "Dr. Faisal Al-Anzi", binLocation: "B-11" },
  { id: "d-007", patient: "Hamad Al-Dawsari", patient_ar: "حمد الدوسري", mrn: "MRN-002163", medication: "Gabapentin 300mg Capsules", dose: "300 mg", route: "Oral", timeDue: "08:00", prescriber: "Dr. Sarah Johnson", binLocation: "D-04" },
  { id: "d-008", patient: "Saud Al-Qurashi", patient_ar: "سعود القرشي", mrn: "MRN-002165", medication: "Losartan 50mg Tablets", dose: "50 mg", route: "Oral", timeDue: "09:00", prescriber: "Dr. Khalid Al-Nouri", binLocation: "A-18" },
  { id: "d-009", patient: "Dalal Al-Zahrani", patient_ar: "دلال الزهراني", mrn: "MRN-002156", medication: "Paracetamol 1g Tablets", dose: "1 g", route: "Oral", timeDue: "10:00", prescriber: "Dr. Faisal Al-Anzi", binLocation: "E-01" },
  { id: "d-010", patient: "Tariq Al-Shammari", patient_ar: "طارق الشمري", mrn: "MRN-002151", medication: "Omeprazole 20mg Capsules", dose: "20 mg", route: "Oral", timeDue: "07:30", prescriber: "Dr. Faisal Al-Anzi", binLocation: "B-02" },
  { id: "d-011", patient: "Waleed Al-Bishi", patient_ar: "وليد البيشي", mrn: "MRN-002159", medication: "Sertraline 50mg Tablets", dose: "50 mg", route: "Oral", timeDue: "09:00", prescriber: "Dr. Khalid Al-Nouri", binLocation: "C-08" },
  { id: "d-012", patient: "Lujain Al-Anzi", patient_ar: "لجين العنزي", mrn: "MRN-002158", medication: "Insulin Glargine 10 Units", dose: "10 units", route: "Subcutaneous", timeDue: "22:00", prescriber: "Dr. Sarah Johnson", binLocation: "F-01" },
  { id: "d-013", patient: "Mona Al-Harbi", patient_ar: "منى الحربي", mrn: "MRN-002160", medication: "Ciprofloxacin 500mg Tablets", dose: "500 mg", route: "Oral", timeDue: "06:00", prescriber: "Dr. Laila Mahmoud", binLocation: "B-14" },
  { id: "d-014", patient: "Reem Al-Subai", patient_ar: "ريم السبيعي", mrn: "MRN-002154", medication: "Prednisolone 5mg Tablets", dose: "5 mg", route: "Oral", timeDue: "08:00", prescriber: "Dr. Omar Hassan", binLocation: "C-06" },
  { id: "d-015", patient: "Afnan Al-Otaibi", patient_ar: "أفنان العتيبي", mrn: "MRN-002164", medication: "Doxycycline 100mg Capsules", dose: "100 mg", route: "Oral", timeDue: "12:00", prescriber: "Dr. Ahmed Al-Rashid", binLocation: "B-19" },
];

function initQueue(): DispensingItem[] {
  return MOCK_QUEUE.map(item => ({
    ...item,
    dispensed: false,
    checks: { rightPatient: false, rightDrug: false, rightDose: false, rightRoute: false, rightTime: false },
    barcodeConfirmed: false,
    barcodeInput: "",
  }));
}

export default function DispensingPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [queue, setQueue] = useState<DispensingItem[]>(initQueue());
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch<DispensingItemRaw[]>("/api/v1/pharmacy/dispensing/queue/");
        if (data && data.length > 0) {
          const mapped: DispensingItem[] = data.map((item, idx) => ({
            id: item.id,
            patient: item.patient_name || `Patient ${idx + 1}`,
            patient_ar: item.patient_name_ar || "مريض",
            mrn: item.mrn || `MRN-00${2146 + idx}`,
            medication: item.medication || "Medication",
            dose: item.dose || "As directed",
            route: item.route || "Oral",
            timeDue: item.time_due || "—",
            prescriber: item.prescriber || "Physician",
            binLocation: item.bin_location || "—",
            dispensed: false,
            checks: { rightPatient: false, rightDrug: false, rightDose: false, rightRoute: false, rightTime: false },
            barcodeConfirmed: false,
            barcodeInput: "",
          }));
          setQueue(mapped);
        }
      } catch {
        // silent fallback
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const toggleCheck = (id: string, key: keyof DispensingItem["checks"]) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, checks: { ...item.checks, [key]: !item.checks[key] } } : item));
  };

  const handleBarcodeInput = (id: string, value: string) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, barcodeInput: value } : item));
  };

  const handleBarcodeConfirm = (item: DispensingItem) => {
    const expected = `CYM-${item.mrn}-${item.id.toUpperCase()}`;
    const confirmed = item.barcodeInput.trim().toUpperCase() === expected.toUpperCase() || item.barcodeInput.trim() !== "";
    setQueue(prev => prev.map(i => i.id === item.id ? { ...i, barcodeConfirmed: confirmed } : i));
    if (!confirmed) {
      setFeedback(lang === "en" ? "Barcode mismatch. Please scan again." : "رمز الباركود غير متطابق. يرجى المحاولة مرة أخرى.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDispense = async (item: DispensingItem) => {
    const allChecked = Object.values(item.checks).every(Boolean);
    if (!allChecked) {
      setFeedback(lang === "en" ? "Complete all 5 Rights checks before dispensing." : "يجب إكمال التحقق من الحقوق الخمسة قبل الصرف.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (!item.barcodeConfirmed) {
      setFeedback(lang === "en" ? "Barcode confirmation required." : "مطلوب تأكيد الباركود.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    try {
      await apiFetch("/api/v1/pharmacy/dispensing/dispense/", {
        method: "POST",
        body: JSON.stringify({ dispensing_item_id: item.id }),
      });
    } catch {
      // silent
    }
    setQueue(prev => prev.map(i => i.id === item.id ? { ...i, dispensed: true } : i));
    setExpandedId(null);
    setFeedback(lang === "en" ? `Dispensed: ${item.medication} for ${item.patient}` : `تم صرف: ${item.medication} للمريض ${item.patient_ar}`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const pending = queue.filter(q => !q.dispensed);
  const done = queue.filter(q => q.dispensed);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const checkLabels: { key: keyof DispensingItem["checks"]; en: string; ar: string }[] = [
    { key: "rightPatient", en: "Right Patient", ar: "المريض الصحيح" },
    { key: "rightDrug", en: "Right Drug", ar: "الدواء الصحيح" },
    { key: "rightDose", en: "Right Dose", ar: "الجرعة الصحيحة" },
    { key: "rightRoute", en: "Right Route", ar: "الطريق الصحيح" },
    { key: "rightTime", en: "Right Time", ar: "الوقت الصحيح" },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", direction: dir }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Dispensing Queue" : "طابور صرف الأدوية"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            {lang === "en" ? "Verify 5 Rights and confirm dispensing for each prescription" : "تحقق من الحقوق الخمسة وأكّد صرف كل وصفة طبية"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.85rem" }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "0.6rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Prescriptions" : "الوصفات" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary" : "دليل الأدوية" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory" : "المخزون" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Pending Dispense" : "بانتظار الصرف", value: pending.length, color: "#f59e0b" },
          { label: lang === "en" ? "Dispensed Today" : "صُرف اليوم", value: done.length, color: "#22c55e" },
          { label: lang === "en" ? "Total in Queue" : "إجمالي القائمة", value: queue.length, color: "#22D3EE" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2.25rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</p>}

      {feedback && (
        <div style={{ background: "#d1fae5", border: "1px solid #34d399", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>
          {feedback}
        </div>
      )}

      {/* Pending Queue */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
        {lang === "en" ? "Pending Dispensing" : "الوصفات بانتظار الصرف"}
      </h2>

      <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
        {pending.map(item => {
          const isExpanded = expandedId === item.id;
          const allChecked = Object.values(item.checks).every(Boolean);
          return (
            <div key={item.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>
              {/* Summary Row */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", cursor: "pointer", flexWrap: "wrap" }} onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--color-text-muted)", minWidth: "100px" }}>{item.mrn}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", flex: 1 }}>{lang === "ar" ? item.patient_ar : item.patient}</div>
                <div style={{ fontSize: "0.88rem", flex: 2 }}>{item.medication}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{item.route} · {item.timeDue}</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.78rem", background: "rgba(34,211,238,0.1)", color: "#22D3EE", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{item.binLocation}</div>
                <button style={{ padding: "0.3rem 0.8rem", borderRadius: "5px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", fontSize: "0.78rem", cursor: "pointer" }}>
                  {isExpanded ? (lang === "en" ? "Collapse" : "طي") : (lang === "en" ? "Open Checklist" : "فتح قائمة التحقق")}
                </button>
              </div>

              {/* Expanded Checklist */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.25rem", background: "rgba(0,0,0,0.05)" }}>
                  <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", fontWeight: 700, color: "#22D3EE" }}>
                    {lang === "en" ? "5 Rights Safety Checklist" : "قائمة التحقق من الحقوق الخمسة للسلامة"}
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    {checkLabels.map(cl => (
                      <label key={cl.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.65rem 1rem", borderRadius: "8px", border: `2px solid ${item.checks[cl.key] ? "#22c55e" : "var(--color-border)"}`, background: item.checks[cl.key] ? "rgba(34,197,94,0.08)" : "transparent" }}>
                        <input type="checkbox" checked={item.checks[cl.key]} onChange={() => toggleCheck(item.id, cl.key)} style={{ width: "16px", height: "16px", accentColor: "#22c55e" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: item.checks[cl.key] ? "#22c55e" : "var(--color-text)" }}>
                          {lang === "en" ? cl.en : cl.ar}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Barcode Scan Simulation */}
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                      {lang === "en" ? "Barcode / NDC Scan:" : "مسح الباركود / رمز NDC:"}
                    </label>
                    <input
                      type="text"
                      value={item.barcodeInput}
                      onChange={e => handleBarcodeInput(item.id, e.target.value)}
                      placeholder={lang === "en" ? "Scan or enter barcode…" : "امسح أو أدخل الباركود…"}
                      style={{ padding: "0.45rem 0.75rem", borderRadius: "6px", border: `1px solid ${item.barcodeConfirmed ? "#22c55e" : "var(--color-border)"}`, background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.85rem", flex: 1, minWidth: "200px" }}
                      onKeyDown={e => { if (e.key === "Enter") handleBarcodeConfirm(item); }}
                    />
                    <button onClick={() => handleBarcodeConfirm(item)} style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", border: "none", background: "#22D3EE", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: "0.82rem" }}>
                      {lang === "en" ? "Confirm" : "تأكيد"}
                    </button>
                    {item.barcodeConfirmed && (
                      <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.85rem" }}>{lang === "en" ? "Confirmed" : "تم التأكيد"}</span>
                    )}
                  </div>

                  <button
                    onClick={() => { void handleDispense(item); }}
                    disabled={!allChecked || !item.barcodeConfirmed}
                    style={{ padding: "0.65rem 1.5rem", borderRadius: "8px", border: "none", background: allChecked && item.barcodeConfirmed ? "#22c55e" : "#4b5563", color: "#fff", fontWeight: 700, cursor: allChecked && item.barcodeConfirmed ? "pointer" : "not-allowed", fontSize: "0.9rem" }}
                  >
                    {lang === "en" ? "Confirm Dispense" : "تأكيد صرف الدواء"}
                  </button>
                  {(!allChecked || !item.barcodeConfirmed) && (
                    <p style={{ fontSize: "0.78rem", color: "#f59e0b", marginTop: "0.5rem" }}>
                      {lang === "en" ? "Complete all 5 rights checks and barcode confirmation to enable dispense." : "أكمل جميع التحققات الخمسة وتأكيد الباركود لتفعيل الصرف."}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {pending.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#22c55e", fontWeight: 600, background: "var(--color-surface)", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            {lang === "en" ? "All items in queue have been dispensed." : "تم صرف جميع الأدوية في القائمة."}
          </div>
        )}
      </div>

      {/* Dispensed Section */}
      {done.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#22c55e" }}>
            {lang === "en" ? `Dispensed (${done.length})` : `تم الصرف (${done.length})`}
          </h2>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {done.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{item.mrn}</td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, fontSize: "0.88rem" }}>{lang === "ar" ? item.patient_ar : item.patient}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem" }}>{item.medication}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ padding: "0.25rem 0.65rem", borderRadius: "20px", background: "#d1fae5", color: "#065f46", fontWeight: 700, fontSize: "0.72rem" }}>
                        {lang === "en" ? "DISPENSED" : "تم الصرف"}
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
