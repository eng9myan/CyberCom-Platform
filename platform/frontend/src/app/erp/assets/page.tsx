"use client";

import { useState, useEffect, useCallback } from "react";
import { Wrench } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

type AssetStatus = "active" | "retired" | "maintenance";

interface Asset {
  id: string; name: string; code: string; asset_type: string;
  purchase_date: string; purchase_cost: string; salvage_value: string;
  useful_life_years: number; status: AssetStatus;
}
interface AssetDepreciation { id: string; asset: string; depreciation_date: string; book_value: string; }
interface Paginated<T> { count: number; results: T[]; }

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

const STATUS_COLOR: Record<AssetStatus, string> = { active: "#22c55e", retired: "#94a3b8", maintenance: "#f59e0b" };
const ASSET_TYPES = ["medical_device", "computer", "vehicle", "furniture", "facility_equipment", "other"];

export default function AssetsPage() {
  const { session, isAuthenticated } = useAuth();
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [depreciations, setDepreciations] = useState<AssetDepreciation[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", asset_type: "medical_device", purchase_date: "", purchase_cost: "", useful_life_years: "5" });

  const loadData = useCallback(async () => {
    if (!session) return;
    setFetchError(null);
    const opts = { token: session.accessToken, tenantId: session.tenantId };
    try {
      const [assetData, depData] = await Promise.all([
        apiFetch<Paginated<Asset> | Asset[]>("/api/v1/erp/assets/items/", opts),
        apiFetch<Paginated<AssetDepreciation> | AssetDepreciation[]>("/api/v1/erp/assets/depreciations/", opts),
      ]);
      setAssets(unwrap(assetData));
      setDepreciations(unwrap(depData));
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to load asset registry."));
    }
  }, [session]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createAsset() {
    if (!session || !form.name || !form.code || !form.purchase_date || !form.purchase_cost) return;
    setBusy(true);
    try {
      await apiFetch("/api/v1/erp/assets/items/", {
        method: "POST",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({
          name: form.name, code: form.code, asset_type: form.asset_type,
          purchase_date: form.purchase_date, purchase_cost: form.purchase_cost,
          salvage_value: 0, useful_life_years: Number(form.useful_life_years), status: "active",
        }),
      });
      setForm({ name: "", code: "", asset_type: "medical_device", purchase_date: "", purchase_cost: "", useful_life_years: "5" });
      setShowForm(false);
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to register asset."));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(assetId: string, status: AssetStatus) {
    if (!session) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/erp/assets/items/${assetId}/`, {
        method: "PATCH",
        token: session.accessToken,
        tenantId: session.tenantId,
        body: JSON.stringify({ status }),
      });
      void loadData();
    } catch (err) {
      const detail = (err as { detail?: string })?.detail;
      setFetchError(detail || (err instanceof Error ? err.message : "Failed to update asset status."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return <div className="mx-auto mt-16 max-w-lg text-center"><h1 className="text-xl font-bold">Sign in required</h1></div>;
  }

  const filtered = (assets || []).filter(a => filterType === "all" || a.asset_type === filterType);
  const latestBookValue = (assetId: string) => depreciations.filter(d => d.asset === assetId).sort((a, b) => b.depreciation_date.localeCompare(a.depreciation_date))[0]?.book_value;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <a href="/erp" className="mb-1 inline-block text-sm text-ink/50 hover:text-ink">← ERP</a>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Wrench size={22} /> Asset Registry</h1>
          <p className="mt-1 text-sm text-ink/50">Fixed assets, medical equipment, and depreciation</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm">+ Register Asset</button>
      </header>

      {fetchError && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{fetchError}</div>}

      {showForm && (
        <div className="cy-card mb-6 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-ink/50">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Philips MRI Scanner" className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Asset code</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. EQ-0042" className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Type</label>
              <select value={form.asset_type} onChange={e => setForm(f => ({ ...f, asset_type: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm">
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Purchase date</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Purchase cost (SAR)</label>
              <input type="number" value={form.purchase_cost} onChange={e => setForm(f => ({ ...f, purchase_cost: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50">Useful life (years)</label>
              <input type="number" value={form.useful_life_years} onChange={e => setForm(f => ({ ...f, useful_life_years: e.target.value }))} className="w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createAsset} disabled={busy || !form.name || !form.code || !form.purchase_date || !form.purchase_cost} className="cy-btn cy-btn-primary !min-h-0 !py-2 !px-4 text-sm disabled:opacity-50">Register</button>
            <button onClick={() => setShowForm(false)} className="cy-btn cy-btn-ghost !min-h-0 !py-2 !px-4 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {["all", ...ASSET_TYPES].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filterType === t ? "bg-brand-500/15 text-brand-300 border border-brand-400/40" : "border border-ink/10 text-ink/50 hover:bg-ink/5"}`}>
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="cy-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5 text-left text-xs uppercase tracking-wider text-ink/40">
                <th className="px-4 py-3">Asset</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Purchased</th>
                <th className="px-4 py-3">Cost</th><th className="px-4 py-3">Book Value</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {assets === null && <tr><td colSpan={7} className="px-4 py-6 text-center text-ink/40">Loading asset registry…</td></tr>}
              {assets !== null && filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-ink/40">No assets registered for this filter.</td></tr>}
              {filtered.map(a => {
                const bookValue = latestBookValue(a.id);
                return (
                  <tr key={a.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs font-mono text-ink/40">{a.code}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-ink/70">{a.asset_type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-ink/60">{new Date(a.purchase_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 tabular-nums">SAR {Number(a.purchase_cost).toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">{bookValue ? `SAR ${Number(bookValue).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: `${STATUS_COLOR[a.status]}22`, color: STATUS_COLOR[a.status] }}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "active" && (
                        <button disabled={busy} onClick={() => setStatus(a.id, "maintenance")} className="rounded-md border border-amber-500/40 px-2 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 disabled:opacity-40">Send to Maintenance</button>
                      )}
                      {a.status === "maintenance" && (
                        <button disabled={busy} onClick={() => setStatus(a.id, "active")} className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40">Return to Active</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
