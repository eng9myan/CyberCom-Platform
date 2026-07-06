"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface FinanceSummary {
  revenue: number;
  expenses: number;
  net_income: number;
  ar_balance: number;
  ap_balance: number;
  cash_balance: number;
}

interface HRSummary {
  total_staff: number;
  active: number;
  on_leave: number;
  open_positions: number;
}

interface InventorySummary {
  total_items: number;
  low_stock: number;
  stock_value: number;
  pending_orders: number;
}

interface ProcurementSummary {
  open_pos: number;
  pending_approval: number;
  spend_mtd: number;
  vendors: number;
}

const FINANCE: FinanceSummary = {
  revenue: 2_400_000,
  expenses: 1_800_000,
  net_income: 600_000,
  ar_balance: 320_000,
  ap_balance: 180_000,
  cash_balance: 950_000,
};

const HR: HRSummary = {
  total_staff: 450,
  active: 432,
  on_leave: 18,
  open_positions: 12,
};

const INVENTORY: InventorySummary = {
  total_items: 1_240,
  low_stock: 34,
  stock_value: 1_850_000,
  pending_orders: 8,
};

const PROCUREMENT: ProcurementSummary = {
  open_pos: 23,
  pending_approval: 7,
  spend_mtd: 420_000,
  vendors: 156,
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function ErpPage() {
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [finance, setFinance] = useState<FinanceSummary>(FINANCE);
  const [hr, setHr] = useState<HRSummary>(HR);
  const [inventory, setInventory] = useState<InventorySummary>(INVENTORY);
  const [procurement, setProcurement] = useState<ProcurementSummary>(PROCUREMENT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<FinanceSummary>("/api/v1/erp/finance/summary/"),
      apiFetch<HRSummary>("/api/v1/erp/hr/summary/"),
      apiFetch<InventorySummary>("/api/v1/erp/inventory/summary/"),
      apiFetch<ProcurementSummary>("/api/v1/erp/procurement/summary/"),
    ])
      .then(([f, h, i, p]) => {
        if (f) setFinance(f);
        if (h) setHr(h);
        if (i) setInventory(i);
        if (p) setProcurement(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isAr = lang === "ar";

  const SUB_MODULES = [
    { href: "/erp/finance", label: isAr ? "المالية" : "Finance & GL" },
    { href: "/erp/finance/ar", label: isAr ? "الذمم المدينة" : "Accounts Receivable" },
    { href: "/erp/hr", label: isAr ? "الموارد البشرية" : "Human Resources" },
    { href: "/erp/payroll", label: isAr ? "الرواتب" : "Payroll" },
    { href: "/erp/inventory", label: isAr ? "المخزون" : "Inventory" },
    { href: "/erp/procurement", label: isAr ? "المشتريات" : "Procurement" },
    { href: "/erp/procurement/requisitions", label: isAr ? "طلبات الشراء" : "Requisitions" },
    { href: "/erp/procurement/invoices", label: isAr ? "فواتير الموردين" : "Vendor Invoices" },
    { href: "/erp/assets", label: isAr ? "الأصول" : "Assets" },
  ];

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" },
    subtitle: { fontSize: "0.9rem", color: "var(--color-text-muted)" },
    langBtn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
    nav: { display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" as const },
    navLink: { padding: "0.6rem 1.2rem", borderRadius: 6, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 },
    section: { marginBottom: "2rem" },
    sectionTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#22D3EE", marginBottom: "1rem" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1.25rem" },
    cardLabel: { fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 6 },
    cardValue: { fontSize: "1.8rem", fontWeight: 700, color: "#22D3EE" },
    cardSub: { fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 },
    alertBadge: { display: "inline-block", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "نظام تخطيط موارد المؤسسة — CyCom ERP" : "CyCom ERP — Enterprise Resource Planning"}</h1>
          <p style={s.subtitle}>{isAr ? "المالية · الموارد البشرية · المخزون · المشتريات" : "Finance · Human Resources · Inventory · Procurement"}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <button style={s.langBtn} onClick={() => setLang(isAr ? "en" : "ar")}>
            {isAr ? "English" : "العربية"}
          </button>
        </div>
      </header>

      <nav style={s.nav}>
        {SUB_MODULES.map(m => (
          <a key={m.href} href={m.href} style={s.navLink}>{m.label}</a>
        ))}
      </nav>

      {/* Finance */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{isAr ? "المالية والحسابات العامة" : "Finance & General Ledger"}</div>
        <div style={s.grid}>
          {[
            { label: isAr ? "الإيرادات" : "Revenue (MTD)", value: `SAR ${fmt(finance.revenue)}`, sub: isAr ? "هذا الشهر" : "Month to date" },
            { label: isAr ? "المصروفات" : "Expenses (MTD)", value: `SAR ${fmt(finance.expenses)}`, sub: isAr ? "هذا الشهر" : "Month to date" },
            { label: isAr ? "صافي الدخل" : "Net Income", value: `SAR ${fmt(finance.net_income)}`, sub: `${((finance.net_income / finance.revenue) * 100).toFixed(1)}% ${isAr ? "هامش" : "margin"}` },
            { label: isAr ? "ذمم مدينة" : "AR Balance", value: `SAR ${fmt(finance.ar_balance)}`, sub: isAr ? "مستحق" : "Outstanding" },
            { label: isAr ? "ذمم دائنة" : "AP Balance", value: `SAR ${fmt(finance.ap_balance)}`, sub: isAr ? "مستحق" : "Payable" },
            { label: isAr ? "النقد" : "Cash Balance", value: `SAR ${fmt(finance.cash_balance)}`, sub: isAr ? "متاح" : "Available" },
          ].map(item => (
            <div key={item.label} style={s.card}>
              <div style={s.cardLabel}>{item.label}</div>
              <div style={s.cardValue}>{item.value}</div>
              <div style={s.cardSub}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HR */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{isAr ? "الموارد البشرية" : "Human Resources"}</div>
        <div style={s.grid}>
          {[
            { label: isAr ? "إجمالي الموظفين" : "Total Staff", value: hr.total_staff, sub: "" },
            { label: isAr ? "نشط" : "Active", value: hr.active, sub: `${Math.round((hr.active / hr.total_staff) * 100)}%` },
            { label: isAr ? "في إجازة" : "On Leave", value: hr.on_leave, sub: isAr ? "حالياً" : "Currently" },
            { label: isAr ? "شواغر" : "Open Positions", value: hr.open_positions, sub: isAr ? "قيد التوظيف" : "Recruiting" },
          ].map(item => (
            <div key={item.label} style={s.card}>
              <div style={s.cardLabel}>{item.label}</div>
              <div style={s.cardValue}>{item.value}</div>
              {item.sub && <div style={s.cardSub}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Inventory */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{isAr ? "إدارة المخزون" : "Inventory Management"}</div>
        <div style={s.grid}>
          {[
            { label: isAr ? "إجمالي الأصناف" : "Total SKUs", value: inventory.total_items.toLocaleString(), sub: "" },
            { label: isAr ? "مخزون منخفض" : "Low Stock", value: inventory.low_stock, sub: isAr ? "يحتاج طلب" : "Needs reorder", alert: true },
            { label: isAr ? "قيمة المخزون" : "Stock Value", value: `SAR ${fmt(inventory.stock_value)}`, sub: "" },
            { label: isAr ? "طلبات معلقة" : "Pending Orders", value: inventory.pending_orders, sub: isAr ? "قيد الاستلام" : "In transit" },
          ].map(item => (
            <div key={item.label} style={s.card}>
              <div style={s.cardLabel}>{item.label}</div>
              <div style={{ ...s.cardValue, color: item.alert ? "#f87171" : "#22D3EE" }}>{item.value}</div>
              {item.sub && <div style={s.cardSub}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Procurement */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{isAr ? "المشتريات" : "Procurement"}</div>
        <div style={s.grid}>
          {[
            { label: isAr ? "أوامر الشراء المفتوحة" : "Open Purchase Orders", value: procurement.open_pos, sub: "" },
            { label: isAr ? "في انتظار الموافقة" : "Awaiting Approval", value: procurement.pending_approval, sub: isAr ? "طلبات شراء" : "Purchase requests" },
            { label: isAr ? "الإنفاق الشهري" : "MTD Spend", value: `SAR ${fmt(procurement.spend_mtd)}`, sub: "" },
            { label: isAr ? "الموردون" : "Active Vendors", value: procurement.vendors, sub: isAr ? "مورد نشط" : "Approved suppliers" },
          ].map(item => (
            <div key={item.label} style={s.card}>
              <div style={s.cardLabel}>{item.label}</div>
              <div style={s.cardValue}>{item.value}</div>
              {item.sub && <div style={s.cardSub}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
