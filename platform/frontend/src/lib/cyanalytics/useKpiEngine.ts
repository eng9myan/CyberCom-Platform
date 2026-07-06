"use client";

/**
 * CyAnalytics KPI engine.
 *
 * Connects to the real Django Channels WebSocket
 * (ws/hospital/command-center/) for server-pushed updates -- the consumer
 * sends a real snapshot on connect, then forwards "kpi.update" broadcasts
 * from the `broadcast_hospital_kpis` Celery beat task (every 10s). Falls
 * back to 15s HTTP polling if the socket fails to connect or drops and
 * won't reconnect (e.g. dev environment without Channels/Redis running) --
 * the hook's return shape is identical either way, so no consumer cares
 * which transport is live.
 *
 * Only the "hospital" level has a real backend today. "network"
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
const WS_RECONNECT_DELAY_MS = 3_000;
const WS_MAX_RECONNECT_ATTEMPTS = 3;

interface HospitalKpiBundle {
  census: HospitalCensusSnapshot;
  modules: HospitalModuleSummary;
}

function wsUrlFor(path: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return apiBase.replace(/^http/, "ws") + path;
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
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (level !== "hospital" || !session) return;

    let cancelled = false;
    let usingFallbackPoll = false;

    async function pollOnce() {
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

    function startPollingFallback() {
      if (usingFallbackPoll || cancelled) return;
      usingFallbackPoll = true;
      void pollOnce();
      pollTimerRef.current = setInterval(() => void pollOnce(), POLL_INTERVAL_MS);
    }

    function connectWebSocket() {
      if (!session || cancelled) return;
      const url = wsUrlFor(
        `/ws/hospital/command-center/?token=${encodeURIComponent(session.accessToken)}&tenant_id=${encodeURIComponent(session.tenantId)}`
      );
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(event.data as string) as {
            type: "snapshot" | "kpi_update";
            data: HospitalKpiBundle;
          };
          setState({
            data: parsed.data,
            available: true,
            loading: false,
            error: null,
            lastUpdated: new Date().toISOString(),
          });
        } catch {
          // Ignore a malformed frame rather than crash the dashboard.
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current <= WS_MAX_RECONNECT_ATTEMPTS) {
          setTimeout(connectWebSocket, WS_RECONNECT_DELAY_MS);
        } else {
          startPollingFallback();
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectWebSocket();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [level, session]);

  return state;
}
