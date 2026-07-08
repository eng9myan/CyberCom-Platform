"use client";

import { usePreferences } from "@/contexts/preferences";

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
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
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
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <a href="/imaging" className="text-sm text-brand-400 hover:underline">{t("← Imaging", "← الأشعة")}</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">{t("Radiology Reports", "تقارير الأشعة")}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t("Real reports with critical-finding notification workflow", "تقارير حقيقية مع سير عمل إشعار النتائج الحرجة")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {[
          { href: "/imaging", label: t("Overview", "نظرة عامة") },
          { href: "/imaging/orders", label: t("Orders", "الطلبات") },
          { href: "/imaging/scheduling", label: t("Scheduling", "الجدولة") },
          { href: "/imaging/reports", label: t("Reports", "التقارير") },
          { href: "/imaging/pacs", label: t("PACS", "PACS") },
        ].map(item => (
          <a key={item.href} href={item.href} className={`rounded-md px-4 py-1.5 text-sm font-medium ${item.href === "/imaging/reports" ? "border border-brand-400 bg-brand-500/15 text-brand-400" : "border border-ink/10 bg-surface text-ink"}`}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3.5 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {loading && <p className="mb-4 text-sm text-ink/50">{t("Loading…", "جارٍ التحميل…")}</p>}

      {!loading && (reports || []).length === 0 && (
        <div className="cy-card p-8 text-center text-sm text-ink/50">
          {t("No radiology reports for this tenant yet.", "لا توجد تقارير أشعة لهذا المستأجر بعد.")}
        </div>
      )}

      <div className="grid gap-4">
        {(reports || []).map(report => {
          const patient = patients[report.patient_id];
          const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${report.patient_id.slice(0, 8)}`;
          const findings = criticalByReport[report.id] || [];
          return (
            <div key={report.id} className="cy-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold">{patientLabel}</p>
                  {patient?.mrn && <p className="mt-0.5 text-xs text-ink/50">{patient.mrn}</p>}
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: (STATUS_COLORS[report.status] || "#6b7280") + "22", color: STATUS_COLORS[report.status] || "#6b7280" }}>
                  {report.status}
                </span>
              </div>
              {report.findings && (
                <p className="mb-1.5 text-sm text-ink/50"><strong>{t("Findings:", "النتائج:")}</strong> {report.findings}</p>
              )}
              {report.impression && (
                <p className="mb-1.5 text-sm"><strong>{t("Impression:", "الانطباع:")}</strong> {report.impression}</p>
              )}
              {!report.findings && !report.impression && (
                <p className="text-sm italic text-ink/50">{t("Report not yet dictated.", "لم يتم إملاء التقرير بعد.")}</p>
              )}
              {findings.length > 0 && (
                <div className="mt-3 grid gap-1.5">
                  {findings.map(f => (
                    <div key={f.id} className="flex items-center justify-between rounded-md bg-red-500/[0.06] px-3 py-2">
                      <span className="text-sm font-bold text-red-500">⚠ {f.finding_description} ({f.severity})</span>
                      {f.notification_status === "acknowledged" ? (
                        <span className="text-xs font-semibold text-emerald-500">{t("Acknowledged", "تم الإقرار")}</span>
                      ) : (
                        <button disabled={busyId === f.id} onClick={() => handleNotifyAcknowledge(f)} className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50">
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
