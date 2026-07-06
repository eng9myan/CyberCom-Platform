"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Lock } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import type { OperationsDashboard } from "@/lib/cyanalytics/types";

const REFRESH_INTERVAL_MS = 20_000;

function KpiTile({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-white/40">{unit}</span>}
      </p>
    </div>
  );
}

function UntrackedNotice({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <Lock size={16} className="mt-0.5 shrink-0 text-white/30" />
      <div>
        <p className="text-sm font-semibold text-white/50">{label}</p>
        <p className="mt-1 text-xs text-white/30">{reason}</p>
      </div>
    </div>
  );
}

export default function OperationsPage() {
  const { session } = useAuth();
  const [data, setData] = useState<OperationsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function load() {
      if (!session) return;
      try {
        const result = await apiFetch<OperationsDashboard>(
          "/api/v1/hospital/command-center/operations/",
          { token: session.accessToken, tenantId: session.tenantId }
        );
        if (!cancelled) setData(result);
      } catch (err) {
        if (cancelled) return;
        const detail = (err as { detail?: string })?.detail;
        setError(detail || (err instanceof Error ? err.message : "Failed to load dashboard."));
      }
    }

    void load();
    const timer = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 text-white">
      <Link href="/cyanalytics" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={14} /> Back to Executive Wall
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">
            Admissions, discharges, transfers, bed status, and queue times.
          </p>
        </div>
        <ClipboardList className="text-brand-400" size={28} />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <KpiTile label="Admissions Today" value={data.admissions_today} />
            <KpiTile label="Discharges Today" value={data.discharges_today} />
            <KpiTile label="ER Waiting" value={data.emergency_waiting} />
            <KpiTile label="Bed Occupancy" value={data.bed_occupancy_percentage} unit="%" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">Bed Status</h2>
              {Object.keys(data.beds_by_status).length === 0 ? (
                <p className="text-sm text-white/40">No beds configured.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.beds_by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-white/70">{status}</span>
                      <span className="font-bold tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
                Transfers Today
              </h2>
              {Object.keys(data.transfers_today_by_status).length === 0 ? (
                <p className="text-sm text-white/40">No transfer requests today.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.transfers_today_by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-white/70">{status}</span>
                      <span className="font-bold tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">Not Yet Tracked</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UntrackedNotice label="Ambulance Tracking" reason={data.ambulance_tracking.reason} />
            <UntrackedNotice label="Cleaning / Room Turnaround" reason={data.cleaning_status.reason} />
          </div>
        </>
      )}
    </div>
  );
}
