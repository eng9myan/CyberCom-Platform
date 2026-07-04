"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type BillingStatus = "unbilled" | "pending" | "submitted";

interface BillingEncounter {
  id: string;
  patient_name: string;
  patient_name_ar: string;
  mrn: string;
  visit_date: string;
  provider: string;
  icd_codes: string[];
  cpt_codes: string[];
  charges: number;
  status: BillingStatus;
}

interface BillingMetrics {
  unbilled: number;
  billed: number;
  collected: number;
  ar_days: number;
}

const ENCOUNTERS: BillingEncounter[] = [
  { id: "ENC-001", patient_name: "Ahmad Al-Rashidi", patient_name_ar: "أحمد الراشدي", mrn: "MRN-001", visit_date: "2026-06-28", provider: "Dr. Hassan", icd_codes: ["E11.9", "E78.5"], cpt_codes: ["99214", "83036"], charges: 1250, status: "unbilled" },
  { id: "ENC-002", patient_name: "Mariam Al-Harbi", patient_name_ar: "مريم الحربي", mrn: "MRN-002", visit_date: "2026-06-27", provider: "Dr. Hassan", icd_codes: ["I10"], cpt_codes: ["99213", "93000"], charges: 980, status: "pending" },
  { id: "ENC-003", patient_name: "Khalid Al-Zahrani", patient_name_ar: "خالد الزهراني", mrn: "MRN-003", visit_date: "2026-06-25", provider: "Dr. Aisha", icd_codes: ["I25.10", "I50.9"], cpt_codes: ["99215", "93306", "71046"], charges: 3400, status: "submitted" },
  { id: "ENC-004", patient_name: "Fatima Al-Ghamdi", patient_name_ar: "فاطمة الغامدي", mrn: "MRN-004", visit_date: "2026-06-29", provider: "Dr. Hassan", icd_codes: ["J45.20"], cpt_codes: ["99213", "94010"], charges: 850, status: "unbilled" },
  { id: "ENC-005", patient_name: "Omar Al-Qahtani", patient_name_ar: "عمر القحطاني", mrn: "MRN-005", visit_date: "2026-06-26", provider: "Dr. Hassan", icd_codes: ["N18.32", "E11.22"], cpt_codes: ["99215", "82565", "82570"], charges: 2100, status: "pending" },
  { id: "ENC-006", patient_name: "Noura Al-Shehri", patient_name_ar: "نورة الشهري", mrn: "MRN-006", visit_date: "2026-06-28", provider: "Dr. Sara", icd_codes: ["E03.9"], cpt_codes: ["99213", "84443"], charges: 780, status: "unbilled" },
  { id: "ENC-007", patient_name: "Abdulaziz Al-Dossari", patient_name_ar: "عبدالعزيز الدوسري", mrn: "MRN-007", visit_date: "2026-06-24", provider: "Dr. Aisha", icd_codes: ["J44.1"], cpt_codes: ["99215", "94010", "94726"], charges: 2800, status: "submitted" },
  { id: "ENC-008", patient_name: "Sara Al-Mutairi", patient_name_ar: "سارة المطيري", mrn: "MRN-008", visit_date: "2026-06-27", provider: "Dr. Hassan", icd_codes: ["M05.79"], cpt_codes: ["99214", "86431"], charges: 1600, status: "pending" },
  { id: "ENC-009", patient_name: "Majed Al-Otaibi", patient_name_ar: "ماجد العتيبي", mrn: "MRN-009", visit_date: "2026-06-23", provider: "Dr. Aisha", icd_codes: ["I50.9", "I25.10"], cpt_codes: ["99215", "93306", "93350"], charges: 4200, status: "submitted" },
  { id: "ENC-010", patient_name: "Hessa Al-Anazi", patient_name_ar: "حصة العنزي", mrn: "MRN-010", visit_date: "2026-06-29", provider: "Dr. Sara", icd_codes: ["D50.9"], cpt_codes: ["99212", "85025", "82728"], charges: 640, status: "unbilled" },
  { id: "ENC-011", patient_name: "Saud Al-Bishi", patient_name_ar: "سعود البيشي", mrn: "MRN-011", visit_date: "2026-06-26", provider: "Dr. Hassan", icd_codes: ["I48.91"], cpt_codes: ["99214", "93000", "85610"], charges: 1380, status: "pending" },
  { id: "ENC-012", patient_name: "Reem Al-Maliki", patient_name_ar: "ريم المالكي", mrn: "MRN-012", visit_date: "2026-06-28", provider: "Dr. Sara", icd_codes: ["G43.909"], cpt_codes: ["99213"], charges: 720, status: "unbilled" },
  { id: "ENC-013", patient_name: "Turki Al-Fahad", patient_name_ar: "تركي الفهد", mrn: "MRN-013", visit_date: "2026-06-25", provider: "Dr. Hassan", icd_codes: ["E11.9", "I10"], cpt_codes: ["99215", "83036", "82565"], charges: 1850, status: "pending" },
  { id: "ENC-014", patient_name: "Manal Al-Sulami", patient_name_ar: "منال السلمي", mrn: "MRN-014", visit_date: "2026-06-27", provider: "Dr. Sara", icd_codes: ["M81.0"], cpt_codes: ["99213", "77080"], charges: 1200, status: "submitted" },
  { id: "ENC-015", patient_name: "Faisal Al-Jabri", patient_name_ar: "فيصل الجابري", mrn: "MRN-015", visit_date: "2026-06-24", provider: "Dr. Aisha", icd_codes: ["G20"], cpt_codes: ["99215", "95923"], charges: 2200, status: "submitted" },
  { id: "ENC-016", patient_name: "Dalal Al-Subhi", patient_name_ar: "دلال الصبحي", mrn: "MRN-016", visit_date: "2026-06-29", provider: "Dr. Hassan", icd_codes: ["M32.9", "N05.9"], cpt_codes: ["99214", "86520", "86235"], charges: 2900, status: "unbilled" },
  { id: "ENC-017", patient_name: "Nasser Al-Ruwaili", patient_name_ar: "ناصر الرويلي", mrn: "MRN-017", visit_date: "2026-06-28", provider: "Dr. Sara", icd_codes: ["K27.9"], cpt_codes: ["99213", "43239"], charges: 1100, status: "unbilled" },
  { id: "ENC-018", patient_name: "Lujain Al-Shamrani", patient_name_ar: "لجين الشمراني", mrn: "MRN-018", visit_date: "2026-06-26", provider: "Dr. Sara", icd_codes: ["E28.2"], cpt_codes: ["99213", "76830"], charges: 930, status: "pending" },
  { id: "ENC-019", patient_name: "Waleed Al-Subaie", patient_name_ar: "وليد السبيعي", mrn: "MRN-019", visit_date: "2026-06-25", provider: "Dr. Aisha", icd_codes: ["C61", "Z08"], cpt_codes: ["99215", "84153", "86316"], charges: 3100, status: "submitted" },
  { id: "ENC-020", patient_name: "Abeer Al-Nasser", patient_name_ar: "عبير الناصر", mrn: "MRN-020", visit_date: "2026-06-27", provider: "Dr. Aisha", icd_codes: ["C50.919", "Z85.3"], cpt_codes: ["99215", "76641", "86316"], charges: 2650, status: "submitted" },
  { id: "ENC-021", patient_name: "Ahmad Al-Rashidi", patient_name_ar: "أحمد الراشدي", mrn: "MRN-001", visit_date: "2026-06-20", provider: "Dr. Hassan", icd_codes: ["E11.9"], cpt_codes: ["99214", "83036", "82947"], charges: 1100, status: "submitted" },
  { id: "ENC-022", patient_name: "Fatima Al-Ghamdi", patient_name_ar: "فاطمة الغامدي", mrn: "MRN-004", visit_date: "2026-06-22", provider: "Dr. Hassan", icd_codes: ["J45.20"], cpt_codes: ["99213", "94640"], charges: 760, status: "submitted" },
  { id: "ENC-023", patient_name: "Omar Al-Qahtani", patient_name_ar: "عمر القحطاني", mrn: "MRN-005", visit_date: "2026-06-19", provider: "Dr. Hassan", icd_codes: ["N18.32"], cpt_codes: ["99215", "90935"], charges: 4500, status: "submitted" },
  { id: "ENC-024", patient_name: "Mariam Al-Harbi", patient_name_ar: "مريم الحربي", mrn: "MRN-002", visit_date: "2026-06-21", provider: "Dr. Hassan", icd_codes: ["I10", "E78.5"], cpt_codes: ["99214", "80061"], charges: 870, status: "submitted" },
  { id: "ENC-025", patient_name: "Noura Al-Shehri", patient_name_ar: "نورة الشهري", mrn: "MRN-006", visit_date: "2026-06-18", provider: "Dr. Sara", icd_codes: ["E03.9"], cpt_codes: ["99213", "84443", "76536"], charges: 1050, status: "submitted" },
  { id: "ENC-026", patient_name: "Saud Al-Bishi", patient_name_ar: "سعود البيشي", mrn: "MRN-011", visit_date: "2026-06-17", provider: "Dr. Hassan", icd_codes: ["I48.91"], cpt_codes: ["99215", "93641"], charges: 5200, status: "submitted" },
  { id: "ENC-027", patient_name: "Reem Al-Maliki", patient_name_ar: "ريم المالكي", mrn: "MRN-012", visit_date: "2026-06-15", provider: "Dr. Sara", icd_codes: ["G43.009"], cpt_codes: ["99212", "90471"], charges: 580, status: "submitted" },
  { id: "ENC-028", patient_name: "Dalal Al-Subhi", patient_name_ar: "دلال الصبحي", mrn: "MRN-016", visit_date: "2026-06-16", provider: "Dr. Hassan", icd_codes: ["M32.9"], cpt_codes: ["99215", "86520"], charges: 1900, status: "submitted" },
  { id: "ENC-029", patient_name: "Manal Al-Sulami", patient_name_ar: "منال السلمي", mrn: "MRN-014", visit_date: "2026-06-14", provider: "Dr. Sara", icd_codes: ["M81.0"], cpt_codes: ["99213", "96156"], charges: 920, status: "submitted" },
  { id: "ENC-030", patient_name: "Lujain Al-Shamrani", patient_name_ar: "لجين الشمراني", mrn: "MRN-018", visit_date: "2026-06-13", provider: "Dr. Sara", icd_codes: ["E28.2"], cpt_codes: ["99213", "82670"], charges: 750, status: "submitted" },
];

