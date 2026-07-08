"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface WorklistItemRaw {
  id: string;
  order_item: string;
  sequence: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

interface LabWorklistRaw {
  id: string;
  name: string;
  department: string;
  status: string;
  created_at: string;
  items: WorklistItemRaw[];
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const ITEM_STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280",
  in_progress: "#f59e0b",
  resulted: "#22c55e",
  verified: "#22c55e",
  cancelled: "#ef4444",
};

export default function WorklistsPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [worklists, setWorklists] = useState<LabWorklistRaw[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await apiFetch<Paginated<LabWorklistRaw> | LabWorklistRaw[]>(
        "/api/v1/lab/worklists/worklists/",
        { token: session.accessToken, tenantId: session.tenantId }
      );
      setWorklists(unwrap(data));
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load worklists."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function updateItemStatus(itemId: string, status: string) {
    if (!session) return;
    setBusyId(itemId);
    try {
      await apiFetch(`/api/v1/lab/worklists/worklist-items/${itemId}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Action failed."));
    } finally {
      setBusyId(null);
    }
  }

  const t = (en: string, ar: string) => lang === "en" ? en : ar;

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const totalItems = (worklists || []).reduce((sum, w) => sum + (w.items || []).length, 0);
  const pendingItems = (worklists || []).reduce((sum, w) => sum + (w.items || []).filter(i => i.status === "pending").length, 0);
  const inProgressItems = (worklists || []).reduce((sum, w) => sum + (w.items || []).filter(i => i.status === "in_progress").length, 0);

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <a href="/laboratory" className="text-sm text-brand-400">{t("← Laboratory", "← المختبر")}</a>
          <h1 className="font-heading text-2xl font-bold text-brand-400">{t("Worklists", "قوائم العمل")}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t("Real per-department analyzer worklists", "قوائم عمل حقيقية لكل قسم/محلل")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {[
          { href: "/laboratory", label: t("Overview", "نظرة عامة") },
          { href: "/laboratory/orders", label: t("Orders", "الطلبات") },
          { href: "/laboratory/specimens", label: t("Specimens", "العينات") },
          { href: "/laboratory/worklists", label: t("Worklists", "قوائم العمل") },
          { href: "/laboratory/results", label: t("Results", "النتائج") },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${item.href === "/laboratory/worklists" ? "border border-brand-400/60 bg-brand-500/15 text-brand-300" : "border border-ink/10 text-ink/70 hover:bg-ink/5"}`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3.5 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: t("Worklists", "قوائم العمل"), value: (worklists || []).length, color: "#6366f1" },
          { label: t("Total Items", "إجمالي البنود"), value: totalItems, color: "#3b82f6" },
          { label: t("Pending", "معلقة"), value: pendingItems, color: "#6b7280" },
          { label: t("In Progress", "قيد المعالجة"), value: inProgressItems, color: "#f59e0b" },
        ].map(m => (
          <div key={m.label} className="cy-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="mt-1 text-xs text-ink/50">{m.label}</p>
          </div>
        ))}
      </div>

      {loading && <p className="mb-4 text-sm text-ink/50">{t("Loading…", "جارٍ التحميل…")}</p>}

      {!loading && (worklists || []).length === 0 && (
        <div className="cy-card p-8 text-center text-sm text-ink/40">
          {t("No worklists for this tenant yet.", "لا توجد قوائم عمل لهذا المستأجر بعد.")}
        </div>
      )}

      <div className="grid gap-4">
        {(worklists || []).map(wl => (
          <div key={wl.id} className="cy-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[0.95rem] font-bold">{wl.name}</p>
                <p className="mt-0.5 text-xs capitalize text-ink/50">{wl.department}</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: (STATUS_COLORS[wl.status] || "#6b7280") + "22", color: STATUS_COLORS[wl.status] || "#6b7280" }}>
                {wl.status}
              </span>
            </div>
            {(wl.items || []).length === 0 ? (
              <p className="text-sm text-ink/50">{t("No items queued.", "لا توجد بنود في القائمة.")}</p>
            ) : (
              <div className="grid gap-1.5">
                {wl.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between rounded-md bg-surface-raised px-2.5 py-1.5">
                    <span className="text-sm">
                      #{item.sequence} — {t("Order Item", "بند الطلب")} {item.order_item.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: (ITEM_STATUS_COLORS[item.status] || "#6b7280") + "22", color: ITEM_STATUS_COLORS[item.status] || "#6b7280" }}>
                        {item.status}
                      </span>
                      {item.status === "pending" && (
                        <button disabled={busyId === item.id} onClick={() => updateItemStatus(item.id, "in_progress")} className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
                          {t("Start", "بدء")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
