"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface StockItem {
  id: string;
  name: string;
  sku: string;
  warehouse: string;
  quantity: string;
  unit: string;
  unit_cost: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

interface AdjustForm {
  itemId: string;
  quantity: number;
  notes: string;
}

export default function PharmacyInventoryPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>({ itemId: "", quantity: 0, notes: "" });
  const [adjustMsg, setAdjustMsg] = useState<string | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await apiFetch<Paginated<StockItem> | StockItem[]>(
        "/api/v1/erp/inventory/stock-items/",
        { token: session.accessToken, tenantId: session.tenantId }
      );
      setItems(unwrap(data));
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load inventory."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openAdjust = (item: StockItem) => {
    setAdjustForm({ itemId: item.id, quantity: 0, notes: "" });
    setShowAdjustModal(true);
  };

  async function handleAdjust() {
    if (!session || !adjustForm.itemId || adjustForm.quantity === 0) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/erp/inventory/movements/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          stock_item: adjustForm.itemId,
          movement_type: "adjustment",
          quantity: adjustForm.quantity,
          notes: adjustForm.notes,
        }),
      });
      setAdjustMsg(lang === "en" ? `Stock adjusted by ${adjustForm.quantity > 0 ? "+" : ""}${adjustForm.quantity}.` : `تم تعديل المخزون بمقدار ${adjustForm.quantity}.`);
      setTimeout(() => setAdjustMsg(null), 3000);
      setShowAdjustModal(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Adjustment failed."));
    } finally {
      setSubmitting(false);
    }
  }

  const dir = lang === "ar" ? "rtl" : "ltr";

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const filtered = (items || []).filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
  });

  const outOfStock = (items || []).filter(i => parseFloat(i.quantity) === 0).length;
  const selectedItem = (items || []).find(i => i.id === adjustForm.itemId);

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: dir }}>
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-400">
            {lang === "en" ? "Pharmacy Inventory" : "مخزون الصيدلية"}
          </h1>
          <p className="mt-1.5 text-sm text-ink/50">
            {lang === "en" ? "Real stock levels from the shared ERP inventory system" : "مستويات المخزون الحقيقية من نظام المخزون المشترك"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2.5">
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Prescriptions" : "الوصفات" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary" : "دليل الأدوية" },
        ].map(item => (
          <a key={item.href} href={item.href} className="rounded-md border border-ink/10 bg-surface px-4 py-2 text-xs font-semibold hover:bg-ink/5">
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4">
        {[
          { label: lang === "en" ? "Total Items" : "إجمالي الأصناف", value: (items || []).length, color: "#22D3EE" },
          { label: lang === "en" ? "Out of Stock" : "نفد من المخزون", value: outOfStock, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="cy-card p-5 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === "en" ? "Search item name or SKU…" : "ابحث باسم الصنف أو رمزه…"}
          className="min-w-[200px] flex-1 rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink"
        />
        {loading && <span className="text-sm text-ink/50">{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</span>}
      </div>

      {adjustMsg && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
          {adjustMsg}
        </div>
      )}

      <div className="cy-card overflow-hidden p-0">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-brand-500/5">
              {[
                lang === "en" ? "SKU" : "الرمز",
                lang === "en" ? "Item Name" : "اسم الصنف",
                lang === "en" ? "Warehouse" : "المستودع",
                lang === "en" ? "Quantity" : "الكمية",
                lang === "en" ? "Adjust" : "تعديل",
              ].map(h => (
                <th key={h} className={`px-4 py-3 text-[13px] font-semibold text-ink/50 ${lang === "ar" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink/50">
                  {lang === "en" ? "No inventory items for this tenant yet." : "لا توجد أصناف مخزون لهذا المستأجر بعد."}
                </td>
              </tr>
            )}
            {filtered.map(item => {
              const qty = parseFloat(item.quantity);
              return (
                <tr key={item.id}>
                  <td className="border-b border-ink/10 px-4 py-3 font-mono text-xs text-ink/50">{item.sku}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">{item.name}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm text-ink/50">{item.warehouse}</td>
                  <td className="border-b border-ink/10 px-4 py-3 text-sm">
                    <span className={`font-bold ${qty === 0 ? "text-red-400" : ""}`}>{qty.toLocaleString()}</span>
                    <span className="text-xs text-ink/50"> {item.unit}</span>
                  </td>
                  <td className="border-b border-ink/10 px-4 py-3">
                    <button onClick={() => openAdjust(item)} className="rounded-md border border-brand-400 bg-brand-500/15 px-2.5 py-1 text-xs font-bold text-brand-400">
                      {lang === "en" ? "Adjust" : "تعديل"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink/50">
        {lang === "en" ? `Showing ${filtered.length} of ${(items || []).length} items` : `عرض ${filtered.length} من ${(items || []).length} صنف`}
      </p>

      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAdjustModal(false)}>
          <div onClick={e => e.stopPropagation()} className="cy-card w-full max-w-[400px] p-8">
            <h3 className="mb-5 font-heading text-lg font-bold text-brand-400">
              {lang === "en" ? "Stock Adjustment" : "تعديل المخزون"}
            </h3>
            <p className="mb-5 text-sm text-ink/50">
              {selectedItem.name} — {lang === "en" ? "Current: " : "الحالي: "}<strong>{selectedItem.quantity} {selectedItem.unit}</strong>
            </p>
            <div className="grid gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink/50">
                  {lang === "en" ? "Adjustment (positive to add, negative to remove):" : "التعديل (موجب للإضافة، سالب للخصم):"}
                </label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={e => setAdjustForm(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-ink/50">
                  {lang === "en" ? "Notes:" : "ملاحظات:"}
                </label>
                <input
                  type="text"
                  value={adjustForm.notes}
                  onChange={e => setAdjustForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-sm text-ink"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button disabled={submitting} onClick={() => { void handleAdjust(); }} className="cy-btn cy-btn-primary flex-1 disabled:opacity-50">
                {submitting ? (lang === "en" ? "Saving…" : "جارٍ الحفظ…") : (lang === "en" ? "Apply Adjustment" : "تطبيق التعديل")}
              </button>
              <button onClick={() => setShowAdjustModal(false)} className="cy-btn cy-btn-ghost flex-1">
                {lang === "en" ? "Cancel" : "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
