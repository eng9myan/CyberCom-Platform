"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type LoadStatus = "loading" | "running" | "completed" | "failed";
type SetStatus = "dirty" | "sterile" | "issued" | "contaminated" | "expired";

interface SterilizationLoad {
  id: string; load_number: string; sterilizer_id: string; cycle_type: string;
  status: LoadStatus; biological_indicator_result: string;
}
interface InstrumentSet { id: string; set_code: string; name: string; load: string | null; status: SetStatus; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const LOAD_STATUS_COLOR: Record<LoadStatus, string> = { loading: "#94a3b8", running: "#3b82f6", completed: "#22c55e", failed: "#ef4444" };
const SET_STATUS_COLOR: Record<SetStatus, string> = { dirty: "#94a3b8", sterile: "#22c55e", issued: "#3b82f6", contaminated: "#ef4444", expired: "#f59e0b" };

export default function CSSDPage() {
  const { session, isAuthenticated } = useAuth();
  const [loads, setLoads] = useState<SterilizationLoad[] | null>(null);
  const [sets, setSets] = useState<InstrumentSet[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [loadForm, setLoadForm] = useState({ loadNumber: "", sterilizerId: "", cycleType: "steam" });
  const [showSetForm, setShowSetForm] = useState(false);
  const [setForm, setSetForm] = useState({ setCode: "", name: "" });

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [loadData, setData] = await Promise.all([
        apiFetch<Paginated<SterilizationLoad> | SterilizationLoad[]>("/api/v1/hospital/cssd/loads/", opts),
        apiFetch<Paginated<InstrumentSet> | InstrumentSet[]>("/api/v1/hospital/cssd/instrument-sets/", opts),
      ]);
      setLoads(unwrap(loadData));
      setSets(unwrap(setData));
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load CSSD data."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createLoad() {
    if (!session || !loadForm.loadNumber || !loadForm.sterilizerId) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/hospital/cssd/loads/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ load_number: loadForm.loadNumber, sterilizer_id: loadForm.sterilizerId, cycle_type: loadForm.cycleType, status: "loading" }),
      });
      setLoadForm({ loadNumber: "", sterilizerId: "", cycleType: "steam" });
      setShowLoadForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to create sterilization load."));
    } finally {
      setBusy(false);
    }
  }

  async function startLoad(id: string) {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/cssd/loads/${id}/start/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ operator_id: session.userId }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to start load."));
    } finally {
      setBusy(false);
    }
  }

  async function completeLoad(id: string, biResult: "pass" | "fail") {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/cssd/loads/${id}/complete/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ biological_indicator_result: biResult }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to complete load."));
    } finally {
      setBusy(false);
    }
  }

  async function createSet() {
    if (!session || !setForm.setCode || !setForm.name) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/hospital/cssd/instrument-sets/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ set_code: setForm.setCode, name: setForm.name, status: "dirty" }),
      });
      setSetForm({ setCode: "", name: "" });
      setShowSetForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to register instrument set."));
    } finally {
      setBusy(false);
    }
  }

  async function issueSet(id: string) {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/cssd/instrument-sets/${id}/issue/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ logged_by: session.userId }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to issue instrument set."));
    } finally {
      setBusy(false);
    }
  }

  async function returnSet(id: string, contaminated: boolean) {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/hospital/cssd/instrument-sets/${id}/return/`, {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({ logged_by: session.userId, contaminated }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to return instrument set."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Zap size={22} /> CSSD — Sterile Supply</h1>
        <p className="mt-1 text-sm text-ink/50">Sterilization cycles and instrument set tracking</p>
      </header>

      {fetchError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Sterilization Loads</h2>
          <button onClick={() => setShowLoadForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ New Load</button>
        </div>
        {showLoadForm && (
          <div className="cy-card mb-4 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input value={loadForm.loadNumber} onChange={e => setLoadForm(f => ({ ...f, loadNumber: e.target.value }))} placeholder="Load number" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
              <input value={loadForm.sterilizerId} onChange={e => setLoadForm(f => ({ ...f, sterilizerId: e.target.value }))} placeholder="Sterilizer ID" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
              <select value={loadForm.cycleType} onChange={e => setLoadForm(f => ({ ...f, cycleType: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                <option value="steam">Steam Autoclave</option><option value="eto">Ethylene Oxide</option><option value="plasma">H2O2 Plasma</option>
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={createLoad} disabled={busy || !loadForm.loadNumber || !loadForm.sterilizerId} className="cy-btn cy-btn-primary !min-h-0 !py-1.5 !px-3 text-xs disabled:opacity-50">Create</button>
              <button onClick={() => setShowLoadForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-1.5 !px-3 text-xs">Cancel</button>
            </div>
          </div>
        )}
        <div className="grid gap-2">
          {loads === null && <div className="cy-card p-4 text-center text-sm text-ink/40">Loading…</div>}
          {loads !== null && loads.length === 0 && <div className="cy-card p-4 text-center text-sm text-ink/40">No sterilization loads yet.</div>}
          {loads?.map(l => (
            <div key={l.id} className="cy-card flex items-center justify-between p-3">
              <div>
                <span className="font-mono text-sm font-semibold">{l.load_number}</span>
                <span className="ml-2 text-xs text-ink/50">{l.sterilizer_id} · {l.cycle_type}</span>
                <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${LOAD_STATUS_COLOR[l.status]}22`, color: LOAD_STATUS_COLOR[l.status] }}>{l.status}</span>
              </div>
              <div className="flex gap-2">
                {l.status === "loading" && <button disabled={busy} onClick={() => startLoad(l.id)} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10 disabled:opacity-40">Start Cycle</button>}
                {l.status === "running" && (
                  <>
                    <button disabled={busy} onClick={() => completeLoad(l.id, "pass")} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">BI Pass</button>
                    <button disabled={busy} onClick={() => completeLoad(l.id, "fail")} className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40">BI Fail</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Instrument Sets</h2>
          <button onClick={() => setShowSetForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ Register Set</button>
        </div>
        {showSetForm && (
          <div className="cy-card mb-4 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={setForm.setCode} onChange={e => setSetForm(f => ({ ...f, setCode: e.target.value }))} placeholder="Set code" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
              <input value={setForm.name} onChange={e => setSetForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Major Laparotomy Set" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={createSet} disabled={busy || !setForm.setCode || !setForm.name} className="cy-btn cy-btn-primary !min-h-0 !py-1.5 !px-3 text-xs disabled:opacity-50">Register</button>
              <button onClick={() => setShowSetForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-1.5 !px-3 text-xs">Cancel</button>
            </div>
          </div>
        )}
        <div className="grid gap-2">
          {sets.length === 0 && <div className="cy-card p-4 text-center text-sm text-ink/40">No instrument sets registered.</div>}
          {sets.map(s => (
            <div key={s.id} className="cy-card flex items-center justify-between p-3">
              <div>
                <span className="font-mono text-sm font-semibold">{s.set_code}</span>
                <span className="ml-2 text-sm text-ink/70">{s.name}</span>
                <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${SET_STATUS_COLOR[s.status]}22`, color: SET_STATUS_COLOR[s.status] }}>{s.status}</span>
              </div>
              <div className="flex gap-2">
                {s.status === "sterile" && <button disabled={busy} onClick={() => issueSet(s.id)} className="rounded-md border border-brand-400/40 px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10 disabled:opacity-40">Issue</button>}
                {s.status === "issued" && (
                  <>
                    <button disabled={busy} onClick={() => returnSet(s.id, false)} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Return Clean</button>
                    <button disabled={busy} onClick={() => returnSet(s.id, true)} className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40">Report Contaminated</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
