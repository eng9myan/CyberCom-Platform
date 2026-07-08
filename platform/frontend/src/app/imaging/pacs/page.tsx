"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface DICOMSeriesRaw {
  id: string;
  series_description: string;
  modality: string;
  instance_count: number;
}

interface DICOMStudyRaw {
  id: string;
  study_instance_uid: string;
  accession_number: string;
  patient_id: string;
  modality: string;
  study_date: string | null;
  series: DICOMSeriesRaw[];
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

export default function ImagingPacsPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [studies, setStudies] = useState<DICOMStudyRaw[] | null>(null);
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [studiesData, patientsData] = await Promise.all([
        apiFetch<Paginated<DICOMStudyRaw> | DICOMStudyRaw[]>("/api/v1/imaging/dicom/studies/", opts),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", opts),
      ]);
      setStudies(unwrap(studiesData));
      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load DICOM study registry."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <a href="/imaging" className="text-sm text-brand-400 hover:underline">{t("← Imaging", "← الأشعة")}</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">{t("DICOM Study Registry", "سجل دراسات DICOM")}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t("Real study/series metadata — this is a PACS gateway registry, not an image viewer.", "بيانات وصفية حقيقية للدراسات/السلاسل — هذه بوابة سجل PACS، وليست عارض صور.")}
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
          <a key={item.href} href={item.href} className={`rounded-md px-4 py-1.5 text-sm font-medium ${item.href === "/imaging/pacs" ? "border border-brand-400 bg-brand-500/15 text-brand-400" : "border border-ink/10 bg-surface text-ink"}`}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3.5 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-100 px-5 py-3.5 text-sm text-amber-800">
        {t(
          "No image pixel data is stored in this system — studies are routed to an external PACS via DICOMweb/WADO. This registry tracks metadata only.",
          "لا يتم تخزين بيانات الصور في هذا النظام — يتم توجيه الدراسات إلى PACS خارجي عبر DICOMweb/WADO. يتتبع هذا السجل البيانات الوصفية فقط."
        )}
      </div>

      {loading && <p className="mb-4 text-sm text-ink/50">{t("Loading…", "جارٍ التحميل…")}</p>}

      {!loading && (studies || []).length === 0 && (
        <div className="cy-card p-8 text-center text-sm text-ink/50">
          {t("No DICOM studies registered for this tenant yet.", "لا توجد دراسات DICOM مسجلة لهذا المستأجر بعد.")}
        </div>
      )}

      <div className="cy-card overflow-hidden p-0">
        {(studies || []).length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ink/10">
                {[t("Accession", "رقم الدخول"), t("Patient", "المريض"), t("Modality", "الجهاز"), t("Study Date", "تاريخ الدراسة"), t("Series", "السلاسل"), t("Instances", "الصور")].map(h => (
                  <th key={h} className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${lang === "ar" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(studies || []).map(study => {
                const patient = patients[study.patient_id];
                const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${study.patient_id.slice(0, 8)}`;
                const totalInstances = (study.series || []).reduce((sum, s) => sum + (s.instance_count || 0), 0);
                return (
                  <tr key={study.id} className="border-b border-ink/10">
                    <td className="px-4 py-3 font-mono text-xs text-brand-400">{study.accession_number || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{patientLabel}</div>
                      {patient?.mrn && <div className="text-xs text-ink/50">{patient.mrn}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm">{study.modality}</td>
                    <td className="px-4 py-3 text-sm text-ink/50">{study.study_date || "—"}</td>
                    <td className="px-4 py-3 text-sm">{(study.series || []).length}</td>
                    <td className="px-4 py-3 text-sm">{totalInstances}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
