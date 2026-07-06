"use client";

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
  const [lang, setLang] = useState<"en" | "ar">("en");
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
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
            {lang === "en" ? "CyMed Pharmacy" : "صيدلية سايمد"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", marginTop: "0.25rem" }}>
            {lang === "en" ? "Medication Dispensing & Inventory Management" : "صرف الأدوية وإدارة المخزون"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <button
            onClick={() => setLang(l => l === "en" ? "ar" : "en")}
            style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      <nav style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Medication Order Queue" : "طابور طلبات الأدوية" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing Queue" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary Search" : "دليل الأدوية" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory & Stock" : "المخزون والعهدة" },
          { href: "/pharmacy/pos", label: lang === "en" ? "POS (Point of Sale)" : "نقطة البيع" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.6rem 1.2rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { label: lang === "en" ? "Pending Verification" : "بانتظار التحقق", value: metrics?.pendingOrders ?? "—", color: "#f59e0b" },
          { label: lang === "en" ? "Dispensed Today" : "صرف اليوم", value: metrics?.dispensedToday ?? "—", color: "#22c55e" },
          { label: lang === "en" ? "Out of Stock Items" : "أصناف نفدت من المخزون", value: metrics?.outOfStock ?? "—", color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", textAlign: "center", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}>
            <p style={{ fontSize: "2.25rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.5rem", fontWeight: 500 }}>{m.label}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        {lang === "en"
          ? "Open the Medication Order Queue to review, verify, or hold real inpatient orders — patient names, drugs, and drug-interaction alerts shown there are pulled live from the pharmacy backend."
          : "افتح طابور طلبات الأدوية لمراجعة أو التحقق من الطلبات الحقيقية للمرضى الداخليين — تُعرض هناك أسماء المرضى والأدوية وتنبيهات التفاعل الدوائي مباشرة من نظام الصيدلية."}
      </p>
    </div>
  );
}
