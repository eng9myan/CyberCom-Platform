"use client";

import { usePreferences } from "@/contexts/preferences";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface DispenseItemRaw {
  id: string;
  drug_name: string;
  dose: string;
  status: string;
}

interface DispenseOrderRaw {
  id: string;
  dispense_number: string;
  patient_id: string;
  dispense_type: string;
  status: string;
  pickup_method: string;
  created_at: string;
  items: DispenseItemRaw[];
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
  queued: "Queued",
  verification_pending: "Pending Verification",
  verified: "Verified",
  in_progress: "In Progress",
  dispensed: "Dispensed",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function DispensingQueuePage() {
  const { session, isAuthenticated } = useAuth();
  const { locale: lang, setLocale: _setLangRaw } = usePreferences();
  const setLang = (updater: "en" | "ar" | ((prev: "en" | "ar") => "en" | "ar")) =>
    _setLangRaw(typeof updater === "function" ? (updater as (prev: "en" | "ar") => "en" | "ar")(lang) : updater);
  const [orders, setOrders] = useState<DispenseOrderRaw[] | null>(null);
  const [patients, setPatients] = useState<Record<string, PatientRaw>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [ordersData, patientsData] = await Promise.all([
        apiFetch<Paginated<DispenseOrderRaw> | DispenseOrderRaw[]>(
          "/api/v1/pharmacy/dispensing/orders/",
          { token: session.accessToken, tenantId: session.tenantId }
        ),
        apiFetch<Paginated<PatientRaw> | PatientRaw[]>("/api/v1/patients/", {
          token: session.accessToken,
          tenantId: session.tenantId,
        }),
      ]);
      setOrders(unwrap(ordersData));
      const patientMap: Record<string, PatientRaw> = {};
      for (const p of unwrap(patientsData)) patientMap[p.id] = p;
      setPatients(patientMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load dispensing queue."));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function runAction(id: string, action: "verify" | "dispense") {
    if (!session) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/pharmacy/dispensing/orders/${id}/${action}/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
      });
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
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", direction: dir }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22D3EE", margin: 0 }}>
            {lang === "en" ? "Dispensing Queue" : "طابور الصرف"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            {lang === "en" ? "Real dispense orders created from verified medication orders" : "طلبات صرف حقيقية منشأة من طلبات الأدوية المتحقق منها"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.85rem" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav style={{ display: "flex", gap: "0.6rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Order Queue" : "طابور الطلبات" },
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

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</p>}

      {!loading && (orders || []).length === 0 && !fetchError && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          {lang === "en"
            ? "No dispense orders yet for this tenant. Dispense orders are created once a medication order has been pharmacist-verified."
            : "لا توجد طلبات صرف لهذا المستأجر بعد. يتم إنشاء طلبات الصرف بعد التحقق من طلب الدواء من قبل الصيدلي."}
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {(orders || []).map(o => {
          const patient = patients[o.patient_id];
          const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${o.patient_id.slice(0, 8)}`;
          return (
            <div key={o.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>{o.dispense_number}</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
                    {patientLabel}{patient?.mrn && ` (${patient.mrn})`} · {o.dispense_type}
                  </p>
                </div>
                <span style={{ padding: "0.25rem 0.6rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
              <div style={{ display: "grid", gap: "0.3rem", marginBottom: "0.85rem" }}>
                {(o.items || []).map(item => (
                  <div key={item.id} style={{ fontSize: "0.82rem", display: "flex", justifyContent: "space-between" }}>
                    <span>{item.drug_name} — {item.dose}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(o.status === "queued" || o.status === "verification_pending") && (
                  <button disabled={busyId === o.id} onClick={() => runAction(o.id, "verify")} style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 700, borderRadius: "6px", background: "#22c55e", color: "#fff", border: "none", cursor: "pointer", opacity: busyId === o.id ? 0.5 : 1 }}>
                    {lang === "en" ? "Verify" : "تحقق"}
                  </button>
                )}
                {o.status === "verified" && (
                  <button disabled={busyId === o.id} onClick={() => runAction(o.id, "dispense")} style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 700, borderRadius: "6px", background: "#22D3EE", color: "#000", border: "none", cursor: "pointer", opacity: busyId === o.id ? 0.5 : 1 }}>
                    {lang === "en" ? "Dispense to Patient" : "صرف للمريض"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
