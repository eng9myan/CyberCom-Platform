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
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
      </div>
    );
  }

  const filtered = filter === "all" ? (orders || []) : (orders || []).filter(o => o.status === filter);
  const totalSpend = (orders || []).filter(o => o.status !== "cancelled").reduce((a, o) => a + parseFloat(o.total_amount), 0);
  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "1rem", marginBottom: "1.25rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "أوامر الشراء" : "Purchase Orders"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{(orders || []).length} {isAr ? "أمر شراء" : "POs"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/erp" style={s.btn}>{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      <div style={s.metricGrid}>
        {[
          { label: isAr ? "إجمالي الإنفاق" : "Total Spend", value: `SAR ${fmt(totalSpend)}`, color: "#22D3EE" },
          { label: isAr ? "قيد المعالجة" : "Open POs", value: (orders || []).filter(o => ["draft", "approved", "sent", "partial"].includes(o.status)).length, color: "#f59e0b" },
          { label: isAr ? "بانتظار الموافقة" : "Awaiting Approval", value: (orders || []).filter(o => o.status === "draft").length, color: "#ef4444" },
          { label: isAr ? "مستلمة" : "Received", value: (orders || []).filter(o => o.status === "received").length, color: "#22c55e" },
        ].map(m => <div key={m.label} style={s.card}><div style={{ fontSize: "1.6rem", fontWeight: 700, color: m.color }}>{m.value}</div><div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div></div>)}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["all", "draft", "approved", "sent", "partial", "received", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...s.btn, background: filter === f ? "#22D3EE" : "var(--color-surface)", color: filter === f ? "#000" : "var(--color-text)", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
            {f === "all" ? (isAr ? "الكل" : "All") : f}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        {!loading && filtered.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", padding: "1.5rem", textAlign: "center" }}>
            {isAr ? "لا توجد أوامر شراء لهذا المستأجر بعد." : "No purchase orders for this tenant yet."}
          </p>
        ) : (
          <table style={s.table}>
            <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "رقم الأمر" : "PO #"}</th><th style={s.th}>{isAr ? "المورد" : "Vendor"}</th><th style={s.th}>{isAr ? "الأصناف" : "Items"}</th><th style={s.th}>{isAr ? "الإجمالي" : "Total"}</th><th style={s.th}>{isAr ? "التاريخ" : "Ordered"}</th><th style={s.th}>{isAr ? "التسليم" : "Delivery"}</th><th style={s.th}>{isAr ? "الحالة" : "Status"}</th><th style={s.th}></th></tr></thead>
            <tbody>
              {filtered.map(o => {
                const vendor = vendors[o.vendor_id];
                return (
                  <tr key={o.id}>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{o.po_number}</td>
                    <td style={s.td}><div style={{ fontWeight: 600 }}>{vendor ? (isAr ? (vendor.name_ar || vendor.name) : vendor.name) : `Vendor ${o.vendor_id.slice(0, 8)}`}</div></td>
                    <td style={s.td}>{(o.lines || []).length}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontWeight: 700 }}>SAR {parseFloat(o.total_amount).toLocaleString()}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{o.po_date}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem" }}>{o.expected_delivery || "—"}</td>
                    <td style={s.td}><span style={{ background: `${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status], border: `1px solid ${STATUS_COLOR[o.status]}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{o.status}</span></td>
                    <td style={s.td}>
                      {o.status === "draft" && (
                        <button disabled={busyId === o.id} onClick={() => handleApprove(o.id)} style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, opacity: busyId === o.id ? 0.5 : 1 }}>
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
