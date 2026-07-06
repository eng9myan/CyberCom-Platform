"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface AccountRaw {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  account_type: string;
  balance: string;
  currency: string;
}

interface JournalLineRaw {
  id: string;
  account: string;
  debit: string;
  credit: string;
}

interface JournalEntryRaw {
  id: string;
  entry_date: string;
  status: string;
  lines: JournalLineRaw[];
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

interface MonthlyPL {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

const TYPE_COLOR: Record<string, string> = {
  asset: "#22D3EE",
  liability: "#ef4444",
  equity: "#a78bfa",
  revenue: "#22c55e",
  expense: "#f59e0b",
};

const TYPE_LABEL: Record<string, { en: string; ar: string }> = {
  asset: { en: "Asset", ar: "أصول" },
  liability: { en: "Liability", ar: "التزامات" },
  equity: { en: "Equity", ar: "حقوق الملكية" },
  revenue: { en: "Revenue", ar: "إيرادات" },
  expense: { en: "Expense", ar: "مصروفات" },
};

const fmt = (n: number) => Math.abs(n) >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toFixed(0);

export default function FinancePage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [accounts, setAccounts] = useState<AccountRaw[] | null>(null);
  const [pl, setPl] = useState<MonthlyPL[] | null>(null);
  const [tab, setTab] = useState<"pl" | "gl">("pl");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isAr = lang === "ar";

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [accountsData, entriesData] = await Promise.all([
        apiFetch<Paginated<AccountRaw> | AccountRaw[]>("/api/v1/erp/finance/gl/accounts/", opts),
        apiFetch<Paginated<JournalEntryRaw> | JournalEntryRaw[]>("/api/v1/erp/finance/gl/journal-entries/", opts),
      ]);

      const accountList = unwrap(accountsData);
      setAccounts(accountList);

      const typeByAccount: Record<string, string> = {};
      for (const a of accountList) typeByAccount[a.id] = a.account_type;

      const byMonth: Record<string, { revenue: number; expenses: number }> = {};
      for (const entry of unwrap(entriesData)) {
        if (entry.status !== "posted") continue;
        const month = entry.entry_date.slice(0, 7); // YYYY-MM
        byMonth[month] ||= { revenue: 0, expenses: 0 };
        for (const line of entry.lines || []) {
          const type = typeByAccount[line.account];
          const debit = parseFloat(line.debit) || 0;
          const credit = parseFloat(line.credit) || 0;
          if (type === "revenue") byMonth[month].revenue += credit - debit;
          if (type === "expense") byMonth[month].expenses += debit - credit;
        }
      }

