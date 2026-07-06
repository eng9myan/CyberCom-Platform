"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

interface Control {
  id: string;
  framework: string;
  name: string;
  description: string;
  status: "compliant" | "warning" | "failing";
}

export default function ComplianceAdminConsole() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "Compliance Audit Console",
      subtitle: "Track Regulatory Compliance Baselines (SOC2, HIPAA, GDPR, NCA, JCI)",
      toggleLang: "العربية",
      framework: "Compliance Framework",
      controlName: "Control Name",
      description: "Description",
      status: "Audit Status",
      compliant: "Compliant",
      warning: "Audit Warning",
      failing: "Non-Compliant",
      search: "Filter by Framework...",
    },
    ar: {
      title: "لوحة تدقيق ومتابعة الامتثال والمعايير",
      subtitle: "متابعة معايير الامتثال التنظيمية وقواعد الترخيص (SOC2, HIPAA, GDPR, NCA, JCI)",
      toggleLang: "English",
      framework: "إطار الامتثال",
      controlName: "اسم الضابط الرقابي",
      description: "الوصف",
      status: "حالة التدقيق",
      compliant: "ممتثل",
      warning: "تنبيه تدقيقي",
      failing: "غير ممتثل",
      search: "تصفية حسب الإطار التنظيمي...",
    }
  }[lang];

  const [filterFramework, setFilterFramework] = useState<string>("all");

  const [controls] = useState<Control[]>(
    [
      { id: "c1", framework: "SOC2", name: "CC6.1 Access Controls", description: "Logical access controls to platform components are restricted via Zitadel/Keycloak OAuth authentication.", status: "compliant" },
      { id: "c2", framework: "HIPAA", name: "§164.312(a)(2)(iv) Encryption", description: "Encryption of Protected Health Information (PHI) in transit (TLS 1.3) and at rest (AES-256-GCM).", status: "compliant" },
      { id: "c3", framework: "GDPR", name: "Art. 32 Processing Security", description: "Pseudonymization and encryption of personal data (PII) using tenant-specific KMS key isolation.", status: "compliant" },
      { id: "c4", framework: "PDPL", name: "Art. 15 Data Residency", description: "Verify Saudi citizen personal data residency resides within national sovereign borders.", status: "compliant" },
      { id: "c5", framework: "NCA ECC", name: "ECC-2: Cybersecurity Governance", description: "Policy evaluations enforced at runtime. OPA policy engine validation requires regular review.", status: "warning" },
      { id: "c6", framework: "JCI", name: "MOI.2 Clinical Records Retention", description: "Clinical records legal hold and retention period enforcement via document management storage.", status: "compliant" }
    ]
  );

  const filteredControls = filterFramework === "all"
    ? controls
    : controls.filter(c => c.framework.toLowerCase() === filterFramework.toLowerCase());

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

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <span style={{ fontSize: "0.95rem" }}>{t.search}</span>
        <select
          value={filterFramework}
          onChange={e => setFilterFramework(e.target.value)}
          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 12px", color: "white", borderRadius: "4px" }}
        >
          <option value="all">Show All Frameworks</option>
          <option value="soc2">SOC2</option>
          <option value="hipaa">HIPAA (Healthcare)</option>
          <option value="gdpr">GDPR</option>
          <option value="pdpl">PDPL (Saudi Residency)</option>
          <option value="nca ecc">NCA ECC (ECC-1/ECC-2)</option>
          <option value="jci">JCI (Joint Commission Clinical)</option>
        </select>
      </div>

      <div className="glass-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <th style={{ padding: "12px 8px", textAlign: isRtl ? "right" : "left" }}>{t.framework}</th>
              <th style={{ padding: "12px 8px", textAlign: isRtl ? "right" : "left" }}>{t.controlName}</th>
              <th style={{ padding: "12px 8px", textAlign: isRtl ? "right" : "left" }}>{t.description}</th>
              <th style={{ padding: "12px 8px", textAlign: isRtl ? "right" : "left" }}>{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {filteredControls.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "12px 8px" }}><span style={{ background: "var(--color-primary-dark)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold" }}>{c.framework}</span></td>
                <td style={{ padding: "12px 8px", fontWeight: "bold" }}>{c.name}</td>
                <td style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>{c.description}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span style={{
                    color: c.status === "compliant" ? "var(--color-success)" : c.status === "warning" ? "var(--color-warning)" : "var(--color-error)",
                    fontWeight: "bold"
                  }}>
                    ● {c.status === "compliant" ? t.compliant : c.status === "warning" ? t.warning : t.failing}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
