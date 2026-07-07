"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type TransferStatus = "initiated" | "under_review" | "accepted" | "completed" | "rejected";

interface ReceivingFacility { id: string; name: string; code: string; facility_type: string; }
interface TransferCase {
  id: string; patient: string; source_hospital_name: string; target_facility: string;
  status: TransferStatus; reason: string;
}
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<TransferStatus, string> = {
  initiated: "#94a3b8", under_review: "#f59e0b", accepted: "#3b82f6", completed: "#22c55e", rejected: "#ef4444",
};

export default function TransferCenterPage() {
  const { session, isAuthenticated } = useAuth();
  const [cases, setCases] = useState<TransferCase[] | null>(null);
  const [facilities, setFacilities] = useState<ReceivingFacility[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: "", sourceHospital: "", targetFacilityId: "", reason: "" });

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [caseData, facilityData, patientData] = await Promise.all([
        apiFetch<Paginated<TransferCase> | TransferCase[]>("/api/v1/hospital/transfer-center/cases/", opts),
        apiFetch<Paginated<ReceivingFacility> | ReceivingFacility[]>("/api/v1/hospital/transfer-center/facilities/", opts),
        apiFetch<Paginated<Patient> | Patient[]>("/api/v1/patients/", opts),
      ]);
      setCases(unwrap(caseData));
      setFacilities(unwrap(facilityData));
      const pMap: Record<string, Patient> = {};
      for (const p of unwrap(patientData)) pMap[p.id] = p;
      setPatients(pMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load transfer center data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createCase() {
    if (!session || !form.patientId || !form.targetFacilityId || !form.reason) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/hospital/transfer-center/cases/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({
          patient: form.patientId, source_hospital_name: form.sourceHospital || "CyMed Hospital",
          target_facility: form.targetFacilityId, reason: form.reason, status: "initiated",
        }),
      });
      setForm({ patientId: "", sourceHospital: "", targetFacilityId: "", reason: "" });
      setShowForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to create transfer case."));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(caseId: string, status: TransferStatus) {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/transfer-center/cases/${caseId}/`, {
        method: "PATCH", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ status }),
      });
      if (status === "accepted") {
        await apiFetch("/api/v1/hospital/transfer-center/reviews/", {
          method: "POST", token: session.accessToken, tenantId: session.tenantId,
          body: JSON.stringify({ transfer_case: caseId, reviewed_by: session.userId, decision: "accept" }),
        });
      }
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to update transfer case."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const sorted = (cases || []).slice();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><ArrowLeftRight size={22} /> Transfer Center</h1>
          <p className="mt-1 text-sm text-ink/50">Inter-facility transfers — incoming referrals and outgoing transfer requests</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ New Transfer</button>
      </header>

      {fetchError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      {showForm && (
        <div className="cy-card mb-6 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-ink/50">Patient</label>
              <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                <option value="">Select…</option>
                {Object.values(patients).map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Target facility</label>
              <select value={form.targetFacilityId} onChange={e => setForm(f => ({ ...f, targetFacilityId: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                <option value="">Select…</option>
                {facilities.map(fac => <option key={fac.id} value={fac.id}>{fac.name} ({fac.facility_type})</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-ink/50">Reason for transfer</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          {facilities.length === 0 && (
            <p className="mt-3 text-xs text-amber-400">No receiving facilities registered yet — add one via the API before creating a case, or ask an administrator.</p>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={createCase} disabled={busy || !form.patientId || !form.targetFacilityId || !form.reason} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm disabled:opacity-50">Submit</button>
            <button onClick={() => setShowForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {cases === null && <div className="cy-card p-6 text-center text-sm text-ink/40">Loading transfer cases…</div>}
        {cases !== null && sorted.length === 0 && <div className="cy-card p-6 text-center text-sm text-ink/40">No transfer cases yet.</div>}
        {sorted.map(c => {
          const p = patients[c.patient];
          const facility = facilities.find(f => f.id === c.target_facility);
          return (
            <div key={c.id} className="cy-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p ? `${p.first_name} ${p.last_name}` : `Patient ${c.patient.slice(0, 8)}`}</span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[c.status]}22`, color: STATUS_COLOR[c.status] }}>{c.status.replace("_", " ")}</span>
                  </div>
                  <div className="mt-1 text-sm text-ink/60">{c.source_hospital_name} → {facility?.name ?? "Unknown facility"}</div>
                  <p className="mt-1 text-xs text-ink/50">{c.reason}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {c.status === "initiated" && (
                    <button disabled={busy} onClick={() => setStatus(c.id, "under_review")} className="rounded-md border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 disabled:opacity-40">Review</button>
                  )}
                  {c.status === "under_review" && (
                    <>
                      <button disabled={busy} onClick={() => setStatus(c.id, "accepted")} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Accept</button>
                      <button disabled={busy} onClick={() => setStatus(c.id, "rejected")} className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40">Reject</button>
                    </>
                  )}
                  {c.status === "accepted" && (
                    <button disabled={busy} onClick={() => setStatus(c.id, "completed")} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10 disabled:opacity-40">Mark Completed</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