const METRICS: BillingMetrics = {
  unbilled: ENCOUNTERS.filter(e => e.status === "unbilled").reduce((s, e) => s + e.charges, 0),
  billed: ENCOUNTERS.filter(e => e.status !== "unbilled").reduce((s, e) => s + e.charges, 0),
  collected: 31240,
  ar_days: 42.3,
};

const STATUS_COLOR: Record<BillingStatus, string> = { unbilled: "#ef4444", pending: "#f59e0b", submitted: "#22c55e" };
const STATUS_BG: Record<BillingStatus, string> = { unbilled: "rgba(239,68,68,0.1)", pending: "rgba(245,158,11,0.1)", submitted: "rgba(34,197,94,0.1)" };

export default function RCMBilling() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [encounters, setEncounters] = useState<BillingEncounter[]>(ENCOUNTERS);
  const [metrics, setMetrics] = useState<BillingMetrics>(METRICS);
  const [statusFilter, setStatusFilter] = useState<"all" | BillingStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchBilling() {
      try {
        const data = await apiFetch<{ encounters?: BillingEncounter[]; metrics?: BillingMetrics }>("/api/v1/rcm/billing/encounters/");
        if (data) {
          if (data.encounters && Array.isArray(data.encounters) && data.encounters.length > 0) setEncounters(data.encounters);
          if (data.metrics) setMetrics(data.metrics);
        }
      } catch (err) {
        console.warn("RCM billing API unavailable, using mock data:", err);
      }
    }
    void fetchBilling();
  }, []);

  const filtered = encounters.filter(e => statusFilter === "all" || e.status === statusFilter);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submitSelected = () => {
    setEncounters(prev => prev.map(e => selected.has(e.id) ? { ...e, status: "submitted" } : e));
    setSelected(new Set());
  };

  const selectedTotal = encounters.filter(e => selected.has(e.id)).reduce((s, e) => s + e.charges, 0);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <a href="/rcm" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textDecoration: "none", display: "inline-block", marginBottom: "0.5rem" }}>
            {lang === "en" ? "← Revenue Cycle (RCM)" : "→ دورة الإيرادات (RCM)"}
          </a>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Billing & Charge Capture" : "الفوترة وتسجيل الرسوم"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {lang === "en" ? "Encounters awaiting billing — ICD-11 and CPT code review" : "الزيارات المنتظرة للفوترة — مراجعة رموز ICD-11 و CPT"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {selected.size > 0 && (
            <button onClick={submitSelected} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", cursor: "pointer", background: "#22D3EE", color: "#000", fontSize: "0.875rem", fontWeight: 700 }}>
              {lang === "en" ? `Submit ${selected.size} (SAR ${selectedTotal.toLocaleString()})` : `إرسال ${selected.size} (${selectedTotal.toLocaleString()} ر.س)`}
            </button>
          )}
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}>
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Revenue Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Unbilled" : "غير مُفوتر", value: `SAR ${metrics.unbilled.toLocaleString()}`, color: "#ef4444" },
          { label: lang === "en" ? "Billed" : "مُفوتر", value: `SAR ${metrics.billed.toLocaleString()}`, color: "#f59e0b" },
          { label: lang === "en" ? "Collected" : "محصّل", value: `SAR ${metrics.collected.toLocaleString()}`, color: "#22c55e" },
          { label: lang === "en" ? "A/R Days" : "أيام الديون", value: `${metrics.ar_days} ${lang === "en" ? "days" : "يوم"}`, color: "#22D3EE" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: c.color, marginTop: "0.375rem" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["all", "unbilled", "pending", "submitted"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: `1px solid ${statusFilter === s ? "#22D3EE" : "var(--color-border)"}`, background: statusFilter === s ? "rgba(34,211,238,0.1)" : "var(--color-surface)", color: statusFilter === s ? "#22D3EE" : "var(--color-text)", fontSize: "0.875rem", cursor: "pointer", fontWeight: statusFilter === s ? 600 : 400 }}>
            {s === "all" ? (lang === "en" ? "All" : "الكل") : s === "unbilled" ? (lang === "en" ? "Unbilled" : "غير مُفوتر") : s === "pending" ? (lang === "en" ? "Pending" : "معلق") : (lang === "en" ? "Submitted" : "مُرسل")}
            {" "}({encounters.filter(e => s === "all" || e.status === s).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ background: "rgba(34,211,238,0.05)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "0.875rem 1rem", width: "40px" }}></th>
                {[
                  lang === "en" ? "Encounter" : "رقم الزيارة",
                  lang === "en" ? "Patient" : "المريض",
                  lang === "en" ? "Visit Date" : "تاريخ الزيارة",
                  lang === "en" ? "Provider" : "الطبيب",
                  lang === "en" ? "ICD-11 Codes" : "رموز ICD-11",
                  lang === "en" ? "CPT Codes" : "رموز CPT",
                  lang === "en" ? "Charges (SAR)" : "الرسوم (ر.س)",
                  lang === "en" ? "Status" : "الحالة",
                  lang === "en" ? "Action" : "الإجراء",
                ].map(h => (
                  <th key={h} style={{ padding: "0.875rem 0.75rem", textAlign: lang === "ar" ? "right" : "left", color: "var(--color-text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(enc => (
                <tr key={enc.id} style={{ borderBottom: "1px solid var(--color-border)", background: selected.has(enc.id) ? "rgba(34,211,238,0.04)" : "transparent" }}>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    {enc.status !== "submitted" && (
                      <input type="checkbox" checked={selected.has(enc.id)} onChange={() => toggleSelect(enc.id)} style={{ cursor: "pointer" }} />
                    )}
                  </td>
                  <td style={{ padding: "0.875rem 0.75rem", fontFamily: "monospace", color: "#22D3EE", fontWeight: 600 }}>{enc.id}</td>
                  <td style={{ padding: "0.875rem 0.75rem" }}>
                    <div style={{ fontWeight: 600 }}>{lang === "en" ? enc.patient_name : enc.patient_name_ar}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{enc.mrn}</div>
                  </td>
                  <td style={{ padding: "0.875rem 0.75rem", color: "var(--color-text-muted)" }}>{enc.visit_date}</td>
                  <td style={{ padding: "0.875rem 0.75rem", color: "var(--color-text-muted)" }}>{enc.provider}</td>
                  <td style={{ padding: "0.875rem 0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      {enc.icd_codes.map(c => (
                        <span key={c} style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(34,211,238,0.08)", color: "#22D3EE", fontSize: "0.75rem", fontFamily: "monospace" }}>{c}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "0.875rem 0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      {enc.cpt_codes.map(c => (
                        <span key={c} style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(168,85,247,0.1)", color: "#a855f7", fontSize: "0.75rem", fontFamily: "monospace" }}>{c}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "0.875rem 0.75rem", fontWeight: 700 }}>{enc.charges.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 0.75rem" }}>
                    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, background: STATUS_BG[enc.status], color: STATUS_COLOR[enc.status], textTransform: "capitalize" }}>
                      {lang === "en" ? enc.status : enc.status === "unbilled" ? "غير مُفوتر" : enc.status === "pending" ? "معلق" : "مُرسل"}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 0.75rem" }}>
                    {enc.status === "unbilled" && (
                      <button onClick={() => setEncounters(prev => prev.map(e => e.id === enc.id ? { ...e, status: "submitted" } : e))} style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px", border: "none", background: "#22D3EE", color: "#000", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {lang === "en" ? "Submit" : "إرسال"}
                      </button>
                    )}
                    {enc.status === "pending" && (
                      <button onClick={() => setEncounters(prev => prev.map(e => e.id === enc.id ? { ...e, status: "submitted" } : e))} style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {lang === "en" ? "Finalize" : "إتمام"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "0.8125rem", display: "flex", justifyContent: "space-between" }}>
          <span>{lang === "en" ? `${filtered.length} encounters` : `${filtered.length} زيارة`}</span>
          <span>{lang === "en" ? `Total charges: SAR ${filtered.reduce((s, e) => s + e.charges, 0).toLocaleString()}` : `إجمالي الرسوم: ${filtered.reduce((s, e) => s + e.charges, 0).toLocaleString()} ر.س`}</span>
        </div>
      </div>
    </div>
  );
}
