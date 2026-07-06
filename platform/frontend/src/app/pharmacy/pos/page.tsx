"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, ShoppingCart, Trash2, Banknote, CreditCard, ShieldCheck, Smartphone, Receipt as ReceiptIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface StockItem { id: string; name: string; sku: string; quantity: string; unit: string; unit_cost: string; }
interface Paginated<T> { count: number; results: T[]; }

interface CartLine { stock_item_id: string; item_name: string; unit_price: number; quantity: number; available: number; }

interface SaleLine { id: string; item_name: string; quantity: string; unit_price: string; line_total: string; }
interface Sale {
  id: string; sale_number: string; payment_method: string; subtotal: string;
  tax_amount: string; discount_amount: string; total_amount: string; status: string; lines: SaleLine[];
}

type PaymentMethod = "cash" | "card" | "insurance" | "mobile";

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "insurance", label: "Insurance", icon: ShieldCheck },
  { key: "mobile", label: "Mobile Wallet", icon: Smartphone },
];

export default function PharmacyPOS() {
  const { session, isAuthenticated } = useAuth();
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const loadItems = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const data = await apiFetch<Paginated<StockItem> | StockItem[]>("/api/v1/erp/inventory/stock-items/", {
        token: session.accessToken, tenantId: session.tenantId,
      });
      setItems(unwrap(data));
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load stock items."));
    }
  }, [session]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items || [];
    if (!q) return list;
    return list.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
  }, [items, search]);

  function addToCart(item: StockItem) {
    const available = Number(item.quantity);
    if (available <= 0) return;
    setCart(prev => {
      const existing = prev.find(l => l.stock_item_id === item.id);
      if (existing) {
        if (existing.quantity >= available) return prev;
        return prev.map(l => l.stock_item_id === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { stock_item_id: item.id, item_name: item.name, unit_price: Number(item.unit_cost), quantity: 1, available }];
    });
  }

  function changeQty(stockItemId: string, delta: number) {
    setCart(prev => prev
      .map(l => l.stock_item_id === stockItemId ? { ...l, quantity: Math.min(Math.max(l.quantity + delta, 0), l.available) } : l)
      .filter(l => l.quantity > 0)
    );
  }

  function removeLine(stockItemId: string) {
    setCart(prev => prev.filter(l => l.stock_item_id !== stockItemId));
  }

  const subtotal = cart.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  async function checkout() {
    if (!session || cart.length === 0) return;
    setCheckingOut(true);
    setFetchError(null);
    try {
      const sale = await apiFetch<Sale>("/api/v1/pharmacy/pos/sales/checkout/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          cashier_id: session.userId,
          payment_method: payment,
          lines: cart.map(l => ({ stock_item_id: l.stock_item_id, item_name: l.item_name, quantity: l.quantity, unit_price: l.unit_price })),
        }),
      });
      setReceipt(sale);
      setCart([]);
      void loadItems();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Checkout failed."));
    } finally {
      setCheckingOut(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><ShoppingCart size={22} className="text-brand-400" /> Pharmacy POS</h1>
          <p className="mt-1 text-sm text-ink/50">Real-time checkout against live stock — quantity decrements on completion</p>
        </div>
      </header>

      {fetchError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Item search / grid */}
        <div>
          <div className="relative mb-4">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search medicine name or SKU…"
              className="w-full rounded-xl border border-ink/10 bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items === null && <div className="col-span-full cy-card p-6 text-center text-sm text-ink/40">Loading stock…</div>}
            {items !== null && filtered.length === 0 && <div className="col-span-full cy-card p-6 text-center text-sm text-ink/40">No stock items match.</div>}
            {filtered.map(item => {
              const outOfStock = Number(item.quantity) <= 0;
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  disabled={outOfStock}
                  className="cy-card p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="text-sm font-semibold leading-tight">{item.name}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-ink/40">{item.sku}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-heading font-bold text-brand-400">SAR {Number(item.unit_cost).toFixed(2)}</span>
                    <span className={`text-[11px] ${outOfStock ? "text-red-400" : "text-ink/40"}`}>{outOfStock ? "Out of stock" : `${item.quantity} ${item.unit}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart / checkout panel */}
        <div className="cy-card flex h-fit flex-col p-4">
          <h2 className="mb-3 font-heading font-bold">Current Sale</h2>
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/40">Cart is empty — tap an item to add it.</p>
          ) : (
            <div className="mb-4 grid gap-2">
              {cart.map(l => (
                <div key={l.stock_item_id} className="flex items-center justify-between gap-2 border-b border-ink/5 pb-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{l.item_name}</div>
                    <div className="text-xs text-ink/40">SAR {l.unit_price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => changeQty(l.stock_item_id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-ink/10 text-xs hover:bg-ink/5">−</button>
                    <span className="w-5 text-center tabular-nums">{l.quantity}</span>
                    <button onClick={() => changeQty(l.stock_item_id, 1)} disabled={l.quantity >= l.available} className="flex h-6 w-6 items-center justify-center rounded-md border border-ink/10 text-xs hover:bg-ink/5 disabled:opacity-30">+</button>
                  </div>
                  <span className="w-16 text-right font-semibold tabular-nums">SAR {(l.quantity * l.unit_price).toFixed(2)}</span>
                  <button onClick={() => removeLine(l.stock_item_id)} className="text-ink/30 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4 space-y-1 border-t border-ink/10 pt-3 text-sm">
            <div className="flex justify-between text-ink/60"><span>Subtotal</span><span className="tabular-nums">SAR {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-ink/60"><span>VAT (15%)</span><span className="tabular-nums">SAR {tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Total</span><span className="tabular-nums text-brand-400">SAR {total.toFixed(2)}</span></div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setPayment(opt.key)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${payment === opt.key ? "border-brand-400 bg-brand-500/15 text-brand-300" : "border-ink/10 text-ink/50 hover:bg-ink/5"}`}
              >
                <opt.icon size={14} /> {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={checkout}
            disabled={checkingOut || cart.length === 0}
            className="cy-btn cy-btn-primary w-full text-sm disabled:opacity-50"
          >
            {checkingOut ? "Processing…" : `Pay SAR ${total.toFixed(2)} (F5)`}
          </button>
        </div>
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReceipt(null)}>
          <div onClick={e => e.stopPropagation()} className="cy-card w-full max-w-sm p-6">
            <div className="mb-4 flex items-center gap-2 text-emerald-400"><ReceiptIcon size={20} /><h3 className="font-heading text-lg font-bold">Sale Complete</h3></div>
            <p className="mb-3 font-mono text-sm text-ink/50">{receipt.sale_number}</p>
            <div className="mb-3 grid gap-1 text-sm">
              {receipt.lines.map(l => (
                <div key={l.id} className="flex justify-between"><span>{l.item_name} × {l.quantity}</span><span className="tabular-nums">SAR {Number(l.line_total).toFixed(2)}</span></div>
              ))}
            </div>
            <div className="border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between text-ink/60"><span>Subtotal</span><span className="tabular-nums">SAR {Number(receipt.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between text-ink/60"><span>VAT</span><span className="tabular-nums">SAR {Number(receipt.tax_amount).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold"><span>Total ({receipt.payment_method})</span><span className="tabular-nums text-brand-400">SAR {Number(receipt.total_amount).toFixed(2)}</span></div>
            </div>
            <button onClick={() => setReceipt(null)} className="cy-btn cy-btn-primary mt-5 w-full text-sm">New Sale</button>
          </div>
        </div>
      )}
    </div>
  );
}
