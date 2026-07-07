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
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-6xl" style={{ direction: dir }}>
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-400">
            {lang === "en" ? "Dispensing Queue" : "طابور الصرف"}
          </h1>
          <p className="mt-1.5 text-sm text-ink/50">
            {lang === "en" ? "Real dispense orders created from verified medication orders" : "طلبات صرف حقيقية منشأة من طلبات الأدوية المتحقق منها"}
          </p>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2.5">
        {[
          { href: "/pharmacy", label: lang === "en" ? "← Pharmacy Home" : "← الصيدلية" },
          { href: "/pharmacy/prescriptions", label: lang === "en" ? "Order Queue" : "طابور الطلبات" },
          { href: "/pharmacy/formulary", label: lang === "en" ? "Formulary" : "دليل الأدوية" },
          { href: "/pharmacy/inventory", label: lang === "en" ? "Inventory" : "المخزون" },
        ].map(item => (
          <a key={item.href} href={item.href} className="rounded-md border border-ink/10 bg-surface px-4 py-2 text-xs font-semibold hover:bg-ink/5">
            {item.label}
          </a>
        ))}
      </nav>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      {loading && <p className="mb-4 text-sm text-ink/50">{lang === "en" ? "Loading…" : "جارٍ التحميل…"}</p>}

      {!loading && (orders || []).length === 0 && !fetchError && (
        <div className="cy-card p-12 text-center text-sm text-ink/50">
          {lang === "en"
            ? "No dispense orders yet for this tenant. Dispense orders are created once a medication order has been pharmacist-verified."
            : "لا توجد طلبات صرف لهذا المستأجر بعد. يتم إنشاء طلبات الصرف بعد التحقق من طلب الدواء من قبل الصيدلي."}
        </div>
      )}

      <div className="grid gap-4">
        {(orders || []).map(o => {
          const patient = patients[o.patient_id];
          const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : `Patient ${o.patient_id.slice(0, 8)}`;
          return (
            <div key={o.id} className="cy-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-[15px] font-bold">{o.dispense_number}</p>
                  <p className="mt-0.5 text-sm text-ink/50">
                    {patientLabel}{patient?.mrn && ` (${patient.mrn})`} · {o.dispense_type}
                  </p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "#dbeafe", color: "#1e40af" }}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
              <div className="mb-3.5 grid gap-1">
                {(o.items || []).map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.drug_name} — {item.dose}</span>
                    <span className="text-ink/50">{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {(o.status === "queued" || o.status === "verification_pending") && (
                  <button disabled={busyId === o.id} onClick={() => runAction(o.id, "verify")} className="cy-btn bg-emerald-500 text-white disabled:opacity-50 !min-h-0 !py-1.5 !px-3.5 text-xs">
                    {lang === "en" ? "Verify" : "تحقق"}
                  </button>
                )}
                {o.status === "verified" && (
                  <button disabled={busyId === o.id} onClick={() => runAction(o.id, "dispense")} className="cy-btn cy-btn-primary disabled:opacity-50 !min-h-0 !py-1.5 !px-3.5 text-xs">
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
