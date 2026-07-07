"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface SpecimenRaw {
  id: string;
  specimen_number: string;
  barcode: string;
  patient_id: string;
  specimen_type: string;
  collection_site: string;
  container_type: string;
  status: string;
  collected_at: string | null;
  received_at: string | null;
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
  pending: "#6b7280",
  collected: "#3b82f6",
  in_transit: "#f59e0b",
  received: "#3b82f6",
  accessioned: "#6366f1",
  in_processing: "#f59e0b",
  stored: "#22c55e",
  rejected: "#ef4444",
  disposed: "#6b7280",
};

export default function SpecimensPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [specimens, setSpecimens] = useState<SpecimenRaw[] | null>(null);
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [specimensData, patientsData] = await Promise.all([
        apiFetch<Paginated<SpecimenRaw> | SpecimenRaw[]>("/api/v1/lab/specimens/specimens/", opts),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", opts),
      ]);
      setSpecimens(unwrap(specimensData));
      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load specimens."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function updateStatus(id: string, status: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/lab/specimens/specimens/${id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status }),
      });
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

  const filtered = (specimens || []).filter(s => statusFilter === "all" || s.status === statusFilter);

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <a href="/laboratory" className="text-sm text-brand-400">{t("← Laboratory", "← المختبر")}</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">{t("Specimen Tracking", "تتبع العينات")}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t("Real specimen chain-of-custody", "سلسلة حفظ العينات الحقيقية")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {[
          { href: "/laboratory", label: t("Overview", "نظرة عامة") },
          { href: "/laboratory/orders", label: t("Orders", "الطلبات") },
          { href: "/laboratory/specimens", label: t("Specimens", "العينات") },
          { href: "/laboratory/worklists", label: t("Worklists", "قوائم العمل") },
          { href: "/laboratory/results", label: t("Results", "النتائج") },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${item.href === "/laboratory/specimens" ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3.5 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {["all", "pending", "collected", "in_transit", "received", "accessioned", "in_processing", "stored", "rejected"].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusFilter === f ? "bg-brand-400 text-black" : "border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
          >
            {f === "all" ? t("All", "الكل") : f}
          </button>
        ))}
        {loading && <span className="self-center text-sm text-ink/50">{t("Loading…", "جارٍ التحميل…")}</span>}
        <div className="ms-auto text-sm text-ink/50">
          {t("Showing", "عرض")} {filtered.length} / {(specimens || []).length}
        </div>
      </div>

      <div className="cy-card overflow-auto p-0">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              {[t("Specimen #", "رقم العينة"), t("Patient", "المريض"), t("Type", "النوع"), t("Site", "موقع الجمع"), t("Status", "الحالة"), t("Collected", "وقت الجمع"), t("Actions", "الإجراءات")].map(h => (
                <th key={h} className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold text-ink/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-sm text-ink/40">
                {t("No specimens for this tenant yet.", "لا توجد عينات لهذا المستأجر بعد.")}
              </td></tr>
            )}
            {filtered.map(sp => {
              const patient = patients[sp.patient_id];
              const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${sp.patient_id.slice(0, 8)}`;
              return (
                <tr key={sp.id} className="border-b border-ink/5">
                  <td className="px-4 py-3.5 font-mono text-xs text-brand-400">{sp.specimen_number}</td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-medium">{patientLabel}</div>
                    {patient?.mrn && <div className="text-xs text-ink/50">{patient.mrn}</div>}
                  </td>
                  <td className="px-4 py-3.5 text-sm">{sp.specimen_type}</td>
                  <td className="px-4 py-3.5 text-sm text-ink/50">{sp.collection_site || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: (STATUS_COLORS[sp.status] || "#6b7280") + "22", color: STATUS_COLORS[sp.status] || "#6b7280" }}>
                      {sp.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-ink/50">
                    {sp.collected_at ? new Date(sp.collected_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      {sp.status === "collected" && (
                        <button disabled={busyId === sp.id} onClick={() => updateStatus(sp.id, "received")} className="whitespace-nowrap rounded-md bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-50">
                          {t("Receive", "استلام")}
                        </button>
                      )}
                      {(sp.status === "pending" || sp.status === "collected" || sp.status === "received") && (
                        <button disabled={busyId === sp.id} onClick={() => updateStatus(sp.id, "rejected")} className="whitespace-nowrap rounded-md border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                          {t("Reject", "رفض")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
