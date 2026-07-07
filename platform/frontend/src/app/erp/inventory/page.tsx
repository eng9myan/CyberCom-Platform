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
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold text-red-400">Unable to load inventory</h1><p className="mt-1 text-sm text-ink/50">{fetchError}</p></div>;
  }
  if (items === null) {
    return <div className="mx-auto mt-16 max-w-lg text-center text-sm text-ink/40">Loading live inventory data...</div>;
  }

  const warehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || "—";
  const filtered = items.filter(i => {
    const qty = parseFloat(i.quantity);
    const matchesFilter = filter === "all" || (filter === "out_of_stock" ? qty === 0 : qty > 0);
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.includes(search);
    return matchesFilter && matchesSearch;
  });
  const outOfStockCount = items.filter(i => parseFloat(i.quantity) === 0).length;

  return (
    <div className="mx-auto max-w-5xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between border-b border-brand-400/30 pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "إدارة المخزون" : "Inventory Management"}</h1>
          <p className="text-sm text-ink/50">{items.length} {isAr ? "صنف" : "items"}</p>
        </div>
        <div className="flex gap-3">
          <a href="/erp" className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm" onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div className="mb-5 grid grid-cols-3 gap-4">
        {[
          { label: isAr ? "الأصناف" : "Total SKUs", value: items.length, color: "#22D3EE" },
          { label: isAr ? "نواقص" : "Out of Stock", value: outOfStockCount, color: "#ef4444" },
          { label: isAr ? "المستودعات" : "Warehouses", value: warehouses.length, color: "#8b5cf6" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4">
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="mt-1 text-xs text-ink/50">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isAr ? "بحث..." : "Search SKU or name..."} className="min-w-[240px] rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink" />
        <div className="flex gap-1.5">
          {(["all", "in_stock", "out_of_stock"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-semibold border ${filter === f ? "border-brand-400 bg-brand-500 text-white" : "border-ink/10 bg-surface text-ink"}`}>
              {f === "all" ? (isAr ? "الكل" : "All") : f === "in_stock" ? "In Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>
      <div className="cy-card overflow-hidden p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-brand-500/5">
              {["SKU", isAr ? "المنتج" : "Item", isAr ? "المستودع" : "Warehouse", isAr ? "الكمية" : "Quantity", isAr ? "تكلفة الوحدة" : "Unit Cost", isAr ? "الحالة" : "Status"].map((h, i) => (
                <th key={i} className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${isAr ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-3 text-center text-sm text-ink/40">{isAr ? "لا توجد أصناف" : "No stock items for this tenant yet."}</td></tr>
            )}
            {filtered.map(item => {
              const qty = parseFloat(item.quantity);
              return (
                <tr key={item.id} className={qty === 0 ? "bg-red-500/[0.04]" : ""}>
                  <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs text-violet-400">{item.sku}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">{item.name}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm">{warehouseName(item.warehouse)}</td>
                  <td className={`border-b border-ink/10 px-4 py-3 text-sm font-bold ${qty === 0 ? "text-red-400" : ""}`}>{qty.toLocaleString()} {item.unit}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm">{parseFloat(item.unit_cost).toLocaleString()}</td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: qty === 0 ? "#ef444422" : "#22c55e22", color: qty === 0 ? "#ef4444" : "#22c55e", border: `1px solid ${qty === 0 ? "#ef4444" : "#22c55e"}55` }}>{qty === 0 ? "Out of stock" : "In stock"}</span>
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
