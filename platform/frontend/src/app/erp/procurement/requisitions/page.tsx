"use client";

import { useState, useEffect, useCallback } from "react";
import { FileCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type ReqStatus = "draft" | "pending_approval" | "approved" | "rejected" | "converted";

interface RequisitionLine { id: string; description: string; quantity: string; estimated_unit_price: string; }
interface Requisition {
  id: string; department: string; justification: string; needed_by: string | null;
  status: ReqStatus; rejection_reason: string; purchase_order_id: string | null; lines: RequisitionLine[];
}
interface Vendor { id: string; name: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<ReqStatus, string> = { draft: "#94a3b8", pending_approval: "#f59e0b", approved: "#22c55e", rejected: "#ef4444", converted: "#3b82f6" };

export default function RequisitionsPage() {
  const { session, isAuthenticated } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ department: "", justification: "", needed_by: "", description: "", quantity: "1", estimated_unit_price: "0" });
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [vendorChoice, setVendorChoice] = useState("");

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [reqData, vendorData] = await Promise.all([
        apiFetch<Paginated<Requisition> | Requisition[]>("/api/v1/erp/procurement/requisitions/requisitions/", opts),
        apiFetch<Paginated<Vendor> | Vendor[]>("/api/v1/erp/finance/ap/vendors/", opts),
      ]);
      setRequisitions(unwrap(reqData));
      setVendors(unwrap(vendorData));
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load requisitions."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createRequisition() {
    if (!session || !form.department || !form.justification || !form.description) return;
    setBusyId("new");
    try {
      const req = await apiFetch<Requisition>("/api/v1/erp/procurement/requisitions/requisitions/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ department: form.department, justification: form.justification, needed_by: form.needed_by || null }),
      });
      await apiFetch("/api/v1/erp/procurement/requisitions/requisition-lines/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ requisition: req.id, description: form.description, quantity: form.quantity, estimated_unit_price: form.estimated_unit_price }),
      });
      setForm({ department: "", justification: "", needed_by: "", description: "", quantity: "1", estimated_unit_price: "0" });
      setShowForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to create requisition."));
    } finally {
      setBusyId(null);
    }
  }

  async function approve(id: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/erp/procurement/requisitions/requisitions/${id}/approve/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to approve requisition."));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!session) return;
    const reason = window.prompt("Rejection reason:");
    if (!reason) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/erp/procurement/requisitions/requisitions/${id}/reject/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ rejection_reason: reason }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to reject requisition."));
    } finally {
      setBusyId(null);
    }
  }

  async function convertToPO(id: string) {
    if (!session || !vendorChoice) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/erp/procurement/requisitions/requisitions/${id}/convert-to-po/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ vendor_id: vendorChoice }),
      });
      setConvertingId(null); setVendorChoice("");
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to convert requisition to PO."));
    } finally {
      setBusyId(null);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const sorted = (requisitions || []).slice();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/erp/procurement" className="mb-1 inline-block text-sm text-ink/50 hover:text-ink">← Procurement</a>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><FileCheck size={22} /> Purchase Requisitions</h1>
          <p className="mt-1 text-sm text-ink/50">Department requests, approval, and PO conversion</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ New Requisition</button>
      </header>

      {fetchError && <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      {showForm && (
        <div className="cy-card mb-6 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-ink/50">Department</label>
              <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Needed by</label>
              <input type="date" value={form.needed_by} onChange={e => setForm(f => ({ ...f, needed_by: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-ink/50">Justification</label>
              <input value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Item description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Quantity</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Est. unit price (SAR)</label>
              <input type="number" value={form.estimated_unit_price} onChange={e => setForm(f => ({ ...f, estimated_unit_price: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createRequisition} disabled={busyId === "new" || !form.department || !form.justification || !form.description} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm disabled:opacity-50">Submit</button>
            <button onClick={() => setShowForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {requisitions === null && <div className="cy-card p-6 text-center text-sm text-ink/40">Loading requisitions…</div>}
        {requisitions !== null && sorted.length === 0 && <div className="cy-card p-6 text-center text-sm text-ink/40">No requisitions yet.</div>}
        {sorted.map(req => (
          <div key={req.id} className="cy-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{req.department}</span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[req.status]}22`, color: STATUS_COLOR[req.status] }}>{req.status.replace("_", " ")}</span>
                </div>
                <p className="mt-1 text-sm text-ink/60">{req.justification}</p>
                {req.needed_by && <p className="mt-0.5 text-xs text-ink/40">Needed by {new Date(req.needed_by).toLocaleDateString()}</p>}
                {req.lines?.length > 0 && (
                  <ul className="mt-2 text-xs text-ink/50">
                    {req.lines.map(l => <li key={l.id}>{l.description} × {l.quantity} @ SAR {Number(l.estimated_unit_price).toLocaleString()}</li>)}
                  </ul>
                )}
                {req.status === "rejected" && req.rejection_reason && <p className="mt-1 text-xs text-red-400">Rejected: {req.rejection_reason}</p>}
                {req.status === "converted" && <p className="mt-1 text-xs text-blue-300">Converted to PO {req.purchase_order_id?.slice(0, 8)}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {req.status === "pending_approval" && (
                  <div className="flex gap-2">
                    <button disabled={busyId === req.id} onClick={() => approve(req.id)} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Approve</button>
                    <button disabled={busyId === req.id} onClick={() => reject(req.id)} className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40">Reject</button>
                  </div>
                )}
                {req.status === "approved" && (
                  convertingId === req.id ? (
                    <div className="flex items-center gap-2">
                      <select value={vendorChoice} onChange={e => setVendorChoice(e.target.value)} className="rounded-md border border-ink/10 bg-surface px-2 py-1 text-xs">
                        <option value="">Vendor…</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                      <button disabled={busyId === req.id || !vendorChoice} onClick={() => convertToPO(req.id)} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10 disabled:opacity-40">Go</button>
                    </div>
                  ) : (
                    <button onClick={() => setConvertingId(req.id)} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10">Convert to PO</button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
