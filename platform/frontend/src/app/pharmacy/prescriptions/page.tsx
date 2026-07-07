"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface MedicationOrderRaw {
  id: string;
  order_number: string;
  patient_id: string;
  prescriber_id: string;
  drug_name: string;
  dose: string;
  dose_unit: string;
  frequency: string;
  status: string;
  is_controlled: boolean;
  dea_schedule: string;
  created_at: string;
}

interface DrugInteractionRaw {
  patient_id: string;
  drug_a_name: string;
  drug_b_name: string;
  severity: string;
  alert_status: string;
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

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_verification: "New",
  verified: "Verified",
  active: "Active",
  on_hold: "On Hold",
  discontinued: "Discontinued",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending_verification: { bg: "#dbeafe", color: "#1e40af" },
  verified: { bg: "#d1fae5", color: "#065f46" },
  active: { bg: "#f0fdf4", color: "#15803d" },
  on_hold: { bg: "#fee2e2", color: "#b91c1c" },
  completed: { bg: "#f3f4f6", color: "#374151" },
  cancelled: { bg: "#f3f4f6", color: "#9ca3af" },
};

export default function PrescriptionsPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [orders, setOrders] = useState<MedicationOrderRaw[] | null>(null);
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [interactionsByPatient, setInteractionsByPatient] = useState<Record<string, DrugInteractionRaw[]>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [ordersData, patientsData, interactionsData] = await Promise.all([
        apiFetch<Paginated<MedicationOrderRaw> | MedicationOrderRaw[]>(
          "/api/v1/pharmacy/prescriptions/orders/",
          { token: session.accessToken, tenantId: session.tenantId }
        ),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
        apiFetch<Paginated<DrugInteractionRaw> | DrugInteractionRaw[]>(
          "/api/v1/pharmacy/interactions/detected/?alert_status=active",
          { token: session.accessToken, tenantId: session.tenantId }
        ),
      ]);

      setOrders(unwrap(ordersData));

      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);

      const interactionMap: Record<string, DrugInteractionRaw[]> = {};
      for (const interaction of unwrap(interactionsData)) {
        (interactionMap[interaction.patient_id] ||= []).push(interaction);
      }
      setInteractionsByPatient(interactionMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load prescription queue."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAction(id: string, nextStatus: "verified" | "on_hold" | "cancelled") {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/pharmacy/prescriptions/orders/${id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status: nextStatus }),
      });
      const msgs = {
        verified: lang === "en" ? "Order verified." : "تم التحقق من الطلب.",
        on_hold: lang === "en" ? "Order placed on hold." : "تم تعليق الطلب.",
        cancelled: lang === "en" ? "Order cancelled." : "تم إلغاء الطلب.",
      };
      setActionMsg(msgs[nextStatus]);
      setTimeout(() => setActionMsg(null), 3000);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Action failed."));
    } finally {
      setBusyId(null);
    }
  }

  const dir = lang === "ar" ? "rtl" : "ltr";

  if (!isAuthenticated) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold">Sign in required</h1>
        <p className="mt-1 text-sm text-ink/50">
          The prescription queue requires an authenticated session.
        </p>
      </div>
    );
  }

  const filtered = (orders || []).filter(o => statusFilter === "all" || o.status === statusFilter);
  const statusCounts = {
    total: (orders || []).length,
    pending_verification: (orders || []).filter(o => o.status === "pending_verification").length,
    verified: (orders || []).filter(o => o.status === "verified").length,
    active: (orders || []).filter(o => o.status === "active").length,
    on_hold: (orders || []).filter(o => o.status === "on_hold").length,
    alerts: Object.keys(interactionsByPatient).length,
  };

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: dir }}>
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-400">
            {lang === "en" ? "Medication Order Queue" : "طابور طلبات الأدوية"}
          </h1>
          <p className="mt-1.5 text-sm text-ink/50">
            {lang === "en" ? "Real inpatient medication orders (CPOE-fed) — review, verify, and manage" : "طلبات الأدوية الحقيقية للمرضى الداخليين — مراجعة والتحقق والإدارة"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2.5">
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing Queue" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary" : "دليل الأدوية" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory" : "المخزون" },
        ].map(item => (
          <a key={item.href} href={item.href} className="rounded-md border border-ink/10 bg-surface px-4 py-2 text-xs font-semibold hover:bg-ink/5">
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: lang === "en" ? "Total" : "الإجمالي", value: statusCounts.total, color: "#22D3EE" },
          { label: lang === "en" ? "New" : "جديد", value: statusCounts.pending_verification, color: "#3b82f6" },
          { label: lang === "en" ? "Verified" : "تم التحقق", value: statusCounts.verified, color: "#22c55e" },
          { label: lang === "en" ? "Active" : "نشط", value: statusCounts.active, color: "#a3e635" },
          { label: lang === "en" ? "On Hold" : "معلقة", value: statusCounts.on_hold, color: "#ef4444" },
          { label: lang === "en" ? "Patients w/ Interaction Alerts" : "مرضى بتنبيهات تفاعل", value: statusCounts.alerts, color: "#f97316" },
        ].map(m => (
          <div key={m.label} className="cy-card p-5 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {["all", "pending_verification", "verified", "active", "on_hold", "completed", "cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold border ${statusFilter === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink"}`}
          >
            {f === "all" ? (lang === "en" ? "All" : "الكل") : STATUS_LABELS[f]}
          </button>
        ))}
        {loading && <span className="self-center text-sm text-ink/50">{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</span>}
      </div>

      {actionMsg && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
          {actionMsg}
        </div>
      )}

      <div className="cy-card overflow-hidden p-0">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-brand-500/5">
              {[
                lang === "en" ? "Order #" : "رقم الطلب",
                lang === "en" ? "Patient" : "المريض",
                lang === "en" ? "Medication" : "الدواء",
                lang === "en" ? "Dose / Freq" : "الجرعة / التكرار",
                lang === "en" ? "Controlled" : "خاضع للرقابة",
                lang === "en" ? "Time" : "الوقت",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Actions" : "إجراءات",
              ].map(h => (
                <th key={h} className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${lang === "ar" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-ink/50">
                  {lang === "en" ? "No medication orders for this tenant yet." : "لا توجد طلبات أدوية لهذا المستأجر بعد."}
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const patient = patients[o.patient_id];
              const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${o.patient_id.slice(0, 8)}`;
              const alerts = interactionsByPatient[o.patient_id];
              return (
                <>
                  <tr key={o.id}>
                    <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs text-ink/50">{o.order_number}</td>
                    <td className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">
                      {patientLabel}{patient?.mrn && <span className="ml-1.5 text-xs text-ink/50">({patient.mrn})</span>}
                    </td>
                    <td className="border-b border-ink/10 px-4 py-3 text-sm font-medium">{o.drug_name}</td>
                    <td className="border-b border-ink/10 px-4 py-3 text-sm text-ink/50">{o.dose} {o.dose_unit} · {o.frequency}</td>
                    <td className="border-b border-ink/10 px-4 py-3 text-sm">{o.is_controlled ? `⚠ ${o.dea_schedule}` : "—"}</td>
                    <td className="border-b border-ink/10 px-4 py-3 text-sm text-ink/50">
                      {o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="border-b border-ink/10 px-4 py-3">
                      <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: STATUS_COLORS[o.status]?.bg || "#f3f4f6", color: STATUS_COLORS[o.status]?.color || "#374151" }}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className="border-b border-ink/10 px-4 py-3">
                      {o.status === "pending_verification" ? (
                        <div className="flex gap-1.5">
                          <button disabled={busyId === o.id} onClick={() => handleAction(o.id, "verified")} className="cy-btn bg-emerald-500 text-white disabled:opacity-50 !min-h-0 !py-1.5 !px-3 text-xs">
                            {lang === "en" ? "Verify" : "تحقق"}
                          </button>
                          <button disabled={busyId === o.id} onClick={() => handleAction(o.id, "on_hold")} className="cy-btn bg-amber-500 text-white disabled:opacity-50 !min-h-0 !py-1.5 !px-3 text-xs">
                            {lang === "en" ? "Hold" : "تعليق"}
                          </button>
                          <button disabled={busyId === o.id} onClick={() => handleAction(o.id, "cancelled")} className="cy-btn bg-red-500 text-white disabled:opacity-50 !min-h-0 !py-1.5 !px-3 text-xs">
                            {lang === "en" ? "Reject" : "رفض"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink/50">—</span>
                      )}
                    </td>
                  </tr>
                  {alerts && alerts.length > 0 && (
                    <tr key={`${o.id}-alert`} className="bg-red-500/5">
                      <td colSpan={8} className="border-b border-ink/10 px-4 py-2">
                        {alerts.map((a, i) => (
                          <div key={i} className="text-sm font-semibold text-red-400">
                            {lang === "en" ? "⚠ Drug Interaction Alert: " : "⚠ تنبيه تفاعل دوائي: "}
                            {a.drug_a_name}{a.drug_b_name ? ` × ${a.drug_b_name}` : ""} ({a.severity})
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink/50">
        {lang === "en" ? `Showing ${filtered.length} of ${statusCounts.total} orders` : `عرض ${filtered.length} من ${statusCounts.total} طلب`}
      </p>
    </div>
  );
}
