"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface ImagingOrderItemRaw {
  id: string;
  procedure: string;
  body_part: string;
  laterality: string;
  status: string;
}

interface ImagingOrderRaw {
  id: string;
  order_number: string;
  patient_id: string;
  priority: string;
  status: string;
  clinical_indication: string;
  ordering_facility: string;
  created_at: string;
  items: ImagingOrderItemRaw[];
}

interface ImagingProcedureRaw {
  id: string;
  name: string;
  modality: string;
}

interface PatientRaw {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
}

interface Paginated<T> {
  count: number;
  results: T[];
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

function priorityColor(p: string) {
  if (p === "stat") return "#ef4444";
  if (p === "urgent") return "#f59e0b";
  return "#6366f1";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280",
  scheduled: "#3b82f6",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

export default function ImagingOrdersPage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [orders, setOrders] = useState<ImagingOrderRaw[] | null>(null);
  const [procedures, setProcedures] = useState<Record<string, ImagingProcedureRaw>>({});
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [ordersData, proceduresData, patientsData] = await Promise.all([
        apiFetch<Paginated<ImagingOrderRaw> | ImagingOrderRaw[]>("/api/v1/imaging/orders/orders/", opts),
        apiFetch<Paginated<ImagingProcedureRaw> | ImagingProcedureRaw[]>("/api/v1/imaging/orders/procedures/", opts),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", opts),
      ]);
      setOrders(unwrap(ordersData));
      const procMap: Record<string, ImagingProcedureRaw> = {};
      for (const p of unwrap(proceduresData)) procMap[p.id] = p;
      setProcedures(procMap);
      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load imaging orders."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCancel(id: string) {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/imaging/orders/orders/${id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status: "cancelled" }),
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

  const filtered = (orders || []).filter(o => {
    if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/imaging" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>{t("← Imaging", "← الأشعة")}</a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" }}>{t("Imaging Order Management", "إدارة طلبات الأشعة")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Real imaging orders (CPOE-fed)", "طلبات أشعة حقيقية")}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { href: "/imaging", label: t("Overview", "نظرة عامة") },
          { href: "/imaging/orders", label: t("Orders", "الطلبات") },
          { href: "/imaging/scheduling", label: t("Scheduling", "الجدولة") },
          { href: "/imaging/reports", label: t("Reports", "التقارير") },
          { href: "/imaging/pacs", label: t("PACS", "PACS") },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/imaging/orders" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/imaging/orders" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/imaging/orders" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
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
          { label: t("Total Orders", "إجمالي الطلبات"), value: (orders || []).length, color: "#6366f1" },
          { label: t("Pending", "معلقة"), value: (orders || []).filter(o => o.status === "pending").length, color: "#6b7280" },
          { label: t("Scheduled", "مجدولة"), value: (orders || []).filter(o => o.status === "scheduled").length, color: "#3b82f6" },
          { label: t("Completed", "مكتملة"), value: (orders || []).filter(o => o.status === "completed").length, color: "#22c55e" },
          { label: t("STAT Orders", "طلبات عاجلة"), value: (orders || []).filter(o => o.priority === "stat").length, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>{t("Priority", "الأولوية")}</span>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {["all", "stat", "urgent", "routine"].map(f => (
              <button key={f} onClick={() => setPriorityFilter(f)} style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", background: priorityFilter === f ? "#22D3EE" : "var(--color-background)", color: priorityFilter === f ? "#000" : "var(--color-text)" }}>
                {f === "all" ? t("All", "الكل") : f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.3rem" }}>{t("Status", "الحالة")}</span>
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {["all", "pending", "scheduled", "in_progress", "completed", "cancelled"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", background: statusFilter === f ? "#22D3EE" : "var(--color-background)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
                {f === "all" ? t("All", "الكل") : f}
              </button>
            ))}
          </div>
        </div>
        {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{t("Loading…", "جارٍ التحميل…")}</span>}
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          {t("Showing", "عرض")} {filtered.length} / {(orders || []).length}
        </div>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[t("Order #", "رقم الطلب"), t("Patient", "المريض"), t("Procedure(s)", "الإجراءات"), t("Facility", "المنشأة"), t("Priority", "الأولوية"), t("Status", "الحالة"), t("Requested", "وقت الطلب"), t("Actions", "الإجراءات")].map(h => (
                <th key={h} style={{ padding: "0.75rem 0.875rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                {t("No imaging orders for this tenant yet.", "لا توجد طلبات أشعة لهذا المستأجر بعد.")}
              </td></tr>
            )}
            {filtered.map((order) => {
              const patient = patients[order.patient_id];
              const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${order.patient_id.slice(0, 8)}`;
              const procedureNames = (order.items || []).map(item => procedures[item.procedure]?.name).filter(Boolean).join(", ") || "—";
              return (
                <tr key={order.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", fontFamily: "monospace", color: "#22D3EE", whiteSpace: "nowrap" }}>{order.order_number}</td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{patientLabel}</div>
                    {patient?.mrn && <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{patient.mrn}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.85rem" }}>{procedureNames}</td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{order.ordering_facility || "—"}</td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: priorityColor(order.priority) + "22", color: priorityColor(order.priority), border: `1px solid ${priorityColor(order.priority)}` }}>
                      {order.priority}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <span style={{ padding: "0.2rem 0.55rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: (STATUS_COLORS[order.status] || "#6b7280") + "22", color: STATUS_COLORS[order.status] || "#6b7280" }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                    {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    {(order.status === "pending" || order.status === "scheduled") ? (
                      <button disabled={busyId === order.id} onClick={() => handleCancel(order.id)} style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", borderRadius: "4px", background: "#ef444422", color: "#ef4444", border: "1px solid #ef4444", cursor: "pointer", whiteSpace: "nowrap", opacity: busyId === order.id ? 0.5 : 1 }}>
                        {t("Cancel", "إلغاء")}
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
