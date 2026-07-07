"use client";

import { useState, useEffect, useCallback } from "react";
import { Droplet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type UnitStatus = "available" | "reserved" | "issued" | "discarded" | "quarantine";
type RequestStatus = "pending" | "compatible" | "incompatible" | "fulfilled";

const BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

interface BloodUnit { id: string; unit_number: string; blood_type: string; component_type: string; expiry_date: string; status: UnitStatus; }
interface CrossmatchRequest { id: string; patient: string; blood_type_required: string; units_requested: number; status: RequestStatus; }
interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const UNIT_STATUS_COLOR: Record<UnitStatus, string> = { available: "#22c55e", reserved: "#3b82f6", issued: "#a78bfa", discarded: "#94a3b8", quarantine: "#f59e0b" };
const REQ_STATUS_COLOR: Record<RequestStatus, string> = { pending: "#94a3b8", compatible: "#22c55e", incompatible: "#ef4444", fulfilled: "#3b82f6" };

type Tab = "inventory" | "requests";

export default function BloodBankPage() {
  const { session, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("inventory");
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [requests, setRequests] = useState<CrossmatchRequest[] | null>(null);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState({ unitNumber: "", bloodType: "O+", componentType: "whole_blood", collectionDate: "", expiryDate: "" });
  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState({ patientId: "", bloodType: "O+", units: "1" });
  const [issuingReq, setIssuingReq] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [unitData, reqData, patientData] = await Promise.all([
        apiFetch<Paginated<BloodUnit> | BloodUnit[]>("/api/v1/hospital/blood-bank/units/", opts),
        apiFetch<Paginated<CrossmatchRequest> | CrossmatchRequest[]>("/api/v1/hospital/blood-bank/crossmatch-requests/", opts),
        apiFetch<Paginated<Patient> | Patient[]>("/api/v1/patients/", opts),
      ]);
      setUnits(unwrap(unitData));
      setRequests(unwrap(reqData));
      const pMap: Record<string, Patient> = {};
      for (const p of unwrap(patientData)) pMap[p.id] = p;
      setPatients(pMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load blood bank data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createUnit() {
    if (!session || !unitForm.unitNumber || !unitForm.collectionDate || !unitForm.expiryDate) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/hospital/blood-bank/units/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({
          unit_number: unitForm.unitNumber, blood_type: unitForm.bloodType, component_type: unitForm.componentType,
          collection_date: unitForm.collectionDate, expiry_date: unitForm.expiryDate, status: "quarantine",
        }),
      });
      setUnitForm({ unitNumber: "", bloodType: "O+", componentType: "whole_blood", collectionDate: "", expiryDate: "" });
      setShowUnitForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to register blood unit."));
    } finally {
      setBusy(false);
    }
  }

  async function releaseUnit(id: string) {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/blood-bank/units/${id}/quarantine_release/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to release unit."));
    } finally {
      setBusy(false);
    }
  }

  async function createRequest() {
    if (!session || !reqForm.patientId) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/hospital/blood-bank/crossmatch-requests/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ patient: reqForm.patientId, blood_type_required: reqForm.bloodType, units_requested: Number(reqForm.units), requested_by: session.userId }),
      });
      setReqForm({ patientId: "", bloodType: "O+", units: "1" });
      setShowReqForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to create crossmatch request."));
    } finally {
      setBusy(false);
    }
  }

  async function resolveRequest(id: string, compatible: boolean) {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/blood-bank/crossmatch-requests/${id}/resolve/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ compatible }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to resolve crossmatch."));
    } finally {
      setBusy(false);
    }
  }

  async function issueForRequest(reqId: string, unitId: string) {
    if (!session || !unitId) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/blood-bank/crossmatch-requests/${reqId}/issue/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ blood_unit_id: unitId, issued_by: session.userId }),
      });
      setIssuingReq(null);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to issue blood unit."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const availableCount = units.filter(u => u.status === "available").length;
  const quarantineCount = units.filter(u => u.status === "quarantine").length;
  const pendingReqs = (requests || []).filter(r => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Droplet size={22} /> Blood Bank</h1>
        <p className="mt-1 text-sm text-ink/50">Blood unit inventory, crossmatch requests, and issuance</p>
      </header>

      {fetchError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="cy-card p-4 text-center"><div className="text-2xl font-bold text-emerald-400">{availableCount}</div><div className="mt-1 text-xs text-ink/50">Available units</div></div>
        <div className="cy-card p-4 text-center"><div className="text-2xl font-bold text-amber-400">{quarantineCount}</div><div className="mt-1 text-xs text-ink/50">In quarantine</div></div>
        <div className="cy-card p-4 text-center"><div className="text-2xl font-bold text-brand-400">{pendingReqs}</div><div className="mt-1 text-xs text-ink/50">Pending crossmatches</div></div>
      </div>

      <div className="mb-5 flex gap-2">
        {(["inventory", "requests"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-brand-500/15 text-brand-300 border border-brand-400/40" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}>{t}</button>
        ))}
      </div>

      {tab === "inventory" && (
        <div>
          <div className="mb-3 flex justify-end"><button onClick={() => setShowUnitForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ Register Unit</button></div>
          {showUnitForm && (
            <div className="cy-card mb-4 p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <input value={unitForm.unitNumber} onChange={e => setUnitForm(f => ({ ...f, unitNumber: e.target.value }))} placeholder="Unit number" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
                <select value={unitForm.bloodType} onChange={e => setUnitForm(f => ({ ...f, bloodType: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                  {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={unitForm.componentType} onChange={e => setUnitForm(f => ({ ...f, componentType: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                  <option value="whole_blood">Whole Blood</option><option value="rbc">Packed RBC</option><option value="plasma">FFP</option><option value="platelets">Platelets</option>
                </select>
                <input type="date" value={unitForm.collectionDate} onChange={e => setUnitForm(f => ({ ...f, collectionDate: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
                <input type="date" value={unitForm.expiryDate} onChange={e => setUnitForm(f => ({ ...f, expiryDate: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={createUnit} disabled={busy || !unitForm.unitNumber || !unitForm.collectionDate || !unitForm.expiryDate} className="cy-btn cy-btn-primary !min-h-0 !py-1.5 !px-3 text-xs disabled:opacity-50">Register</button>
                <button onClick={() => setShowUnitForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-1.5 !px-3 text-xs">Cancel</button>
              </div>
            </div>
          )}
          <div className="grid gap-2">
            {units.length === 0 && <div className="cy-card p-4 text-center text-sm text-ink/40">No blood units registered.</div>}
            {units.map(u => (
              <div key={u.id} className="cy-card flex items-center justify-between p-3">
                <div>
                  <span className="font-mono text-sm font-semibold">{u.unit_number}</span>
                  <span className="ml-2 rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-bold text-red-400">{u.blood_type}</span>
                  <span className="ml-2 text-xs text-ink/50">{u.component_type.replace("_", " ")} · exp {new Date(u.expiry_date).toLocaleDateString()}</span>
                  <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${UNIT_STATUS_COLOR[u.status]}22`, color: UNIT_STATUS_COLOR[u.status] }}>{u.status}</span>
                </div>
                {u.status === "quarantine" && <button disabled={busy} onClick={() => releaseUnit(u.id)} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Release</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div>
          <div className="mb-3 flex justify-end"><button onClick={() => setShowReqForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ New Crossmatch</button></div>
          {showReqForm && (
            <div className="cy-card mb-4 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select value={reqForm.patientId} onChange={e => setReqForm(f => ({ ...f, patientId: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                  <option value="">Select patient…</option>
                  {Object.values(patients).map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>)}
                </select>
                <select value={reqForm.bloodType} onChange={e => setReqForm(f => ({ ...f, bloodType: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                  {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" value={reqForm.units} onChange={e => setReqForm(f => ({ ...f, units: e.target.value }))} placeholder="Units" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={createRequest} disabled={busy || !reqForm.patientId} className="cy-btn cy-btn-primary !min-h-0 !py-1.5 !px-3 text-xs disabled:opacity-50">Submit</button>
                <button onClick={() => setShowReqForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-1.5 !px-3 text-xs">Cancel</button>
              </div>
            </div>
          )}
          <div className="grid gap-2">
            {requests === null && <div className="cy-card p-4 text-center text-sm text-ink/40">Loading…</div>}
            {requests !== null && requests.length === 0 && <div className="cy-card p-4 text-center text-sm text-ink/40">No crossmatch requests yet.</div>}
            {requests?.map(r => {
              const p = patients[r.patient];
              const matchingUnits = units.filter(u => u.blood_type === r.blood_type_required && u.status === "available");
              return (
                <div key={r.id} className="cy-card p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{p ? `${p.first_name} ${p.last_name}` : `Patient ${r.patient.slice(0, 8)}`}</span>
                      <span className="ml-2 rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-bold text-red-400">{r.blood_type_required}</span>
                      <span className="ml-2 text-xs text-ink/50">{r.units_requested} unit(s)</span>
                      <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${REQ_STATUS_COLOR[r.status]}22`, color: REQ_STATUS_COLOR[r.status] }}>{r.status}</span>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <button disabled={busy} onClick={() => resolveRequest(r.id, true)} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Compatible</button>
                        <button disabled={busy} onClick={() => resolveRequest(r.id, false)} className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40">Incompatible</button>
                      </div>
                    )}
                    {r.status === "compatible" && (
                      issuingReq === r.id ? (
                        <div className="flex items-center gap-2">
                          <select onChange={e => issueForRequest(r.id, e.target.value)} defaultValue="" className="rounded-md border border-ink/10 bg-surface px-2 py-1 text-xs">
                            <option value="" disabled>Pick unit…</option>
                            {matchingUnits.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                          </select>
                        </div>
                      ) : (
                        <button onClick={() => setIssuingReq(r.id)} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10">Issue Unit</button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
