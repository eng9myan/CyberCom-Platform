"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Plus, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
}

interface StockItem {
  id: string;
  name: string;
  sku: string;
  warehouse: string;
  quantity: string;
  unit: string;
  unit_cost: string;
}

interface StockMovement {
  id: string;
  stock_item: string;
  movement_type: "receipt" | "issue" | "transfer" | "adjustment";
  quantity: string;
  movement_date: string;
  notes: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

const emptyItemForm = { name: "", sku: "", warehouse: "", unit: "pcs", unit_cost: "" };

export default function InventoryManagement() {
  const { session, isAuthenticated } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[] | null>(null);
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyItemForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [warehousePage, itemPage, movementPage] = await Promise.all([
        apiFetch<Paginated<Warehouse>>("/api/v1/erp/inventory/warehouses/", opts),
        apiFetch<Paginated<StockItem>>("/api/v1/erp/inventory/stock-items/", opts),
        apiFetch<Paginated<StockMovement>>("/api/v1/erp/inventory/movements/", opts),
      ]);
      setWarehouses(warehousePage.results);
      setItems(itemPage.results);
      setMovements(movementPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load inventory data."));
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function submitItem() {
    if (!session) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch("/api/v1/erp/inventory/stock-items/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          warehouse: form.warehouse,
          unit: form.unit,
          unit_cost: form.unit_cost || "0",
        }),
      });
      setForm(emptyItemForm);
      setShowForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFormError(detail || (err instanceof Error ? err.message : "Failed to create stock item."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold text-red-400">Unable to load inventory data</h1>
        <p className="mt-2 text-white/50">{fetchError}</p>
      </div>
    );
  }
  if (warehouses === null || items === null) {
    return <div className="mt-16 text-center text-white/50">Loading live inventory data...</div>;
  }

  const warehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || "Unknown warehouse";
  const filtered = items.filter(i => warehouseFilter === "all" || i.warehouse === warehouseFilter);
  const outOfStock = items.filter(i => parseFloat(i.quantity) === 0).length;
  const totalValue = items.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.unit_cost), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Package size={22} /> Inventory Management</h1>
          <p className="mt-1 text-sm text-white/50">Live stock across all warehouses for this tenant</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600" disabled={warehouses.length === 0}>
          <Plus size={16} /> Add Stock Item
        </button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4">
          <p className="text-xs text-white/50">Total Items</p>
          <p className="mt-1 text-xl font-bold text-brand-300">{items.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4">
          <p className="text-xs text-white/50">Out of Stock</p>
          <p className="mt-1 text-xl font-bold text-red-400">{outOfStock}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4">
          <p className="text-xs text-white/50">Total Stock Value</p>
          <p className="mt-1 text-xl font-bold text-green-400">SAR {totalValue.toLocaleString()}</p>
        </div>
      </div>

      {warehouses.length === 0 && (
        <div className="mb-6 rounded-xl border border-white/10 bg-surface-raised p-6 text-center text-white/50">
          No warehouses configured for this tenant yet — create a warehouse via the API before adding stock items.
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-white/10 bg-surface-raised p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Add Stock Item</h2>
            <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
          </div>
          {formError && <p className="mb-3 text-sm text-red-400">{formError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input placeholder="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            <input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            <select value={form.warehouse} onChange={e => setForm({ ...form, warehouse: e.target.value })} className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none">
              <option value="">Select warehouse...</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input placeholder="Unit (e.g. pcs, box)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            <input placeholder="Unit cost (SAR)" type="number" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          </div>
          <button onClick={submitItem} disabled={submitting || !form.name || !form.sku || !form.warehouse} className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-40">
            {submitting ? "Adding..." : "Add Stock Item"}
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setWarehouseFilter("all")} className={`rounded-lg border px-3 py-1.5 text-sm ${warehouseFilter === "all" ? "border-brand-400 bg-brand-500/15 text-brand-200 font-semibold" : "border-white/10 bg-surface-overlay text-white/70"}`}>All warehouses</button>
        {warehouses.map(w => (
          <button key={w.id} onClick={() => setWarehouseFilter(w.id)} className={`rounded-lg border px-3 py-1.5 text-sm ${warehouseFilter === w.id ? "border-brand-400 bg-brand-500/15 text-brand-200 font-semibold" : "border-white/10 bg-surface-overlay text-white/70"}`}>{w.name}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["SKU", "Name", "Warehouse", "Quantity", "Unit Cost (SAR)", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-white/50">No stock items for this tenant yet.</td></tr>
              )}
              {filtered.map(item => {
                const qty = parseFloat(item.quantity);
                return (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-mono text-brand-300">{item.sku}</td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-white/60">{warehouseName(item.warehouse)}</td>
                    <td className="px-4 py-3">{qty.toLocaleString()} {item.unit}</td>
                    <td className="px-4 py-3">{parseFloat(item.unit_cost).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${qty === 0 ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
                        {qty === 0 ? "Out of stock" : "In stock"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Recent Movements</h2>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["Item", "Type", "Quantity", "Date", "Notes"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-white/50">No stock movements recorded yet.</td></tr>
              )}
              {movements.map(m => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{items.find(i => i.id === m.stock_item)?.name || "Unknown item"}</td>
                  <td className="px-4 py-3 capitalize text-white/60">{m.movement_type}</td>
                  <td className="px-4 py-3">{parseFloat(m.quantity).toLocaleString()}</td>
                  <td className="px-4 py-3 text-white/60">{new Date(m.movement_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-white/60">{m.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
