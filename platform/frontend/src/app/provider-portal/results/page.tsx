"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { resolveCurrentProvider, type CurrentProvider } from "../_lib/provider";

type ResultStatus = "preliminary" | "final" | "corrected" | "amended" | "cancelled";

interface ResultView {
  id: string;
  patient_id: string;
  result_type: string;
  result_name: string;
  result_date: string;
  result_status: ResultStatus;
  is_critical: boolean;
  is_reviewed: boolean;
  is_acknowledged: boolean;
  result_summary: string;
}

interface Patient { id: string; first_name: string; last_name: string; mrn: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<ResultStatus, string> = {
  preliminary: "#f59e0b", final: "#22c55e", corrected: "#a78bfa", amended: "#a78bfa", cancelled: "#94a3b8",
};

export default function ProviderResults() {
  const { session, isAuthenticated } = useAuth();
  const [results, setResults] = useState<ResultView[] | null>(null);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [provider, setProvider] = useState<CurrentProvider | null | undefined>(undefined);
  const [filter, setFilter] = useState<"all" | "unreviewed" | "critical">("unreviewed");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const resolvedProvider = await resolveCurrentProvider(session.userId, opts);
      setProvider(resolvedProvider);
      const [resultsData, patientsData] = await Promise.all([
        apiFetch<Paginated<ResultView> | ResultView[]>("/api/v1/provider-portal/results/results/", opts),
        apiFetch<Paginated<Patient> | Patient[]>("/api/v1/patients/", opts),
      ]);
      setResults(unwrap(resultsData));
      const pMap: Record<string, Patient> = {};
      for (const p of unwrap(patientsData)) pMap[p.id] = p;
      setPatients(pMap);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load results."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function acknowledge(result: ResultView) {
    if (!session || !provider) return;
    setBusyId(result.id);
    try {
      await apiFetch("/api/v1/provider-portal/results/acknowledgements/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          result: result.id,
          provider_id: provider.id,
          provider_name: provider.name,
          provider_type: provider.providerType,
          action_taken: "noted",
        }),
      });
      await apiFetch(`/api/v1/provider-portal/results/results/${result.id}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          is_reviewed: true,
          is_acknowledged: true,
          reviewed_by_provider_id: provider.id,
          reviewed_at: new Date().toISOString(),
          acknowledged_at: new Date().toISOString(),
        }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to acknowledge result."));
    } finally {
      setBusyId(null);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const filtered = (results || []).filter(r => {
    if (filter === "unreviewed") return !r.is_reviewed;
    if (filter === "critical") return r.is_critical;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <a href="/provider-portal" className="mb-1 inline-block text-sm text-white/50 hover:text-white">← Provider Portal</a>
        <h1 className="font-heading text-2xl font-bold text-brand-400">Results Review</h1>
        <p className="mt-1 text-sm text-white/50">Lab, imaging, and pathology results awaiting provider review</p>
      </header>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>
      )}
      {provider === null && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Your account isn&apos;t linked to a clinical Provider record — you can view results but acknowledgement will be blocked until linked.
        </div>
      )}

      <div className="mb-5 flex gap-2">
        {(["unreviewed", "critical", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === f ? "bg-brand-500/15 text-brand-300 border border-brand-400/40" : "border border-white/10 text-white/50 hover:bg-white/5"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {results === null && <div className="cy-card p-6 text-center text-sm text-white/40">Loading results…</div>}
        {results !== null && filtered.length === 0 && (
          <div className="cy-card p-6 text-center text-sm text-white/40">No results match this filter.</div>
        )}
        {filtered.map(r => {
          const p = patients[r.patient_id];
          return (
            <div key={r.id} className="cy-card p-4" style={r.is_critical ? { borderColor: "rgba(239,68,68,0.4)" } : undefined}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.result_name}</span>
                    {r.is_critical && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400">CRITICAL</span>}
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[r.result_status]}22`, color: STATUS_COLOR[r.result_status] }}>{r.result_status}</span>
                  </div>
                  <div className="mt-1 text-sm text-white/50">
                    {p ? `${p.first_name} ${p.last_name} (${p.mrn})` : `Patient ${r.patient_id.slice(0, 8)}`} · {r.result_type} · {new Date(r.result_date).toLocaleDateString()}
                  </div>
                  {r.result_summary && <p className="mt-2 text-sm text-white/70">{r.result_summary}</p>}
                </div>
                {r.is_acknowledged ? (
                  <span className="whitespace-nowrap text-xs font-bold text-emerald-400">Acknowledged</span>
                ) : (
                  <button disabled={busyId === r.id || !provider} onClick={() => acknowledge(r)} className="cy-btn cy-btn-primary !min-h-0 whitespace-nowrap !py-1.5 !px-3 text-xs disabled:opacity-40">
                    {busyId === r.id ? "…" : "Acknowledge"}
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
