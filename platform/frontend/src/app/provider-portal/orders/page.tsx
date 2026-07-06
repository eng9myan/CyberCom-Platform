"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { resolveCurrentProvider, type CurrentProvider } from "../_lib/provider";

type OrderCategory = "laboratory" | "imaging" | "medication" | "procedure" | "referral" | "nursing" | "dietary" | "respiratory" | "physical_therapy" | "other";
type OrderStatus = "draft" | "submitted" | "acknowledged" | "in_progress" | "completed" | "cancelled" | "on_hold";
type Priority = "routine" | "urgent" | "stat";

interface OrderRequest {
  id: string;
  patient_id: string;
  ordering_provider_id: string;
  ordering_provider_name: string;
  order_category: OrderCategory;
  order_name: string;
  priority: Priority;
  status: OrderStatus;
  clinical_indication: string;
  created_at: string;
}

interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_FLOW: OrderStatus[] = ["draft", "submitted", "acknowledged", "in_progress", "completed"];
const STATUS_COLOR: Record<OrderStatus, string> = {
  draft: "#94a3b8", submitted: "#f59e0b", acknowledged: "#3b82f6", in_progress: "#a78bfa",
  completed: "#22c55e", cancelled: "#ef4444", on_hold: "#f97316",
};
const CATEGORY_ICON: Record<OrderCategory, string> = {
  laboratory: "🧪", imaging: "🩻", medication: "💊", referral: "👨‍⚕️", procedure: "🩹",
  nursing: "🧑‍⚕️", dietary: "🍽️", respiratory: "🫁", physical_therapy: "🏃", other: "📋",
};
const PRIORITY_COLOR: Record<Priority, string> = { routine: "#94a3b8", urgent: "#f59e0b", stat: "#ef4444" };

export default function ProviderOrders() {
  const { session, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderRequest[] | null>(null);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [provider, setProvider] = useState<CurrentProvider | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<OrderCategory | "all">("all");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState<OrderCategory>("laboratory");
  const [formPatientId, setFormPatientId] = useState("");
  const [formName, setFormName] = useState("");
  const [formIndication, setFormIndication] = useState("");
  const [formPriority, setFormPriority] = useState<Priority>("routine");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [ordersData, patientsData, resolvedProvider] = await Promise.all([
        apiFetch<Paginated<OrderRequest> | OrderRequest[]>("/api/v1/provider-portal/orders/order-requests/", opts),
        apiFetch<Paginated<Patient> | Patient[]>("/api/v1/patients/", opts),
        resolveCurrentProvider(session.userId, opts),
      ]);
      setOrders(unwrap(ordersData));
      const pMap: Record<string, Patient> = {};
      for (const p of unwrap(patientsData)) pMap[p.id] = p;
      setPatients(pMap);
      setProvider(resolvedProvider);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load order requests."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function handleSubmitOrder() {
    if (!session || !provider || !formPatientId || !formName) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/provider-portal/orders/order-requests/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          patient_id: formPatientId,
          ordering_provider_id: provider.id,
          ordering_provider_name: provider.name,
          order_category: formCategory,
          order_name: formName,
          priority: formPriority,
          status: "submitted",
          clinical_indication: formIndication,
          submitted_at: new Date().toISOString(),
        }),
      });
      setFormName("");
      setFormIndication("");
      setFormPatientId("");
      setShowForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to submit order."));
    } finally {
      setSubmitting(false);
    }
  }

  async function advanceStatus(order: OrderRequest) {
    if (!session) return;
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
    if (!next || next === order.status) return;
    setBusyId(order.id);
    try {
      await apiFetch(`/api/v1/provider-portal/orders/order-requests/${order.id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          status: next,
          ...(next === "acknowledged" ? { acknowledged_at: new Date().toISOString() } : {}),
          ...(next === "completed" ? { completed_at: new Date().toISOString() } : {}),
        }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to update order status."));
    } finally {
      setBusyId(null);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const filtered = (orders || []).filter(o => activeTab === "all" || o.order_category === activeTab);
  const countByCat = (cat: OrderCategory) => (orders || []).filter(o => o.order_category === cat).length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/provider-portal" className="mb-1 inline-block text-sm text-white/50 hover:text-white">← Provider Portal</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">Order Entry (CPOE)</h1>
          <p className="mt-1 text-sm text-white/50">Real orders — lab, imaging, medication, referral, and more</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ New Order</button>
      </header>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>
      )}

      {provider === null && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Your account isn&apos;t linked to a clinical Provider record, so you can view orders but can&apos;t submit new ones. Ask an administrator to link your user to a Provider.
        </div>
      )}

      {showForm && (
        <div className="cy-card mb-6 p-5">
          <h3 className="mb-3 font-heading font-bold text-brand-400">New Order</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/50">Patient</label>
              <select value={formPatientId} onChange={e => setFormPatientId(e.target.value)} className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm">
                <option value="">Select patient…</option>
                {Object.values(patients).map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Category</label>
              <select value={formCategory} onChange={e => setFormCategory(e.target.value as OrderCategory)} className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm">
                {(Object.keys(CATEGORY_ICON) as OrderCategory[]).map(c => (
                  <option key={c} value={c}>{c.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Priority</label>
              <select value={formPriority} onChange={e => setFormPriority(e.target.value as Priority)} className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Order name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. CBC, Chest CT, Amlodipine 5mg" className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/50">Clinical indication</label>
              <input value={formIndication} onChange={e => setFormIndication(e.target.value)} placeholder="Reason for order" className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmitOrder} disabled={submitting || !provider || !formPatientId || !formName} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit Order"}
            </button>
            <button onClick={() => setShowForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "laboratory", "imaging", "medication", "referral"] as (OrderCategory | "all")[]).map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${activeTab === cat ? "bg-brand-500/15 text-brand-300 border border-brand-400/40" : "border border-white/10 text-white/50 hover:bg-white/5"}`}>
            {cat === "all" ? "All Orders" : `${cat} (${countByCat(cat)})`}
          </button>
        ))}
      </div>

      <div className="cy-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Ordered</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders === null && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-white/40">Loading order requests…</td></tr>
              )}
              {orders !== null && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-white/40">No order requests for this tenant yet.</td></tr>
              )}
              {filtered.map(o => {
                const patient = patients[o.patient_id];
                return (
                  <tr key={o.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">{CATEGORY_ICON[o.order_category]} <span className="capitalize text-white/70">{o.order_category.replace("_", " ")}</span></td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${o.patient_id.slice(0, 8)}`}</div>
                      {patient && <div className="text-xs text-white/40">{patient.mrn}</div>}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-white/70">{o.order_name}</td>
                    <td className="px-4 py-3"><span style={{ color: PRIORITY_COLOR[o.priority] }} className="text-xs font-bold uppercase">{o.priority}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-white/40">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status] }}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!["completed", "cancelled"].includes(o.status) && (
                        <button disabled={busyId === o.id} onClick={() => advanceStatus(o)} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10 disabled:opacity-40">
                          {busyId === o.id ? "…" : "Advance"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
