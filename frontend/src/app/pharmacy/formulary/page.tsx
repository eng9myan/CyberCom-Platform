"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface DrugRaw {
  id: string;
  generic_name?: string;
  brand_name?: string;
  drug_class?: string;
  dosage_form?: string;
  strength?: string;
  formulary_status?: string;
  restriction_notes?: string;
  preferred_alternative?: string;
}

interface Drug {
  id: string;
  genericName: string;
  brandName: string;
  drugClass: string;
  dosageForm: string;
  strength: string;
  status: "formulary" | "non-formulary" | "restricted";
  restrictionNotes: string;
  preferredAlternative: string;
}

const MOCK_DRUGS: Drug[] = [
  { id: "f-001", genericName: "Metformin", brandName: "Glucophage", drugClass: "Antidiabetic (Biguanide)", dosageForm: "Tablet", strength: "500mg, 850mg, 1000mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-002", genericName: "Insulin Glargine", brandName: "Lantus", drugClass: "Insulin (Long-acting)", dosageForm: "Solution for injection", strength: "100 units/mL", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-003", genericName: "Atorvastatin", brandName: "Lipitor", drugClass: "Statin", dosageForm: "Tablet", strength: "10mg, 20mg, 40mg, 80mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-004", genericName: "Rosuvastatin", brandName: "Crestor", drugClass: "Statin", dosageForm: "Tablet", strength: "5mg, 10mg, 20mg, 40mg", status: "non-formulary", restrictionNotes: "Prefer atorvastatin unless documented intolerance.", preferredAlternative: "Atorvastatin (Lipitor)" },
  { id: "f-005", genericName: "Lisinopril", brandName: "Zestril", drugClass: "ACE Inhibitor", dosageForm: "Tablet", strength: "5mg, 10mg, 20mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-006", genericName: "Losartan", brandName: "Cozaar", drugClass: "ARB", dosageForm: "Tablet", strength: "25mg, 50mg, 100mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-007", genericName: "Amlodipine", brandName: "Norvasc", drugClass: "Calcium Channel Blocker", dosageForm: "Tablet", strength: "5mg, 10mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-008", genericName: "Metoprolol Succinate", brandName: "Toprol-XL", drugClass: "Beta Blocker", dosageForm: "Extended-release Tablet", strength: "25mg, 50mg, 100mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-009", genericName: "Amoxicillin", brandName: "Amoxil", drugClass: "Antibiotic (Penicillin)", dosageForm: "Capsule / Suspension", strength: "250mg, 500mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-010", genericName: "Azithromycin", brandName: "Zithromax", drugClass: "Antibiotic (Macrolide)", dosageForm: "Tablet / Suspension", strength: "250mg, 500mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-011", genericName: "Ciprofloxacin", brandName: "Cipro", drugClass: "Antibiotic (Fluoroquinolone)", dosageForm: "Tablet", strength: "250mg, 500mg, 750mg", status: "restricted", restrictionNotes: "Restricted to infectious disease approval for systemic use.", preferredAlternative: "Amoxicillin or Azithromycin per indication" },
  { id: "f-012", genericName: "Vancomycin", brandName: "Vancocin", drugClass: "Antibiotic (Glycopeptide)", dosageForm: "IV infusion / Capsule", strength: "500mg, 1g vial", status: "restricted", restrictionNotes: "Infectious Disease or ICU approval required. TDM monitoring mandatory.", preferredAlternative: "" },
  { id: "f-013", genericName: "Omeprazole", brandName: "Losec", drugClass: "Proton Pump Inhibitor", dosageForm: "Capsule / IV", strength: "20mg, 40mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-014", genericName: "Pantoprazole", brandName: "Protonix", drugClass: "Proton Pump Inhibitor", dosageForm: "Tablet / IV", strength: "20mg, 40mg", status: "non-formulary", restrictionNotes: "Prefer omeprazole unless specific indication.", preferredAlternative: "Omeprazole (Losec)" },
  { id: "f-015", genericName: "Salbutamol", brandName: "Ventolin", drugClass: "Bronchodilator (SABA)", dosageForm: "Inhaler / Nebuliser", strength: "100mcg/puff, 2.5mg/2.5mL", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-016", genericName: "Fluticasone/Salmeterol", brandName: "Seretide", drugClass: "ICS/LABA Combination", dosageForm: "Inhaler", strength: "250/25mcg, 500/50mcg", status: "restricted", restrictionNotes: "Respiratory specialist initiation required. Step-up therapy only.", preferredAlternative: "" },
  { id: "f-017", genericName: "Levothyroxine", brandName: "Eltroxin", drugClass: "Thyroid Hormone", dosageForm: "Tablet", strength: "25mcg, 50mcg, 100mcg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-018", genericName: "Prednisolone", brandName: "Deltacortril", drugClass: "Corticosteroid", dosageForm: "Tablet / Syrup", strength: "5mg, 25mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-019", genericName: "Methylprednisolone", brandName: "Solu-Medrol", drugClass: "Corticosteroid (IV)", dosageForm: "IV powder for reconstitution", strength: "40mg, 125mg, 500mg, 1g", status: "restricted", restrictionNotes: "Hospital/specialist use only for pulse therapy.", preferredAlternative: "Prednisolone oral for maintenance" },
  { id: "f-020", genericName: "Furosemide", brandName: "Lasix", drugClass: "Loop Diuretic", dosageForm: "Tablet / IV", strength: "20mg, 40mg, 80mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-021", genericName: "Spironolactone", brandName: "Aldactone", drugClass: "Aldosterone Antagonist", dosageForm: "Tablet", strength: "25mg, 50mg, 100mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-022", genericName: "Warfarin", brandName: "Coumadin", drugClass: "Anticoagulant (Vitamin K Antagonist)", dosageForm: "Tablet", strength: "1mg, 2mg, 5mg", status: "restricted", restrictionNotes: "Requires INR monitoring. Anticoagulation clinic review mandatory.", preferredAlternative: "" },
  { id: "f-023", genericName: "Rivaroxaban", brandName: "Xarelto", drugClass: "Anticoagulant (Direct Xa inhibitor)", dosageForm: "Tablet", strength: "10mg, 15mg, 20mg", status: "restricted", restrictionNotes: "Cardiology / Haematology initiation required. Formulary exception form needed.", preferredAlternative: "Warfarin for non-valvular AF if budget concern" },
  { id: "f-024", genericName: "Aspirin", brandName: "Aspirin Cardio", drugClass: "Antiplatelet / NSAID", dosageForm: "Tablet", strength: "75mg, 100mg, 300mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-025", genericName: "Clopidogrel", brandName: "Plavix", drugClass: "Antiplatelet", dosageForm: "Tablet", strength: "75mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-026", genericName: "Sertraline", brandName: "Zoloft", drugClass: "Antidepressant (SSRI)", dosageForm: "Tablet", strength: "25mg, 50mg, 100mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-027", genericName: "Escitalopram", brandName: "Lexapro", drugClass: "Antidepressant (SSRI)", dosageForm: "Tablet", strength: "5mg, 10mg, 20mg", status: "non-formulary", restrictionNotes: "Prefer sertraline as first-line. Escitalopram requires psychiatry note.", preferredAlternative: "Sertraline (Zoloft)" },
  { id: "f-028", genericName: "Gabapentin", brandName: "Neurontin", drugClass: "Anticonvulsant / Neuropathic Pain", dosageForm: "Capsule", strength: "100mg, 300mg, 400mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-029", genericName: "Levetiracetam", brandName: "Keppra", drugClass: "Anticonvulsant", dosageForm: "Tablet / IV", strength: "250mg, 500mg, 1000mg", status: "restricted", restrictionNotes: "Neurology initiation required for new epilepsy diagnosis.", preferredAlternative: "" },
  { id: "f-030", genericName: "Paracetamol", brandName: "Panadol", drugClass: "Analgesic / Antipyretic", dosageForm: "Tablet / IV / Syrup", strength: "500mg, 1g", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-031", genericName: "Tramadol", brandName: "Tramal", drugClass: "Opioid Analgesic", dosageForm: "Capsule / IV", strength: "50mg, 100mg", status: "restricted", restrictionNotes: "Controlled substance. Requires prescriber DEA-equivalent authorization. Max 3-day supply outpatient.", preferredAlternative: "Paracetamol + ibuprofen combination for mild-moderate pain" },
  { id: "f-032", genericName: "Ibuprofen", brandName: "Brufen", drugClass: "NSAID", dosageForm: "Tablet / Suspension", strength: "200mg, 400mg, 600mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-033", genericName: "Dexamethasone", brandName: "Decadron", drugClass: "Corticosteroid (IV/IM)", dosageForm: "Injection", strength: "4mg/mL, 8mg/2mL", status: "restricted", restrictionNotes: "Hospital use. Oncology use covered separately under cancer protocol.", preferredAlternative: "" },
  { id: "f-034", genericName: "Ondansetron", brandName: "Zofran", drugClass: "Antiemetic (5-HT3 antagonist)", dosageForm: "Tablet / IV", strength: "4mg, 8mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-035", genericName: "Metoclopramide", brandName: "Primperan", drugClass: "Prokinetic / Antiemetic", dosageForm: "Tablet / IV", strength: "10mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-036", genericName: "Allopurinol", brandName: "Zyloprim", drugClass: "Xanthine Oxidase Inhibitor", dosageForm: "Tablet", strength: "100mg, 300mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-037", genericName: "Colchicine", brandName: "Colcrys", drugClass: "Anti-Gout", dosageForm: "Tablet", strength: "0.5mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-038", genericName: "Doxycycline", brandName: "Vibramycin", drugClass: "Antibiotic (Tetracycline)", dosageForm: "Capsule", strength: "100mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-039", genericName: "Loperamide", brandName: "Imodium", drugClass: "Antidiarrheal", dosageForm: "Capsule / Tablet", strength: "2mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
  { id: "f-040", genericName: "Cetirizine", brandName: "Zyrtec", drugClass: "Antihistamine (2nd gen)", dosageForm: "Tablet / Syrup", strength: "5mg, 10mg", status: "formulary", restrictionNotes: "", preferredAlternative: "" },
];

type StatusFilter = "all" | "formulary" | "non-formulary" | "restricted";

export default function FormularyPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [drugs, setDrugs] = useState<Drug[]>(MOCK_DRUGS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch<DrugRaw[]>("/api/v1/pharmacy/formulary/");
        if (data && data.length > 0) {
          const mapped: Drug[] = data.map(d => ({
            id: d.id,
            genericName: d.generic_name || "Unknown",
            brandName: d.brand_name || "—",
            drugClass: d.drug_class || "General",
            dosageForm: d.dosage_form || "—",
            strength: d.strength || "—",
            status: (["formulary", "non-formulary", "restricted"].includes(d.formulary_status || "") ? d.formulary_status as Drug["status"] : "formulary"),
            restrictionNotes: d.restriction_notes || "",
            preferredAlternative: d.preferred_alternative || "",
          }));
          setDrugs(mapped);
        }
      } catch {
        // silent fallback
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const drugClasses = ["all", ...Array.from(new Set(drugs.map(d => d.drugClass))).sort()];

  const filtered = drugs.filter(d => {
    const q = search.toLowerCase();
    if (q && !d.genericName.toLowerCase().includes(q) && !d.brandName.toLowerCase().includes(q) && !d.drugClass.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (classFilter !== "all" && d.drugClass !== classFilter) return false;
    return true;
  });

  const statusStyle: Record<string, { bg: string; color: string; label: { en: string; ar: string } }> = {
    formulary: { bg: "#d1fae5", color: "#065f46", label: { en: "Formulary", ar: "مدرج بالقائمة" } },
    "non-formulary": { bg: "#fee2e2", color: "#b91c1c", label: { en: "Non-Formulary", ar: "غير مدرج" } },
    restricted: { bg: "#fef3c7", color: "#92400e", label: { en: "Restricted", ar: "مقيّد" } },
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: dir }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Hospital Formulary" : "دليل الأدوية المعتمدة"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            {lang === "en" ? "Approved drug list — formulary, non-formulary and restricted items" : "قائمة الأدوية المعتمدة — المدرجة وغير المدرجة والمقيّدة"}
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
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing" : "طابور الصرف" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory" : "المخزون" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Total Drugs" : "إجمالي الأدوية", value: drugs.length, color: "#22D3EE" },
          { label: lang === "en" ? "Formulary" : "مدرجة", value: drugs.filter(d => d.status === "formulary").length, color: "#22c55e" },
          { label: lang === "en" ? "Non-Formulary" : "غير مدرجة", value: drugs.filter(d => d.status === "non-formulary").length, color: "#ef4444" },
          { label: lang === "en" ? "Restricted" : "مقيّدة", value: drugs.filter(d => d.status === "restricted").length, color: "#f59e0b" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === "en" ? "Search by drug name or class…" : "ابحث باسم الدواء أو الفئة الدوائية…"}
          style={{ padding: "0.5rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.85rem", minWidth: "240px", flex: 1 }}
        />
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["all", "formulary", "non-formulary", "restricted"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.4rem 0.8rem", borderRadius: "5px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, background: statusFilter === f ? "#22D3EE" : "var(--color-surface)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
              {f === "all" ? (lang === "en" ? "All" : "الكل") : (lang === "en" ? statusStyle[f]?.label.en : statusStyle[f]?.label.ar)}
            </button>
          ))}
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.82rem" }}>
          {drugClasses.map(c => <option key={c} value={c}>{c === "all" ? (lang === "en" ? "All Drug Classes" : "جميع الفئات") : c}</option>)}
        </select>
        {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</span>}
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "Generic Name" : "الاسم العلمي",
                lang === "en" ? "Brand Name" : "الاسم التجاري",
                lang === "en" ? "Drug Class" : "الفئة الدوائية",
                lang === "en" ? "Form" : "الشكل الصيدلاني",
                lang === "en" ? "Strength" : "التركيز",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Notes / Alternative" : "ملاحظات / البديل",
              ].map(h => (
                <th key={h} style={{ padding: "0.9rem 1rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((drug, i) => (
              <tr key={drug.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                <td style={{ padding: "0.85rem 1rem", fontWeight: 700, fontSize: "0.88rem" }}>{drug.genericName}</td>
                <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{drug.brandName}</td>
                <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem" }}>{drug.drugClass}</td>
                <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{drug.dosageForm}</td>
                <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{drug.strength}</td>
                <td style={{ padding: "0.85rem 1rem" }}>
                  <span style={{ padding: "0.25rem 0.65rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, background: statusStyle[drug.status]?.bg, color: statusStyle[drug.status]?.color }}>
                    {lang === "en" ? statusStyle[drug.status]?.label.en : statusStyle[drug.status]?.label.ar}
                  </span>
                </td>
                <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem" }}>
                  {drug.restrictionNotes && (
                    <div style={{ color: "#f59e0b", marginBottom: drug.preferredAlternative ? "0.3rem" : 0 }}>{drug.restrictionNotes}</div>
                  )}
                  {drug.preferredAlternative && (
                    <div style={{ color: "#22c55e", fontWeight: 600 }}>{lang === "en" ? "Alt: " : "البديل: "}{drug.preferredAlternative}</div>
                  )}
                  {!drug.restrictionNotes && !drug.preferredAlternative && (
                    <span style={{ color: "var(--color-text-muted)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            {lang === "en" ? "No drugs match your search." : "لا توجد أدوية تطابق بحثك."}
          </div>
        )}
      </div>
      <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
        {lang === "en" ? `Showing ${filtered.length} of ${drugs.length} formulary items` : `عرض ${filtered.length} من ${drugs.length} دواء`}
      </p>
    </div>
  );
}
