"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface POLineRaw {
  id: string;
  po: string;
  quantity: string;
  line_total: string;
}

interface PurchaseOrderRaw {
  id: string;
  po_number: string;
  vendor_id: string;
  po_date: string;
  expected_delivery: string | null;
  status: string;
  total_amount: string;
  lines: POLineRaw[];
}

interface VendorRaw {
  id: string;
  name: string;
  name_ar: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<string, string> = {
  draft: "#6b7280",
  approved: "#22D3EE",
  sent: "#f59e0b",
  partial: "#a78bfa",
  received: "#22c55e",
  cancelled: "#ef4444",
};

export default function ProcurementPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [orders, setOrders] = useState<PurchaseOrderRaw[] | null>(null);
  const [vendors, setVendors] = useState<Record<string, VendorRaw>>({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isAr = lang === "ar";

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [ordersData, vendorsData] = await Promise.all([
        apiFetch<Paginated<PurchaseOrderRaw> | PurchaseOrderRaw[]>("/api/v1/erp/procurement/purchase-orders/", opts),
        apiFetch<Paginated<VendorRaw> | VendorRaw[]>("/api/v1/erp/finance/ap/vendors/", opts),
      ]);
      setOrders(unwrap(ordersData));
      const vendorMap: Record<string, VendorRaw> = {};
      for (const v of unwrap(vendorsData)) vendorMap[v.id] = v;
      setVendors(vendorMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load purchase orders."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleApprove(id: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/erp/procurement/purchase-orders/${id}/`, {
        method: "PUT",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status: "approved" }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Approve failed."));
    } finally {
      setBusyId(null);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const filtered = filter === "all" ? (orders || []) : (orders || []).filter(o => o.status === filter);
  const totalSpend = (orders || []).filter(o => o.status !== "cancelled").reduce((a, o) => a + parseFloat(o.total_amount), 0);
  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

  return (
    <div className="mx-auto max-w-5xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between border-b border-brand-400/30 pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "أوامر الشراء" : "Purchase Orders"}</h1>
          <p className="text-sm text-ink/50">{(orders || []).length} {isAr ? "أمر شراء" : "POs"}</p>
        </div>
        <div className="flex gap-3">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <a href="/erp" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm" onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      {fetchError && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-3.5 text-sm font-semibold text-red-400">
          {fetchError}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: isAr ? "إجمالي الإنفاق" : "Total Spend", value: `SAR ${fmt(totalSpend)}`, color: "#22D3EE" },
          { label: isAr ? "قيد المعالجة" : "Open POs", value: (orders || []).filter(o => ["draft", "approved", "sent", "partial"].includes(o.status)).length, color: "#f59e0b" },
          { label: isAr ? "بانتظار الموافقة" : "Awaiting Approval", value: (orders || []).filter(o => o.status === "draft").length, color: "#ef4444" },
          { label: isAr ? "مستلمة" : "Received", value: (orders || []).filter(o => o.status === "received").length, color: "#22c55e" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4">
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="mt-1 text-xs text-ink/50">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {["all", "draft", "approved", "sent", "partial", "received", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-semibold border ${filter === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink"}`}>
            {f === "all" ? (isAr ? "الكل" : "All") : f}
          </button>
        ))}
      </div>

      <div className="cy-card overflow-hidden p-0">
        {!loading && filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink/50">
            {isAr ? "لا توجد أوامر شراء لهذا المستأجر بعد." : "No purchase orders for this tenant yet."}
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-500/5">
                {[isAr ? "رقم الأمر" : "PO #", isAr ? "المورد" : "Vendor", isAr ? "الأصناف" : "Items", isAr ? "الإجمالي" : "Total", isAr ? "التاريخ" : "Ordered", isAr ? "التسليم" : "Delivery", isAr ? "الحالة" : "Status", ""].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const vendor = vendors[o.vendor_id];
                return (
                  <tr key={o.id}>
                    <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs">{o.po_number}</td>
                    <td className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">{vendor ? (isAr ? (vendor.name_ar || vendor.name) : vendor.name) : `Vendor ${o.vendor_id.slice(0, 8)}`}</td>
                    <td className="border-b border-ink/10 px-4 py-3 text-sm">{(o.lines || []).length}</td>
                    <td className="border-b border-ink/10 px-4 py-3 font-mono text-sm font-bold">SAR {parseFloat(o.total_amount).toLocaleString()}</td>
                    <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs">{o.po_date}</td>
                    <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs">{o.expected_delivery || "—"}</td>
                    <td className="border-b border-ink/10 px-4 py-3">
                      <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status], border: `1px solid ${STATUS_COLOR[o.status]}55` }}>{o.status}</span>
                    </td>
                    <td className="border-b border-ink/10 px-4 py-3">
                      {o.status === "draft" && (
                        <button disabled={busyId === o.id} onClick={() => handleApprove(o.id)} className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 disabled:opacity-50">
                          {isAr ? "موافقة" : "Approve"}
                        </button>
                      )}
                    </td>
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