      const monthlyPL = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, revenue: v.revenue, expenses: v.expenses, net: v.revenue - v.expenses }));
      setPl(monthlyPL);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load finance data."));
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

  const totalRevenue = (pl || []).reduce((a, m) => a + m.revenue, 0);
  const totalExpenses = (pl || []).reduce((a, m) => a + m.expenses, 0);
  const totalNet = totalRevenue - totalExpenses;
  const maxRev = Math.max(1, ...(pl || []).map(m => m.revenue));

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
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {isAr ? "الأداء المالي (من قيود اليومية الفعلية)" : "Financial Performance (from real posted journal entries)"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {loading && <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>●</span>}
          <a href="/erp" style={s.btn}>{isAr ? "← نظام ERP" : "← ERP"}</a>
          <button style={s.btn} onClick={() => setLang(isAr ? "en" : "ar")}>{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      <div style={s.metricGrid}>
        {[
          { label: isAr ? "الإيرادات" : "Revenue", value: `SAR ${fmt(totalRevenue)}`, color: "#22c55e" },
          { label: isAr ? "المصروفات" : "Expenses", value: `SAR ${fmt(totalExpenses)}`, color: "#f59e0b" },
          { label: isAr ? "صافي الدخل" : "Net Income", value: `SAR ${fmt(totalNet)}`, color: "#22D3EE" },
        ].map(m => (
          <div key={m.label} style={s.card}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button onClick={() => setTab("pl")} style={{ ...s.btn, background: tab === "pl" ? "#22D3EE" : "var(--color-surface)", color: tab === "pl" ? "#000" : "var(--color-text)" }}>{isAr ? "الأرباح والخسائر" : "P&L Statement"}</button>
        <button onClick={() => setTab("gl")} style={{ ...s.btn, background: tab === "gl" ? "#22D3EE" : "var(--color-surface)", color: tab === "gl" ? "#000" : "var(--color-text)" }}>{isAr ? "الحسابات العامة" : "GL Accounts"}</button>
      </div>

      {tab === "pl" && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", color: "#22D3EE" }}>{isAr ? "الأرباح والخسائر الشهرية" : "Monthly P&L"}</div>
          {!loading && (pl || []).length === 0 && (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              {isAr ? "لا توجد قيود يومية مرحّلة لهذا المستأجر بعد." : "No posted journal entries for this tenant yet."}
            </p>
          )}
          {(pl || []).length > 0 && (
            <table style={s.table}>
              <thead><tr><th style={s.th}>{isAr ? "الشهر" : "Month"}</th><th style={s.th}>{isAr ? "الإيرادات" : "Revenue"}</th><th style={s.th}>{isAr ? "المصروفات" : "Expenses"}</th><th style={s.th}>{isAr ? "صافي الدخل" : "Net Income"}</th><th style={s.th}>{isAr ? "الهامش" : "Margin %"}</th><th style={{ ...s.th, width: 200 }}>{isAr ? "الإيرادات (بيانياً)" : "Revenue (bar)"}</th></tr></thead>
              <tbody>
                {(pl || []).map(m => (
                  <tr key={m.month}>
                    <td style={{ ...s.td, fontWeight: 700 }}>{m.month}</td>
                    <td style={{ ...s.td, color: "#22c55e", fontFamily: "monospace" }}>SAR {fmt(m.revenue)}</td>
                    <td style={{ ...s.td, color: "#f59e0b", fontFamily: "monospace" }}>SAR {fmt(m.expenses)}</td>
                    <td style={{ ...s.td, color: "#22D3EE", fontFamily: "monospace", fontWeight: 700 }}>SAR {fmt(m.net)}</td>
                    <td style={s.td}>{m.revenue !== 0 ? `${Math.round((m.net / m.revenue) * 100)}%` : "—"}</td>
                    <td style={s.td}><div style={{ height: 16, background: "var(--color-background)", borderRadius: 4 }}><div style={{ width: `${(m.revenue / maxRev) * 100}%`, height: "100%", background: "#22c55e", borderRadius: 4 }} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "gl" && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
          {!loading && (accounts || []).length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", padding: "1.5rem" }}>
              {isAr ? "لا توجد حسابات عامة لهذا المستأجر بعد." : "No GL accounts for this tenant yet."}
            </p>
          ) : (
            <table style={s.table}>
              <thead><tr style={{ background: "rgba(34,211,238,0.05)" }}><th style={s.th}>{isAr ? "الرمز" : "Code"}</th><th style={s.th}>{isAr ? "الحساب" : "Account"}</th><th style={s.th}>{isAr ? "النوع" : "Type"}</th><th style={s.th}>{isAr ? "الرصيد" : "Balance"}</th></tr></thead>
              <tbody>
                {(accounts || []).map(a => (
                  <tr key={a.id}>
                    <td style={{ ...s.td, fontFamily: "monospace", color: "#a78bfa" }}>{a.code}</td>
                    <td style={s.td}>{isAr ? (a.name_ar || a.name) : a.name}</td>
                    <td style={s.td}>
                      <span style={{ background: `${TYPE_COLOR[a.account_type] ?? "#6b7280"}22`, color: TYPE_COLOR[a.account_type] ?? "#6b7280", border: `1px solid ${TYPE_COLOR[a.account_type] ?? "#6b7280"}55`, borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>
                        {isAr ? (TYPE_LABEL[a.account_type]?.ar ?? a.account_type) : (TYPE_LABEL[a.account_type]?.en ?? a.account_type)}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontWeight: 700 }}>{a.currency} {parseFloat(a.balance).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
