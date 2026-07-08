"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type InvoiceStatus = "pending_match" | "matched" | "mismatched" | "approved" | "paid";

interface VendorInvoice {
  id: string; po: string; vendor_id: string; invoice_number: string; invoice_date: string;
  total_amount: string; status: InvoiceStatus; match_notes: string;
}
interface Vendor { id: string; name: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<InvoiceStatus, string> = { pending_match: "#94a3b8", matched: "#22c55e", mismatched: "#ef4444", approved: "#3b82f6", paid: "#a78bfa" };

export default function VendorInvoicesPage() {
  const { session, isAuthenticated } = useAuth();
  const [invoices, setInvoices] = useState<VendorInvoice[] | null>(null);
  const [vendors, setVendors] = useState<Record<string, Vendor>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [invoiceData, vendorData] = await Promise.all([
        apiFetch<Paginated<VendorInvoice> | VendorInvoice[]>("/api/v1/erp/procurement/invoices/vendor-invoices/", opts),
        apiFetch<Paginated<Vendor> | Vendor[]>("/api/v1/erp/finance/ap/vendors/", opts),
      ]);
      setInvoices(unwrap(invoiceData));
      const vMap: Record<string, Vendor> = {};
      for (const v of unwrap(vendorData)) vMap[v.id] = v;
      setVendors(vMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load vendor invoices."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function runMatch(id: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/erp/procurement/invoices/vendor-invoices/${id}/run-three-way-match/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to run 3-way match."));
    } finally {
      setBusyId(null);
    }
  }

  async function approve(id: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/erp/procurement/invoices/vendor-invoices/${id}/approve/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to approve invoice."));
    } finally {
      setBusyId(null);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const sorted = (invoices || []).slice().sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <a href="/erp/procurement" className="mb-1 inline-block text-sm text-ink/50 hover:text-ink">← Procurement</a>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Receipt size={22} /> Vendor Invoices</h1>
        <p className="mt-1 text-sm text-ink/50">3-way match against PO quantity/price and goods receipt</p>
      </header>

      {fetchError && <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      <div className="grid gap-3">
        {invoices === null && <div className="cy-card p-6 text-center text-sm text-ink/40">Loading vendor invoices…</div>}
        {invoices !== null && sorted.length === 0 && <div className="cy-card p-6 text-center text-sm text-ink/40">No vendor invoices for this tenant yet.</div>}
        {sorted.map(inv => {
          const vendor = vendors[inv.vendor_id];
          return (
            <div key={inv.id} className="cy-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-brand-300">{inv.invoice_number}</span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[inv.status]}22`, color: STATUS_COLOR[inv.status] }}>{inv.status.replace("_", " ")}</span>
                  </div>
                  <div className="mt-1 text-sm text-ink/60">{vendor ? vendor.name : `Vendor ${inv.vendor_id.slice(0, 8)}`} · SAR {Number(inv.total_amount).toLocaleString()} · {new Date(inv.invoice_date).toLocaleDateString()}</div>
                  {inv.match_notes && (
                    <p className={`mt-2 whitespace-pre-line text-xs ${inv.status === "mismatched" ? "text-red-400" : "text-ink/50"}`}>{inv.match_notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {inv.status === "pending_match" && (
                    <button disabled={busyId === inv.id} onClick={() => runMatch(inv.id)} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10 disabled:opacity-40">Run 3-Way Match</button>
                  )}
                  {inv.status === "mismatched" && (
                    <button disabled={busyId === inv.id} onClick={() => runMatch(inv.id)} className="rounded-md border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 disabled:opacity-40">Re-run Match</button>
                  )}
                  {inv.status === "matched" && (
                    <button disabled={busyId === inv.id} onClick={() => approve(inv.id)} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Approve for Payment</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
