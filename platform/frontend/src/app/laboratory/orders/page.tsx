"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface LabOrderItemRaw {
  id: string;
  test: string | null;
  status: string;
  priority: string;
  specimen_type: string;
}

interface LabOrderRaw {
  id: string;
  order_number: string;
  patient_id: string;
  status: string;
  priority: string;
  ordered_by: string;
  ordering_location: string;
  requested_at: string | null;
  items: LabOrderItemRaw[];
}

interface LabTestRaw {
  id: string;
  name: string;
  loinc_code: string;
  department: string;
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

function priorityColor(p: string) {
  if (p === "stat") return "#ef4444";
  if (p === "urgent") return "#f59e0b";
  return "#6366f1";
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  submitted: "#3b82f6",
  in_progress: "#f59e0b",
  partial: "#f59e0b",
  completed: "#22c55e",
  cancelled: "#ef4444",
  on_hold: "#6b7280",
};

export default function LabOrdersPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [orders, setOrders] = useState<LabOrderRaw[] | null>(null);
  const [tests, setTests] = useState<Record<string, LabTestRaw>>({});
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [ordersData, testsData, patientsData] = await Promise.all([
        apiFetch<Paginated<LabOrderRaw> | LabOrderRaw[]>("/api/v1/lab/orders/orders/", {
          token: session.accessToken, tenantId: session.tenantId,
        }),
        apiFetch<Paginated<LabTestRaw> | LabTestRaw[]>("/api/v1/lab/orders/tests/", {
          token: session.accessToken, tenantId: session.tenantId,
        }),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", {
          token: session.accessToken, tenantId: session.tenantId,
        }),
      ]);
      setOrders(unwrap(ordersData));
      const testMap: Record<string, LabTestRaw> = {};
      for (const t of unwrap(testsData)) testMap[t.id] = t;
      setTests(testMap);
      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load lab orders."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCancel(id: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/lab/orders/orders/${id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status: "cancelled" }),
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

  const filtered = (orders || []).filter(o => {
    if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <a href="/laboratory" className="text-sm text-brand-400">{t("← Laboratory", "← المختبر")}</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">{t("Lab Order Management", "إدارة طلبات المختبر")}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t("Real laboratory test orders (CPOE-fed)", "طلبات الفحوصات المخبرية الحقيقية")}
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
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${item.href === "/laboratory/orders" ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3.5 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      <div className="mb-6 grid grid-cols-5 gap-4">
        {[
          { label: t("Total Orders", "إجمالي الطلبات"), value: (orders || []).length, color: "#6366f1" },
          { label: t("Submitted", "مُرسلة"), value: (orders || []).filter(o => o.status === "submitted").length, color: "#3b82f6" },
          { label: t("In Progress", "قيد المعالجة"), value: (orders || []).filter(o => o.status === "in_progress").length, color: "#f59e0b" },
          { label: t("Completed", "مكتملة"), value: (orders || []).filter(o => o.status === "completed").length, color: "#22c55e" },
          { label: t("STAT Orders", "طلبات عاجلة"), value: (orders || []).filter(o => o.priority === "stat").length, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="cy-card mb-5 flex flex-wrap items-center gap-4 p-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-ink/50">{t("Priority", "الأولوية")}</span>
          <div className="flex gap-1">
            {["all", "stat", "urgent", "routine"].map(f => (
              <button
                key={f}
                onClick={() => setPriorityFilter(f)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${priorityFilter === f ? "bg-brand-400 text-black" : "border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
              >
                {f === "all" ? t("All", "الكل") : f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-ink/50">{t("Status", "الحالة")}</span>
          <div className="flex flex-wrap gap-1">
            {["all", "submitted", "in_progress", "partial", "completed", "cancelled"].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusFilter === f ? "bg-brand-400 text-black" : "border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
              >
                {f === "all" ? t("All", "الكل") : f}
              </button>
            ))}
          </div>
        </div>
        {loading && <span className="text-sm text-ink/50">{t("Loading…", "جارٍ التحميل…")}</span>}
        <div className="ms-auto text-sm text-ink/50">
          {t("Showing", "عرض")} {filtered.length} / {(orders || []).length} {t("orders", "طلب")}
        </div>
      </div>

      <div className="cy-card overflow-auto p-0">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              {[t("Order #", "رقم الطلب"), t("Patient", "المريض"), t("Test(s)", "الفحوصات"), t("Location", "الموقع"), t("Priority", "الأولوية"), t("Status", "الحالة"), t("Requested", "وقت الطلب"), t("Actions", "الإجراءات")].map(h => (
                <th key={h} className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold text-ink/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-sm text-ink/40">
                {t("No lab orders for this tenant yet.", "لا توجد طلبات مخبرية لهذا المستأجر بعد.")}
              </td></tr>
            )}
            {filtered.map(order => {
              const patient = patients[order.patient_id];
              const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${order.patient_id.slice(0, 8)}`;
              const testNames = (order.items || []).map(item => item.test ? tests[item.test]?.name : null).filter(Boolean).join(", ") || "—";
              return (
                <tr key={order.id} className="border-b border-ink/5">
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-brand-400">{order.order_number}</td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-medium">{patientLabel}</div>
                    {patient?.mrn && <div className="text-xs text-ink/50">{patient.mrn}</div>}
                  </td>
                  <td className="px-4 py-3.5 text-sm">{testNames}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-ink/50">{order.ordering_location || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: priorityColor(order.priority) + "22", color: priorityColor(order.priority), border: `1px solid ${priorityColor(order.priority)}` }}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: (STATUS_COLORS[order.status] || "#6b7280") + "22", color: STATUS_COLORS[order.status] || "#6b7280" }}>
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                    {order.requested_at ? new Date(order.requested_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    {(order.status === "submitted" || order.status === "in_progress") ? (
                      <button disabled={busyId === order.id} onClick={() => handleCancel(order.id)} className="whitespace-nowrap rounded-md border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                        {t("Cancel", "إلغاء")}
                      </button>
                    ) : (
                      <span className="text-xs text-ink/40">—</span>
                    )}
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
