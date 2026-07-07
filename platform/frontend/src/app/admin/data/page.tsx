"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

interface Asset {
  id: string;
  name: string;
  type: string;
  path: string;
  region: string;
  piiCount: number;
}

interface Lineage {
  id: string;
  source: string;
  target: string;
  job: string;
}

export default function DataAdminConsole() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "CyData Catalog & Lineage",
      subtitle: "Data Assets Catalog, Quality Constraints, and Lineage Mappings",
      toggleLang: "العربية",
      catalogTab: "Data Catalog",
      lineageTab: "Lineage Graph",
      name: "Asset Name",
      type: "Asset Type",
      path: "Physical Path",
      region: "Data Residency",
      pii: "PII/PHI Fields",
      source: "Source Asset",
      target: "Target Asset",
      job: "Transformation Job",
    },
    ar: {
      title: "فهرس البيانات وتدفقاتها (CyData)",
      subtitle: "دليل أصول البيانات، وقيود الجودة، ومطابقات تدفق البيانات",
      toggleLang: "English",
      catalogTab: "فهرس البيانات",
      lineageTab: "مخطط مسار البيانات",
      name: "اسم الأصل",
      type: "نوع الأصل",
      path: "المسار المادي",
      region: "مقر حفظ البيانات",
      pii: "حقول السرية PII/PHI",
      source: "الأصل المصدر",
      target: "الأصل الهدف",
      job: "مهمة التحويل",
    }
  }[lang];

  const [activeTab, setActiveTab] = useState<"catalog" | "lineage">("catalog");

  const [assets] = useState<Asset[]>([
    { id: "1", name: "clinical_patient_records", type: "lakehouse", path: "s3://lakehouse/clinical/patient", region: "me-central-1", piiCount: 4 },
    { id: "2", name: "erp_ledger_transactions", type: "table", path: "postgresql://erp_db/public/platform_ledger", region: "me-central-1", piiCount: 0 },
    { id: "3", name: "citizen_registrations", type: "lakehouse", path: "s3://lakehouse/gov/citizen", region: "me-central-1", piiCount: 8 }
  ]);

  const [lineages] = useState<Lineage[]>([
    { id: "l1", source: "clinical_patient_records", target: "patient_analytics_cube", job: "dbt_patient_metrics" },
    { id: "l2", source: "erp_ledger_transactions", target: "financial_revenue_dashboard", job: "dbt_revenue_reconciliation" }
  ]);

  const navBtnCls = (active: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${isRtl ? "text-right" : "text-left"} ${
      active ? "border-brand-400/60 bg-brand-500 text-white" : "border-ink/10 text-ink/70 hover:bg-ink/5"
    }`;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-ink/50">{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {t.toggleLang}
        </button>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <aside className="cy-card col-span-3 flex h-fit flex-col gap-2 p-4">
          <button onClick={() => setActiveTab("catalog")} className={navBtnCls(activeTab === "catalog")}>{t.catalogTab}</button>
          <button onClick={() => setActiveTab("lineage")} className={navBtnCls(activeTab === "lineage")}>{t.lineageTab}</button>
        </aside>

        <main className="cy-card col-span-9 p-6">
          {activeTab === "catalog" && (
            <div>
              <h2 className="text-lg font-bold">{t.catalogTab}</h2>
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.name}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.type}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.path}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.region}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.pii}</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id} className="border-b border-ink/5">
                      <td className="px-4 py-3 font-bold">{a.name}</td>
                      <td className="px-4 py-3"><span className="rounded bg-ink/10 px-2 py-0.5 text-xs">{a.type.toUpperCase()}</span></td>
                      <td className="px-4 py-3"><code className="font-mono text-xs">{a.path}</code></td>
                      <td className="px-4 py-3">{a.region}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${a.piiCount > 0 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                          {a.piiCount} fields marked
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "lineage" && (
            <div>
              <h2 className="text-lg font-bold">{t.lineageTab}</h2>
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.source}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.target}</th>
                    <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.job}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineages.map(l => (
                    <tr key={l.id} className="border-b border-ink/5">
                      <td className="px-4 py-3"><code className="font-mono text-xs">{l.source}</code></td>
                      <td className="px-4 py-3"><code className="font-mono text-xs">{l.target}</code></td>
                      <td className="px-4 py-3"><span className="text-brand-300">{l.job}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
