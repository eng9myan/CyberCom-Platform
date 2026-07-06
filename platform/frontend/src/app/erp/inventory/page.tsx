"use client";

import { usePreferences } from "@/contexts/preferences";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface Warehouse { id: string; name: string; code: string; location: string; }
interface StockItem { id: string; name: string; sku: string; warehouse: string; quantity: string; unit: string; unit_cost: string; }
interface Paginated<T> { count: number; results: T[]; }

export default function InventoryPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [filter, setFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [search, setSearch] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isAr = lang === "ar";

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [warehousePage, itemPage] = await Promise.all([
        apiFetch<Paginated<Warehouse>>("/api/v1/erp/inventory/warehouses/", opts),
        apiFetch<Paginated<StockItem>>("/api/v1/erp/inventory/stock-items/", opts),
      ]);
      setWarehouses(warehousePage.results);
      setItems(itemPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load inventory."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (!isAuthenticated) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem" }}><h1 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>Unable to load inventory</h1><p style={{ color: "var(--color-text-muted)" }}>{fetchError}</p></div>;
  }
  if (items === null) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "4rem", color: "var(--color-text-muted)" }}>Loading live inventory data...</div>;
  }

  const warehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || "—";
  const filtered = items.filter(i => {
    const qty = parseFloat(i.quantity);
    const matchesFilter = filter === "all" || (filter === "out_of_stock" ? qty === 0 : qty > 0);
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.includes(search);
    return matchesFilter && matchesSearch;
  });
  const outOfStockCount = items.filter(i => parseFloat(i.quantity) === 0).length;

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: "1rem", marginBottom: "1.25rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "إدارة المخزون" : "Inventory Management"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{items.length} {isAr ? "صنف" : "items"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a href="/erp" style={s.btn}>{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.metricGrid}>
        {[
          { label: isAr ? "الأصناف" : "Total SKUs", value: items.length, color: "#22D3EE" },
          { label: isAr ? "نواقص" : "Out of Stock", value: outOfStockCount, color: "#ef4444" },
          { label: isAr ? "المستودعات" : "Warehouses", value: warehouses.length, color: "#8b5cf6" },
        ].map(m => <div key={m.label} style={s.card}><div style={{ fontSize: "1.6rem", fontWeight: 700, color: m.color }}>{m.value}</div><div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div></div>)}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث..." : "Search SKU or name..."} style={{ padding: "0.45rem 0.75rem", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", minWidth: 240 }} />
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["all", "in_stock", "out_of_stock"] as const).map(f => <button key={f} onClick={() => setFilter(f)} style={{ ...s.btn, background: filter === f ? "#22D3EE" : "var(--color-surface)", color: filter === f ? "#000" : "var(--color-text)", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>{f === "all" ? (isAr ? "الكل" : "All") : f === "in_stock" ? "In Stock" : "Out of Stock"}</button>)}
        </div>
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={s.table}>
          <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}>
            <th style={s.th}>SKU</th>
            <th style={s.th}>{isAr ? "المنتج" : "Item"}</th>
            <th style={s.th}>{isAr ? "المستودع" : "Warehouse"}</th>
            <th style={s.th}>{isAr ? "الكمية" : "Quantity"}</th>
            <th style={s.th}>{isAr ? "تكلفة الوحدة" : "Unit Cost"}</th>
            <th style={s.th}>{isAr ? "الحالة" : "Status"}</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ ...s.td, textAlign: "center", color: "var(--color-text-muted)" }}>{isAr ? "لا توجد أصناف" : "No stock items for this tenant yet."}</td></tr>
            )}
            {filtered.map(item => {
              const qty = parseFloat(item.quantity);
              return (
                <tr key={item.id} style={{ background: qty === 0 ? "rgba(239,68,68,0.04)" : "transparent" }}>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.8rem", color: "#a78bfa" }}>{item.sku}</td>
                  <td style={s.td}><div style={{ fontWeight: 600 }}>{item.name}</div></td>
                  <td style={s.td}>{warehouseName(item.warehouse)}</td>
                  <td style={{ ...s.td, fontWeight: 700, color: qty === 0 ? "#ef4444" : "var(--color-text)" }}>{qty.toLocaleString()} {item.unit}</td>
                  <td style={s.td}>{parseFloat(item.unit_cost).toLocaleString()}</td>
                  <td style={s.td}><span style={{ background: qty === 0 ? "#ef444422" : "#22c55e22", color: qty === 0 ? "#ef4444" : "#22c55e", border: `1px solid ${qty === 0 ? "#ef4444" : "#22c55e"}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{qty === 0 ? "Out of stock" : "In stock"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
