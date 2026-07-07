"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface ResultValueRaw {
  id: string;
  analyte_name: string;
  value_numeric: string | null;
  value_text: string;
  unit: string;
  interpretation: string;
  is_critical: boolean;
  is_abnormal: boolean;
}

interface LabResultRaw {
  id: string;
  order_item: string;
  status: string;
  has_critical_value: boolean;
  has_abnormal_value: boolean;
  resulted_at: string | null;
  values: ResultValueRaw[];
}

interface CriticalResultRaw {
  id: string;
  result_value: string;
  notification_status: string;
  critical_at: string;
  acknowledgement_name: string;
}

interface LabOrderItemRaw {
  id: string;
  order: string;
}

interface LabOrderRaw {
  id: string;
  order_number: string;
  patient_id: string;
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
  in_progress: "#f59e0b",
  resulted: "#22c55e",
  verified: "#22c55e",
  approved: "#22c55e",
  amended: "#f59e0b",
  cancelled: "#ef4444",
};

export default function LabResultsPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [results, setResults] = useState<LabResultRaw[] | null>(null);
  const [criticalByValue, setCriticalByValue] = useState<Record<string, CriticalResultRaw>>({});
  const [patientByOrderItem, setPatientByOrderItem] = useState<Record<string, { label: string; mrn: string }>>({});
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
      const [resultsData, criticalData, itemsData, ordersData, patientsData] = await Promise.all([
        apiFetch<Paginated<LabResultRaw> | LabResultRaw[]>("/api/v1/lab/results/results/", opts),
        apiFetch<Paginated<CriticalResultRaw> | CriticalResultRaw[]>("/api/v1/lab/results/critical-results/", opts),
        apiFetch<Paginated<LabOrderItemRaw> | LabOrderItemRaw[]>("/api/v1/lab/orders/order-items/", opts),
        apiFetch<Paginated<LabOrderRaw> | LabOrderRaw[]>("/api/v1/lab/orders/orders/", opts),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", opts),
      ]);

      setResults(unwrap(resultsData));

      const criticalMap: Record<string, CriticalResultRaw> = {};
      for (const cr of unwrap(criticalData)) criticalMap[cr.result_value] = cr;
      setCriticalByValue(criticalMap);

      const orderById: Record<string, LabOrderRaw> = {};
      for (const o of unwrap(ordersData)) orderById[o.id] = o;
      const patientById: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientById[p.id] = p;

      const itemPatientMap: Record<string, { label: string; mrn: string }> = {};
      for (const item of unwrap(itemsData)) {
        const order = orderById[item.order];
        if (!order) continue;
        const patient = patientById[order.patient_id];
        itemPatientMap[item.id] = {
          label: patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${order.patient_id.slice(0, 8)}`,
          mrn: patient?.mrn || "",
        };
      }
      setPatientByOrderItem(itemPatientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load lab results."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAcknowledge(criticalResultId: string) {
    if (!session) return;
    const name = window.prompt(lang === "en" ? "Read-back verification: enter your name" : "التحقق: أدخل اسمك");
    if (!name) return;
    setBusyId(criticalResultId);
    try {
      await apiFetch(`/api/v1/lab/results/critical-results/${criticalResultId}/acknowledge/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ acknowledgement_name: name }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Acknowledge failed."));
    } finally {
      setBusyId(null);
    }
  }

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const filtered = (results || []).filter(r => statusFilter === "all" || r.status === statusFilter);
  const unacknowledgedCritical = (results || []).filter(r => {
    if (!r.has_critical_value) return false;
    return (r.values || []).some(v => {
      const critical = criticalByValue[v.id];
      return v.is_critical && critical && critical.notification_status !== "acknowledged" && critical.notification_status !== "closed";
    });
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <a href="/laboratory" className="text-sm text-brand-400">{t("← Laboratory", "← المختبر")}</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">{t("Lab Results", "نتائج المختبر")}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t("Real results with critical-value flagging and read-back acknowledgment", "نتائج حقيقية مع تمييز القيم الحرجة والإقرار بها")}
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
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${item.href === "/laboratory/results" ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
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

      {unacknowledgedCritical.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-3.5">
          <span className="text-lg">⚠</span>
          <div>
            <p className="text-sm font-bold text-red-400">
              {unacknowledgedCritical.length} {t("Unacknowledged Critical Value(s)", "قيمة حرجة غير مُقرّ بها")}
            </p>
            <p className="mt-0.5 text-xs text-red-400">
              {t("Critical results require immediate physician acknowledgment.", "تتطلب النتائج الحرجة إقرارًا فوريًا من الطبيب.")}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: t("Total Results", "إجمالي النتائج"), value: (results || []).length, color: "#6366f1" },
          { label: t("Critical", "حرجة"), value: (results || []).filter(r => r.has_critical_value).length, color: "#ef4444" },
          { label: t("Abnormal", "غير طبيعية"), value: (results || []).filter(r => r.has_abnormal_value).length, color: "#f59e0b" },
          { label: t("Unacknowledged", "غير مُقرّ بها"), value: unacknowledgedCritical.length, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {["all", "pending", "resulted", "verified", "approved", "amended", "cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusFilter === f ? "bg-brand-400 text-black" : "border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
          >
            {f === "all" ? t("All", "الكل") : f}
          </button>
        ))}
        {loading && <span className="self-center text-sm text-ink/50">{t("Loading…", "جارٍ التحميل…")}</span>}
      </div>

      <div className="grid gap-4">
        {!loading && filtered.length === 0 && (
          <div className="cy-card p-8 text-center text-sm text-ink/40">
            {t("No lab results for this tenant yet.", "لا توجد نتائج مخبرية لهذا المستأجر بعد.")}
          </div>
        )}
        {filtered.map(result => {
          const patientInfo = patientByOrderItem[result.order_item];
          return (
            <div key={result.id} className="cy-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold">{patientInfo?.label || `Order Item ${result.order_item.slice(0, 8)}`}</p>
                  {patientInfo?.mrn && <p className="mt-0.5 text-xs text-ink/50">{patientInfo.mrn}</p>}
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: (STATUS_COLORS[result.status] || "#6b7280") + "22", color: STATUS_COLORS[result.status] || "#6b7280" }}>
                  {result.status}
                </span>
              </div>
              <div className="grid gap-1.5">
                {(result.values || []).map(v => {
                  const critical = criticalByValue[v.id];
                  return (
                    <div key={v.id} className={`flex items-center justify-between rounded-md px-2.5 py-1.5 ${v.is_critical ? "bg-red-500/10" : ""}`}>
                      <span className={`text-sm ${v.is_critical ? "font-bold text-red-400" : ""}`}>
                        {v.is_critical && "⚠ "}{v.analyte_name}: {v.value_numeric ?? v.value_text} {v.unit}
                        {v.interpretation && <span className="text-ink/50"> ({v.interpretation})</span>}
                      </span>
                      {v.is_critical && critical && (
                        critical.notification_status === "acknowledged" ? (
                          <span className="text-xs font-semibold text-emerald-400">
                            {t("Acknowledged by", "أقرّ بواسطة")} {critical.acknowledgement_name}
                          </span>
                        ) : (
                          <button disabled={busyId === critical.id} onClick={() => handleAcknowledge(critical.id)} className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50">
                            {t("Acknowledge", "إقرار")}
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
