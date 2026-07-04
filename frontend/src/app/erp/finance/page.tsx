"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface GLAccount { code: string; name: string; name_ar: string; type: string; type_ar: string; balance: number; }
interface MonthlyPL { month: string; revenue: number; expenses: number; net: number; }
const MOCK_GL: GLAccount[] = [
  { code: "1000", name: "Cash & Cash Equivalents", name_ar: "النقد وما في حكمه", type: "Asset", type_ar: "أصول", balance: 950000 },
  { code: "1100", name: "Accounts Receivable", name_ar: "الذمم المدينة", type: "Asset", type_ar: "أصول", balance: 320000 },
  { code: "1200", name: "Medical Supplies Inventory", name_ar: "مخزون المستلزمات الطبية", type: "Asset", type_ar: "أصول", balance: 185000 },
  { code: "1300", name: "Property & Equipment", name_ar: "الأصول الثابتة", type: "Asset", type_ar: "أصول", balance: 4200000 },
  { code: "2000", name: "Accounts Payable", name_ar: "الذمم الدائنة", type: "Liability", type_ar: "التزامات", balance: 180000 },
  { code: "2100", name: "Accrued Expenses", name_ar: "مصروفات مستحقة", type: "Liability", type_ar: "التزامات", balance: 95000 },
  { code: "2200", name: "Long-Term Debt", name_ar: "الديون طويلة الأجل", type: "Liability", type_ar: "التزامات", balance: 1500000 },
  { code: "3000", name: "Retained Earnings", name_ar: "الأرباح المحتجزة", type: "Equity", type_ar: "حقوق الملكية", balance: 3900000 },
  { code: "4000", name: "Patient Revenue", name_ar: "إيرادات المرضى", type: "Revenue", type_ar: "إيرادات", balance: 2400000 },
  { code: "4100", name: "Insurance Revenue", name_ar: "إيرادات التأمين", type: "Revenue", type_ar: "إيرادات", balance: 1800000 },
  { code: "5000", name: "Staff Salaries", name_ar: "رواتب الموظفين", type: "Expense", type_ar: "مصروفات", balance: 1200000 },
  { code: "5100", name: "Medical Supplies", name_ar: "المستلزمات الطبية", type: "Expense", type_ar: "مصروفات", balance: 350000 },
  { code: "5200", name: "Utilities & Maintenance", name_ar: "المرافق والصيانة", type: "Expense", type_ar: "مصروفات", balance: 120000 },
  { code: "5300", name: "Depreciation", name_ar: "الاستهلاك", type: "Expense", type_ar: "مصروفات", balance: 130000 },
];
const MOCK_PL: MonthlyPL[] = [
  { month: "Jan", revenue: 3800000, expenses: 2900000, net: 900000 },
  { month: "Feb", revenue: 3600000, expenses: 2750000, net: 850000 },
  { month: "Mar", revenue: 4100000, expenses: 3100000, net: 1000000 },
  { month: "Apr", revenue: 3900000, expenses: 3000000, net: 900000 },
  { month: "May", revenue: 4200000, expenses: 3200000, net: 1000000 },
  { month: "Jun", revenue: 4400000, expenses: 3300000, net: 1100000 },
];
const TYPE_COLOR: Record<string, string> = { Asset: "#22D3EE", Liability: "#ef4444", Equity: "#a78bfa", Revenue: "#22c55e", Expense: "#f59e0b" };
const fmt = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n);

