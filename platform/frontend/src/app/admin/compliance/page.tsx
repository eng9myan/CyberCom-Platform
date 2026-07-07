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

      <div className="mb-5 flex items-center gap-3">
        <span className="text-sm">{t.search}</span>
        <select
          value={filterFramework}
          onChange={e => setFilterFramework(e.target.value)}
          className="rounded-lg border border-ink/10 bg-surface px-3 py-1.5 text-sm text-ink"
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

      <div className="cy-card overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.framework}</th>
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.controlName}</th>
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.description}</th>
              <th className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isRtl ? "text-right" : "text-left"}`}>{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {filteredControls.map(c => (
              <tr key={c.id} className="border-b border-ink/5">
                <td className="px-4 py-3"><span className="rounded bg-brand-700 px-2 py-0.5 text-xs font-bold text-white">{c.framework}</span></td>
                <td className="px-4 py-3 font-bold">{c.name}</td>
                <td className="px-4 py-3 text-sm text-ink/50">{c.description}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${c.status === "compliant" ? "text-emerald-400" : c.status === "warning" ? "text-amber-400" : "text-red-400"}`}>
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
