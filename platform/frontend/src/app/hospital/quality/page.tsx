"use client";

import { useState, useEffect, useCallback } from "react";
import { LineChart } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

interface QualityIndicator {
  id: string;
  name: string;
  category: string;
  unit_of_measure: string;
  target_value: string | null;
  direction: "higher_is_better" | "lower_is_better";
}
interface QualityMeasurement {
  id: string;
  indicator: string;
  indicator_name: string;
  period_start: string;
  period_end: string;
  numerator: string;
  denominator: string;
  value: number | null;
  meets_target: boolean | null;
}
interface Paginated<T> { count: number; results: T[]; }

export default function QualityPage() {
  const { session, isAuthenticated } = useAuth();
  const [indicators, setIndicators] = useState<QualityIndicator[] | null>(null);
  const [measurements, setMeasurements] = useState<QualityMeasurement[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The form ONLY collects raw integers -- numerator/denominator. The
  // displayed rate is always computed (here and by the backend), never a
  // field the user can type a percentage into directly.
  const [form, setForm] = useState({ indicator: "", period_start: "", period_end: "", numerator: "", denominator: "" });

  const load = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    try {
      const opts = { token: session.accessToken, tenantId: session.tenantId };
      const [indPage, measPage] = await Promise.all([
        apiFetch<Paginated<QualityIndicator>>("/api/v1/hospital/quality/indicators/", opts),
        apiFetch<Paginated<QualityMeasurement>>("/api/v1/hospital/quality/measurements/", opts),
      ]);
      setIndicators(indPage.results);
      setMeasurements(measPage.results);
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load quality data."));
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const livePreview = form.denominator && Number(form.denominator) > 0
    ? Math.round((Number(form.numerator || 0) / Number(form.denominator)) * 1000) / 10
    : null;

  async function submitMeasurement() {
    if (!session || !form.indicator || !form.period_start || !form.period_end || !form.denominator) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/hospital/quality/measurements/", {
        method: "POST", token: session.accessToken, tenantId: session.tenantId,
        body: JSON.stringify({
          indicator: form.indicator, period_start: form.period_start, period_end: form.period_end,
          numerator: form.numerator || "0", denominator: form.denominator, recorded_by: session.userId,
        }),
      });
      setForm({ indicator: "", period_start: "", period_end: "", numerator: "", denominator: "" });
      void load();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to record measurement."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }
  if (fetchError) {
    return <div role="alert" className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold text-red-400">Unable to load quality data</h1><p className="mt-1 text-sm text-ink/50">{fetchError}</p></div>;
  }
  if (indicators === null) {
    return <div className="mx-auto mt-16 max-w-lg text-center text-sm text-ink/40">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><LineChart size={22} /> Quality Management</h1>
          <p className="mt-1 text-sm text-ink/50">{indicators.length} indicator(s) tracked</p>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {indicators.map(ind => {
          const latest = measurements.filter(m => m.indicator === ind.id).sort((a, b) => b.period_end.localeCompare(a.period_end))[0];
          return (
            <div key={ind.id} className={`rounded-xl border p-4 ${latest?.meets_target === false ? "border-red-500/30 bg-red-500/5" : "border-ink/10 bg-surface-raised"}`}>
              <div className="text-sm font-semibold">{ind.name}</div>
              <div className="mt-2 text-2xl font-bold">{latest?.value != null ? `${latest.value}${ind.unit_of_measure}` : "—"}</div>
              <div className="mt-1 text-xs text-ink/50">
                Target: {ind.target_value ?? "—"}{ind.unit_of_measure} ({ind.direction === "lower_is_better" ? "lower is better" : "higher is better"})
              </div>
              {latest && (
                <div className={`mt-2 text-xs font-semibold ${latest.meets_target ? "text-emerald-400" : "text-red-400"}`}>
                  {latest.meets_target ? "✓ Target Achieved" : "✕ Remedial Action Flagged"} (raw: {latest.numerator}/{latest.denominator})
                </div>
              )}
            </div>
          );
        })}
        {indicators.length === 0 && <div className="col-span-full text-sm text-ink/50">No indicators defined yet.</div>}
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-surface-raised">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-semibold">Record a Measurement</div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-5">
          <select value={form.indicator} onChange={e => setForm(f => ({ ...f, indicator: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm sm:col-span-2">
            <option value="">Select indicator...</option>
            {indicators.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
          </select>
          <input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
          <input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
          <div />
          <input type="number" value={form.numerator} onChange={e => setForm(f => ({ ...f, numerator: e.target.value }))} placeholder="Numerator (e.g. successful)" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
          <input type="number" value={form.denominator} onChange={e => setForm(f => ({ ...f, denominator: e.target.value }))} placeholder="Denominator (e.g. total)" className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
          <div className="flex items-center rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-sm text-ink/60">
            Computed rate: <strong className="ml-1">{livePreview === null ? "—" : `${livePreview}%`}</strong>
          </div>
          <button disabled={busy || !form.indicator || !form.denominator} onClick={() => void submitMeasurement()} className="cy-btn cy-btn-primary disabled:opacity-50">Save Measurement</button>
        </div>
      </div>
    </div>
  );
}
