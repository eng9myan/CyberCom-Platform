"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface DrugRaw {
  id: string;
  drug_code: string;
  drug_name: string;
  generic_name?: string;
  status: string;
  tier: number;
  requires_prior_auth: boolean;
  requires_step_therapy: boolean;
  available_strengths?: string[];
  available_forms?: string[];
  notes?: string;
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

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

function mapStatus(raw: string): Drug["status"] {
  if (raw === "restricted") return "restricted";
  if (raw === "non_formulary" || raw === "discontinued" || raw === "non_preferred") return "non-formulary";
  return "formulary";
}

type StatusFilter = "all" | "formulary" | "non-formulary" | "restricted";

export default function FormularyPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [drugs, setDrugs] = useState<Drug[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await apiFetch<Paginated<DrugRaw> | DrugRaw[]>(
        "/api/v1/pharmacy/formulary/drugs/",
        { token: session.accessToken, tenantId: session.tenantId }
      );
      const mapped: Drug[] = unwrap(data).map(d => ({
        id: d.id,
        genericName: d.generic_name || d.drug_name,
        brandName: d.drug_name,
        drugClass: `Tier ${d.tier}`,
        dosageForm: (d.available_forms || []).join(", ") || "—",
        strength: (d.available_strengths || []).join(", ") || "—",
        status: mapStatus(d.status),
        restrictionNotes: [
          d.requires_prior_auth ? "Requires prior authorization." : "",
          d.requires_step_therapy ? "Requires step therapy." : "",
          d.notes || "",
        ].filter(Boolean).join(" "),
        preferredAlternative: "",
      }));
      setDrugs(mapped);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load formulary."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const drugClasses = ["all", ...Array.from(new Set((drugs || []).map(d => d.drugClass))).sort()];

  const filtered = (drugs || []).filter(d => {
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

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: dir }}>
      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}
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
          { label: lang === "en" ? "Total Drugs" : "إجمالي الأدوية", value: (drugs || []).length, color: "#22D3EE" },
          { label: lang === "en" ? "Formulary" : "مدرجة", value: (drugs || []).filter(d => d.status === "formulary").length, color: "#22c55e" },
          { label: lang === "en" ? "Non-Formulary" : "غير مدرجة", value: (drugs || []).filter(d => d.status === "non-formulary").length, color: "#ef4444" },
          { label: lang === "en" ? "Restricted" : "مقيّدة", value: (drugs || []).filter(d => d.status === "restricted").length, color: "#f59e0b" },
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
        {lang === "en" ? `Showing ${filtered.length} of ${(drugs || []).length} formulary items` : `عرض ${filtered.length} من ${(drugs || []).length} دواء`}
      </p>
    </div>
  );
}
