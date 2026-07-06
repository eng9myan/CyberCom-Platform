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
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
      </div>
    );
  }

  const totalItems = (worklists || []).reduce((sum, w) => sum + (w.items || []).length, 0);
  const pendingItems = (worklists || []).reduce((sum, w) => sum + (w.items || []).filter(i => i.status === "pending").length, 0);
  const inProgressItems = (worklists || []).reduce((sum, w) => sum + (w.items || []).filter(i => i.status === "in_progress").length, 0);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/laboratory" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>{t("← Laboratory", "← المختبر")}</a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" }}>{t("Worklists", "قوائم العمل")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Real per-department analyzer worklists", "قوائم عمل حقيقية لكل قسم/محلل")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/laboratory", label: t("Overview", "نظرة عامة") },
          { href: "/laboratory/orders", label: t("Orders", "الطلبات") },
          { href: "/laboratory/specimens", label: t("Specimens", "العينات") },
          { href: "/laboratory/worklists", label: t("Worklists", "قوائم العمل") },
          { href: "/laboratory/results", label: t("Results", "النتائج") },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/laboratory/worklists" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/laboratory/worklists" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/laboratory/worklists" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("Worklists", "قوائم العمل"), value: (worklists || []).length, color: "#6366f1" },
          { label: t("Total Items", "إجمالي البنود"), value: totalItems, color: "#3b82f6" },
          { label: t("Pending", "معلقة"), value: pendingItems, color: "#6b7280" },
          { label: t("In Progress", "قيد المعالجة"), value: inProgressItems, color: "#f59e0b" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>{t("Loading…", "جارٍ التحميل…")}</p>}

      {!loading && (worklists || []).length === 0 && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          {t("No worklists for this tenant yet.", "لا توجد قوائم عمل لهذا المستأجر بعد.")}
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {(worklists || []).map(wl => (
          <div key={wl.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>{wl.name}</p>
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0.15rem 0 0", textTransform: "capitalize" }}>{wl.department}</p>
              </div>
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: (STATUS_COLORS[wl.status] || "#6b7280") + "22", color: STATUS_COLORS[wl.status] || "#6b7280" }}>
                {wl.status}
              </span>
            </div>
            {(wl.items || []).length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{t("No items queued.", "لا توجد بنود في القائمة.")}</p>
            ) : (
              <div style={{ display: "grid", gap: "0.35rem" }}>
                {wl.items.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", borderRadius: "6px", background: "var(--color-background)" }}>
                    <span style={{ fontSize: "0.82rem" }}>
                      #{item.sequence} — {t("Order Item", "بند الطلب")} {item.order_item.slice(0, 8)}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ padding: "0.15rem 0.5rem", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 600, background: (ITEM_STATUS_COLORS[item.status] || "#6b7280") + "22", color: ITEM_STATUS_COLORS[item.status] || "#6b7280" }}>
                        {item.status}
                      </span>
                      {item.status === "pending" && (
                        <button disabled={busyId === item.id} onClick={() => updateItemStatus(item.id, "in_progress")} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer", opacity: busyId === item.id ? 0.5 : 1 }}>
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
