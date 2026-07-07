"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface MedicationOrderRaw {
  id: string;
  status: string;
  created_at: string;
}

interface DispenseOrderRaw {
  id: string;
  status: string;
  dispensed_at: string | null;
}

interface StockItemRaw {
  id: string;
  quantity: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export default function PharmacyPortal() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    pendingOrders: number;
    dispensedToday: number;
    outOfStock: number;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [ordersData, dispenseData, stockData] = await Promise.all([
        apiFetch<Paginated<MedicationOrderRaw> | MedicationOrderRaw[]>(
          "/api/v1/pharmacy/prescriptions/orders/",
          { token: session.accessToken, tenantId: session.tenantId }
        ),
        apiFetch<Paginated<DispenseOrderRaw> | DispenseOrderRaw[]>(
          "/api/v1/pharmacy/dispensing/orders/",
          { token: session.accessToken, tenantId: session.tenantId }
        ),
        apiFetch<Paginated<StockItemRaw> | StockItemRaw[]>(
          "/api/v1/erp/inventory/stock-items/",
          { token: session.accessToken, tenantId: session.tenantId }
        ),
      ]);

      const orders = unwrap(ordersData);
      const dispenses = unwrap(dispenseData);
      const stock = unwrap(stockData);
      const today = new Date().toDateString();

      setMetrics({
        pendingOrders: orders.filter(o => o.status === "pending_verification").length,
        dispensedToday: dispenses.filter(d => d.status === "dispensed" && d.dispensed_at && new Date(d.dispensed_at).toDateString() === today).length,
        outOfStock: stock.filter(s => parseFloat(s.quantity) === 0).length,
      });
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load pharmacy overview."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === "en" ? "CyMed Pharmacy" : "صيدلية سايمد"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {lang === "en" ? "Medication Dispensing & Inventory Management" : "صرف الأدوية وإدارة المخزون"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink/50">
            {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      <nav className="mb-8 flex flex-wrap gap-3">
        {[
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Medication Order Queue" : "طابور طلبات الأدوية" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing Queue" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary Search" : "دليل الأدوية" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory & Stock" : "المخزون والعهدة" },
          { href: "/pharmacy/pos", label: lang === "en" ? "POS (Point of Sale)" : "نقطة البيع" },
        ].map(item => (
          <a key={item.href} href={item.href} className="rounded-lg border border-ink/10 bg-surface px-5 py-2.5 text-sm font-semibold text-ink no-underline hover:bg-ink/5">
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      {loading && <p className="mb-4 text-sm text-ink/50">{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</p>}

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: lang === "en" ? "Pending Verification" : "بانتظار التحقق", value: metrics?.pendingOrders ?? "—", color: "#f59e0b" },
          { label: lang === "en" ? "Dispensed Today" : "صرف اليوم", value: metrics?.dispensedToday ?? "—", color: "#22c55e" },
          { label: lang === "en" ? "Out of Stock Items" : "أصناف نفدت من المخزون", value: metrics?.outOfStock ?? "—", color: "#ef4444" },
        ].map(m => (
          <div key={m.label} className="cy-card p-6 text-center">
            <p className="text-4xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-2 text-sm font-medium text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-ink/50">
        {lang === "en"
          ? "Open the Medication Order Queue to review, verify, or hold real inpatient orders — patient names, drugs, and drug-interaction alerts shown there are pulled live from the pharmacy backend."
          : "افتح طابور طلبات الأدوية لمراجعة أو التحقق من الطلبات الحقيقية للمرضى الداخليين — تُعرض هناك أسماء المرضى والأدوية وتنبيهات التفاعل الدوائي مباشرة من نظام الصيدلية."}
      </p>
    </div>
  );
}
