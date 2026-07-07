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

  return (
    <div className="dashboard-container" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <header className="dashboard-header">
        <div>
          <h1>{t.title}</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="theme-toggle-btn">
          {t.toggleLang}
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "var(--spacing-lg)" }}>
        <aside className="glass-card" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", height: "fit-content" }}>
          <button onClick={() => setActiveTab("catalog")} style={{ background: activeTab === "catalog" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.catalogTab}</button>
          <button onClick={() => setActiveTab("lineage")} style={{ background: activeTab === "lineage" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgb(var(--color-ink-rgb) / 0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.lineageTab}</button>
        </aside>

        <main className="glass-card" style={{ gridColumn: "span 9" }}>
          {activeTab === "catalog" && (
            <div>
              <h2>{t.catalogTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.name}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.type}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.path}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.region}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.pii}</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                      <td style={{ padding: "8px", fontWeight: "bold" }}>{a.name}</td>
                      <td style={{ padding: "8px" }}><span style={{ background: "rgb(var(--color-ink-rgb) / 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{a.type.toUpperCase()}</span></td>
                      <td style={{ padding: "8px" }}><code>{a.path}</code></td>
                      <td style={{ padding: "8px" }}>{a.region}</td>
                      <td style={{ padding: "8px" }}>
                        <span style={{
                          background: a.piiCount > 0 ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                          color: a.piiCount > 0 ? "#f87171" : "#34d399",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.85rem"
                        }}>
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
              <h2>{t.lineageTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.source}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.target}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.job}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineages.map(l => (
                    <tr key={l.id} style={{ borderBottom: "1px solid rgb(var(--color-ink-rgb) / 0.05)" }}>
                      <td style={{ padding: "8px" }}><code>{l.source}</code></td>
                      <td style={{ padding: "8px" }}><code>{l.target}</code></td>
                      <td style={{ padding: "8px" }}><span style={{ color: "var(--color-primary-light)" }}>{l.job}</span></td>
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
