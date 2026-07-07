"use client";

import { usePreferences } from "@/contexts/preferences";

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
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
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
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: dir }}>
      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {fetchError}
        </div>
      )}
      {/* Header */}
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-400">
            {lang === "en" ? "Hospital Formulary" : "دليل الأدوية المعتمدة"}
          </h1>
          <p className="mt-1.5 text-sm text-ink/50">
            {lang === "en" ? "Approved drug list — formulary, non-formulary and restricted items" : "قائمة الأدوية المعتمدة — المدرجة وغير المدرجة والمقيّدة"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="mb-8 flex flex-wrap gap-2.5">
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Prescriptions" : "الوصفات" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing" : "طابور الصرف" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory" : "المخزون" },
        ].map(item => (
          <a key={item.href} href={item.href} className="rounded-md border border-ink/10 bg-surface px-4 py-2 text-xs font-semibold hover:bg-ink/5">
            {item.label}
          </a>
        ))}
      </nav>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: lang === "en" ? "Total Drugs" : "إجمالي الأدوية", value: (drugs || []).length, color: "#22D3EE" },
          { label: lang === "en" ? "Formulary" : "مدرجة", value: (drugs || []).filter(d => d.status === "formulary").length, color: "#22c55e" },
          { label: lang === "en" ? "Non-Formulary" : "غير مدرجة", value: (drugs || []).filter(d => d.status === "non-formulary").length, color: "#ef4444" },
          { label: lang === "en" ? "Restricted" : "مقيّدة", value: (drugs || []).filter(d => d.status === "restricted").length, color: "#f59e0b" },
        ].map(m => (
          <div key={m.label} className="cy-card p-5 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === "en" ? "Search by drug name or class…" : "ابحث باسم الدواء أو الفئة الدوائية…"}
          className="min-w-[240px] flex-1 rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink"
        />
        <div className="flex gap-1.5">
          {(["all", "formulary", "non-formulary", "restricted"] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold border ${statusFilter === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink"}`}
            >
              {f === "all" ? (lang === "en" ? "All" : "الكل") : (lang === "en" ? statusStyle[f]?.label.en : statusStyle[f]?.label.ar)}
            </button>
          ))}
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink">
          {drugClasses.map(c => <option key={c} value={c}>{c === "all" ? (lang === "en" ? "All Drug Classes" : "جميع الفئات") : c}</option>)}
        </select>
        {loading && <span className="text-sm text-ink/50">{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</span>}
      </div>

      {/* Table */}
      <div className="cy-card overflow-hidden p-0">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-brand-500/5">
              {[
                lang === "en" ? "Generic Name" : "الاسم العلمي",
                lang === "en" ? "Brand Name" : "الاسم التجاري",
                lang === "en" ? "Drug Class" : "الفئة الدوائية",
                lang === "en" ? "Form" : "الشكل الصيدلاني",
                lang === "en" ? "Strength" : "التركيز",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Notes / Alternative" : "ملاحظات / البديل",
              ].map(h => (
                <th key={h} className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${lang === "ar" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(drug => (
              <tr key={drug.id}>
                <td className="border-b border-ink/10 px-4 py-3 text-sm font-bold">{drug.genericName}</td>
                <td className="border-b border-ink/10 px-4 py-3 text-sm text-ink/50">{drug.brandName}</td>
                <td className="border-b border-ink/10 px-4 py-3 text-sm">{drug.drugClass}</td>
                <td className="border-b border-ink/10 px-4 py-3 text-sm text-ink/50">{drug.dosageForm}</td>
                <td className="border-b border-ink/10 px-4 py-3 text-sm text-ink/50">{drug.strength}</td>
                <td className="border-b border-ink/10 px-4 py-3">
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: statusStyle[drug.status]?.bg, color: statusStyle[drug.status]?.color }}>
                    {lang === "en" ? statusStyle[drug.status]?.label.en : statusStyle[drug.status]?.label.ar}
                  </span>
                </td>
                <td className="border-b border-ink/10 px-4 py-3 text-sm">
                  {drug.restrictionNotes && (
                    <div className="text-amber-500" style={{ marginBottom: drug.preferredAlternative ? "0.3rem" : 0 }}>{drug.restrictionNotes}</div>
                  )}
                  {drug.preferredAlternative && (
                    <div className="font-semibold text-emerald-500">{lang === "en" ? "Alt: " : "البديل: "}{drug.preferredAlternative}</div>
                  )}
                  {!drug.restrictionNotes && !drug.preferredAlternative && (
                    <span className="text-ink/40">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-ink/50">
            {lang === "en" ? "No drugs match your search." : "لا توجد أدوية تطابق بحثك."}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-ink/50">
        {lang === "en" ? `Showing ${filtered.length} of ${(drugs || []).length} formulary items` : `عرض ${filtered.length} من ${(drugs || []).length} دواء`}
      </p>
    </div>
  );
}
