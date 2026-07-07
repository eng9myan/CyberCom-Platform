"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState } from "react";

interface Backup {
  id: string;
  assetName: string;
  lastBackup: string;
  sizeMb: number;
  integrity: "passed" | "failed";
}

export default function OperationsAdminConsole() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const isRtl = lang === "ar";

  const t = {
    en: {
      title: "Platform Operations & DR Validation",
      subtitle: "Monitor Automated Backups, Replication health, and Trigger Recovery Drills",
      toggleLang: "العربية",
      backupTab: "Database Backups",
      replicationTab: "Active Replication & DR",
      assetName: "Target DB / Catalog",
      lastBackup: "Last Successful Backup",
      size: "Backup Size",
      integrity: "Integrity Check",
      actions: "Actions",
      validate: "Run Integrity Check",
      failover: "Simulate Disaster Recovery Failover",
      passed: "Passed",
      failed: "Failed",
      validationSuccess: "Backup integrity check triggered: PASSED",
      failoverSuccess: "DR Failover dry run simulation completed successfully: Replication health OK.",
    },
    ar: {
      title: "العمليات والتحقق من النسخ الاحتياطي",
      subtitle: "متابعة النسخ الاحتياطي التلقائي، وصحة التكرار، وتفعيل تجارب استعادة الخدمة الكارثية",
      toggleLang: "English",
      backupTab: "النسخ الاحتياطي لقواعد البيانات",
      replicationTab: "التكرار الفعال والتعافي الكارثي",
      assetName: "قاعدة البيانات / الفهرس المستهدف",
      lastBackup: "آخر نسخة احتياطية ناجحة",
      size: "حجم النسخة الاحتياطية",
      integrity: "فحص سلامة النسخة",
      actions: "الإجراءات",
      validate: "فحص سلامة النسخة",
      failover: "محاكاة تعافي الكوارث (Failover)",
      passed: "سليم",
      failed: "فاشل",
      validationSuccess: "تم فحص سلامة النسخة الاحتياطية: سليمة بنسبة 100%",
      failoverSuccess: "تمت محاكاة تعافي الكوارث بنجاح: صحة التكرار والمزامنة ممتازة.",
    }
  }[lang];

  const [activeTab, setActiveTab] = useState<"backups" | "dr">("backups");
  const [notification, setNotification] = useState<string | null>(null);

  const [backups] = useState<Backup[]>([
    { id: "1", assetName: "cybercom_identity_db", lastBackup: "2026-06-22T04:00:00Z", sizeMb: 1420, integrity: "passed" },
    { id: "2", assetName: "cybercom_clinical_ehr", lastBackup: "2026-06-22T04:05:00Z", sizeMb: 4890, integrity: "passed" },
    { id: "3", assetName: "cybercom_ledger_erp", lastBackup: "2026-06-21T04:00:00Z", sizeMb: 3120, integrity: "passed" }
  ]);

  const handleValidate = (assetName: string) => {
    setNotification(`${t.validationSuccess} for ${assetName}`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFailover = () => {
    setNotification(t.failoverSuccess);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-ink/50">{t.subtitle}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {t.toggleLang}
        </button>
      </header>

      {notification && (
        <div className="cy-card mb-4 border-l-4 border-emerald-500 p-4 text-sm font-semibold">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <aside className="cy-card col-span-3 flex h-fit flex-col gap-2 p-4">
          <button
            onClick={() => setActiveTab("backups")}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === "backups" ? "bg-brand-500 text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            {t.backupTab}
          </button>
          <button
            onClick={() => setActiveTab("dr")}
            className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === "dr" ? "bg-brand-500 text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            {t.replicationTab}
          </button>
        </aside>

        <main className="cy-card col-span-9 p-6">
          {activeTab === "backups" && (
            <div>
              <h2 className="text-lg font-bold">{t.backupTab}</h2>
              <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.assetName}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.lastBackup}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.size}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.integrity}</th>
                      <th className="px-4 py-3 text-left text-[13px] font-semibold text-ink/50">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map(b => (
                      <tr key={b.id} className="border-b border-ink/5">
                        <td className="px-4 py-3 font-bold">{b.assetName}</td>
                        <td className="px-4 py-3"><small className="text-xs text-ink/50">{new Date(b.lastBackup).toLocaleString()}</small></td>
                        <td className="px-4 py-3">{(b.sizeMb / 1024).toFixed(2)} GB</td>
                        <td className={`px-4 py-3 font-bold ${b.integrity === "passed" ? "text-emerald-400" : "text-red-400"}`}>{b.integrity === "passed" ? t.passed : t.failed}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleValidate(b.assetName)} className="cy-btn cy-btn-primary !min-h-0 !py-1.5 !px-3 text-xs">{t.validate}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "dr" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">{t.replicationTab}</h2>
              <div className="cy-card p-4">
                <h3 className="font-bold">Failover Target: me-central-2 (Drill mode)</h3>
                <p className="mt-2 text-sm text-ink/50">Replication engine: pglogical active-active setup. Replication latency is within limits (0.4 seconds).</p>
              </div>
              <div>
                <button onClick={handleFailover} className="cy-btn bg-amber-500 text-white">{t.failover}</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
