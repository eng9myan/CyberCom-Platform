"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import type { MedicalDirectorDashboard } from "@/lib/cyanalytics/types";

const REFRESH_INTERVAL_MS = 30_000;

function KpiTile({
  label, value, unit, tone = "default", note,
}: { label: string; value: string | number; unit?: string; tone?: "default" | "warning"; note?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone === "warning" ? "text-amber-400" : "text-white"}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-white/40">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-white/30">{note}</p>}
    </div>
  );
}

export default function MedicalDirectorPage() {
  const { session } = useAuth();
  const [data, setData] = useState<MedicalDirectorDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function load() {
      if (!session) return;
      try {
        const result = await apiFetch<MedicalDirectorDashboard>(
          `/api/v1/hospital/command-center/medical-director/?period_days=${periodDays}`,
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
  }, [session, periodDays]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 text-white">
      <Link href="/cyanalytics" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={14} /> Back to Executive Wall
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Director Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">
            Clinical quality: mortality, readmissions, length of stay, bed utilization, consultant productivity.
          </p>
        </div>
        <Stethoscope className="text-brand-400" size={28} />
      </div>

      <div className="mb-6 flex gap-2">
        {[30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setPeriodDays(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              d === periodDays ? "bg-brand-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Last {d}d
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiTile label="Discharges" value={data.discharge_count} />
            <KpiTile
              label="Avg Length of Stay"
              value={data.avg_length_of_stay_days ?? "—"}
              unit="days"
              note={data.avg_length_of_stay_days === null ? "No discharges in period" : undefined}
            />
            <KpiTile
              label="Mortality Rate"
              value={data.mortality_rate_percent ?? "—"}
              unit="%"
              tone={(data.mortality_rate_percent ?? 0) > 5 ? "warning" : "default"}
              note={data.mortality_rate_percent === null ? "No discharges in period" : `${data.mortality_count} case(s)`}
            />
            <KpiTile
              label="Readmission Rate"
              value={data.readmission_rate_percent ?? "—"}
              unit="%"
              tone={(data.readmission_rate_percent ?? 0) > 15 ? "warning" : "default"}
              note={data.readmission_rate_percent === null ? "No discharges in period" : `${data.readmission_count} case(s)`}
            />
            <KpiTile
              label="Bed Occupancy"
              value={data.bed_occupancy_percentage}
              unit="%"
              tone={data.bed_occupancy_percentage >= 90 ? "warning" : "default"}
            />
            <KpiTile label="ICU Critical Events" value={data.icu_critical_events_count} />
          </div>

          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
            Consultant Productivity (admissions in period)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3">Admitting Physician</th>
                  <th className="px-4 py-3">Admissions</th>
                </tr>
              </thead>
              <tbody>
                {data.consultant_productivity.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-white/40" colSpan={2}>
                      No admissions in this period.
                    </td>
                  </tr>
                )}
                {data.consultant_productivity.map((c) => (
                  <tr key={c.admitting_physician_id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-white/70">{c.admitting_physician_id}</td>
                    <td className="px-4 py-3 tabular-nums">{c.admission_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
