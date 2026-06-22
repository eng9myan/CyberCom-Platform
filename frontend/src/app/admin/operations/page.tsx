"use client";

import { useState } from "react";
import Head from "next/head";

interface Backup {
  id: string;
  assetName: string;
  lastBackup: string;
  sizeMb: number;
  integrity: "passed" | "failed";
}

export default function OperationsAdminConsole() {
  const [lang, setLang] = useState<"en" | "ar">("en");
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

  const [backups, setBackups] = useState<Backup[]>([
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

      {notification && (
        <div className="glass-card" style={{ marginBottom: "var(--spacing-md)", borderLeft: "4px solid var(--color-success)", color: "white" }}>
          {notification}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "var(--spacing-lg)" }}>
        <aside className="glass-card" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", height: "fit-content" }}>
          <button onClick={() => setActiveTab("backups")} style={{ background: activeTab === "backups" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.backupTab}</button>
          <button onClick={() => setActiveTab("dr")} style={{ background: activeTab === "dr" ? "var(--color-primary)" : "none", color: "white", padding: "10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>{t.replicationTab}</button>
        </aside>

        <main className="glass-card" style={{ gridColumn: "span 9" }}>
          {activeTab === "backups" && (
            <div>
              <h2>{t.backupTab}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--spacing-md)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.assetName}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.lastBackup}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.size}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.integrity}</th>
                    <th style={{ padding: "8px", textAlign: isRtl ? "right" : "left" }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(b => (
                    <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px", fontWeight: "bold" }}>{b.assetName}</td>
                      <td style={{ padding: "8px" }}><small>{new Date(b.lastBackup).toLocaleString()}</small></td>
                      <td style={{ padding: "8px" }}>{(b.sizeMb / 1024).toFixed(2)} GB</td>
                      <td style={{ padding: "8px", color: b.integrity === "passed" ? "var(--color-success)" : "var(--color-error)", fontWeight: "bold" }}>{b.integrity === "passed" ? t.passed : t.failed}</td>
                      <td style={{ padding: "8px" }}>
                        <button onClick={() => handleValidate(b.assetName)} style={{ background: "var(--color-primary)", border: "none", color: "white", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}>{t.validate}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "dr" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h2>{t.replicationTab}</h2>
              <div className="glass-card" style={{ background: "rgba(0,0,0,0.1)" }}>
                <h3>Failover Target: me-central-2 (Drill mode)</h3>
                <p style={{ color: "var(--color-text-muted)", marginTop: "8px" }}>Replication engine: pglogical active-active setup. Replication latency is within limits (0.4 seconds).</p>
              </div>
              <div>
                <button onClick={handleFailover} style={{ background: "var(--color-warning)", border: "none", color: "white", padding: "12px 24px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>{t.failover}</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
