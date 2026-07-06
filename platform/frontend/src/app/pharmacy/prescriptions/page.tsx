"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface MedicationOrderRaw {
  id: string;
  order_number: string;
  patient_id: string;
  prescriber_id: string;
  drug_name: string;
  dose: string;
  dose_unit: string;
  frequency: string;
  status: string;
  is_controlled: boolean;
  dea_schedule: string;
  created_at: string;
}

interface DrugInteractionRaw {
  patient_id: string;
  drug_a_name: string;
  drug_b_name: string;
  severity: string;
  alert_status: string;
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

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_verification: "New",
  verified: "Verified",
  active: "Active",
  on_hold: "On Hold",
  discontinued: "Discontinued",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending_verification: { bg: "#dbeafe", color: "#1e40af" },
  verified: { bg: "#d1fae5", color: "#065f46" },
  active: { bg: "#f0fdf4", color: "#15803d" },
  on_hold: { bg: "#fee2e2", color: "#b91c1c" },
  completed: { bg: "#f3f4f6", color: "#374151" },
  cancelled: { bg: "#f3f4f6", color: "#9ca3af" },
};

export default function PrescriptionsPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [orders, setOrders] = useState<MedicationOrderRaw[] | null>(null);
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [interactionsByPatient, setInteractionsByPatient] = useState<Record<string, DrugInteractionRaw[]>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [ordersData, patientsData, interactionsData] = await Promise.all([
        apiFetch<Paginated<MedicationOrderRaw> | MedicationOrderRaw[]>(
          "/api/v1/pharmacy/prescriptions/orders/",
          { token: session.accessToken, tenantId: session.tenantId }
        ),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
        apiFetch<Paginated<DrugInteractionRaw> | DrugInteractionRaw[]>(
          "/api/v1/pharmacy/interactions/detected/?alert_status=active",
          { token: session.accessToken, tenantId: session.tenantId }
        ),
      ]);

      setOrders(unwrap(ordersData));

      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);

      const interactionMap: Record<string, DrugInteractionRaw[]> = {};
      for (const interaction of unwrap(interactionsData)) {
        (interactionMap[interaction.patient_id] ||= []).push(interaction);
      }
      setInteractionsByPatient(interactionMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load prescription queue."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAction(id: string, nextStatus: "verified" | "on_hold" | "cancelled") {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/pharmacy/prescriptions/orders/${id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status: nextStatus }),
      });
      const msgs = {
        verified: lang === "en" ? "Order verified." : "تم التحقق من الطلب.",
        on_hold: lang === "en" ? "Order placed on hold." : "تم تعليق الطلب.",
        cancelled: lang === "en" ? "Order cancelled." : "تم إلغاء الطلب.",
      };
      setActionMsg(msgs[nextStatus]);
      setTimeout(() => setActionMsg(null), 3000);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Action failed."));
    } finally {
      setBusyId(null);
    }
  }

  const dir = lang === "ar" ? "rtl" : "ltr";

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign in required</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
          The prescription queue requires an authenticated session.
        </p>
      </div>
    );
  }

  const filtered = (orders || []).filter(o => statusFilter === "all" || o.status === statusFilter);
  const statusCounts = {
    total: (orders || []).length,
    pending_verification: (orders || []).filter(o => o.status === "pending_verification").length,
    verified: (orders || []).filter(o => o.status === "verified").length,
    active: (orders || []).filter(o => o.status === "active").length,
    on_hold: (orders || []).filter(o => o.status === "on_hold").length,
    alerts: Object.keys(interactionsByPatient).length,
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: dir }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Medication Order Queue" : "طابور طلبات الأدوية"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            {lang === "en" ? "Real inpatient medication orders (CPOE-fed) — review, verify, and manage" : "طلبات الأدوية الحقيقية للمرضى الداخليين — مراجعة والتحقق والإدارة"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.85rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.6rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/dispensing", label: lang === "en" ? "Dispensing Queue" : "طابور الصرف" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary" : "دليل الأدوية" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory" : "المخزون" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "6px", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: lang === "en" ? "Total" : "الإجمالي", value: statusCounts.total, color: "#22D3EE" },
          { label: lang === "en" ? "New" : "جديد", value: statusCounts.pending_verification, color: "#3b82f6" },
          { label: lang === "en" ? "Verified" : "تم التحقق", value: statusCounts.verified, color: "#22c55e" },
          { label: lang === "en" ? "Active" : "نشط", value: statusCounts.active, color: "#a3e635" },
          { label: lang === "en" ? "On Hold" : "معلقة", value: statusCounts.on_hold, color: "#ef4444" },
          { label: lang === "en" ? "Patients w/ Interaction Alerts" : "مرضى بتنبيهات تفاعل", value: statusCounts.alerts, color: "#f97316" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["all", "pending_verification", "verified", "active", "on_hold", "completed", "cancelled"].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.35rem 0.75rem", borderRadius: "5px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, background: statusFilter === f ? "#22D3EE" : "var(--color-surface)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
            {f === "all" ? (lang === "en" ? "All" : "الكل") : STATUS_LABELS[f]}
          </button>
        ))}
        {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", alignSelf: "center" }}>{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</span>}
      </div>

      {actionMsg && (
        <div style={{ background: "#d1fae5", border: "1px solid #34d399", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>
          {actionMsg}
        </div>
      )}

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {[
                lang === "en" ? "Order #" : "رقم الطلب",
                lang === "en" ? "Patient" : "المريض",
                lang === "en" ? "Medication" : "الدواء",
                lang === "en" ? "Dose / Freq" : "الجرعة / التكرار",
                lang === "en" ? "Controlled" : "خاضع للرقابة",
                lang === "en" ? "Time" : "الوقت",
                lang === "en" ? "Status" : "الحالة",
                lang === "en" ? "Actions" : "إجراءات",
              ].map(h => (
                <th key={h} style={{ padding: "0.9rem 1rem", textAlign: lang === "ar" ? "right" : "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  {lang === "en" ? "No medication orders for this tenant yet." : "لا توجد طلبات أدوية لهذا المستأجر بعد."}
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const patient = patients[o.patient_id];
              const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${o.patient_id.slice(0, 8)}`;
              const alerts = interactionsByPatient[o.patient_id];
              return (
                <>
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{o.order_number}</td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600, fontSize: "0.88rem" }}>
                      {patientLabel}{patient?.mrn && <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>({patient.mrn})</span>}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.88rem", fontWeight: 500 }}>{o.drug_name}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{o.dose} {o.dose_unit} · {o.frequency}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem" }}>{o.is_controlled ? `⚠ ${o.dea_schedule}` : "—"}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      {o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span style={{ padding: "0.25rem 0.6rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, background: STATUS_COLORS[o.status]?.bg || "#f3f4f6", color: STATUS_COLORS[o.status]?.color || "#374151" }}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {o.status === "pending_verification" ? (
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button disabled={busyId === o.id} onClick={() => handleAction(o.id, "verified")} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", background: "#22c55e", color: "#fff", border: "none", cursor: "pointer", opacity: busyId === o.id ? 0.5 : 1 }}>
                            {lang === "en" ? "Verify" : "تحقق"}
                          </button>
                          <button disabled={busyId === o.id} onClick={() => handleAction(o.id, "on_hold")} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer", opacity: busyId === o.id ? 0.5 : 1 }}>
                            {lang === "en" ? "Hold" : "تعليق"}
                          </button>
                          <button disabled={busyId === o.id} onClick={() => handleAction(o.id, "cancelled")} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", opacity: busyId === o.id ? 0.5 : 1 }}>
                            {lang === "en" ? "Reject" : "رفض"}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                  {alerts && alerts.length > 0 && (
                    <tr key={`${o.id}-alert`} style={{ background: "#fef2f2", borderBottom: "1px solid var(--color-border)" }}>
                      <td colSpan={8} style={{ padding: "0.5rem 1rem" }}>
                        {alerts.map((a, i) => (
                          <div key={i} style={{ fontSize: "0.8rem", color: "#b91c1c", fontWeight: 600 }}>
                            {lang === "en" ? "⚠ Drug Interaction Alert: " : "⚠ تنبيه تفاعل دوائي: "}
                            {a.drug_a_name}{a.drug_b_name ? ` × ${a.drug_b_name}` : ""} ({a.severity})
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
        {lang === "en" ? `Showing ${filtered.length} of ${statusCounts.total} orders` : `عرض ${filtered.length} من ${statusCounts.total} طلب`}
      </p>
    </div>
  );
}
