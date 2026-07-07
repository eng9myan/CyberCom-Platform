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

  return (
    <div className="mx-auto max-w-5xl" style={{ direction: isAr ? "rtl" : "ltr" }}>
      <header className="mb-6 flex items-center justify-between border-b border-brand-400/30 pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "نظام تخطيط موارد المؤسسة — CyCom ERP" : "CyCom ERP — Enterprise Resource Planning"}</h1>
          <p className="text-sm text-ink/50">{isAr ? "المالية · الموارد البشرية · المخزون · المشتريات" : "Finance · Human Resources · Inventory · Procurement"}</p>
        </div>
        <div className="flex items-center gap-4">
          {loading && <span className="text-xs text-ink/50">●</span>}
          <button className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm" onClick={() => setLang(isAr ? "en" : "ar")}>
            {isAr ? "English" : "العربية"}
          </button>
        </div>
      </header>

      <nav className="mb-8 flex flex-wrap gap-3">
        {SUB_MODULES.map(m => (
          <a key={m.href} href={m.href} className="rounded-md border border-ink/10 bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-400 hover:text-brand-400">{m.label}</a>
        ))}
      </nav>

      {/* Finance */}
      <div className="mb-8">
        <div className="mb-3 text-lg font-bold text-brand-400">{isAr ? "المالية والحسابات العامة" : "Finance & General Ledger"}</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: isAr ? "الإيرادات" : "Revenue (MTD)", value: `SAR ${fmt(finance.revenue)}`, sub: isAr ? "هذا الشهر" : "Month to date" },
            { label: isAr ? "المصروفات" : "Expenses (MTD)", value: `SAR ${fmt(finance.expenses)}`, sub: isAr ? "هذا الشهر" : "Month to date" },
            { label: isAr ? "صافي الدخل" : "Net Income", value: `SAR ${fmt(finance.net_income)}`, sub: `${((finance.net_income / finance.revenue) * 100).toFixed(1)}% ${isAr ? "هامش" : "margin"}` },
            { label: isAr ? "ذمم مدينة" : "AR Balance", value: `SAR ${fmt(finance.ar_balance)}`, sub: isAr ? "مستحق" : "Outstanding" },
            { label: isAr ? "ذمم دائنة" : "AP Balance", value: `SAR ${fmt(finance.ap_balance)}`, sub: isAr ? "مستحق" : "Payable" },
            { label: isAr ? "النقد" : "Cash Balance", value: `SAR ${fmt(finance.cash_balance)}`, sub: isAr ? "متاح" : "Available" },
          ].map(item => (
            <div key={item.label} className="cy-card p-5">
              <div className="text-xs text-ink/50">{item.label}</div>
              <div className="mt-1.5 text-2xl font-bold text-brand-400">{item.value}</div>
              <div className="mt-1 text-xs text-ink/40">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HR */}
      <div className="mb-8">
        <div className="mb-3 text-lg font-bold text-brand-400">{isAr ? "الموارد البشرية" : "Human Resources"}</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: isAr ? "إجمالي الموظفين" : "Total Staff", value: hr.total_staff, sub: "" },
            { label: isAr ? "نشط" : "Active", value: hr.active, sub: `${Math.round((hr.active / hr.total_staff) * 100)}%` },
            { label: isAr ? "في إجازة" : "On Leave", value: hr.on_leave, sub: isAr ? "حالياً" : "Currently" },
            { label: isAr ? "شواغر" : "Open Positions", value: hr.open_positions, sub: isAr ? "قيد التوظيف" : "Recruiting" },
          ].map(item => (
            <div key={item.label} className="cy-card p-5">
              <div className="text-xs text-ink/50">{item.label}</div>
              <div className="mt-1.5 text-2xl font-bold text-brand-400">{item.value}</div>
              {item.sub && <div className="mt-1 text-xs text-ink/40">{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Inventory */}
      <div className="mb-8">
        <div className="mb-3 text-lg font-bold text-brand-400">{isAr ? "إدارة المخزون" : "Inventory Management"}</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: isAr ? "إجمالي الأصناف" : "Total SKUs", value: inventory.total_items.toLocaleString(), sub: "" },
            { label: isAr ? "مخزون منخفض" : "Low Stock", value: inventory.low_stock, sub: isAr ? "يحتاج طلب" : "Needs reorder", alert: true },
            { label: isAr ? "قيمة المخزون" : "Stock Value", value: `SAR ${fmt(inventory.stock_value)}`, sub: "" },
            { label: isAr ? "طلبات معلقة" : "Pending Orders", value: inventory.pending_orders, sub: isAr ? "قيد الاستلام" : "In transit" },
          ].map(item => (
            <div key={item.label} className="cy-card p-5">
              <div className="text-xs text-ink/50">{item.label}</div>
              <div className="mt-1.5 text-2xl font-bold" style={{ color: item.alert ? "#f87171" : "#22D3EE" }}>{item.value}</div>
              {item.sub && <div className="mt-1 text-xs text-ink/40">{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Procurement */}
      <div className="mb-8">
        <div className="mb-3 text-lg font-bold text-brand-400">{isAr ? "المشتريات" : "Procurement"}</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: isAr ? "أوامر الشراء المفتوحة" : "Open Purchase Orders", value: procurement.open_pos, sub: "" },
            { label: isAr ? "في انتظار الموافقة" : "Awaiting Approval", value: procurement.pending_approval, sub: isAr ? "طلبات شراء" : "Purchase requests" },
            { label: isAr ? "الإنفاق الشهري" : "MTD Spend", value: `SAR ${fmt(procurement.spend_mtd)}`, sub: "" },
            { label: isAr ? "الموردون" : "Active Vendors", value: procurement.vendors, sub: isAr ? "مورد نشط" : "Approved suppliers" },
          ].map(item => (
            <div key={item.label} className="cy-card p-5">
              <div className="text-xs text-ink/50">{item.label}</div>
              <div className="mt-1.5 text-2xl font-bold text-brand-400">{item.value}</div>
              {item.sub && <div className="mt-1 text-xs text-ink/40">{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
