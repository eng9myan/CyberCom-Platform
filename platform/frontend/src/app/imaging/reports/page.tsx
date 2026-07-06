"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface CriticalFindingRaw {
  id: string;
  report: string;
  finding_description: string;
  severity: string;
  notification_status: string;
}

interface RadiologyReportRaw {
  id: string;
  patient_id: string;
  status: string;
  technique: string;
  findings: string;
  impression: string;
  created_at: string;
}

interface PatientRaw {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  preliminary: "#f59e0b",
  final: "#22c55e",
  signed: "#22c55e",
  amended: "#f59e0b",
  addendum: "#f59e0b",
};

export default function ImagingReportsPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [reports, setReports] = useState<RadiologyReportRaw[] | null>(null);
  const [criticalByReport, setCriticalByReport] = useState<Record<string, CriticalFindingRaw[]>>({});
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [reportsData, criticalData, patientsData] = await Promise.all([
        apiFetch<Paginated<RadiologyReportRaw> | RadiologyReportRaw[]>("/api/v1/imaging/reporting/reports/", opts),
        apiFetch<Paginated<CriticalFindingRaw> | CriticalFindingRaw[]>("/api/v1/imaging/reporting/critical-findings/", opts),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", opts),
      ]);
      setReports(unwrap(reportsData));
      const criticalMap: Record<string, CriticalFindingRaw[]> = {};
      for (const cf of unwrap(criticalData)) (criticalMap[cf.report] ||= []).push(cf);
      setCriticalByReport(criticalMap);
      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load radiology reports."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleNotifyAcknowledge(finding: CriticalFindingRaw) {
    if (!session) return;
    setBusyId(finding.id);
    try {
      if (finding.notification_status === "pending") {
        await apiFetch(`/api/v1/imaging/reporting/critical-findings/${finding.id}/notify/`, {
          method: "POST",
          token: session.accessToken,
          tenantId: session.tenantId,
          body: JSON.stringify({ notification_method: "system" }),
        });
      } else if (finding.notification_status === "notified") {
        await apiFetch(`/api/v1/imaging/reporting/critical-findings/${finding.id}/acknowledge/`, {
          method: "POST",
          token: session.accessToken,
          tenantId: session.tenantId,
          body: JSON.stringify({ read_back_verified: true }),
        });
      }
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Action failed."));
    } finally {
      setBusyId(null);
    }
  }

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/imaging" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>{t("← Imaging", "← الأشعة")}</a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" }}>{t("Radiology Reports", "تقارير الأشعة")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Real reports with critical-finding notification workflow", "تقارير حقيقية مع سير عمل إشعار النتائج الحرجة")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/imaging", label: t("Overview", "نظرة عامة") },
          { href: "/imaging/orders", label: t("Orders", "الطلبات") },
          { href: "/imaging/scheduling", label: t("Scheduling", "الجدولة") },
          { href: "/imaging/reports", label: t("Reports", "التقارير") },
          { href: "/imaging/pacs", label: t("PACS", "PACS") },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/imaging/reports" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/imaging/reports" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/imaging/reports" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>{t("Loading…", "جارٍ التحميل…")}</p>}

      {!loading && (reports || []).length === 0 && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          {t("No radiology reports for this tenant yet.", "لا توجد تقارير أشعة لهذا المستأجر بعد.")}
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {(reports || []).map(report => {
          const patient = patients[report.patient_id];
          const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${report.patient_id.slice(0, 8)}`;
          const findings = criticalByReport[report.id] || [];
          return (
            <div key={report.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{patientLabel}</p>
                  {patient?.mrn && <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0.15rem 0 0" }}>{patient.mrn}</p>}
                </div>
                <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: (STATUS_COLORS[report.status] || "#6b7280") + "22", color: STATUS_COLORS[report.status] || "#6b7280" }}>
                  {report.status}
                </span>
              </div>
              {report.findings && (
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}><strong>{t("Findings:", "النتائج:")}</strong> {report.findings}</p>
              )}
              {report.impression && (
                <p style={{ fontSize: "0.82rem", marginBottom: "0.4rem" }}><strong>{t("Impression:", "الانطباع:")}</strong> {report.impression}</p>
              )}
              {!report.findings && !report.impression && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>{t("Report not yet dictated.", "لم يتم إملاء التقرير بعد.")}</p>
              )}
              {findings.length > 0 && (
                <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.4rem" }}>
                  {findings.map(f => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.7rem", borderRadius: "6px", background: "#fef2f2" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#b91c1c" }}>⚠ {f.finding_description} ({f.severity})</span>
                      {f.notification_status === "acknowledged" ? (
                        <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600 }}>{t("Acknowledged", "تم الإقرار")}</span>
                      ) : (
                        <button disabled={busyId === f.id} onClick={() => handleNotifyAcknowledge(f)} style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", opacity: busyId === f.id ? 0.5 : 1 }}>
                          {f.notification_status === "pending" ? t("Notify", "إشعار") : t("Acknowledge", "إقرار")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
