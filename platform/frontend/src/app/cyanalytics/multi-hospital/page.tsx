"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Lock } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import type { HealthGroupSnapshot, HealthGroupSummary } from "@/lib/cyanalytics/types";

interface Paginated<T> {
  results: T[];
}

const REFRESH_INTERVAL_MS = 30_000;

function StatCell({ value, tone = "default" }: { value: string | number; tone?: "default" | "warning" }) {
  return (
    <span className={`tabular-nums ${tone === "warning" ? "text-amber-400" : "text-white"}`}>
      {value}
    </span>
  );
}

export default function MultiHospitalDashboard() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<HealthGroupSummary[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<HealthGroupSnapshot | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function loadGroups() {
      if (!session) return;
      try {
        const page = await apiFetch<Paginated<HealthGroupSummary>>(
          "/api/v1/tenants/health-groups/",
          { token: session.accessToken, tenantId: session.tenantId }
        );
        if (cancelled) return;
        setForbidden(false);
        setGroups(page.results);
        setSelectedGroupId((prev) => prev ?? page.results[0]?.id ?? null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status === 403) {
          setForbidden(true);
        } else {
          const detail = (err as { detail?: string })?.detail;
          setError(detail || (err instanceof Error ? err.message : "Failed to load health groups."));
        }
        setLoading(false);
      }
    }

    void loadGroups();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !selectedGroupId) return;
    let cancelled = false;

    async function loadSnapshot() {
      if (!session || !selectedGroupId) return;
      try {
        const data = await apiFetch<HealthGroupSnapshot>(
          `/api/v1/tenants/health-groups/${selectedGroupId}/snapshot/`,
          { token: session.accessToken, tenantId: session.tenantId }
        );
        if (cancelled) return;
        setSnapshot(data);
      } catch (err) {
        if (cancelled) return;
        const detail = (err as { detail?: string })?.detail;
        setError(detail || (err instanceof Error ? err.message : "Failed to load group snapshot."));
      }
    }

    void loadSnapshot();
    const timer = setInterval(() => void loadSnapshot(), REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session, selectedGroupId]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 text-white">
      <Link href="/cyanalytics" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={14} /> Back to Executive Wall
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Multi-Hospital Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">
            Compare revenue, admissions, occupancy, and turnaround across every hospital in your group.
          </p>
        </div>
        <Building2 className="text-brand-400" size={28} />
      </div>

      {loading && <p className="text-sm text-white/40">Loading health groups…</p>}

      {forbidden && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <Lock size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Group-level access required</p>
            <p className="mt-1 text-sm text-white/60">
              This view is limited to platform_admin, group_ceo, group_board_member, or
              group_cfo roles -- your account doesn&apos;t currently hold one of those roles.
              This is a real permission boundary, not a missing feature.
            </p>
          </div>
        </div>
      )}

      {error && !forbidden && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !forbidden && !error && groups.length === 0 && (
        <p className="text-sm text-white/40">No health groups exist yet for this account.</p>
      )}

      {groups.length > 0 && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  g.id === selectedGroupId
                    ? "bg-brand-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {g.name} <span className="text-white/40">({g.tenant_count})</span>
              </button>
            ))}
          </div>

          {snapshot && (
            <>
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/50">Hospitals</p>
                  <p className="mt-1 text-2xl font-bold">{snapshot.hospital_count}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/50">Active Admissions</p>
                  <p className="mt-1 text-2xl font-bold">{snapshot.totals.active_admissions}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/50">Group Occupancy</p>
                  <p className="mt-1 text-2xl font-bold">
                    {snapshot.totals.group_bed_occupancy_percentage ?? "—"}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/50">Occupied / Total Beds</p>
                  <p className="mt-1 text-2xl font-bold">
                    {snapshot.totals.current_occupied_beds}/{snapshot.totals.total_beds}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/50">ER Waiting</p>
                  <p className="mt-1 text-2xl font-bold">{snapshot.totals.emergency_waiting}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/50">ICU Occupancy</p>
                  <p className="mt-1 text-2xl font-bold">{snapshot.totals.icu_occupancy}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/50">Patients Total</p>
                  <p className="mt-1 text-2xl font-bold">{snapshot.totals.patients_total}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/40">
                      <th className="px-4 py-3">Hospital</th>
                      <th className="px-4 py-3">Admissions</th>
                      <th className="px-4 py-3">Beds</th>
                      <th className="px-4 py-3">Occupancy</th>
                      <th className="px-4 py-3">ER Waiting</th>
                      <th className="px-4 py-3">ICU</th>
                      <th className="px-4 py-3">Invoices Outstanding</th>
                      <th className="px-4 py-3">Patients</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.hospitals.map((h) => (
                      <tr key={h.tenant_id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-medium">{h.tenant_name}</td>
                        {h.error ? (
                          <td className="px-4 py-3 text-red-300" colSpan={7}>
                            {h.error}
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3"><StatCell value={h.active_admissions ?? "—"} /></td>
                            <td className="px-4 py-3">
                              <StatCell value={`${h.current_occupied_beds ?? 0}/${h.total_beds ?? 0}`} />
                            </td>
                            <td className="px-4 py-3">
                              <StatCell
                                value={`${h.bed_occupancy_percentage ?? 0}%`}
                                tone={(h.bed_occupancy_percentage ?? 0) >= 90 ? "warning" : "default"}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <StatCell
                                value={h.emergency_waiting ?? "—"}
                                tone={(h.emergency_waiting ?? 0) > 10 ? "warning" : "default"}
                              />
                            </td>
                            <td className="px-4 py-3"><StatCell value={h.icu_occupancy ?? "—"} /></td>
                            <td className="px-4 py-3"><StatCell value={h.invoices_outstanding ?? "—"} /></td>
                            <td className="px-4 py-3"><StatCell value={h.patients_total ?? "—"} /></td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