export default function FinancePage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [accounts, setAccounts] = useState<GLAccount[]>(MOCK_GL);
  const [pl] = useState<MonthlyPL[]>(MOCK_PL);
  const [tab, setTab] = useState<"pl" | "gl">("pl");
  const [loading, setLoading] = useState(false);
  const isAr = lang === "ar";

  useEffect(() => {
    setLoading(true);
    apiFetch<GLAccount[]>("/api/v1/erp/finance/gl/accounts/").then(d => { if (d && d.length) setAccounts(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalRevenue = pl.reduce((a, m) => a + m.revenue, 0);
  const totalExpenses = pl.reduce((a, m) => a + m.expenses, 0);
  const totalNet = pl.reduce((a, m) => a + m.net, 0);
  const maxRev = Math.max(...pl.map(m => m.revenue));

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "2rem", maxWidth: 1200, margin: "0 auto", direction: isAr ? "rtl" : "ltr" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid rgba(34,211,238,0.3)", paddingBottom: "1rem" },
    h1: { fontSize: "1.6rem", fontWeight: 700, color: "#22D3EE" },
    btn: { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "0.4rem 1rem", borderRadius: 6, cursor: "pointer", fontWeight: 600, textDecoration: "none" as const },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" },
    card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "1.25rem" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "0.75rem", textAlign: (isAr ? "right" : "left") as "left" | "right", color: "var(--color-text-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-border)", fontSize: "0.85rem" },
    td: { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>{isAr ? "المالية والحسابات العامة" : "Finance & General Ledger"}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>YTD {isAr ? "الأداء المالي" : "Financial Performance"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/erp" style={s.btn}>{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>
      <div style={s.metricGrid}>
        {[{ label: isAr ? "الإيرادات (YTD)" : "Revenue (YTD)", value: `SAR ${fmt(totalRevenue)}`, color: "#22c55e" }, { label: isAr ? "المصروفات (YTD)" : "Expenses (YTD)", value: `SAR ${fmt(totalExpenses)}`, color: "#f59e0b" }, { label: isAr ? "صافي الدخل (YTD)" : "Net Income (YTD)", value: `SAR ${fmt(totalNet)}`, color: "#22D3EE" }].map(m => <div key={m.label} style={s.card}><div style={{ fontSize: "1.8rem", fontWeight: 700, color: m.color }}>{m.value}</div><div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div></div>)}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button onClick={() => setTab("pl")} style={{ ...s.btn, background: tab === "pl" ? "#22D3EE" : "var(--color-surface)", color: tab === "pl" ? "#000" : "var(--color-text)" }}>{isAr ? "الأرباح والخسائر" : "P&L Statement"}</button>
        <button onClick={() => setTab("gl")} style={{ ...s.btn, background: tab === "gl" ? "#22D3EE" : "var(--color-surface)", color: tab === "gl" ? "#000" : "var(--color-text)" }}>{isAr ? "الحسابات العامة" : "GL Accounts"}</button>
      </div>
      {tab === "pl" && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", color: "#22D3EE" }}>{isAr ? "الأرباح والخسائر الشهرية" : "Monthly P&L"}</div>
          <table style={s.table}>
            <thead><tr><th style={s.th}>{isAr ? "الشهر" : "Month"}</th><th style={s.th}>{isAr ? "الإيرادات" : "Revenue"}</th><th style={s.th}>{isAr ? "المصروفات" : "Expenses"}</th><th style={s.th}>{isAr ? "صافي الدخل" : "Net Income"}</th><th style={s.th}>{isAr ? "الهامش" : "Margin %"}</th><th style={{ ...s.th, width: 200 }}>{isAr ? "الإيرادات (بيانياً)" : "Revenue (bar)"}</th></tr></thead>
            <tbody>{pl.map(m => <tr key={m.month}><td style={{ ...s.td, fontWeight: 700 }}>{m.month}</td><td style={{ ...s.td, color: "#22c55e", fontFamily: "monospace" }}>SAR {fmt(m.revenue)}</td><td style={{ ...s.td, color: "#f59e0b", fontFamily: "monospace" }}>SAR {fmt(m.expenses)}</td><td style={{ ...s.td, color: "#22D3EE", fontFamily: "monospace", fontWeight: 700 }}>SAR {fmt(m.net)}</td><td style={s.td}>{Math.round(m.net / m.revenue * 100)}%</td><td style={s.td}><div style={{ height: 16, background: "var(--color-background)", borderRadius: 4 }}><div style={{ width: `${(m.revenue / maxRev) * 100}%`, height: "100%", background: "#22c55e", borderRadius: 4 }} /></div></td></tr>)}</tbody>
          </table>
        </div>
      )}
      {tab === "gl" && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
          <table style={s.table}>
            <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "الرمز" : "Code"}</th><th style={s.th}>{isAr ? "الحساب" : "Account"}</th><th style={s.th}>{isAr ? "النوع" : "Type"}</th><th style={s.th}>{isAr ? "الرصيد" : "Balance"}</th></tr></thead>
            <tbody>{accounts.map(a => <tr key={a.code}><td style={{ ...s.td, fontFamily: "monospace", color: "#a78bfa" }}>{a.code}</td><td style={s.td}>{isAr ? a.name_ar : a.name}</td><td style={s.td}><span style={{ background: `${TYPE_COLOR[a.type] ?? "#6b7280"}22`, color: TYPE_COLOR[a.type] ?? "#6b7280", border: `1px solid ${TYPE_COLOR[a.type] ?? "#6b7280"}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>{isAr ? a.type_ar : a.type}</span></td><td style={{ ...s.td, fontFamily: "monospace", fontWeight: 700 }}>SAR {a.balance.toLocaleString()}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
