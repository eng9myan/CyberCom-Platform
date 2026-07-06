"use client";

/**
 * CyAnalytics KPI engine.
 *
 * Polls real backend endpoints on an interval (no live WebSocket/SSE
 * transport exists in this backend yet -- Django Channels isn't wired up,
 * so "real-time" here means short-interval polling; the hook's return shape
 * is transport-agnostic so swapping the fetch loop for an SSE subscription
 * later doesn't change any consumer).
 *
 * Only the "hospital" level has a real backend today
 * (ClinicalCommandCenterMetricsView / ModuleSummaryView). "network"
 * (multi-hospital rollup) has no aggregation endpoint -- there is exactly
 * one tenant per request in this architecture -- so it always resolves to
 * `available: false` with an honest reason instead of invented numbers.
 */
import { useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth";

import type {
  DrillLevel,
  HospitalCensusSnapshot,
  HospitalModuleSummary,
  KpiResult,
} from "./types";

const POLL_INTERVAL_MS = 15_000;

interface HospitalKpiBundle {
  census: HospitalCensusSnapshot;
  modules: HospitalModuleSummary;
}

export function useHospitalKpis(level: DrillLevel): KpiResult<HospitalKpiBundle> {
  const { session } = useAuth();
  const [state, setState] = useState<KpiResult<HospitalKpiBundle>>({
    data: null,
    available: level === "hospital",
    loading: level === "hospital",
    error: null,
    lastUpdated: null,
    unavailableReason:
      level === "network"
        ? "Multi-hospital aggregation has no backend yet -- this deployment is single-tenant. Wire a cross-tenant rollup endpoint to enable this level."
        : level !== "hospital"
          ? "No KPI source wired for this drill level yet."
          : undefined,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (level !== "hospital" || !session) return;

    let cancelled = false;

    async function poll() {
      if (!session) return;
      try {
        const opts = { token: session.accessToken, tenantId: session.tenantId };
        const [census, modules] = await Promise.all([
          apiFetch<HospitalCensusSnapshot>("/api/v1/hospital/command-center/metrics/", opts),
          apiFetch<HospitalModuleSummary>(
            "/api/v1/hospital/command-center/module-summary/",
            opts
          ),
        ]);
        if (cancelled) return;
        setState({
          data: { census, modules },
          available: true,
          loading: false,
          error: null,
          lastUpdated: new Date().toISOString(),
        });
      } catch (err) {
        if (cancelled) return;
        const detail = (err as { detail?: string })?.detail;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: detail || (err instanceof Error ? err.message : "Failed to load KPIs."),
        }));
      }
    }

    void poll();
    timerRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [level, session]);

  return state;
}
