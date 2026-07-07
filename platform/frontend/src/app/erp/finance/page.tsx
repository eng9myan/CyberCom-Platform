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
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const totalRevenue = (pl || []).reduce((a, m) => a + m.revenue, 0);
  const totalExpenses = (pl || []).reduce((a, m) => a + m.expenses, 0);
  const totalNet = totalRevenue - totalExpenses;
  const maxRev = Math.max(1, ...(pl || []).map(m => m.revenue));

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/erp" className="mb-1 inline-block text-sm text-ink/50 hover:text-ink">{isAr ? "← نظام ERP" : "← ERP"}</a>
          <h1 className="font-heading text-2xl font-bold">{isAr ? "المالية والحسابات العامة" : "Finance & General Ledger"}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {isAr ? "الأداء المالي (من قيود اليومية الفعلية)" : "Financial Performance (from real posted journal entries)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-ink/40">●</span>}
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">{isAr ? "English" : "العربية"}</button>
        </div>
      </header>

      {fetchError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: isAr ? "الإيرادات" : "Revenue", value: `SAR ${fmt(totalRevenue)}`, className: "text-emerald-400" },
          { label: isAr ? "المصروفات" : "Expenses", value: `SAR ${fmt(totalExpenses)}`, className: "text-amber-400" },
          { label: isAr ? "صافي الدخل" : "Net Income", value: `SAR ${fmt(totalNet)}`, className: "text-brand-400" },
        ].map(m => (
          <div key={m.label} className="cy-card p-5">
            <div className={`text-2xl font-bold ${m.className}`}>{m.value}</div>
            <div className="mt-1 text-xs text-ink/50">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex gap-2">
        <button onClick={() => setTab("pl")} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === "pl" ? "border border-brand-400/40 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}>{isAr ? "الأرباح والخسائر" : "P&L Statement"}</button>
        <button onClick={() => setTab("gl")} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === "gl" ? "border border-brand-400/40 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}>{isAr ? "الحسابات العامة" : "GL Accounts"}</button>
      </div>

      {tab === "pl" && (
        <div className="cy-card p-5">
          <h2 className="mb-5 text-lg font-bold">{isAr ? "الأرباح والخسائر الشهرية" : "Monthly P&L"}</h2>
          {!loading && (pl || []).length === 0 && (
            <p className="text-sm text-ink/50">
              {isAr ? "لا توجد قيود يومية مرحّلة لهذا المستأجر بعد." : "No posted journal entries for this tenant yet."}
            </p>
          )}
          {(pl || []).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "الشهر" : "Month"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "الإيرادات" : "Revenue"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "المصروفات" : "Expenses"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "صافي الدخل" : "Net Income"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "الهامش" : "Margin %"}</th>
                    <th className="w-[200px] px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "الإيرادات (بيانياً)" : "Revenue (bar)"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(pl || []).map(m => (
                    <tr key={m.month} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-3 font-semibold">{m.month}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">SAR {fmt(m.revenue)}</td>
                      <td className="px-4 py-3 font-mono text-amber-400">SAR {fmt(m.expenses)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-brand-400">SAR {fmt(m.net)}</td>
                      <td className="px-4 py-3">{m.revenue !== 0 ? `${Math.round((m.net / m.revenue) * 100)}%` : "—"}</td>
                      <td className="px-4 py-3"><div className="h-4 rounded bg-ink/10"><div className="h-full rounded bg-emerald-400" style={{ width: `${(m.revenue / maxRev) * 100}%` }} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "gl" && (
        <div className="cy-card overflow-hidden p-0">
          {!loading && (accounts || []).length === 0 ? (
            <p className="p-6 text-center text-sm text-ink/50">
              {isAr ? "لا توجد حسابات عامة لهذا المستأجر بعد." : "No GL accounts for this tenant yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/5">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "الرمز" : "Code"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "الحساب" : "Account"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "النوع" : "Type"}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50">{isAr ? "الرصيد" : "Balance"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(accounts || []).map(a => (
                    <tr key={a.id} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-3 font-mono text-purple-400">{a.code}</td>
                      <td className="px-4 py-3">{isAr ? (a.name_ar || a.name) : a.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `${TYPE_COLOR[a.account_type] ?? "#6b7280"}22`, color: TYPE_COLOR[a.account_type] ?? "#6b7280", border: `1px solid ${TYPE_COLOR[a.account_type] ?? "#6b7280"}55` }}>
                          {isAr ? (TYPE_LABEL[a.account_type]?.ar ?? a.account_type) : (TYPE_LABEL[a.account_type]?.en ?? a.account_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">{a.currency} {parseFloat(a.balance).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
