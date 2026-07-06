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
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
      </div>
    );
  }

  const filtered = (items || []).filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
  });

  const outOfStock = (items || []).filter(i => parseFloat(i.quantity) === 0).length;
  const selectedItem = (items || []).find(i => i.id === adjustForm.itemId);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: dir }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Pharmacy Inventory" : "مخزون الصيدلية"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            {lang === "en" ? "Real stock levels from the shared ERP inventory system" : "مستويات المخزون الحقيقية من نظام المخزون المشترك"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.85rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.6rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Prescriptions" : "الوصفات" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary" : "دليل الأدوية" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Total Items" : "إجمالي الأصناف", value: (items || []).length, color: "#22D3EE" },
          { label: lang === "en" ? "Out of Stock" : "نفد من المخزون", value: outOfStock, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === "en" ? "Search item name or SKU…" : "ابحث باسم الصنف أو رمزه…"}
          style={{ padding: "0.5rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.85rem", flex: 1, minWidth: "200px" }}
        />
        {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</span>}
      </div>

      {adjustMsg && (
        <div style={{ background: "#d1fae5", border: "1px solid #34d399", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>
          {adjustMsg}
        </div>
      )}

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "SKU" : "الرمز",
                lang === "en" ? "Item Name" : "اسم الصنف",
                lang === "en" ? "Warehouse" : "المستودع",
                lang === "en" ? "Quantity" : "الكمية",
                lang === "en" ? "Adjust" : "تعديل",
              ].map(h => (
                <th key={h} style={{ padding: "0.9rem 1rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  {lang === "en" ? "No inventory items for this tenant yet." : "لا توجد أصناف مخزون لهذا المستأجر بعد."}
                </td>
              </tr>
            )}
            {filtered.map((item, i) => {
              const qty = parseFloat(item.quantity);
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{item.sku}</td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600, fontSize: "0.88rem" }}>{item.name}</td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{item.warehouse}</td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.88rem" }}>
                    <span style={{ fontWeight: 700, color: qty === 0 ? "#ef4444" : "var(--color-text)" }}>{qty.toLocaleString()}</span>
                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}> {item.unit}</span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <button onClick={() => openAdjust(item)} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", background: "rgba(34,211,238,0.15)", color: "#22D3EE", border: "1px solid #22D3EE", cursor: "pointer" }}>
                      {lang === "en" ? "Adjust" : "تعديل"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
        {lang === "en" ? `Showing ${filtered.length} of ${(items || []).length} items` : `عرض ${filtered.length} من ${(items || []).length} صنف`}
      </p>

      {showAdjustModal && selectedItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "2rem", width: "400px", maxWidth: "90vw" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#22D3EE" }}>
              {lang === "en" ? "Stock Adjustment" : "تعديل المخزون"}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              {selectedItem.name} — {lang === "en" ? "Current: " : "الحالي: "}<strong>{selectedItem.quantity} {selectedItem.unit}</strong>
            </p>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                  {lang === "en" ? "Adjustment (positive to add, negative to remove):" : "التعديل (موجب للإضافة، سالب للخصم):"}
                </label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={e => setAdjustForm(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }))}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                  {lang === "en" ? "Notes:" : "ملاحظات:"}
                </label>
                <input
                  type="text"
                  value={adjustForm.notes}
                  onChange={e => setAdjustForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)", color: "var(--color-text)", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button disabled={submitting} onClick={() => { void handleAdjust(); }} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#22D3EE", color: "#000", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", opacity: submitting ? 0.5 : 1 }}>
                {submitting ? (lang === "en" ? "Saving…" : "جارٍ الحفظ…") : (lang === "en" ? "Apply Adjustment" : "تطبيق التعديل")}
              </button>
              <button onClick={() => setShowAdjustModal(false)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "transparent", color: "var(--color-text)", border: "1px solid var(--color-border)", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
                {lang === "en" ? "Cancel" : "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
