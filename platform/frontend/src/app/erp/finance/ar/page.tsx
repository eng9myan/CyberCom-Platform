"use client";

import { useState, useEffect, useCallback } from "react";
import { Landmark } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled";

interface Customer { id: string; name: string; customer_code: string; credit_limit: string; }
interface Invoice {
  id: string; customer: string; invoice_number: string; invoice_date: string; due_date: string;
  total_amount: string; paid_amount: string; status: InvoiceStatus;
}
interface Payment { id: string; customer: string; invoice: string | null; payment_date: string; amount: string; method: string; }
interface AgingBucket { id: string; customer: string; bucket_label: string; amount: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<InvoiceStatus, string> = { draft: "#94a3b8", sent: "#3b82f6", partial: "#f59e0b", paid: "#22c55e", overdue: "#ef4444", cancelled: "#94a3b8" };

type Tab = "invoices" | "payments" | "aging";

export default function AccountsReceivablePage() {
  const { session, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("invoices");
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [aging, setAging] = useState<AgingBucket[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showPayForm, setShowPayForm] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [customerData, invoiceData, paymentData, agingData] = await Promise.all([
        apiFetch<Paginated<Customer> | Customer[]>("/api/v1/erp/finance/ar/customers/", opts),
        apiFetch<Paginated<Invoice> | Invoice[]>("/api/v1/erp/finance/ar/invoices/", opts),
        apiFetch<Paginated<Payment> | Payment[]>("/api/v1/erp/finance/ar/payments/", opts),
        apiFetch<Paginated<AgingBucket> | AgingBucket[]>("/api/v1/erp/finance/ar/aging-buckets/", opts),
      ]);
      const cMap: Record<string, Customer> = {};
      for (const c of unwrap(customerData)) cMap[c.id] = c;
      setCustomers(cMap);
      setInvoices(unwrap(invoiceData));
      setPayments(unwrap(paymentData));
      setAging(unwrap(agingData));
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load accounts receivable data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function recordPayment(invoice: Invoice) {
    if (!session || !payAmount) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/erp/finance/ar/payments/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({
          customer: invoice.customer, invoice: invoice.id, payment_date: new Date().toISOString().slice(0, 10),
          amount: payAmount, method: payMethod,
        }),
      });
      const newPaid = Number(invoice.paid_amount) + Number(payAmount);
      const newStatus: InvoiceStatus = newPaid >= Number(invoice.total_amount) ? "paid" : "partial";
      await apiFetch(`/api/v1/erp/finance/ar/invoices/${invoice.id}/`, {
        method: "PATCH", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ paid_amount: newPaid, status: newStatus }),
      });
      setShowPayForm(null); setPayAmount("");
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to record payment."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const sortedInvoices = (invoices || []).slice().sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
  const totalOutstanding = (invoices || []).reduce((s, i) => s + (Number(i.total_amount) - Number(i.paid_amount)), 0);
  const agingByBucket: Record<string, number> = {};
  for (const a of aging) agingByBucket[a.bucket_label] = (agingByBucket[a.bucket_label] || 0) + Number(a.amount);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <a href="/erp/finance" className="mb-1 inline-block text-sm text-ink/50 hover:text-ink">← Finance</a>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Landmark size={22} /> Accounts Receivable</h1>
        <p className="mt-1 text-sm text-ink/50">Customer invoices, payments, and aging</p>
      </header>

      {fetchError && <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="cy-card p-4 text-center"><div className="text-2xl font-bold text-brand-400">{(invoices || []).length}</div><div className="mt-1 text-xs text-ink/50">Invoices</div></div>
        <div className="cy-card p-4 text-center"><div className="text-2xl font-bold text-red-400">SAR {totalOutstanding.toLocaleString()}</div><div className="mt-1 text-xs text-ink/50">Outstanding</div></div>
        <div className="cy-card p-4 text-center"><div className="text-2xl font-bold text-accent">{Object.keys(customers).length}</div><div className="mt-1 text-xs text-ink/50">Customers</div></div>
      </div>

      <div className="mb-5 flex gap-2">
        {(["invoices", "payments", "aging"] as Tab[]).map(tKey => (
          <button key={tKey} onClick={() => setTab(tKey)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${tab === tKey ? "bg-brand-500/15 text-brand-300 border border-brand-400/40" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}>{tKey}</button>
        ))}
      </div>

      {tab === "invoices" && (
        <div className="grid gap-3">
          {invoices === null && <div className="cy-card p-6 text-center text-sm text-ink/40">Loading invoices…</div>}
          {invoices !== null && sortedInvoices.length === 0 && <div className="cy-card p-6 text-center text-sm text-ink/40">No AR invoices for this tenant yet.</div>}
          {sortedInvoices.map(inv => {
            const c = customers[inv.customer];
            const outstanding = Number(inv.total_amount) - Number(inv.paid_amount);
            return (
              <div key={inv.id} className="cy-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-brand-300">{inv.invoice_number}</span>
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[inv.status]}22`, color: STATUS_COLOR[inv.status] }}>{inv.status}</span>
                    </div>
                    <div className="mt-1 text-sm text-ink/60">{c ? c.name : `Customer ${inv.customer.slice(0, 8)}`} · Due {new Date(inv.due_date).toLocaleDateString()}</div>
                    <div className="mt-1 text-sm tabular-nums">SAR {Number(inv.total_amount).toLocaleString()} — {outstanding > 0 ? <span className="font-semibold text-red-400">SAR {outstanding.toLocaleString()} outstanding</span> : <span className="text-emerald-400">paid in full</span>}</div>
                  </div>
                  {outstanding > 0 && inv.status !== "cancelled" && (
                    showPayForm === inv.id ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount" className="w-24 rounded-md border border-ink/10 bg-surface px-2 py-1 text-xs" />
                        <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="rounded-md border border-ink/10 bg-surface px-2 py-1 text-xs">
                          <option value="cash">Cash</option><option value="card">Card</option><option value="bank">Bank</option><option value="insurance">Insurance</option><option value="wallet">Wallet</option>
                        </select>
                        <button disabled={busy || !payAmount} onClick={() => recordPayment(inv)} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Save</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowPayForm(inv.id)} className="shrink-0 rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10">Record Payment</button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "payments" && (
        <div className="cy-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="border-b border-ink/10 bg-ink/5 text-left text-xs uppercase tracking-wider text-ink/40"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Amount</th></tr></thead>
              <tbody>
                {payments.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-ink/40">No payments recorded yet.</td></tr>}
                {payments.slice().sort((a, b) => b.payment_date.localeCompare(a.payment_date)).map(p => (
                  <tr key={p.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{customers[p.customer]?.name ?? `Customer ${p.customer.slice(0, 8)}`}</td>
                    <td className="px-4 py-3 capitalize">{p.method}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">SAR {Number(p.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "aging" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {["current", "1-30", "31-60", "61-90", "90+"].map(b => (
            <div key={b} className="cy-card p-4 text-center">
              <div className="text-xl font-bold" style={{ color: b === "90+" ? "#ef4444" : b === "61-90" ? "#f59e0b" : "#22c55e" }}>SAR {(agingByBucket[b] || 0).toLocaleString()}</div>
              <div className="mt-1 text-xs text-ink/50">{b}</div>
            </div>
          ))}
          {aging.length === 0 && <p className="col-span-full text-center text-sm text-ink/40">No aging data computed for this tenant yet.</p>}
        </div>
      )}
    </div>
  );
}
