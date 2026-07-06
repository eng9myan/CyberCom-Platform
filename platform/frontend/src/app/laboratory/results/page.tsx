"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface ResultValueRaw {
  id: string;
  analyte_name: string;
  value_numeric: string | null;
  value_text: string;
  unit: string;
  interpretation: string;
  is_critical: boolean;
  is_abnormal: boolean;
}

interface LabResultRaw {
  id: string;
  order_item: string;
  status: string;
  has_critical_value: boolean;
  has_abnormal_value: boolean;
  resulted_at: string | null;
  values: ResultValueRaw[];
}

interface CriticalResultRaw {
  id: string;
  result_value: string;
  notification_status: string;
  critical_at: string;
  acknowledgement_name: string;
}

interface LabOrderItemRaw {
  id: string;
  order: string;
}

interface LabOrderRaw {
  id: string;
  order_number: string;
  patient_id: string;
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

const STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280",
  in_progress: "#f59e0b",
  resulted: "#22c55e",
  verified: "#22c55e",
  approved: "#22c55e",
  amended: "#f59e0b",
  cancelled: "#ef4444",
};

export default function LabResultsPage() {
  const { session, isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [results, setResults] = useState<LabResultRaw[] | null>(null);
  const [criticalByValue, setCriticalByValue] = useState<Record<string, CriticalResultRaw>>({});
  const [patientByOrderItem, setPatientByOrderItem] = useState<Record<string, { label: string; mrn: string }>>({});
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
      const [resultsData, criticalData, itemsData, ordersData, patientsData] = await Promise.all([
        apiFetch<Paginated<LabResultRaw> | LabResultRaw[]>("/api/v1/lab/results/results/", opts),
        apiFetch<Paginated<CriticalResultRaw> | CriticalResultRaw[]>("/api/v1/lab/results/critical-results/", opts),
        apiFetch<Paginated<LabOrderItemRaw> | LabOrderItemRaw[]>("/api/v1/lab/orders/order-items/", opts),
        apiFetch<Paginated<LabOrderRaw> | LabOrderRaw[]>("/api/v1/lab/orders/orders/", opts),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", opts),
      ]);

      setResults(unwrap(resultsData));

      const criticalMap: Record<string, CriticalResultRaw> = {};
      for (const cr of unwrap(criticalData)) criticalMap[cr.result_value] = cr;
      setCriticalByValue(criticalMap);

      const orderById: Record<string, LabOrderRaw> = {};
      for (const o of unwrap(ordersData)) orderById[o.id] = o;
      const patientById: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientById[p.id] = p;

      const itemPatientMap: Record<string, { label: string; mrn: string }> = {};
      for (const item of unwrap(itemsData)) {
        const order = orderById[item.order];
        if (!order) continue;
        const patient = patientById[order.patient_id];
        itemPatientMap[item.id] = {
          label: patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${order.patient_id.slice(0, 8)}`,
          mrn: patient?.mrn || "",
        };
      }
      setPatientByOrderItem(itemPatientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load lab results."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAcknowledge(criticalResultId: string) {
    if (!session) return;
    const name = window.prompt(lang === "en" ? "Read-back verification: enter your name" : "التحقق: أدخل اسمك");
    if (!name) return;
    setBusyId(criticalResultId);
    try {
      await apiFetch(`/api/v1/lab/results/critical-results/${criticalResultId}/acknowledge/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ acknowledgement_name: name }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Acknowledge failed."));
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

  const filtered = (results || []).filter(r => statusFilter === "all" || r.status === statusFilter);
  const unacknowledgedCritical = (results || []).filter(r => {
    if (!r.has_critical_value) return false;
    return (r.values || []).some(v => {
      const critical = criticalByValue[v.id];
      return v.is_critical && critical && critical.notification_status !== "acknowledged" && critical.notification_status !== "closed";
    });
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: lang === "ar" ? "rtl" : "ltr", background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <a href="/laboratory" style={{ color: "#22D3EE", textDecoration: "none", fontSize: "0.875rem" }}>{t("← Laboratory", "← المختبر")}</a>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#22D3EE" }}>{t("Lab Results", "نتائج المختبر")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {t("Real results with critical-value flagging and read-back acknowledgment", "نتائج حقيقية مع تمييز القيم الحرجة والإقرار بها")}
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
          <a key={item.href} href={item.href} style={{ padding: "0.4rem 1rem", borderRadius: "4px", background: item.href === "/laboratory/results" ? "#22D3EE22" : "var(--color-surface)", border: `1px solid ${item.href === "/laboratory/results" ? "#22D3EE" : "var(--color-border)"}`, color: item.href === "/laboratory/results" ? "#22D3EE" : "var(--color-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.9rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
          {fetchError}
        </div>
      )}

      {unacknowledgedCritical.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "0.85rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.2rem" }}>⚠</span>
          <div>
            <p style={{ color: "#b91c1c", fontWeight: 700, margin: 0, fontSize: "0.9rem" }}>
              {unacknowledgedCritical.length} {t("Unacknowledged Critical Value(s)", "قيمة حرجة غير مُقرّ بها")}
            </p>
            <p style={{ color: "#b91c1c", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>
              {t("Critical results require immediate physician acknowledgment.", "تتطلب النتائج الحرجة إقرارًا فوريًا من الطبيب.")}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: t("Total Results", "إجمالي النتائج"), value: (results || []).length, color: "#6366f1" },
          { label: t("Critical", "حرجة"), value: (results || []).filter(r => r.has_critical_value).length, color: "#ef4444" },
          { label: t("Abnormal", "غير طبيعية"), value: (results || []).filter(r => r.has_abnormal_value).length, color: "#f59e0b" },
          { label: t("Unacknowledged", "غير مُقرّ بها"), value: unacknowledgedCritical.length, color: "#ef4444" },
        ].map(m => (
          <div key={m.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["all", "pending", "resulted", "verified", "approved", "amended", "cancelled"].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "0.3rem 0.7rem", borderRadius: "5px", border: "1px solid var(--color-border)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: statusFilter === f ? "#22D3EE" : "var(--color-surface)", color: statusFilter === f ? "#000" : "var(--color-text)" }}>
            {f === "all" ? t("All", "الكل") : f}
          </button>
        ))}
        {loading && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", alignSelf: "center" }}>{t("Loading…", "جارٍ التحميل…")}</span>}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {!loading && filtered.length === 0 && (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            {t("No lab results for this tenant yet.", "لا توجد نتائج مخبرية لهذا المستأجر بعد.")}
          </div>
        )}
        {filtered.map(result => {
          const patientInfo = patientByOrderItem[result.order_item];
          return (
            <div key={result.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{patientInfo?.label || `Order Item ${result.order_item.slice(0, 8)}`}</p>
                  {patientInfo?.mrn && <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0.15rem 0 0" }}>{patientInfo.mrn}</p>}
                </div>
                <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: (STATUS_COLORS[result.status] || "#6b7280") + "22", color: STATUS_COLORS[result.status] || "#6b7280" }}>
                  {result.status}
                </span>
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                {(result.values || []).map(v => {
                  const critical = criticalByValue[v.id];
                  return (
                    <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", borderRadius: "6px", background: v.is_critical ? "#fef2f2" : "transparent" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: v.is_critical ? 700 : 400, color: v.is_critical ? "#b91c1c" : "var(--color-text)" }}>
                        {v.is_critical && "⚠ "}{v.analyte_name}: {v.value_numeric ?? v.value_text} {v.unit}
                        {v.interpretation && <span style={{ color: "var(--color-text-muted)" }}> ({v.interpretation})</span>}
                      </span>
                      {v.is_critical && critical && (
                        critical.notification_status === "acknowledged" ? (
                          <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600 }}>
                            {t("Acknowledged by", "أقرّ بواسطة")} {critical.acknowledgement_name}
                          </span>
                        ) : (
                          <button disabled={busyId === critical.id} onClick={() => handleAcknowledge(critical.id)} style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", opacity: busyId === critical.id ? 0.5 : 1 }}>
                            {t("Acknowledge", "إقرار")}
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
