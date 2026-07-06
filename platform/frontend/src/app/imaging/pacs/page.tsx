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
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" }}>{t("DICOM Study Registry", "سجل دراسات DICOM")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Real study/series metadata — this is a PACS gateway registry, not an image viewer.", "بيانات وصفية حقيقية للدراسات/السلاسل — هذه بوابة سجل PACS، وليست عارض صور.")}
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
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/imaging/pacs" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/imaging/pacs" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/imaging/pacs" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "0.85rem 1.25rem", marginBottom: "1.5rem", color: "#92400e", fontSize: "0.85rem" }}>
        {t(
          "No image pixel data is stored in this system — studies are routed to an external PACS via DICOMweb/WADO. This registry tracks metadata only.",
          "لا يتم تخزين بيانات الصور في هذا النظام — يتم توجيه الدراسات إلى PACS خارجي عبر DICOMweb/WADO. يتتبع هذا السجل البيانات الوصفية فقط."
        )}
      </div>

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>{t("Loading…", "جارٍ التحميل…")}</p>}

      {!loading && (studies || []).length === 0 && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          {t("No DICOM studies registered for this tenant yet.", "لا توجد دراسات DICOM مسجلة لهذا المستأجر بعد.")}
        </div>
      )}

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
        {(studies || []).length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                {[t("Accession", "رقم الدخول"), t("Patient", "المريض"), t("Modality", "الجهاز"), t("Study Date", "تاريخ الدراسة"), t("Series", "السلاسل"), t("Instances", "الصور")].map(h => (
                  <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(studies || []).map(study => {
                const patient = patients[study.patient_id];
                const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${study.patient_id.slice(0, 8)}`;
                const totalInstances = (study.series || []).reduce((sum, s) => sum + (s.instance_count || 0), 0);
                return (
                  <tr key={study.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "#22D3EE" }}>{study.accession_number || "—"}</td>
                    <td style={{ padding: "0.75rem 0.875rem" }}>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{patientLabel}</div>
                      {patient?.mrn && <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{patient.mrn}</div>}
                    </td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.85rem" }}>{study.modality}</td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{study.study_date || "—"}</td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.85rem" }}>{(study.series || []).length}</td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.85rem" }}>{totalInstances}</td>
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
