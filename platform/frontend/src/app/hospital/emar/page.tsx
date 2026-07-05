"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Pill } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type MarStatus = "scheduled" | "given" | "held" | "refused" | "missed" | "late";

interface MedicationOrder {
  id: string;
  patient_id: string;
  drug_name: string;
  dose: string;
  dose_unit: string;
  route: string;
  frequency: string;
  order_type: string;
  status: string;
}
interface MarRecord {
  id: string;
  medication_order: string;
  patient_id: string;
  scheduled_at: string;
  status: MarStatus;
  administered_at: string | null;
  dose_given: string;
  barcode_match_verified: boolean;
}
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Paginated<T> { count: number; results: T[]; }

const STATUS_COLOR: Record<MarStatus, string> = {
  scheduled: "#3b82f6", given: "#22c55e", held: "#f59e0b",
  refused: "#ef4444", missed: "#6b7280", late: "#f97316",
};

export default function EMARPage() {
  const { session, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<MedicationOrder[]>([]);
  const [marRecords, setMarRecords] = useState<MarRecord[] | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [givePanelId, setGivePanelId] = useState<string | null>(null);
  const [givePatientBarcode, setGivePatientBarcode] = useState("");
  const [giveDrugBarcode, setGiveDrugBarcode] = useState("");
  const [holdPanelId, setHoldPanelId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState("");
  const [refusePanelId, setRefusePanelId] = useState<string | null>(null);
  const [refuseReason, setRefuseReason] = useState("");

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [orderPage, marPage, patientPage] = await Promise.all([
        apiFetch<Paginated<MedicationOrder>>("/api/v1/pharmacy/prescriptions/orders/", opts),
        apiFetch<Paginated<MarRecord>>("/api/v1/pharmacy/administration/records/", opts),
        apiFetch<Paginated<Patient>>("/api/v1/patients/", opts),
      ]);
      setOrders(orderPage.results);
      setMarRecords(marPage.results);
      setPatients(patientPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load eMAR data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function actOnDose(mar: MarRecord, action: "administer" | "hold" | "refuse", extra: Record<string, string> = {}) {
    if (!session) return;
    setSubmittingId(mar.id);
    setActionError(null);
    try {
      await apiFetch(`/api/v1/pharmacy/administration/records/${mar.id}/${action}/`, {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify(extra),
      });
      setGivePanelId(null);
      setHoldPanelId(null);
      setRefusePanelId(null);
      setGivePatientBarcode("");
      setGiveDrugBarcode("");
      setHoldReason("");
      setRefuseReason("");
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setActionError(detail || `Failed to ${action} dose.`);
    } finally {
      setSubmittingId(null);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return (
      <div className="mx-auto mt-16 max-w-lg text-center">
        <h1 className="text-xl font-bold text-red-400">Unable to load eMAR data</h1>
        <p className="mt-2 text-white/50">{fetchError}</p>
      </div>
    );
  }
  if (marRecords === null) {
    return <div className="mt-16 text-center text-white/50">Loading live eMAR data...</div>;
  }

  const orderById = (id: string) => orders.find(o => o.id === id);
  const patientById = (id: string) => patients.find(p => p.id === id);
  const dueCount = marRecords.filter(m => m.status === "scheduled").length;
  const givenCount = marRecords.filter(m => m.status === "given" || m.status === "late").length;
  const heldOrRefusedCount = marRecords.filter(m => m.status === "held" || m.status === "refused").length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Pill size={22} /> Medication Administration Record</h1>
        <p className="mt-1 text-sm text-white/50">Live eMAR for this tenant -- bedside barcode-verified dosing</p>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{dueCount}</p>
          <p className="mt-1 text-xs text-white/50">Due</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{givenCount}</p>
          <p className="mt-1 text-xs text-white/50">Given</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-raised p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{heldOrRefusedCount}</p>
          <p className="mt-1 text-xs text-white/50">Held / Refused</p>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{actionError}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["Patient", "Drug", "Dose", "Route", "Scheduled", "Status", "Barcode", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marRecords.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-white/50">No medication administration records scheduled for this tenant yet.</td></tr>
              )}
              {marRecords.map(mar => {
                const order = orderById(mar.medication_order);
                const patient = patientById(mar.patient_id);
                const busy = submittingId === mar.id;
                return (
                  <Fragment key={mar.id}>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3 font-medium">{patient ? `${patient.first_name} ${patient.last_name} (${patient.mrn})` : "Unknown patient"}</td>
                      <td className="px-4 py-3">{order?.drug_name ?? "—"}</td>
                      <td className="px-4 py-3 text-white/60">{mar.dose_given || (order ? `${order.dose} ${order.dose_unit}` : "—")}</td>
                      <td className="px-4 py-3 text-white/60">{order?.route ?? "—"}</td>
                      <td className="px-4 py-3 text-white/60">{new Date(mar.scheduled_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize" style={{ background: `${STATUS_COLOR[mar.status]}22`, color: STATUS_COLOR[mar.status] }}>{mar.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {mar.administered_at ? (
                          <span className={mar.barcode_match_verified ? "text-green-400" : "text-amber-400"}>
                            {mar.barcode_match_verified ? "Verified" : "Override"}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {mar.status === "scheduled" && (
                          <div className="flex gap-1.5">
                            <button
                              disabled={busy}
                              onClick={() => { setGivePanelId(givePanelId === mar.id ? null : mar.id); setHoldPanelId(null); setRefusePanelId(null); }}
                              className="rounded-md bg-green-500/15 px-2 py-1 text-xs font-semibold text-green-400 hover:bg-green-500/25 disabled:opacity-40"
                            >
                              Give
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => { setHoldPanelId(holdPanelId === mar.id ? null : mar.id); setGivePanelId(null); setRefusePanelId(null); }}
                              className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/25 disabled:opacity-40"
                            >
                              Hold
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => { setRefusePanelId(refusePanelId === mar.id ? null : mar.id); setGivePanelId(null); setHoldPanelId(null); }}
                              className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/25 disabled:opacity-40"
                            >
                              Refuse
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {givePanelId === mar.id && (
                      <tr className="border-b border-white/5 bg-white/5">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex flex-wrap items-end gap-3">
                            <label className="text-xs text-white/50">Patient wristband barcode (MRN)
                              <input value={givePatientBarcode} onChange={e => setGivePatientBarcode(e.target.value)} placeholder={patient?.mrn} className="mt-1 block w-56 rounded-lg border border-white/10 bg-surface-overlay px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
                            </label>
                            <label className="text-xs text-white/50">Drug package barcode (drug code)
                              <input value={giveDrugBarcode} onChange={e => setGiveDrugBarcode(e.target.value)} className="mt-1 block w-56 rounded-lg border border-white/10 bg-surface-overlay px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
                            </label>
                            <button
                              disabled={busy}
                              onClick={() => void actOnDose(mar, "administer", { patient_barcode_scanned: givePatientBarcode, drug_barcode_scanned: giveDrugBarcode })}
                              className="rounded-lg bg-green-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-green-600 disabled:opacity-40"
                            >
                              {busy ? "Confirming..." : "Confirm Administration"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {holdPanelId === mar.id && (
                      <tr className="border-b border-white/5 bg-white/5">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex flex-wrap items-end gap-3">
                            <label className="text-xs text-white/50">Reason for holding this dose
                              <input value={holdReason} onChange={e => setHoldReason(e.target.value)} className="mt-1 block w-72 rounded-lg border border-white/10 bg-surface-overlay px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
                            </label>
                            <button disabled={busy || !holdReason} onClick={() => void actOnDose(mar, "hold", { hold_reason: holdReason })} className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-amber-600 disabled:opacity-40">
                              {busy ? "Saving..." : "Confirm Hold"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {refusePanelId === mar.id && (
                      <tr className="border-b border-white/5 bg-white/5">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex flex-wrap items-end gap-3">
                            <label className="text-xs text-white/50">Reason patient refused
                              <input value={refuseReason} onChange={e => setRefuseReason(e.target.value)} className="mt-1 block w-72 rounded-lg border border-white/10 bg-surface-overlay px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
                            </label>
                            <button disabled={busy || !refuseReason} onClick={() => void actOnDose(mar, "refuse", { refused_reason: refuseReason })} className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-semibold hover:bg-red-600 disabled:opacity-40">
                              {busy ? "Saving..." : "Confirm Refusal"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
